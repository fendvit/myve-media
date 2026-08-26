// A deliberately small Markdown → HTML converter for update-log bodies.
//
// Why not accept HTML from the MCP client and sanitize it? Because sanitizing
// needs a DOM parser that Deno Deploy does not have, and every sanitizer is a
// blocklist race. Here the input is escaped *first* and the only tags in the
// output are ones this file constructs, so there is no path from input text to
// executable markup — no sanitizer required.
//
// Supported: paragraphs, ### headings, - and 1. lists, **bold**, *italic*,
// `code`, [links](url), --- rules. Anything else is treated as literal text.

const SAFE_PROTOCOL = /^(https?:\/\/|mailto:|tel:)/i;

/** Placeholder marker for extracted code spans — a character Markdown can't contain. */
const MARK = "\u0000";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Applies inline formatting to one already-trimmed line. */
function inline(raw: string): string {
  // Code spans come out first so bold/italic can't reformat their contents,
  // and go back in last.
  const codeSpans: string[] = [];
  let text = escapeHtml(raw).replace(/`([^`]+)`/g, (_match, code: string) => {
    codeSpans.push(`<code>${code}</code>`);
    return `${MARK}${codeSpans.length - 1}${MARK}`;
  });

  // The URL may contain one level of nested parens — both `alert(1)` in a
  // rejected javascript: link and real URLs like /wiki/Foo_(bar) rely on this.
  // Without it the match stops at the first ")" and leaves a stray ")" behind.
  text = text.replace(
    /\[([^\]]+)\]\(\s*([^\s()]*(?:\([^()]*\)[^\s()]*)*)\s*\)/g,
    (_match, label: string, href: string) =>
      // escapeHtml already ran, so any quote in `href` is now &quot; and cannot
      // close the attribute.
      SAFE_PROTOCOL.test(href)
        ? `<a href="${href}" target="_blank" rel="noreferrer noopener">${label}</a>`
        : label,
  );

  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  text = text.replace(/~~([^~]+)~~/g, "<s>$1</s>");

  return text.replace(
    new RegExp(`${MARK}(\\d+)${MARK}`, "g"),
    (_match, index: string) => codeSpans[Number(index)],
  );
}

export function markdownToHtml(source: string): string {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];

  let listTag: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  function closeParagraph() {
    if (paragraph.length === 0) return;
    out.push(`<p>${paragraph.map(inline).join("<br>")}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!listTag) return;
    out.push(`</${listTag}>`);
    listTag = null;
  }

  function openList(tag: "ul" | "ol") {
    if (listTag === tag) return;
    closeList();
    out.push(`<${tag}>`);
    listTag = tag;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeParagraph();
      closeList();
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      closeParagraph();
      closeList();
      out.push("<hr>");
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeParagraph();
      closeList();
      // Capped at h3 to match the levels the portal composer can represent —
      // otherwise an entry written here would lose a level the moment someone
      // pasted it into the editor. .portal-rich keeps all three modest so they
      // never outshout the entry title above them.
      const level = Math.min(heading[1].length, 3);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    if (bullet) {
      closeParagraph();
      openList("ul");
      out.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) {
      closeParagraph();
      openList("ol");
      out.push(`<li>${inline(numbered[1])}</li>`);
      continue;
    }

    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      closeParagraph();
      closeList();
      out.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`);
      continue;
    }

    closeList();
    paragraph.push(trimmed);
  }

  closeParagraph();
  closeList();

  return out.join("");
}
