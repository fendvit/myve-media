// Notifies the *other* side of a portal conversation about a new message.
//
// Two transports, chosen per subscription row: Web Push for browsers, FCM for
// the Capacitor app (see fcm.ts). Web Push doesn't work inside a WebView, and
// FCM can't reach a desktop browser, so both have to exist.
//
// Called by the sender's browser right after a message row is inserted. That is
// deliberately simpler than a database trigger with pg_net: no vault secrets, no
// extra infrastructure, and the worst case if the sender's tab dies mid-request
// is a missed notification — the message itself is already committed.
//
// The caller's JWT is verified and checked against the message, so a client can
// only ever trigger notifications for their own thread.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import webpush from "npm:web-push@3.6.7";
import { fcmConfigured, sendFcm } from "./fcm.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:fendvit.bis@gmail.com";

const PORTAL_ORIGIN = "https://portal.myve.media";

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

function preview(body: string | null, hasAttachment: boolean): string {
  if (body && body.trim()) {
    return body.length > 120 ? `${body.slice(0, 117)}…` : body;
  }
  return hasAttachment ? "Poslal(a) přílohu" : "Nová zpráva";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    // --- identify the caller ----------------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ error: "Unauthorized" }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    const { message_id } = await req.json().catch(() => ({ message_id: null }));
    if (typeof message_id !== "string") return json({ error: "message_id required" }, 400);

    // --- load the message and the caller's role ---------------------------
    const [{ data: message }, { data: callerProfile }] = await Promise.all([
      admin
        .from("portal_messages")
        .select("id, client_id, sender_role, body, attachment_url")
        .eq("id", message_id)
        .maybeSingle(),
      admin
        .from("portal_profiles")
        .select("role, client_id")
        .eq("user_id", callerId)
        .maybeSingle(),
    ]);

    if (!message) return json({ error: "Message not found" }, 404);
    if (!callerProfile) return json({ error: "Forbidden" }, 403);

    // The caller must actually be a party to this thread, and must match the
    // role the message claims to be from.
    const isAdmin = callerProfile.role === "admin";
    const ownsThread = callerProfile.client_id === message.client_id;
    if (!isAdmin && !ownsThread) return json({ error: "Forbidden" }, 403);
    if (message.sender_role !== callerProfile.role) return json({ error: "Forbidden" }, 403);

    const { data: client } = await admin
      .from("portal_clients")
      .select("id, name, auth_user_id")
      .eq("id", message.client_id)
      .maybeSingle();

    // --- work out who should be notified ----------------------------------
    let recipientIds: string[] = [];
    let title: string;
    let url: string;

    if (message.sender_role === "client") {
      // Client wrote -> notify every admin.
      const { data: admins } = await admin
        .from("portal_profiles")
        .select("user_id")
        .eq("role", "admin");
      recipientIds = (admins ?? []).map((row: { user_id: string }) => row.user_id);
      title = client?.name ? `Nová zpráva — ${client.name}` : "Nová zpráva";
      url = `${PORTAL_ORIGIN}/admin/${message.client_id}`;
    } else {
      // Admin wrote -> notify that one client, if they have ever signed in.
      recipientIds = client?.auth_user_id ? [client.auth_user_id] : [];
      title = "MYVE";
      url = `${PORTAL_ORIGIN}/chat`;
    }

    // Never notify the sender's own devices.
    recipientIds = recipientIds.filter((id) => id !== callerId);
    if (recipientIds.length === 0) return json({ sent: 0, reason: "no recipients" });

    const { data: subscriptions } = await admin
      .from("portal_push_subscriptions")
      .select("id, endpoint, platform, p256dh, auth")
      .in("user_id", recipientIds);

    if (!subscriptions || subscriptions.length === 0) {
      return json({ sent: 0, reason: "no subscriptions" });
    }

    // --- send --------------------------------------------------------------
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const notification = {
      title,
      body: preview(message.body, Boolean(message.attachment_url)),
      url,
      tag: `portal-${message.client_id}`,
    };
    const payload = JSON.stringify(notification);

    // Native rows can exist before Firebase is configured. Skipping them keeps
    // web push working instead of failing the whole request for everyone.
    const canSendNative = fcmConfigured();
    let skippedNative = 0;

    let sent = 0;
    const stale: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub: {
        id: string;
        endpoint: string;
        platform: string;
        p256dh: string | null;
        auth: string | null;
      }) => {
        if (sub.platform !== "web") {
          if (!canSendNative) {
            skippedNative += 1;
            return;
          }
          const result = await sendFcm(sub.endpoint, notification);
          if (result === "sent") sent += 1;
          else if (result === "stale") stale.push(sub.id);
          return;
        }

        if (!sub.p256dh || !sub.auth) {
          // A check constraint should make this impossible; if it happens the
          // row is unusable, so drop it rather than throwing on every message.
          stale.push(sub.id);
          return;
        }

        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
          sent += 1;
        } catch (err) {
          // 404/410 mean the browser threw the subscription away — drop ours too
          // so we stop retrying a dead endpoint forever.
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) stale.push(sub.id);
          else console.error("web push send failed", status, err);
        }
      }),
    );

    if (stale.length > 0) {
      await admin.from("portal_push_subscriptions").delete().in("id", stale);
    }

    if (skippedNative > 0) {
      console.warn(`skipped ${skippedNative} native device(s): FCM_SERVICE_ACCOUNT not set`);
    }

    return json({ sent, pruned: stale.length, skippedNative });
  } catch (err) {
    console.error("send-push failed", err);
    return json({ error: "send failed" }, 500);
  }
});
