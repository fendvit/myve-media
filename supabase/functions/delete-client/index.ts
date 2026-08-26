// Permanently deletes a client and everything attached to them.
//
// Deleting the portal_clients row from the browser would already cascade to
// projects, updates and messages, but three things live outside that cascade
// and need the service role:
//
//   * the synthetic auth user minted by redeem-code. Left behind, it keeps a
//     valid refresh token on the client's phone forever — the profile row is
//     gone so they can't read anything, but they also never get signed out.
//     Deleting the user is what actually ends the session.
//   * chat attachments in the private portal-attachments bucket, which are
//     exactly the files you most want gone when you delete someone.
//   * the client's logo in portal-logos.
//
// This is the destructive twin of archiving (see
// 20260826220000_portal_archive_revokes_access.sql). Archiving is the reversible
// one and should be the default; this exists for when the data itself has to go.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BUCKETS = ["portal-attachments", "portal-logos"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Same string, ignoring the casing and padding someone types into a form. */
function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase("cs") === b.trim().toLocaleLowerCase("cs");
}

type Admin = ReturnType<typeof createClient>;

/**
 * Empties `<clientId>/` in one bucket. Objects sit directly in that folder
 * (see uploadAttachment / uploadClientLogo), so a single non-recursive listing
 * covers it — paged, because list() caps out at 100 rows by default and a long
 * chat can hold more than that.
 */
async function emptyClientFolder(admin: Admin, bucket: string, clientId: string): Promise<number> {
  const store = admin.storage.from(bucket);
  let removed = 0;

  for (;;) {
    const { data, error } = await store.list(clientId, { limit: 100 });
    if (error) throw error;
    if (!data || data.length === 0) return removed;

    const paths = data.map((entry: { name: string }) => `${clientId}/${entry.name}`);
    const { error: removeError } = await store.remove(paths);
    if (removeError) throw removeError;

    removed += paths.length;
    // A full page probably means there is another one behind it.
    if (data.length < 100) return removed;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // --- only an admin may do this ----------------------------------------
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { data: callerProfile } = await admin
      .from("portal_profiles")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (callerProfile?.role !== "admin") return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const clientId = typeof body.client_id === "string" ? body.client_id : null;
    const confirmName = typeof body.confirm_name === "string" ? body.confirm_name : null;
    if (!clientId) return json({ error: "client_id required" }, 400);

    const { data: client, error: lookupError } = await admin
      .from("portal_clients")
      .select("id, name, auth_user_id")
      .eq("id", clientId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!client) return json({ error: "Klient nenalezen." }, 404);

    // The name has to be retyped here too, not just in the UI: this endpoint is
    // reachable with any admin token, and the check is the only thing standing
    // between a mistyped id and someone else's history.
    if (!confirmName || !sameName(confirmName, client.name as string)) {
      return json({ error: "Název klienta nesouhlasí." }, 400);
    }

    // --- files -------------------------------------------------------------
    let filesRemoved = 0;
    for (const bucket of BUCKETS) {
      filesRemoved += await emptyClientFolder(admin, bucket, clientId);
    }

    // --- the client's login ------------------------------------------------
    // Before the row, so a failure here leaves the client intact and the whole
    // thing retryable rather than half-deleted with a stranded auth user.
    const authUserId = client.auth_user_id as string | null;
    if (authUserId) {
      const { error: deleteUserError } = await admin.auth.admin.deleteUser(authUserId);
      // Already gone is the state we wanted anyway.
      if (deleteUserError && deleteUserError.status !== 404) throw deleteUserError;
    }

    // --- the client itself, cascading to projects, updates and messages ----
    const { error: deleteError } = await admin
      .from("portal_clients")
      .delete()
      .eq("id", clientId);
    if (deleteError) throw deleteError;

    return json({ ok: true, files_removed: filesRemoved });
  } catch (err) {
    console.error("delete-client failed", err);
    return json({ error: "Smazání se nezdařilo. Zkuste to prosím znovu." }, 500);
  }
});
