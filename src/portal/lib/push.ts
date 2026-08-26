import { Capacitor } from "@capacitor/core";
import { db, supabase } from "./db";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export type PushState =
  | "unsupported" // browser can't do web push (or iOS Safari outside an installed app)
  | "needs-install" // iOS: only works once added to the home screen
  | "native-pending" // Capacitor shell: needs FCM/APNs, not web push
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
  // Say so plainly rather than falling through to "unsupported", which would
  // blame the browser for something that simply isn't wired up yet.
  if (Capacitor.isNativePlatform()) return "native-pending";
  if (!pushSupported()) {
    // iOS only exposes PushManager once the site is installed to the home
    // screen, so tell the user that rather than calling it unsupported.
    return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  }
  if (Notification.permission === "denied") return "denied";

  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? "on" : "off";
}

export async function enablePush(): Promise<PushState> {
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

  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("Nejste přihlášeni.");

  const json = subscription.toJSON();
  const { error } = await db.from("portal_push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh ?? arrayBufferToBase64(subscription.getKey("p256dh")),
      auth: json.keys?.auth ?? arrayBufferToBase64(subscription.getKey("auth")),
      user_agent: navigator.userAgent,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(error.message);

  return "on";
}

export async function disablePush(): Promise<PushState> {
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return "off";

  await db.from("portal_push_subscriptions").delete().eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
  return "off";
}

/**
 * Asks the backend to notify the other side about a message we just sent.
 * Best-effort: a failure here must never surface as "your message failed",
 * because the message itself is already saved.
 */
export async function notifyNewMessage(messageId: string): Promise<void> {
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
      body: JSON.stringify({ message_id: messageId }),
    });
  } catch {
    // Swallowed on purpose — see the doc comment.
  }
}
