import { describe, expect, it } from "vitest";
import { markdownToHtml } from "../../supabase/functions/portal-mcp/markdown";
import { isRichTextEmpty, richTextToPlain, sanitizeRichText } from "@/portal/lib/richText";

// These two pieces are the only paths by which text becomes markup in a
// client's browser: the MCP server generates HTML from Markdown, and the portal
// sanitizes whatever ends up in the database before injecting it.

describe("markdownToHtml", () => {
  it("renders the formatting an update actually uses", () => {
    const html = markdownToHtml(
      "### Tento týden\n- Hotový **návrh**\n- Napojení na *CMS*\n\nPříští týden nasazujeme.",
    );
    expect(html).toBe(
      "<h3>Tento týden</h3><ul><li>Hotový <strong>návrh</strong></li>" +
        "<li>Napojení na <em>CMS</em></li></ul><p>Příští týden nasazujeme.</p>",
    );
  });

  it("numbers ordered lists and keeps safe links", () => {
    expect(markdownToHtml("1. První\n2. Druhý")).toBe("<ol><li>První</li><li>Druhý</li></ol>");
    expect(markdownToHtml("[web](https://myve.media)")).toContain(
      '<a href="https://myve.media" target="_blank" rel="noreferrer noopener">web</a>',
    );
  });

  it("escapes markup instead of emitting it", () => {
    const html = markdownToHtml("Ahoj <script>alert(1)</script> a <img src=x onerror=alert(1)>");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops links with an unsafe protocol but keeps the label", () => {
    const html = markdownToHtml("[klikni](javascript:alert(1))");
    expect(html).toBe("<p>klikni</p>");
  });

  it("cannot be broken out of an href attribute", () => {
    // The quote survives as &quot;, so it stays inside the attribute value
    // instead of closing it and starting an event handler.
    const html = markdownToHtml('[x](https://a.com"onmouseover="alert(1))');
    expect(html).toBe(
      '<p><a href="https://a.com&quot;onmouseover=&quot;alert(1)" ' +
        'target="_blank" rel="noreferrer noopener">x</a></p>',
    );
    expect(html).not.toContain('"onmouseover="');
  });

  it("leaves code spans unformatted", () => {
    const html = markdownToHtml("Spusťte `npm run **build**`");
    expect(html).toBe("<p>Spusťte <code>npm run **build**</code></p>");
  });

  it("keeps heading levels distinct, capped at the editor's deepest level", () => {
    expect(markdownToHtml("# A")).toBe("<h1>A</h1>");
    expect(markdownToHtml("## B")).toBe("<h2>B</h2>");
    expect(markdownToHtml("### C")).toBe("<h3>C</h3>");
    // Deeper than the composer can represent — clamped rather than dropped.
    expect(markdownToHtml("##### E")).toBe("<h3>E</h3>");
  });

  it("survives a round trip through the sanitizer", () => {
    // What post_update writes is what the client renders; a mismatch here
    // means the MCP server can emit markup the portal silently discards.
    const source = "## Stav\n- **hotovo**\n- [odkaz](https://myve.media)\n\n> poznámka";
    const html = markdownToHtml(source);
    expect(sanitizeRichText(html)).toBe(html);
  });
});

describe("sanitizeRichText", () => {
  it("keeps the tags the composer produces", () => {
    const html = "<p>Ahoj <strong>světe</strong></p><ul><li>bod</li></ul>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("strips scripts along with their contents", () => {
    expect(sanitizeRichText("<p>před</p><script>alert(1)</script><p>po</p>")).toBe(
      "<p>před</p><p>po</p>",
    );
  });

  it("removes event handlers and inline styles", () => {
    const clean = sanitizeRichText('<p onclick="alert(1)" style="color:red">text</p>');
    expect(clean).toBe("<p>text</p>");
  });

  it("unwraps unknown elements but keeps their text", () => {
    expect(sanitizeRichText("<div><font>text</font></div>")).toBe("text");
  });

  it("drops javascript: hrefs and hardens the links it keeps", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizeRichText('<a href="https://myve.media">x</a>')).toBe(
      '<a href="https://myve.media" target="_blank" rel="noreferrer noopener">x</a>',
    );
  });
});

describe("isRichTextEmpty", () => {
  it("treats an untouched editor as empty", () => {
    expect(isRichTextEmpty("")).toBe(true);
    expect(isRichTextEmpty("<p></p>")).toBe(true);
    expect(isRichTextEmpty("<p>   </p>")).toBe(true);
  });

  it("treats real content as non-empty", () => {
    expect(isRichTextEmpty("<p>a</p>")).toBe(false);
    expect(isRichTextEmpty("<hr>")).toBe(false);
  });
});

describe("richTextToPlain", () => {
  it("flattens markup to a single line", () => {
    expect(richTextToPlain("<h3>Nadpis</h3><p>Text\n s mezerami</p>")).toBe(
      "NadpisText s mezerami",
    );
  });
});
