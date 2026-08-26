// Exchanges a client access code for a real Supabase session.
//
// Supabase has no "log in with an arbitrary code" flow, so this function bridges
// the gap: it verifies the code with the service role, mints (or reuses) a
// synthetic auth user for that client, rotates that user's password to a fresh
// random value, and signs in with it. The password is never persisted anywhere —
// it exists only for the duration of this request.
//
// The caller gets back standard access/refresh tokens, so supabase-js handles
// persistence and silent refresh from there: enter the code once, stay logged in.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Synthetic addresses never receive mail; they only give GoTrue a unique handle.
const SYNTHETIC_EMAIL_DOMAIN = "clients.myve.media";

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_FAILURES = 8;

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

/** Accepts "x7k9qp2m", "X7K9-QP2M", "x7k9 qp2m" -> "X7K9-QP2M". */
function normalizeCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length !== 8) return null;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

function randomPassword(): string {
  // 32 bytes -> 64 hex chars. GoTrue hashes with bcrypt, which hard-fails above
  // 72 bytes — and does so as a panic, surfacing only as an opaque 500. Keep
  // this comfortably under the limit; 256 bits is already far more than enough
  // for a credential that lives for the duration of one request.
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ip = clientIp(req);

  try {
    const { code } = await req.json().catch(() => ({ code: null }));
    if (typeof code !== "string" || !code.trim()) {
      return json({ error: "Zadejte přístupový kód." }, 400);
    }

    // --- brute force guard -------------------------------------------------
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60_000).toISOString();
    const { count: recentFailures } = await admin
      .from("portal_code_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("succeeded", false)
      .gte("created_at", since);

    if ((recentFailures ?? 0) >= RATE_LIMIT_MAX_FAILURES) {
      return json(
        { error: "Příliš mnoho pokusů. Zkuste to prosím za 15 minut." },
        429,
      );
    }

    const normalized = normalizeCode(code);
    if (!normalized) {
      await admin.from("portal_code_attempts").insert({ ip, succeeded: false });
      return json({ error: "Neplatný kód." }, 401);
    }

    // --- look up the client ------------------------------------------------
    const { data: client, error: lookupError } = await admin
      .from("portal_clients")
      .select("id, name, auth_user_id, archived")
      .eq("access_code", normalized)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (!client || client.archived) {
      await admin.from("portal_code_attempts").insert({ ip, succeeded: false });
      return json({ error: "Neplatný kód." }, 401);
    }

    // --- ensure a synthetic auth user exists -------------------------------
    const email = `${client.id}@${SYNTHETIC_EMAIL_DOMAIN}`;
    const password = randomPassword();
    let userId = client.auth_user_id as string | null;

    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { portal_client_id: client.id, portal_client_name: client.name },
      });
      if (createError) throw createError;
      userId = created.user.id;

      const { error: linkError } = await admin
        .from("portal_clients")
        .update({ auth_user_id: userId })
        .eq("id", client.id);
      if (linkError) throw linkError;
    } else {
      // Rotate the password so no long-lived credential is ever stored.
      const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
        password,
      });
      if (updateError) throw updateError;
    }

    // The profile row is what RLS reads to scope this user to their client.
    const { error: profileError } = await admin
      .from("portal_profiles")
      .upsert({ user_id: userId, role: "client", client_id: client.id });
    if (profileError) throw profileError;

    // --- mint the session --------------------------------------------------
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;

    await admin.from("portal_code_attempts").insert({ ip, succeeded: true });

    return json({
      access_token: signIn.session!.access_token,
      refresh_token: signIn.session!.refresh_token,
      client: { id: client.id, name: client.name },
    });
  } catch (err) {
    console.error("redeem-code failed", err);
    return json({ error: "Přihlášení se nezdařilo. Zkuste to prosím znovu." }, 500);
  }
});
