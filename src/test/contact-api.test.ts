import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/contact";

const post = (body: unknown) =>
  handler(
    new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );

const sentEmails = () =>
  (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map(
    ([, init]: [string, RequestInit]) => JSON.parse(String(init.body))
  );

describe("api/contact", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ id: "x" }), { status: 200 }))
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it("accepts a request with only name and e-mail — no project description required", async () => {
    const res = await post({ kind: "request", name: "Jana", email: "jana@firma.cz" });
    expect(res.status).toBe(200);
    const [notify, confirm] = sentEmails();
    expect(notify.subject).toBe("Nová poptávka: Jana");
    expect(notify.html).toContain("Bez poznámky");
    expect(confirm.to).toEqual(["jana@firma.cz"]);
    expect(confirm.html).toContain("do jednoho pracovního dne");
    expect(confirm.html).not.toContain("24 hodin");
  });

  it("puts the chosen goal in the subject and body", async () => {
    await post({ name: "Petr", email: "petr@firma.cz", goal: "Ještě nevím", message: "Ahoj" });
    const [notify] = sentEmails();
    expect(notify.subject).toBe("Nová poptávka: Petr — Ještě nevím");
    expect(notify.html).toContain("Ještě nevím");
    expect(notify.html).toContain("Ahoj");
  });

  it("still requires a name and a valid e-mail on the initial request", async () => {
    expect((await post({ email: "jana@firma.cz" })).status).toBe(400);
    expect((await post({ name: "Jana", email: "nope" })).status).toBe(400);
    expect(sentEmails()).toHaveLength(0);
  });

  it("follow-up needs a phone or a note and only notifies MYVE", async () => {
    expect((await post({ kind: "followup", name: "Jana", email: "jana@firma.cz" })).status).toBe(400);
    const res = await post({ kind: "followup", name: "Jana", email: "jana@firma.cz", phone: "+420 123" });
    expect(res.status).toBe(200);
    const emails = sentEmails();
    expect(emails).toHaveLength(1);
    expect(emails[0].subject).toBe("Doplnění poptávky: Jana");
    expect(emails[0].html).toContain("+420 123");
  });

  it("swallows honeypot submissions without sending anything", async () => {
    const res = await post({ name: "Bot", email: "bot@spam.io", website: "http://spam" });
    expect(res.status).toBe(200);
    expect(sentEmails()).toHaveLength(0);
  });

  it("escapes HTML in user-supplied fields", async () => {
    await post({ name: "<b>X</b>", email: "x@x.cz", message: "<script>alert(1)</script>" });
    const [notify] = sentEmails();
    expect(notify.html).not.toContain("<script>");
    expect(notify.html).toContain("&lt;script&gt;");
  });
});
