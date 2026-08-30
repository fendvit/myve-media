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

// --- website content --------------------------------------------------------
//
// The public site's portfolio, partner logos and testimonials live in their own
// tables and have nothing to do with the portal tables above. They are called
// "references" here because `create_project` already means a portal project —
// the same word means two different things either side of the login, and a
// model that confuses them publishes a client's private work to the front page.

const IMAGE_BUCKET = "project-images";
const IMAGE_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/`;

const CATEGORIES = ["web", "app"];

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

interface ReferenceRow {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  sort_order: number | null;
  [key: string]: unknown;
}

/** Same transliteration the admin form uses, so a slug generated here and one
 *  generated in the browser agree for the same Czech title. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    // Strips the combining marks NFD just split off, so "Dvůr Králové" slugs as
    // "dvur-kralove" rather than losing the accented letters entirely below.
    .replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function resolveReference(db: SupabaseClient, reference: string): Promise<ReferenceRow> {
  const value = reference.trim();
  if (!value) throw new ToolError("Reference is empty.");

  if (UUID.test(value)) {
    const { data } = await db.from("projects").select("*").eq("id", value).maybeSingle();
    if (!data) throw new ToolError(`No reference with id ${value}.`);
    return data as ReferenceRow;
  }

  const { data: bySlug } = await db.from("projects").select("*").eq("slug", value).maybeSingle();
  if (bySlug) return bySlug as ReferenceRow;

  const { data: matches } = await db
    .from("projects")
    .select("*")
    .ilike("title", `%${value}%`)
    .limit(10);

  const rows = (matches ?? []) as ReferenceRow[];
  if (rows.length === 0) throw new ToolError(`No reference matches "${value}".`);
  if (rows.length > 1) {
    const exact = rows.filter((row) => row.title.toLowerCase() === value.toLowerCase());
    if (exact.length === 1) return exact[0];
    throw new ToolError(
      `"${value}" matches ${rows.length} references: ${rows
        .map((row) => `${row.title} (${row.slug ?? row.id})`)
        .join(", ")}. Use the slug.`,
    );
  }
  return rows[0];
}

/**
 * Copies an image into our own bucket, so a published reference never depends on
 * a URL somebody else can delete. Anything already in the bucket — including a
 * public_url handed back by prepare_image_upload — passes straight through.
 */
async function storeImage(db: SupabaseClient, source: string): Promise<string> {
  const url = source.trim();
  if (!url) throw new ToolError("Image URL is empty.");
  if (url.startsWith(IMAGE_PREFIX)) return url;

  if (!/^https:\/\//i.test(url)) {
    throw new ToolError(
      `"${url}" is not an https URL. For a file on disk, call prepare_image_upload first and pass the public_url it returns.`,
    );
  }

  const response = await fetch(url);
  if (!response.ok) throw new ToolError(`Could not fetch ${url}: HTTP ${response.status}.`);

  const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!contentType.startsWith("image/")) {
    throw new ToolError(`${url} returned ${contentType || "no content type"}, not an image.`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${
    IMAGE_EXTENSIONS[contentType] ?? "png"
  }`;

  const { error } = await db.storage.from(IMAGE_BUCKET).upload(name, bytes, { contentType });
  if (error) throw new ToolError(`Could not store ${url}: ${error.message}`);
  return `${IMAGE_PREFIX}${name}`;
}

/** Accepts a real array or the separated string the admin form uses — both are
 *  natural things for a model to send, and neither is worth an error. */
function toList(value: unknown, separator: RegExp): string[] | null {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(separator).map((entry) => entry.trim()).filter(Boolean);
  }
  return null;
}

function toSteps(value: unknown): { title: string; description: string }[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .map((entry, index) => {
      if (typeof entry !== "object" || entry === null) {
        throw new ToolError(`steps[${index}] must be an object with title and description.`);
      }
      const step = entry as Record<string, unknown>;
      return {
        title: typeof step.title === "string" ? step.title.trim() : "",
        description: typeof step.description === "string" ? step.description.trim() : "",
      };
    })
    .filter((step) => step.title || step.description);
}

/** The fields create_reference and update_reference share. Only keys actually
 *  present in `args` end up in the patch, so an update touches nothing else. */
async function referenceFields(
  db: SupabaseClient,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const patch: Record<string, unknown> = {};

  if (typeof args.title === "string" && args.title.trim()) patch.title = args.title.trim();
  if (typeof args.slug === "string" && args.slug.trim()) patch.slug = slugify(args.slug);
  if (typeof args.description === "string") patch.description = args.description.trim() || null;
  if (typeof args.external_url === "string") patch.external_url = args.external_url.trim() || null;
  if (typeof args.visible === "boolean") patch.visible = args.visible;

  if (typeof args.category === "string" && args.category.trim()) {
    const category = args.category.trim().toLowerCase();
    if (!CATEGORIES.includes(category)) {
      throw new ToolError(`\`category\` must be one of: ${CATEGORIES.join(", ")}.`);
    }
    patch.category = category;
  }

  if (typeof args.detailed_description === "string") {
    patch.detailed_description = markdownToHtml(args.detailed_description) || null;
  }

  const tags = toList(args.tags, /[,\n]/);
  if (tags) patch.tags = tags;

  const results = toList(args.results, /\n/);
  if (results) patch.result_text = results.join("\n") || null;

  const steps = toSteps(args.steps);
  if (steps) patch.steps = steps;

  if (typeof args.image === "string") {
    patch.image_url = args.image.trim() ? await storeImage(db, args.image) : null;
  }

  const screenshots = toList(args.screenshots, /\n/);
  if (screenshots) {
    // Sequential rather than Promise.all: a reference with a dozen screenshots
    // would otherwise open a dozen sockets at once inside one edge invocation.
    const stored: string[] = [];
    for (const url of screenshots) stored.push(await storeImage(db, url));
    patch.screenshots = stored;
  }

  return patch;
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

  // Public site. Everything below is world-readable the moment it is written —
  // unlike the portal tools above, which only the one client ever sees.
  {
    name: "list_references",
    description:
      "List the portfolio entries on the public site (myve.media/projekty) with their slugs, categories and order. The first four in sort order are the ones shown on the homepage. Not to be confused with portal projects — these are public.",
    inputSchema: {
      type: "object",
      properties: {
        full: {
          type: "boolean",
          description:
            "Include long fields (detailed description, screenshots, steps). Defaults to false, which keeps the list short.",
        },
      },
    },
  },
  {
    name: "get_reference",
    description: "Full detail for one public portfolio entry, including its detailed description, screenshots and steps.",
    inputSchema: {
      type: "object",
      properties: {
        reference: { type: "string", description: "Reference id, slug, or title." },
      },
      required: ["reference"],
    },
  },
  {
    name: "create_reference",
    description:
      "Publish a portfolio entry to the public site. Only `title` is required; everything else can be filled in later with update_reference. New entries go to the end of the order, so they do NOT appear on the homepage until reordered in the admin UI.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Project name, e.g. \"Penzion U Lípy\"." },
        slug: {
          type: "string",
          description:
            "URL segment under /projekty/. Derived from the title when omitted; accents are stripped.",
        },
        description: { type: "string", description: "One or two sentences, shown on the card in the listing." },
        detailed_description: {
          type: "string",
          description:
            "The long \"O projektu\" section on the entry's own page. Markdown — headings, bullets, bold, links — converted to HTML.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "e.g. [\"Webdesign\", \"Rezervační systém\"]. A comma-separated string is also accepted.",
        },
        results: {
          type: "array",
          items: { type: "string" },
          description:
            "Headline outcomes, each rendered on its own line with an arrow, e.g. [\"+120 % návštěvnosti\", \"+50 % konverzí\"].",
        },
        external_url: { type: "string", description: "Link to the live site or app." },
        category: { type: "string", description: "web or app. Defaults to web." },
        image: {
          type: "string",
          description:
            "Main image: an https URL, which is downloaded and re-hosted in our own storage. For a file on disk, call prepare_image_upload first.",
        },
        screenshots: {
          type: "array",
          items: { type: "string" },
          description: "Gallery images, same rules as `image`.",
        },
        steps: {
          type: "array",
          description: "The \"Jak jsme postupovali\" list, in order.",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        visible: { type: "boolean", description: "Defaults to visible." },
      },
      required: ["title"],
    },
  },
  {
    name: "update_reference",
    description:
      "Change a public portfolio entry. Only the fields you pass are touched. Passing `tags`, `results`, `screenshots` or `steps` replaces that list wholesale rather than appending — read it with get_reference first if you mean to add one item.",
    inputSchema: {
      type: "object",
      properties: {
        reference: { type: "string", description: "Reference id, slug, or title." },
        title: { type: "string" },
        slug: { type: "string", description: "Changing this breaks any existing link to the entry." },
        description: { type: "string" },
        detailed_description: { type: "string", description: "Markdown. Empty string clears it." },
        tags: { type: "array", items: { type: "string" } },
        results: { type: "array", items: { type: "string" } },
        external_url: { type: "string", description: "Empty string clears it." },
        category: { type: "string", description: "web or app." },
        image: { type: "string", description: "Empty string clears it." },
        screenshots: { type: "array", items: { type: "string" } },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
          },
        },
        visible: { type: "boolean", description: "false hides it from the site without deleting it." },
      },
      required: ["reference"],
    },
  },
  {
    name: "reorder_references",
    description:
      "Set the order of the public portfolio, which is what decides the homepage: the first four entries in the order are the ones shown there. Entries you name move to the front in the order given; anything you leave out keeps its current relative order behind them, so promoting a single entry needs only that one name.",
    inputSchema: {
      type: "object",
      properties: {
        order: {
          type: "array",
          items: { type: "string" },
          description: "Reference ids, slugs or titles, most prominent first.",
        },
      },
      required: ["order"],
    },
  },
  {
    name: "list_partners",
    description: "List the partner logos in the marquee on the public site.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_partner",
    description: "Add a partner logo to the marquee on the public site.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Partner or company name, used as the logo's alt text." },
        logo: {
          type: "string",
          description:
            "An https URL, downloaded and re-hosted in our own storage. For a file on disk, call prepare_image_upload first.",
        },
        reference: {
          type: "string",
          description: "Optional portfolio entry to link the logo to — id, slug, or title.",
        },
        visible: { type: "boolean", description: "Defaults to visible." },
      },
      required: ["name", "logo"],
    },
  },
  {
    name: "list_testimonials",
    description: "List the client testimonials on the public site.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "create_testimonial",
    description:
      "Add a client testimonial to the public site. Quote real words only — never invent or embellish a client's words.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "The quote itself, as the client wrote or said it." },
        author_name: { type: "string" },
        author_role: { type: "string", description: "e.g. \"majitel, Penzion U Lípy\"." },
        visible: { type: "boolean", description: "Defaults to visible." },
      },
      required: ["content", "author_name"],
    },
  },
  {
    name: "prepare_image_upload",
    description:
      "Get a one-time signed URL for putting an image straight into our storage, for pictures that exist only on the caller's disk. Upload the bytes with `curl -X PUT \"<upload_url>\" -H \"Content-Type: <mime>\" --data-binary @<file>`, then pass the returned `public_url` to create_reference or create_partner. Images already reachable over https need none of this — pass the URL directly.",
    inputSchema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "Original file name; only its extension is kept. Defaults to .png.",
        },
      },
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

  // --- public site ----------------------------------------------------------

  async list_references(db, args) {
    const columns = args.full === true
      ? "*"
      : "id, title, slug, category, description, tags, image_url, external_url, visible, sort_order";

    const { data, error } = await db
      .from("projects")
      .select(columns)
      .order("sort_order", { ascending: true });

    if (error) throw new ToolError(error.message);
    const rows = (data ?? []) as ReferenceRow[];
    return {
      references: rows,
      note: rows.length > 4
        ? `The first four (${rows.slice(0, 4).map((row) => row.title).join(", ")}) are the ones on the homepage.`
        : "All of these appear on the homepage.",
    };
  },

  async get_reference(db, args) {
    const reference = await resolveReference(db, requireString(args, "reference"));
    return { reference, url: `https://myve.media/projekty/${reference.slug ?? ""}` };
  },

  async create_reference(db, args) {
    const title = requireString(args, "title");
    const insert = await referenceFields(db, args);
    insert.title = title;
    if (!insert.slug) insert.slug = slugify(title);

    if (!insert.slug) {
      throw new ToolError(
        `"${title}" has no letters or digits to build a slug from — pass \`slug\` explicitly.`,
      );
    }

    // The slug is the URL, so a collision would silently shadow an existing
    // entry rather than fail loudly at insert time.
    const { data: clash } = await db
      .from("projects")
      .select("id, title")
      .eq("slug", insert.slug)
      .maybeSingle();
    if (clash) {
      throw new ToolError(
        `Slug "${insert.slug}" is already used by "${(clash as { title: string }).title}". Pass a different \`slug\`.`,
      );
    }

    const { count } = await db.from("projects").select("id", { count: "exact", head: true });
    insert.sort_order = count ?? 0;

    const { data, error } = await db.from("projects").insert(insert).select().single();
    if (error) throw new ToolError(error.message);

    return {
      reference: data,
      url: `https://myve.media/projekty/${insert.slug}`,
      note:
        "Live on the site now, at the end of the listing. Drag it into the first four in /admin if it should be on the homepage.",
    };
  },

  async update_reference(db, args) {
    const reference = await resolveReference(db, requireString(args, "reference"));
    const patch = await referenceFields(db, args);

    if (Object.keys(patch).length === 0) {
      throw new ToolError("Nothing to change — pass at least one field to update.");
    }

    if (typeof patch.slug === "string" && patch.slug !== reference.slug) {
      const { data: clash } = await db
        .from("projects")
        .select("id, title")
        .eq("slug", patch.slug)
        .neq("id", reference.id)
        .maybeSingle();
      if (clash) {
        throw new ToolError(
          `Slug "${patch.slug}" is already used by "${(clash as { title: string }).title}".`,
        );
      }
    }

    const { data, error } = await db
      .from("projects")
      .update(patch)
      .eq("id", reference.id)
      .select()
      .single();

    if (error) throw new ToolError(error.message);
    return { reference: data, changed: Object.keys(patch) };
  },

  async reorder_references(db, args) {
    const requested = toList(args.order, /\n/);
    if (!requested || requested.length === 0) {
      throw new ToolError("`order` must name at least one reference.");
    }

    const { data, error } = await db
      .from("projects")
      .select("id, title, slug")
      .order("sort_order", { ascending: true });
    if (error) throw new ToolError(error.message);
    const current = (data ?? []) as ReferenceRow[];

    const front: ReferenceRow[] = [];
    const named = new Set<string>();
    for (const entry of requested) {
      const row = await resolveReference(db, entry);
      if (named.has(row.id)) {
        throw new ToolError(`"${entry}" names "${row.title}", which the order already lists.`);
      }
      named.add(row.id);
      front.push(row);
    }

    // Unnamed entries keep their relative order behind the named ones, which is
    // what makes "put this one on the homepage" a one-name call.
    const ordered = [...front, ...current.filter((row) => !named.has(row.id))];

    const results = await Promise.all(
      ordered.map((row, index) =>
        db.from("projects").update({ sort_order: index }).eq("id", row.id),
      ),
    );

    // Promise.all doesn't stop the others once one rejects, so a failure here
    // leaves the order partly written rather than untouched. Say so plainly.
    const failure = results.find((result) => result.error);
    if (failure?.error) {
      throw new ToolError(
        `The order is now half-applied — rerun this call or fix it in /admin. Cause: ${failure.error.message}`,
      );
    }

    return {
      order: ordered.map((row, index) => ({
        position: index,
        title: row.title,
        slug: row.slug,
      })),
      homepage: ordered.slice(0, 4).map((row) => row.title),
    };
  },

  async list_partners(db) {
    const { data, error } = await db
      .from("partner_logos")
      .select("id, name, logo_url, project_id, visible, sort_order")
      .order("sort_order", { ascending: true });

    if (error) throw new ToolError(error.message);
    return { partners: data ?? [] };
  },

  async create_partner(db, args) {
    const insert: Record<string, unknown> = {
      name: requireString(args, "name"),
      logo_url: await storeImage(db, requireString(args, "logo")),
    };

    if (typeof args.reference === "string" && args.reference.trim()) {
      insert.project_id = (await resolveReference(db, args.reference)).id;
    }
    if (typeof args.visible === "boolean") insert.visible = args.visible;

    const { count } = await db.from("partner_logos").select("id", { count: "exact", head: true });
    insert.sort_order = (count ?? 0) + 1;

    const { data, error } = await db.from("partner_logos").insert(insert).select().single();
    if (error) throw new ToolError(error.message);
    return { partner: data, note: "Visible in the marquee on the site now." };
  },

  async list_testimonials(db) {
    const { data, error } = await db
      .from("testimonials")
      .select("id, content, author_name, author_role, visible, sort_order")
      .order("sort_order", { ascending: true });

    if (error) throw new ToolError(error.message);
    return { testimonials: data ?? [] };
  },

  async create_testimonial(db, args) {
    const insert: Record<string, unknown> = {
      content: requireString(args, "content"),
      author_name: requireString(args, "author_name"),
    };
    if (typeof args.author_role === "string") {
      insert.author_role = args.author_role.trim() || null;
    }
    if (typeof args.visible === "boolean") insert.visible = args.visible;

    const { count } = await db.from("testimonials").select("id", { count: "exact", head: true });
    insert.sort_order = (count ?? 0) + 1;

    const { data, error } = await db.from("testimonials").insert(insert).select().single();
    if (error) throw new ToolError(error.message);
    return { testimonial: data, note: "Published to the site now." };
  },

  async prepare_image_upload(db, args) {
    const name = typeof args.filename === "string" ? args.filename.trim() : "";
    const extension = (name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension || "png"}`;

    const { data, error } = await db.storage.from(IMAGE_BUCKET).createSignedUploadUrl(path);
    if (error) throw new ToolError(error.message);

    const { token } = data as { token: string };
    return {
      // Built by hand rather than taken from `data.signedUrl`, which is relative
      // in some client versions and absolute in others.
      upload_url:
        `${SUPABASE_URL}/storage/v1/object/upload/sign/${IMAGE_BUCKET}/${path}?token=${token}`,
      public_url: `${IMAGE_PREFIX}${path}`,
      note:
        "Single use, expires in two hours. PUT the bytes with a Content-Type header, then pass public_url to create_reference or create_partner.",
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
