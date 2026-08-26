import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { PortalDatabase } from "./types";

// Deliberately the *same* client instance as the marketing site rather than a
// second createClient() call: two GoTrue instances sharing one storage key race
// each other on token refresh. Only the row types differ, so a cast is enough.
export const db = supabase as unknown as SupabaseClient<PortalDatabase>;

export { supabase };

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export interface RedeemResult {
  access_token: string;
  refresh_token: string;
  client: { id: string; name: string };
}

/**
 * Trades an access code for a session and installs it on the shared client.
 * Throws with a human-readable Czech message the caller can surface directly.
 */
export async function redeemAccessCode(code: string): Promise<RedeemResult> {
  const response = await fetch(`${FUNCTIONS_BASE}/redeem-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ code }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Přihlášení se nezdařilo.");
  }

  // setSession persists to localStorage and starts the refresh timer, which is
  // what keeps the client logged in on both web and the installed app.
  const { error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
  if (error) throw new Error(error.message);

  return payload as RedeemResult;
}

/** Attachments live under `<client_id>/…`, which is what storage RLS checks. */
export async function uploadAttachment(clientId: string, file: File): Promise<{
  path: string;
  name: string;
}> {
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const path = `${clientId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("portal-attachments")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(error.message);
  return { path, name: file.name };
}

/**
 * Stores a client's logo and returns its public URL.
 *
 * The path carries a timestamp rather than being a stable `<client_id>.png`:
 * this bucket is public and therefore CDN-cached, so overwriting one path would
 * leave the old logo on screen for as long as the edge cache holds it. A fresh
 * path per upload makes a replacement show up immediately.
 */
export async function uploadClientLogo(clientId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.replace(/[^\w]/g, "") || "png";
  const path = `${clientId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("portal-logos")
    .upload(path, file, { cacheControl: "31536000", upsert: false });

  if (error) throw new Error(error.message);

  return supabase.storage.from("portal-logos").getPublicUrl(path).data.publicUrl;
}

/** The bucket is private, so links have to be signed on demand. */
export async function signAttachment(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("portal-attachments")
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}
