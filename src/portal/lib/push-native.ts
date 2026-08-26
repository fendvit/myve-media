// Native push for the Capacitor build. Web Push doesn't work inside a WebView —
// on iOS not at all, on Android unreliably — so native devices register with
// FCM instead and store the resulting token in the same table, tagged with a
// platform. See supabase/functions/send-push for the sending half.

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { db } from "./db";
import type { PortalPushPlatform } from "./types";

/**
 * The FCM token this device last registered — the native equivalent of
 * `pushManager.getSubscription()`, which Capacitor has no API for.
 *
 * It is a property of the *device*, not of the account: it is what we look the
 * subscription row up by, and both accounts on a shared phone look it up by the
 * same value. So it is only ever written (never cleared) when a state turns out
 * to be off — a missing row means this account isn't subscribed, not that the
 * device's token is gone, and throwing the token away on that would make the
 * *other* account's toggle read off too.
 */
const TOKEN_KEY = "myve-portal-fcm-token";

function nativePlatform(): PortalPushPlatform {
  return Capacitor.getPlatform() === "ios" ? "ios" : "android";
}

function rememberedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function rememberToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // A device with storage disabled still gets notifications; it just can't
    // show an accurate toggle. Not worth failing the whole flow over.
  }
}

/**
 * `register()` resolves as soon as the request is handed to the OS — the token
 * arrives later on the `registration` event, or never, if the device has no
 * Play Services or no network. Listeners are attached before registering to
 * avoid missing a fast callback, and the timeout keeps a silent failure from
 * leaving the toggle spinning forever.
 */
async function registerForToken(timeoutMs = 15_000): Promise<string> {
  let resolveToken!: (token: string) => void;
  let rejectToken!: (error: Error) => void;
  const token = new Promise<string>((resolve, reject) => {
    resolveToken = resolve;
    rejectToken = reject;
  });

  const listeners = await Promise.all([
    PushNotifications.addListener("registration", (t) => resolveToken(t.value)),
    PushNotifications.addListener("registrationError", (err) =>
      rejectToken(new Error(String((err as { error?: unknown }).error ?? "registration failed"))),
    ),
  ]);

  const timer = setTimeout(
    () => rejectToken(new Error("Zařízení nevrátilo token pro upozornění.")),
    timeoutMs,
  );

  try {
    await PushNotifications.register();
    return await token;
  } finally {
    clearTimeout(timer);
    await Promise.all(listeners.map((listener) => listener.remove()));
  }
}

export async function getNativePushState(): Promise<"on" | "off" | "denied"> {
  const { receive } = await PushNotifications.checkPermissions();
  if (receive === "denied") return "denied";
  if (receive !== "granted") return "off";

  const token = rememberedToken();
  if (!token) return "off";

  // Confirm a row exists *for this account*: the server prunes tokens FCM
  // reports as dead, and RLS narrows the select to our own rows, so an empty
  // result means either the subscription was pruned or it belongs to somebody
  // else who signed in on this device. Both are "off" for the person looking at
  // the toggle. The token stays cached either way — see TOKEN_KEY.
  const { data } = await db
    .from("portal_push_subscriptions")
    .select("id")
    .eq("endpoint", token)
    .limit(1);

  return data && data.length > 0 ? "on" : "off";
}

export async function enableNativePush(): Promise<"on" | "off" | "denied"> {
  const existing = await PushNotifications.checkPermissions();
  const permission =
    existing.receive === "granted" ? existing : await PushNotifications.requestPermissions();

  if (permission.receive === "denied") return "denied";
  if (permission.receive !== "granted") return "off";

  const token = await registerForToken();

  // p256dh/auth are deliberately absent — a check constraint rejects native rows
  // that carry a Web Push key pair.
  //
  // Adds a row for this account without disturbing one another account on the
  // same phone may already have. See
  // 20260826210000_portal_push_device_per_account.sql.
  const { error } = await db.rpc("portal_claim_push_subscription", {
    p_endpoint: token,
    p_platform: nativePlatform(),
    p_user_agent: navigator.userAgent,
  });
  if (error) throw new Error(error.message);

  rememberToken(token);
  return "on";
}

export async function disableNativePush(): Promise<"off"> {
  const token = rememberedToken();
  if (token) {
    // RLS narrows the delete to our own row, so another account on this phone
    // keeps its subscription.
    await db.from("portal_push_subscriptions").delete().eq("endpoint", token);
  }

  // The OS registration is deliberately left alone. `unregister()` would throw
  // the device's FCM token away, which is shared: it would silently cut off any
  // other account signed in here, and their toggle would still claim to be on
  // until the next send pruned the row. With our row gone nothing is addressed
  // to us anyway, so the app is never woken on our behalf — which is all the
  // switch promises.
  return "off";
}

/**
 * Routes a tapped notification to the screen it refers to. The URL is put in
 * the FCM data payload by send-push; only its path is used, so a malformed or
 * foreign URL can't navigate the app somewhere unexpected.
 */
export async function onNotificationTap(navigate: (path: string) => void): Promise<() => void> {
  const listener = await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      const raw = action.notification.data?.url;
      if (typeof raw !== "string") return;
      try {
        navigate(new URL(raw).pathname);
      } catch {
        // Not a URL — ignore rather than navigating somewhere arbitrary.
      }
    },
  );
  return () => void listener.remove();
}
