// MCP server for the client portal — lets an AI assistant read and write the
// portal the same way the admin UI does.
//
// Transport is MCP Streamable HTTP in its stateless form: one JSON-RPC request
// per POST, one JSON response back, no SSE stream and no session id. That is
// enough for a tool-only server and avoids keeping state in an edge function
// that can be recycled between calls.
//
// Auth is a bearer token, not a user JWT: the caller is a desktop assistant, not
// a logged-in browser. Tokens are minted and revoked from the admin UI and
// matched here by SHA-256; the older PORTAL_MCP_TOKEN secret is still accepted
// so connections predating that screen keep working. Either way the token
// carries full admin power over portal data — treat it like the service role key
// it stands in for.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { markdownToHtml } from "./markdown.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MCP_TOKEN = Deno.env.get("PORTAL_MCP_TOKEN") ?? "";

const SERVER_INFO = { name: "myve-portal", version: "1.0.0" };
const SUPPORTED_PROTOCOLS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const DEFAULT_PROTOCOL = "2025-06-18";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, mcp-protocol-version, mcp-session-id, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Matches the alphabet in portal_generate_code(): no I, O, 0 or 1, so a code
// can't be misread over the phone.
const ACCESS_CODE = /^[A-HJ-NP-Z2-9]{4}-?[A-HJ-NP-Z2-9]{4}$/i;

// --- plumbing ---------------------------------------------------------------

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Compares digests rather than raw bytes so neither length nor content leaks
 *  through response timing. */
async function envTokenMatches(presented: string): Promise<boolean> {
  if (!MCP_TOKEN || !presented) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(presented)),
    crypto.subtle.digest("SHA-256", encoder.encode(MCP_TOKEN)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

/**
 * Accepts either a token minted in the admin UI or the original
 * PORTAL_MCP_TOKEN secret.
 *
 * Table tokens are matched by hash, so no timing-safe compare is needed here:
 * the lookup key is a SHA-256 digest, and learning how long a failed index
 * probe took tells an attacker nothing about the 256-bit token behind it.
 */
async function authorize(db: SupabaseClient, presented: string): Promise<boolean> {
  if (!presented) return false;

  const { data, error } = await db
    .from("portal_mcp_tokens")
    .select("id")
    .eq("token_hash", await sha256Hex(presented))
    .is("revoked_at", null)
    .maybeSingle();

  // A failed lookup falls through to the env token, which keeps the server up if
  // the table is missing or unreachable — but silently, and a permanently
  // unusable token screen is exactly the kind of thing nobody notices. Say so.
  if (error) {
    console.error("portal_mcp_tokens lookup failed, falling back to env token:", error.message);
  }

  if (data) {
    // Awaited rather than fired and forgotten: an edge function can be recycled
    // the moment it returns a response, which would drop a pending write.
    await db
      .from("portal_mcp_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", (data as { id: string }).id);
    return true;
  }

  return await envTokenMatches(presented);
}

class ToolError extends Error {}

// --- lookups ----------------------------------------------------------------

interface ClientRow {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  access_code: string;
  archived: boolean;
  created_at: string;
}

interface ProjectRow {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  live_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Accepts a client id, an access code, or a name — whichever the caller has
 *  to hand. An ambiguous name is an error rather than a guess, because the
 *  wrong guess writes to the wrong client's portal. */
async function resolveClient(db: SupabaseClient, reference: string): Promise<ClientRow> {
  const value = reference.trim();
  if (!value) throw new ToolError("Client reference is empty.");

  if (UUID.test(value)) {
    const { data } = await db.from("portal_clients").select("*").eq("id", value).maybeSingle();
    if (!data) throw new ToolError(`No client with id ${value}.`);
    return data as ClientRow;
  }

  if (ACCESS_CODE.test(value)) {
    const normalized = value.toUpperCase().replace(/-/g, "");
    const code = `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
    const { data } = await db
      .from("portal_clients")
      .select("*")
      .eq("access_code", code)
      .maybeSingle();
    if (data) return data as ClientRow;
    // Fall through: a name really could look like a code.
  }

  const { data: matches } = await db
    .from("portal_clients")
    .select("*")
    .ilike("name", `%${value}%`)
    .limit(10);

  const rows = (matches ?? []) as ClientRow[];
  if (rows.length === 0) throw new ToolError(`No client matches "${value}".`);
  if (rows.length > 1) {
    const exact = rows.filter((row) => row.name.toLowerCase() === value.toLowerCase());
    if (exact.length === 1) return exact[0];
    throw new ToolError(
      `"${value}" matches ${rows.length} clients: ${rows
        .map((row) => `${row.name} (${row.id})`)
        .join(", ")}. Use the id.`,
    );
  }
  return rows[0];
}

async function resolveProject(
  db: SupabaseClient,
  reference: string,
  clientReference?: string,
): Promise<ProjectRow> {
  const value = reference.trim();
  if (!value) throw new ToolError("Project reference is empty.");

  if (UUID.test(value)) {
    const { data } = await db.from("portal_projects").select("*").eq("id", value).maybeSingle();
    if (!data) throw new ToolError(`No project with id ${value}.`);
    return data as ProjectRow;
  }

  if (!clientReference) {
    throw new ToolError(
      "Project names are only unique within a client — pass `client` as well, or use the project id.",
    );
  }

  const client = await resolveClient(db, clientReference);
  const { data: matches } = await db
    .from("portal_projects")
    .select("*")
    .eq("client_id", client.id)
    .ilike("name", `%${value}%`)
    .limit(10);

  const rows = (matches ?? []) as ProjectRow[];
  if (rows.length === 0) {
    throw new ToolError(`${client.name} has no project matching "${value}".`);
  }
  if (rows.length > 1) {
    const exact = rows.filter((row) => row.name.toLowerCase() === value.toLowerCase());
    if (exact.length === 1) return exact[0];
    throw new ToolError(
      `"${value}" matches ${rows.length} projects: ${rows
        .map((row) => `${row.name} (${row.id})`)
        .join(", ")}. Use the id.`,
    );
  }
  return rows[0];
}

function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new ToolError(`\`${key}\` is required.`);
  }
  return value.trim();
}

// --- tools ------------------------------------------------------------------

const TOOLS = [
  {
    name: "list_clients",
    description:
      "List portal clients with their projects, progress and access codes. Start here when you need to know who or what exists.",
    inputSchema: {
      type: "object",
      properties: {
        include_archived: {
          type: "boolean",
          description: "Include archived clients. Defaults to false.",
        },
      },
    },
  },
  {
    name: "get_client",
    description:
      "Full detail for one client: contact info, access code, every project, and the most recent log entries per project.",
    inputSchema: {
      type: "object",
      properties: {
        client: { type: "string", description: "Client id, access code (XXXX-XXXX), or name." },
      },
      required: ["client"],
    },
  },
  {
    name: "create_client",
    description:
      "Create a client. The access code is generated by the database — return it to the user so they can send it on. Optionally creates a first project at the same time.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Client or company name." },
        email: { type: "string" },
        phone: { type: "string" },
        first_project: { type: "string", description: "Name of an initial project." },
      },
      required: ["name"],
    },
  },
  {
    name: "create_project",
    description: "Add a project to an existing client.",
    inputSchema: {
      type: "object",
      properties: {
        client: { type: "string", description: "Client id, access code, or name." },
        name: { type: "string" },
        description: { type: "string", description: "Short summary shown under the title." },
        status: {
          type: "string",
          description:
            "One of: V přípravě, Probíhá, Ke kontrole, Hotovo, Pozastaveno. Defaults to V přípravě.",
        },
        progress: { type: "number", description: "0–100." },
      },
      required: ["client", "name"],
    },
  },
  {
    name: "update_project",
    description:
      "Change a project's status, progress, description or live URL. Only the fields you pass are touched.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project id, or name when `client` is given." },
        client: { type: "string", description: "Required when `project` is a name." },
        status: { type: "string" },
        progress: { type: "number", description: "0–100." },
        description: { type: "string" },
        live_url: { type: "string", description: "Empty string clears it." },
      },
      required: ["project"],
    },
  },
  {
    name: "post_update",
    description:
      "Write an entry into a project's log — this is what the client sees on their home screen. `body` is Markdown (headings, bullets, bold, links) and is converted to formatted HTML. Use it for progress notes and written reports.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string", description: "Project id, or name when `client` is given." },
        client: { type: "string", description: "Required when `project` is a name." },
        title: { type: "string", description: "Optional headline shown above the entry." },
        body: { type: "string", description: "Markdown body." },
      },
      required: ["project", "body"],
    },
  },
  {
    name: "list_updates",
    description: "Read a project's log, newest first.",
    inputSchema: {
      type: "object",
      properties: {
        project: { type: "string" },
        client: { type: "string", description: "Required when `project` is a name." },
        limit: { type: "number", description: "Defaults to 20." },
      },
      required: ["project"],
    },
  },
  {
    name: "read_chat",
    description: "Read the chat thread with a client, oldest first.",
    inputSchema: {
      type: "object",
      properties: {
        client: { type: "string" },
        limit: { type: "number", description: "Most recent N messages. Defaults to 50." },
      },
      required: ["client"],
    },
  },
  {
    name: "send_message",
    description:
      "Send a chat message to a client as the admin. Note: messages sent this way do NOT trigger a push notification, because push requires a signed-in browser session.",
    inputSchema: {
      type: "object",
      properties: {
        client: { type: "string" },
        body: { type: "string" },
      },
      required: ["client", "body"],
    },
  },
  {
    name: "project_report",
    description:
      "Gather everything needed to write a status report for one client: project states, log entries in the period, and chat activity including whether the client is waiting on a reply. Returns raw material — write the prose yourself, then post_update it if the user wants it published.",
    inputSchema: {
      type: "object",
      properties: {
        client: { type: "string" },
        since: {
          type: "string",
          description: "ISO date. Defaults to 30 days ago.",
        },
      },
      required: ["client"],
    },
  },
] as const;

type ToolHandler = (
  db: SupabaseClient,
  args: Record<string, unknown>,
) => Promise<unknown>;

const HANDLERS: Record<string, ToolHandler> = {
  async list_clients(db, args) {
    let query = db
      .from("portal_clients")
      .select("id, name, contact_email, access_code, archived, created_at, projects:portal_projects(id, name, status, progress, live_url)")
      .order("created_at", { ascending: false });

    if (args.include_archived !== true) query = query.eq("archived", false);

    const { data, error } = await query;
    if (error) throw new ToolError(error.message);
    return { clients: data ?? [] };
  },

  async get_client(db, args) {
    const client = await resolveClient(db, requireString(args, "client"));

    const { data: projects } = await db
      .from("portal_projects")
      .select("*")
      .eq("client_id", client.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const rows = (projects ?? []) as ProjectRow[];
    const withUpdates = await Promise.all(
      rows.map(async (project) => {
        const { data: updates } = await db
          .from("portal_updates")
          .select("id, title, body, is_html, created_at")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(5);
        return { ...project, recent_updates: updates ?? [] };
      }),
    );

    const { count } = await db
      .from("portal_messages")
      .select("id", { count: "exact", head: true })
      .eq("client_id", client.id);

    return { client, projects: withUpdates, message_count: count ?? 0 };
  },

  async create_client(db, args) {
    const name = requireString(args, "name");
    const email = typeof args.email === "string" ? args.email.trim() : "";
    const phone = typeof args.phone === "string" ? args.phone.trim() : "";

    // access_code comes from the portal_generate_code() column default.
    const { data, error } = await db
      .from("portal_clients")
      .insert({
        name,
        contact_email: email || null,
        contact_phone: phone || null,
      })
      .select()
      .single();

    if (error) throw new ToolError(error.message);
    const client = data as ClientRow;

    let project = null;
    if (typeof args.first_project === "string" && args.first_project.trim()) {
      const { data: projectRow, error: projectError } = await db
        .from("portal_projects")
        .insert({ client_id: client.id, name: args.first_project.trim() })
        .select()
        .single();
      if (projectError) throw new ToolError(projectError.message);
      project = projectRow;
    }

    return {
      client,
      project,
      note: `Send the access code ${client.access_code} to the client — it is their only way in.`,
    };
  },

  async create_project(db, args) {
    const client = await resolveClient(db, requireString(args, "client"));
    const insert: Record<string, unknown> = {
      client_id: client.id,
      name: requireString(args, "name"),
    };
    if (typeof args.description === "string") insert.description = args.description.trim() || null;
    if (typeof args.status === "string" && args.status.trim()) insert.status = args.status.trim();
    if (typeof args.progress === "number") {
      insert.progress = Math.max(0, Math.min(100, Math.round(args.progress)));
    }

    const { data, error } = await db.from("portal_projects").insert(insert).select().single();
    if (error) throw new ToolError(error.message);
    return { project: data, client: { id: client.id, name: client.name } };
  },

  async update_project(db, args) {
    const project = await resolveProject(
      db,
      requireString(args, "project"),
      typeof args.client === "string" ? args.client : undefined,
    );

    const patch: Record<string, unknown> = {};
    if (typeof args.status === "string" && args.status.trim()) patch.status = args.status.trim();
    if (typeof args.progress === "number") {
      patch.progress = Math.max(0, Math.min(100, Math.round(args.progress)));
    }
    if (typeof args.description === "string") {
      patch.description = args.description.trim() || null;
    }
    if (typeof args.live_url === "string") patch.live_url = args.live_url.trim() || null;

    if (Object.keys(patch).length === 0) {
      throw new ToolError("Nothing to change — pass at least one of status, progress, description, live_url.");
    }

    const { data, error } = await db
      .from("portal_projects")
      .update(patch)
      .eq("id", project.id)
      .select()
      .single();

    if (error) throw new ToolError(error.message);
    return { project: data, changed: Object.keys(patch) };
  },

  async post_update(db, args) {
    const project = await resolveProject(
      db,
      requireString(args, "project"),
      typeof args.client === "string" ? args.client : undefined,
    );

    const html = markdownToHtml(requireString(args, "body"));
    if (!html) throw new ToolError("`body` produced no content.");

    const title = typeof args.title === "string" && args.title.trim() ? args.title.trim() : null;

    const { data, error } = await db
      .from("portal_updates")
      .insert({ project_id: project.id, title, body: html, is_html: true })
      .select()
      .single();

    if (error) throw new ToolError(error.message);
    return {
      update: data,
      note: `Visible to the client now, on the ${project.name} timeline.`,
    };
  },

  async list_updates(db, args) {
    const project = await resolveProject(
      db,
      requireString(args, "project"),
      typeof args.client === "string" ? args.client : undefined,
    );
    const limit = typeof args.limit === "number" ? Math.min(100, Math.max(1, args.limit)) : 20;

    const { data, error } = await db
      .from("portal_updates")
      .select("id, title, body, is_html, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new ToolError(error.message);
    return { project: { id: project.id, name: project.name }, updates: data ?? [] };
  },

  async read_chat(db, args) {
    const client = await resolveClient(db, requireString(args, "client"));
    const limit = typeof args.limit === "number" ? Math.min(200, Math.max(1, args.limit)) : 50;

    const { data, error } = await db
      .from("portal_messages")
      .select("id, sender_role, body, attachment_name, created_at")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new ToolError(error.message);
    return {
      client: { id: client.id, name: client.name },
      messages: (data ?? []).reverse(),
    };
  },

  async send_message(db, args) {
    const client = await resolveClient(db, requireString(args, "client"));
    const body = requireString(args, "body");

    const { data, error } = await db
      .from("portal_messages")
      .insert({ client_id: client.id, sender_role: "admin", body })
      .select()
      .single();

    if (error) throw new ToolError(error.message);
    return {
      message: data,
      note: "Delivered to the thread. No push notification was sent — see the tool description.",
    };
  },

  async project_report(db, args) {
    const client = await resolveClient(db, requireString(args, "client"));
    let since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    if (typeof args.since === "string" && args.since.trim()) {
      const parsed = new Date(args.since.trim());
      // toISOString() on an Invalid Date throws a RangeError, which would
      // surface as an unhelpful "Invalid time value".
      if (Number.isNaN(parsed.getTime())) {
        throw new ToolError(`\`since\` is not a valid date: ${args.since}`);
      }
      since = parsed.toISOString();
    }

    const { data: projects } = await db
      .from("portal_projects")
      .select("*")
      .eq("client_id", client.id)
      .order("sort_order", { ascending: true });

    const rows = (projects ?? []) as ProjectRow[];
    const perProject = await Promise.all(
      rows.map(async (project) => {
        const { data: updates } = await db
          .from("portal_updates")
          .select("id, title, body, is_html, created_at")
          .eq("project_id", project.id)
          .gte("created_at", since)
          .order("created_at", { ascending: true });
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          progress: project.progress,
          live_url: project.live_url,
          description: project.description,
          updates_in_period: updates ?? [],
        };
      }),
    );

    const { data: messages } = await db
      .from("portal_messages")
      .select("sender_role, body, created_at")
      .eq("client_id", client.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    const thread = messages ?? [];
    const last = thread[thread.length - 1];

    return {
      client: { id: client.id, name: client.name, contact_email: client.contact_email },
      period: { since, until: new Date().toISOString() },
      projects: perProject,
      chat: {
        messages_in_period: thread.length,
        from_client: thread.filter((m) => m.sender_role === "client").length,
        from_us: thread.filter((m) => m.sender_role === "admin").length,
        // The single most useful fact in a status review.
        awaiting_our_reply: last?.sender_role === "client",
        last_message_at: last?.created_at ?? null,
      },
    };
  },
};

// --- JSON-RPC ---------------------------------------------------------------

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

function rpcResult(id: RpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(id: RpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleRpc(db: SupabaseClient, request: RpcRequest): Promise<unknown | null> {
  const { method, id, params } = request;

  switch (method) {
    case "initialize": {
      const asked = (params?.protocolVersion as string) ?? DEFAULT_PROTOCOL;
      return rpcResult(id, {
        protocolVersion: SUPPORTED_PROTOCOLS.includes(asked) ? asked : DEFAULT_PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      });
    }

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, { tools: TOOLS });

    case "tools/call": {
      const name = params?.name as string;
      const handler = HANDLERS[name];
      if (!handler) return rpcError(id, -32602, `Unknown tool: ${name}`);

      const args = (params?.arguments as Record<string, unknown>) ?? {};
      try {
        const result = await handler(db, args);
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (error) {
        // Tool failures belong in the result, not in a protocol error — that is
        // what lets the model read the message and correct itself.
        const message = error instanceof Error ? error.message : String(error);
        return rpcResult(id, {
          content: [{ type: "text", text: message }],
          isError: true,
        });
      }
    }

    default:
      // Notifications (no id) need no reply at all.
      if (id === undefined || id === null) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    // GET would open the server-to-client SSE stream, which this stateless
    // server does not offer.
    return json({ error: "Method not allowed" }, 405);
  }

  // Built before the auth check, because that check now reads the token table.
  const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const presented = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!(await authorize(db, presented))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="myve-portal"',
      },
    });
  }

  let payload: RpcRequest | RpcRequest[];
  try {
    payload = await req.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }

  if (Array.isArray(payload)) {
    const responses = (await Promise.all(payload.map((entry) => handleRpc(db, entry)))).filter(
      (entry) => entry !== null,
    );
    return responses.length === 0 ? new Response(null, { status: 202, headers: corsHeaders }) : json(responses);
  }

  const response = await handleRpc(db, payload);
  if (response === null) return new Response(null, { status: 202, headers: corsHeaders });
  return json(response);
});
