// Notifies the client (or, for chat, whichever side didn't just write) about
// something that happened in their portal.
//
// Three kinds of event, one delivery path: a new chat message, a new log entry
// under a project, or a progress change. Two transports, chosen per
// subscription row: Web Push for browsers, FCM for the Capacitor app (see
// fcm.ts). Web Push doesn't work inside a WebView, and FCM can't reach a
// desktop browser, so both have to exist.
//
// Called by the actor's browser right after the underlying row is written.
// That is deliberately simpler than a database trigger with pg_net: no vault
// secrets, no extra infrastructure, and the worst case if the tab dies
// mid-request is a missed notification — the write itself is already committed.
//
// The caller's JWT is verified and checked against the row's owner, so a
// client can only ever trigger notifications for their own thread, and only
// an admin can trigger update/progress notifications (clients can't edit
// those, so a client-triggered one would only ever be a forged request).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import webpush from "npm:web-push@3.6.7";
import { fcmConfigured, sendFcm, type PushPayload } from "./fcm.ts";

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

function truncate(text: string, max = 120): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 3)}…` : trimmed;
}

function messagePreview(body: string | null, hasAttachment: boolean): string {
  if (body && body.trim()) return truncate(body);
  return hasAttachment ? "Poslal(a) přílohu" : "Nová zpráva";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function updatePreview(update: { body: string; is_html: boolean }): string {
  const text = update.is_html ? stripHtml(update.body) : update.body;
  return text ? truncate(text) : "Nový záznam";
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

    const { data: callerProfile } = await admin
      .from("portal_profiles")
      .select("role, client_id")
      .eq("user_id", callerId)
      .maybeSingle();
    if (!callerProfile) return json({ error: "Forbidden" }, 403);
    const isAdmin = callerProfile.role === "admin";

    const body = await req.json().catch(() => ({}));
    const kind = typeof body.kind === "string" ? body.kind : "message";

    // --- work out who should be notified, and with what ------------------
    let recipientIds: string[] = [];
    let title: string;
    let text: string;
    let url: string;
    let tag: string;

    if (kind === "message") {
      const messageId = body.message_id;
      if (typeof messageId !== "string") return json({ error: "message_id required" }, 400);

      const { data: message } = await admin
        .from("portal_messages")
        .select("id, client_id, sender_role, body, attachment_url")
        .eq("id", messageId)
        .maybeSingle();
      if (!message) return json({ error: "Message not found" }, 404);

      const ownsThread = callerProfile.client_id === message.client_id;
      if (!isAdmin && !ownsThread) return json({ error: "Forbidden" }, 403);
      if (message.sender_role !== callerProfile.role) return json({ error: "Forbidden" }, 403);

      const { data: client } = await admin
        .from("portal_clients")
        .select("id, name, auth_user_id")
        .eq("id", message.client_id)
        .maybeSingle();

      if (message.sender_role === "client") {
        const { data: admins } = await admin.from("portal_profiles").select("user_id").eq("role", "admin");
        recipientIds = (admins ?? []).map((row: { user_id: string }) => row.user_id);
        title = client?.name ? `Nová zpráva — ${client.name}` : "Nová zpráva";
      } else {
        recipientIds = client?.auth_user_id ? [client.auth_user_id] : [];
        title = "Máte novou zprávu";
      }
      text = messagePreview(message.body, Boolean(message.attachment_url));
      url = message.sender_role === "client" ? `${PORTAL_ORIGIN}/admin/${message.client_id}` : `${PORTAL_ORIGIN}/chat`;
      tag = `portal-${message.client_id}`;
    } else if (kind === "update") {
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
      const updateId = body.update_id;
      if (typeof updateId !== "string") return json({ error: "update_id required" }, 400);

      const { data: update } = await admin
        .from("portal_updates")
        .select("id, project_id, title, body, is_html")
        .eq("id", updateId)
        .maybeSingle();
      if (!update) return json({ error: "Update not found" }, 404);

      const { data: project } = await admin
        .from("portal_projects")
        .select("id, name, client_id")
        .eq("id", update.project_id)
        .maybeSingle();
      if (!project) return json({ error: "Project not found" }, 404);

      const { data: client } = await admin
        .from("portal_clients")
        .select("auth_user_id")
        .eq("id", project.client_id)
        .maybeSingle();

      recipientIds = client?.auth_user_id ? [client.auth_user_id] : [];
      title = update.title ? `${project.name} — ${update.title}` : `Nový záznam u projektu ${project.name}`;
      text = updatePreview(update);
      url = PORTAL_ORIGIN;
      tag = `portal-update-${project.id}`;
    } else if (kind === "progress") {
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
      const projectId = body.project_id;
      if (typeof projectId !== "string") return json({ error: "project_id required" }, 400);

      const { data: project } = await admin
        .from("portal_projects")
        .select("id, name, client_id, progress")
        .eq("id", projectId)
        .maybeSingle();
      if (!project) return json({ error: "Project not found" }, 404);

      const { data: client } = await admin
        .from("portal_clients")
        .select("auth_user_id")
        .eq("id", project.client_id)
        .maybeSingle();

      recipientIds = client?.auth_user_id ? [client.auth_user_id] : [];
      title = "Váš projekt se právě posunul";
      text = `${project.name}: teď na ${project.progress} %`;
      url = PORTAL_ORIGIN;
      tag = `portal-progress-${project.id}`;
    } else {
      return json({ error: "Unknown kind" }, 400);
    }

    // Never notify the actor's own devices.
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

    const notification: PushPayload = { title, body: text, url, tag };
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
