/**
 * Serverless contact endpoint (Vercel Edge Function).
 *
 * Two kinds of POST, both from the site's consultation dialog:
 *
 *   kind: "request"  — the initial ask. Only name + e-mail are required; the
 *                      visitor never has to describe a project to get a reply.
 *                      Notifies MYVE and sends the visitor a confirmation.
 *   kind: "followup" — optional extras (phone, a note) the visitor adds on the
 *                      thank-you step, after they have already committed.
 *                      Notifies MYVE only.
 *
 * Required env vars (set in Vercel + local .env.local — NEVER commit the key):
 *   RESEND_API_KEY     Resend API key (secret)
 *   CONTACT_TO_EMAIL   Inbox that receives requests   (default: fendvit.bis@gmail.com)
 *   CONTACT_FROM_EMAIL Verified sender on your domain (default: MYVE <konzultace@myve.media>)
 */
export const config = { runtime: "edge" };

interface ContactPayload {
  kind?: "request" | "followup";
  name?: string;
  email?: string;
  goal?: string;
  message?: string;
  phone?: string;
  website?: string; // honeypot — must stay empty
}

const TO_EMAIL = "fendvit.bis@gmail.com";
const FROM_EMAIL = "MYVE <konzultace@myve.media>";
const REPLY_PROMISE = "do jednoho pracovního dne";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

const esc = (s: string) =>
  s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

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

const rowsHtml = (rows: [string, string][]) =>
  rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#8a8a8a;font-size:14px;vertical-align:top">${k}</td><td style="padding:6px 0;color:#111;font-size:14px;font-weight:600">${esc(
          v
        )}</td></tr>`
    )
    .join("");

const noteHtml = (label: string, text: string) => `
      <div style="border-top:1px solid #eee;padding-top:16px">
        <div style="color:#8a8a8a;font-size:14px;margin-bottom:6px">${label}</div>
        <div style="color:#111;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(text)}</div>
      </div>`;

const wrap = (title: string, subtitle: string, body: string) => `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#111;margin:0 0 4px">${title}</h2>
      <p style="color:#8a8a8a;margin:0 0 20px;font-size:14px">${subtitle}</p>
      ${body}
    </div>`;

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

  const kind = body.kind === "followup" ? "followup" : "request";
  const name = str(body.name, 200);
  const email = str(body.email, 320);
  const goal = str(body.goal, 200);
  const message = str(body.message);
  const phone = str(body.phone, 60);

  if (!email || !isEmail(email)) {
    return json({ error: "Zadejte prosím platný e-mail." }, 400);
  }

  // ---- Follow-up: extras added on the thank-you step ----------------------
  if (kind === "followup") {
    if (!phone && !message) {
      return json({ error: "Doplňte prosím telefon nebo pár slov." }, 400);
    }
    const who = name || email;
    const html = wrap(
      "Doplnění poptávky",
      `${esc(who)} přidal(a) další informace k poptávce z webu myve.media`,
      rowsHtml([
        ["Jméno", name || "—"],
        ["E-mail", email],
        ["Telefon", phone || "—"],
      ]) + (message ? noteHtml("Co dělají a co je brzdí", message) : "")
    );
    try {
      await sendEmail(apiKey, {
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `Doplnění poptávky: ${who}`,
        html,
      });
    } catch (err) {
      console.error("Contact follow-up failed:", err);
      return json({ error: "Zprávu se nepodařilo odeslat. Zkuste to prosím znovu." }, 502);
    }
    return json({ ok: true });
  }

  // ---- Initial request: name + e-mail is all we ask -----------------------
  if (!name) {
    return json({ error: "Vyplňte prosím jméno a e-mail." }, 400);
  }

  const notifyHtml = wrap(
    "Nová poptávka konzultace",
    `Z webu myve.media · slíbená odpověď ${REPLY_PROMISE}`,
    `<table style="border-collapse:collapse;margin-bottom:20px">${rowsHtml([
      ["Jméno", name],
      ["E-mail", email],
      ["Co by pomohlo", goal || "neuvedeno"],
    ])}</table>` +
      (message
        ? noteHtml("Poznámka", message)
        : `<p style="color:#8a8a8a;font-size:14px;margin:0">Bez poznámky. Klient nemusel nic vymýšlet, zjištění je na nás.</p>`)
  );

  const confirmHtml = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#111;margin:0 0 12px">Díky, ${esc(name)}. Máme to.</h2>
      <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
        Ozveme se vám ${REPLY_PROMISE}. Nemusíte nic připravovat, otázky si vezmeme na sebe.
        Výsledkem bude jasná odpověď: co dává smysl postavit, kolik by to stálo a kdy by to bylo.
        A když to smysl nedává, řekneme vám to na rovinu.
      </p>
      <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 8px"><strong>Co se stane dál</strong></p>
      <ol style="color:#333;font-size:15px;line-height:1.7;margin:0 0 20px;padding-left:20px">
        <li>Podíváme se na váš byznys a na to, co jste nám poslali.</li>
        <li>Ozveme se a domluvíme krátký hovor. Stačí 15 minut.</li>
        <li>Dostanete jasný návrh: co, za kolik a kdy.</li>
      </ol>
      <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
        Chcete, aby hovor šel rychleji? Odpovězte na tento e-mail dvěma větami:
        <em>co děláte</em> a <em>co vás teď nejvíc brzdí</em>. Nic víc nepotřebujeme.
      </p>
      ${
        message
          ? `<p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 4px">Pro připomenutí, tohle jste nám poslali:</p>
      <div style="color:#555;font-size:14px;line-height:1.6;white-space:pre-wrap;border-left:3px solid #ff6b57;padding-left:14px;margin:8px 0 20px">${esc(
        message
      )}</div>`
          : ""
      }
      <p style="color:#8a8a8a;font-size:13px;margin:0">
        Mezitím se můžete podívat na naše projekty na
        <a href="https://myve.media/projekty" style="color:#ff6b57">myve.media</a>.<br/>
        — Vít Fendrych, MYVE · Making You Visible Everywhere
      </p>
    </div>`;

  try {
    // Primary: notify MYVE. If this fails, the whole request fails.
    await sendEmail(apiKey, {
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `Nová poptávka: ${name}${goal ? ` — ${goal}` : ""}`,
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
      subject: "Máme to. Ozveme se do jednoho pracovního dne — MYVE",
      html: confirmHtml,
    });
  } catch (err) {
    console.error("Contact confirmation failed:", err);
  }

  return json({ ok: true });
}
