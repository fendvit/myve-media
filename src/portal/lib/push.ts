import { Capacitor } from "@capacitor/core";
import { db, supabase } from "./db";
import { disableNativePush, enableNativePush, getNativePushState } from "./push-native";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushState =
  | "unsupported" // browser can't do web push (or iOS Safari outside an installed app)
  | "needs-install" // iOS: only works once added to the home screen
  | "denied" // user blocked notifications at the browser level
  | "off"
  | "on";

/** The VAPID key travels as base64url but PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Inside the Capacitor WebView a service worker caches nothing worth having
  // and its push events never fire — native push goes via FCM/APNs instead.
  // Registering anyway only produces errors on startup.
  if (Capacitor.isNativePlatform()) return null;
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/portal-sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

export async function getPushState(): Promise<PushState> {
  // Native devices go through FCM; the browser APIs below don't exist there.
  if (Capacitor.isNativePlatform()) return getNativePushState();
  if (!pushSupported()) {
    // iOS only exposes PushManager once the site is installed to the home
    // screen, so tell the user that rather than calling it unsupported.
    return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return "off";

  // A subscription existing in the browser is not the same as one that reaches
  // *this* account, and the difference is not cosmetic: the row carries the
  // user_id the notification is addressed to. Sign out, sign back in under a
  // different code on the same device, and the browser still holds a perfectly
  // valid subscription pointing at the previous account — the toggle would read
  // "on" while nothing arrived, and message previews for the account that left
  // would keep landing on this screen.
  //
  // RLS restricts select to the caller's own rows, so an empty result means the
  // row was either pruned as stale by send-push or belongs to somebody else.
  // Both are "off" for the person looking at the toggle, and switching it on
  // re-registers the device to them. Native already worked this way; this is
  // the web half. (The re-registration upsert needs the UPDATE policy from
  // 20260826180000_portal_push_reassign_update.sql.)
  const { data } = await db
    .from("portal_push_subscriptions")
    .select("id")
    .eq("endpoint", subscription.endpoint)
    .limit(1);

  return data && data.length > 0 ? "on" : "off";
}

export async function enablePush(): Promise<PushState> {
  if (Capacitor.isNativePlatform()) return enableNativePush();
  if (!VAPID_PUBLIC_KEY) {
    throw new Error("Chybí VITE_VAPID_PUBLIC_KEY.");
  }
  if (!pushSupported()) {
    return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";

  const registration = (await navigator.serviceWorker.getRegistration("/"))
    ?? (await registerServiceWorker());
  if (!registration) return "unsupported";

  // Wait for activation; subscribing against an installing worker throws.
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const json = subscription.toJSON();
  // An RPC rather than an upsert: this browser may already be registered to
  // whoever signed in before, and `on conflict do update` needs to *see* that
  // row through the SELECT policy, which only exposes your own. See
  // 20260826200000_portal_claim_push_subscription.sql.
  const { error } = await db.rpc("portal_claim_push_subscription", {
    p_endpoint: subscription.endpoint,
    p_platform: "web",
    p_p256dh: json.keys?.p256dh ?? arrayBufferToBase64(subscription.getKey("p256dh")),
    p_auth: json.keys?.auth ?? arrayBufferToBase64(subscription.getKey("auth")),
    p_user_agent: navigator.userAgent,
  });
  if (error) throw new Error(error.message);

  return "on";
}

export async function disablePush(): Promise<PushState> {
  if (Capacitor.isNativePlatform()) return disableNativePush();
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return "off";

  await db.from("portal_push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
  return "off";
}

/**
 * Asks the backend to push a notification about something that just happened.
 * Best-effort: a failure here must never surface as "your action failed",
 * because the underlying write (message, log entry, progress) is already saved.
 */
async function requestPush(body: Record<string, unknown>): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Swallowed on purpose — see the doc comment.
  }
}

/** Notifies the other side of the thread about a message we just sent. */
export async function notifyNewMessage(messageId: string): Promise<void> {
  await requestPush({ kind: "message", message_id: messageId });
}

/** Notifies the client that a new log entry was posted under their project. */
export async function notifyProjectUpdate(updateId: string): Promise<void> {
  await requestPush({ kind: "update", update_id: updateId });
}

/** Notifies the client that their project's progress just changed. */
export async function notifyProjectProgress(projectId: string): Promise<void> {
  await requestPush({ kind: "progress", project_id: projectId });
}
