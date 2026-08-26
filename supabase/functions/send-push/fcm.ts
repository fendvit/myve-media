// Firebase Cloud Messaging, HTTP v1.
//
// v1 authenticates with a short-lived OAuth2 access token minted from a service
// account, not the old static server key — so sending a notification means
// signing a JWT, exchanging it, and only then posting the message. That's the
// whole reason this isn't a one-line fetch in index.ts.
//
// The service account key goes in the FCM_SERVICE_ACCOUNT secret, either as the
// JSON itself or base64-encoded — see serviceAccount() for why both.

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

/** Access tokens last an hour; minting one per notification would be absurd. */
let cachedToken: { value: string; expiresAt: number } | null = null;

let cachedAccount: ServiceAccount | null = null;

export function fcmConfigured(): boolean {
  return Boolean(Deno.env.get("FCM_SERVICE_ACCOUNT"));
}

/** Decodes base64 that is expected to contain UTF-8 JSON. */
function decodeBase64(value: string): string {
  try {
    return new TextDecoder().decode(
      Uint8Array.from(atob(value.replace(/\s+/g, "")), (char) => char.charCodeAt(0)),
    );
  } catch {
    throw new Error("FCM_SERVICE_ACCOUNT is neither JSON nor base64-encoded JSON");
  }
}

function serviceAccount(): ServiceAccount {
  if (cachedAccount) return cachedAccount;

  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT");
  if (!raw) throw new Error("FCM_SERVICE_ACCOUNT is not set");

  // Both encodings are accepted because the two ways of setting this behave
  // differently: pasting JSON into the dashboard is fine, but pushing a
  // multi-line value through a shell is not — PowerShell splits it into one
  // argument per line, and the CLI then rejects it. base64 survives any shell.
  const text = raw.trimStart().startsWith("{") ? raw : decodeBase64(raw);

  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(text) as Partial<ServiceAccount>;
  } catch {
    throw new Error("FCM_SERVICE_ACCOUNT is not valid JSON");
  }

  if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
    throw new Error("FCM_SERVICE_ACCOUNT is missing client_email, private_key or project_id");
  }

  cachedAccount = parsed as ServiceAccount;
  return cachedAccount;
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlText(text: string): string {
  return base64url(new TextEncoder().encode(text));
}

/** The PEM in the service account JSON, as a key Web Crypto will sign with. */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const der = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bytes = Uint8Array.from(atob(der), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    bytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // Refresh a minute early so a token can't expire mid-flight.
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.value;

  const account = serviceAccount();
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64urlText(JSON.stringify(header))}.${base64urlText(JSON.stringify(claims))}`;
  const key = await importPrivateKey(account.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  const assertion = `${signingInput}.${base64url(new Uint8Array(signature))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`FCM token exchange failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: body.access_token, expiresAt: now + body.expires_in };
  return body.access_token;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

/** `stale` means the token is permanently dead and its row should be dropped. */
export type FcmResult = "sent" | "stale" | "failed";

export async function sendFcm(deviceToken: string, payload: PushPayload): Promise<FcmResult> {
  const account = serviceAccount();

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await accessToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title: payload.title, body: payload.body },
          // Read by onNotificationTap in the app. FCM data values must be strings.
          data: { url: payload.url },
          android: {
            priority: "HIGH",
            // Matching tags collapse in the tray, so a burst of messages from one
            // client replaces itself instead of stacking up.
            notification: { tag: payload.tag },
          },
        },
      }),
    },
  );

  if (response.ok) return "sent";

  const detail = await response.text();

  // UNREGISTERED (404) means the app was uninstalled or the token rotated.
  // INVALID_ARGUMENT (400) on a token means it was never valid. Both are
  // permanent — retrying forever would just log the same failure every message.
  if (response.status === 404 || (response.status === 400 && detail.includes("INVALID_ARGUMENT"))) {
    return "stale";
  }

  console.error("fcm send failed", response.status, detail);
  return "failed";
}
