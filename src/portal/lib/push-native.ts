// Native push for the Capacitor build. Web Push doesn't work inside a WebView —
// on iOS not at all, on Android unreliably — so native devices register with
// FCM instead and store the resulting token in the same table, tagged with a
// platform. See supabase/functions/send-push for the sending half.

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { db, supabase } from "./db";
import type { PortalPushPlatform } from "./types";

/**
 * The token this device last registered. Permission alone doesn't tell us
 * whether *this* device has a live subscription — a user with two phones would
 * otherwise see "on" on both after enabling it on one.
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

function rememberToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
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

  // Confirm the row still exists: the server prunes tokens FCM reports as dead,
  // and showing "on" for a subscription that was pruned would be a lie.
  const { data } = await db
    .from("portal_push_subscriptions")
    .select("id")
    .eq("endpoint", token)
    .limit(1);

  if (!data || data.length === 0) {
    rememberToken(null);
    return "off";
  }
  return "on";
}

export async function enableNativePush(): Promise<"on" | "off" | "denied"> {
  const existing = await PushNotifications.checkPermissions();
  const permission =
    existing.receive === "granted" ? existing : await PushNotifications.requestPermissions();

  if (permission.receive === "denied") return "denied";
  if (permission.receive !== "granted") return "off";

  const token = await registerForToken();

  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) throw new Error("Nejste přihlášeni.");

  // p256dh/auth are deliberately absent — a check constraint rejects native rows
  // that carry a Web Push key pair.
  const { error } = await db.from("portal_push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: token,
      platform: nativePlatform(),
      user_agent: navigator.userAgent,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw new Error(error.message);

  rememberToken(token);
  return "on";
}

export async function disableNativePush(): Promise<"off"> {
  const token = rememberedToken();
  if (token) {
    await db.from("portal_push_subscriptions").delete().eq("endpoint", token);
  }
  rememberToken(null);

  // Drops the OS-level registration too, so the app stops being woken at all
  // rather than merely having nobody left to send to it.
  await PushNotifications.unregister().catch(() => {
    // Already unregistered, or the platform doesn't support it. Either way the
    // row is gone, which is what the toggle actually reflects.
  });

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
