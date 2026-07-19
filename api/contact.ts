/**
 * Serverless contact endpoint (Vercel Edge Function).
 *
 * Receives a consultation request from the site's contact form, emails it to
 * MYVE via Resend, and sends the visitor an instant confirmation.
 *
 * Required env vars (set in Vercel + local .env.local — NEVER commit the key):
 *   RESEND_API_KEY     Resend API key (secret)
 *   CONTACT_TO_EMAIL   Inbox that receives requests   (default: fendvit.bis@gmail.com)
 *   CONTACT_FROM_EMAIL Verified sender on your domain (default: MYVE <konzultace@myve.media>)
 */
export const config = { runtime: "edge" };

interface ContactPayload {
  name?: string;
  email?: string;
  projectType?: string;
  message?: string;
  website?: string; // honeypot — must stay empty
}

const TO_EMAIL = "fendvit.bis@gmail.com";
const FROM_EMAIL = "MYVE <konzultace@myve.media>";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

async function sendEmail(apiKey: string, payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
  return res.json();
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return json({ error: "Server není nakonfigurován." }, 500);
  }
  const toEmail = process.env.CONTACT_TO_EMAIL || TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || FROM_EMAIL;

  let body: ContactPayload;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Neplatný požadavek." }, 400);
  }

  // Honeypot: bots fill hidden fields — pretend success, send nothing.
  if (body.website && body.website.trim() !== "") {
    return json({ ok: true });
  }

  const name = (body.name || "").trim();
  const email = (body.email || "").trim();
  const projectType = (body.projectType || "").trim();
  const message = (body.message || "").trim();

  if (!name || !email || !message) {
    return json({ error: "Vyplňte prosím jméno, e-mail a zprávu." }, 400);
  }
  if (!isEmail(email)) {
    return json({ error: "Zadejte prosím platný e-mail." }, 400);
  }

  const rows = [
    ["Jméno", name],
    ["E-mail", email],
    ["Typ projektu", projectType || "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#8a8a8a;font-size:14px">${k}</td><td style="padding:6px 0;color:#111;font-size:14px;font-weight:600">${esc(
          v
        )}</td></tr>`
    )
    .join("");

  const notifyHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#111;margin:0 0 4px">Nová poptávka konzultace</h2>
      <p style="color:#8a8a8a;margin:0 0 20px;font-size:14px">Z webu myve.media</p>
      <table style="border-collapse:collapse;margin-bottom:20px">${rows}</table>
      <div style="border-top:1px solid #eee;padding-top:16px">
        <div style="color:#8a8a8a;font-size:14px;margin-bottom:6px">Zpráva</div>
        <div style="color:#111;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(
          message
        )}</div>
      </div>
    </div>`;

  const confirmHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#111;margin:0 0 12px">Děkujeme za zprávu, ${esc(name)} 👋</h2>
      <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
        Vaši poptávku jsme přijali a ozveme se vám co nejdříve, obvykle do jednoho
        pracovního dne. Mezitím si můžete prohlédnout naše projekty na
        <a href="https://myve.media/projekty" style="color:#ff6b57">myve.media</a>.
      </p>
      <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 4px">Pro připomenutí, tohle jste nám poslali:</p>
      <div style="color:#555;font-size:14px;line-height:1.6;white-space:pre-wrap;border-left:3px solid #ff6b57;padding-left:14px;margin:8px 0 20px">${esc(
        message
      )}</div>
      <p style="color:#8a8a8a;font-size:13px;margin:0">— tým MYVE · Making You Visible Everywhere</p>
    </div>`;

  try {
    // Primary: notify MYVE. If this fails, the whole request fails.
    await sendEmail(apiKey, {
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `Nová poptávka: ${name}${projectType ? ` — ${projectType}` : ""}`,
      html: notifyHtml,
    });
  } catch (err) {
    console.error("Contact notify failed:", err);
    return json({ error: "Zprávu se nepodařilo odeslat. Zkuste to prosím znovu." }, 502);
  }

  // Secondary: confirmation to the visitor. Best-effort — never fail on this.
  try {
    await sendEmail(apiKey, {
      from: fromEmail,
      to: [email],
      reply_to: toEmail,
      subject: "Přijali jsme vaši poptávku — MYVE",
      html: confirmHtml,
    });
  } catch (err) {
    console.error("Contact confirmation failed:", err);
  }

  return json({ ok: true });
}
