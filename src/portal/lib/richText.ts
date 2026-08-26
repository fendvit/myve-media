// Sanitizing + flattening for update-log HTML.
//
// Only admins can insert into portal_updates (enforced by RLS), so this is not
// the last line of defence — it is defence in depth. The body travels through
// the database and is rendered into every client's browser with
// dangerouslySetInnerHTML, so a compromised admin session, a bad paste, or a
// future "let the client comment too" change should not become stored XSS.
//
// Allowlist, not blocklist: anything not named here is dropped.

const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "code", "pre",
  "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "hr", "a", "span",
]);

/** Tags whose *contents* are dropped too — unwrapping them would leak code. */
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed"]);

const ALLOWED_ATTRIBUTES: Record<string, ReadonlySet<string>> = {
  a: new Set(["href", "title"]),
};

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function isSafeHref(value: string): boolean {
  const trimmed = value.trim();
  // Relative links are fine and have no protocol to check.
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    return SAFE_LINK_PROTOCOLS.has(new URL(trimmed, window.location.origin).protocol);
  } catch {
    return false;
  }
}

function clean(node: Element) {
  // Snapshot first: the loop reparents and removes nodes as it goes.
  for (const child of Array.from(node.children)) clean(child);

  const tag = node.tagName.toLowerCase();

  if (DROP_WITH_CONTENT.has(tag)) {
    node.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tag)) {
    // Unknown wrapper (a stray <div>, a pasted <font>) — keep the text, lose
    // the element.
    node.replaceWith(...Array.from(node.childNodes));
    return;
  }

  const allowed = ALLOWED_ATTRIBUTES[tag];
  for (const attribute of Array.from(node.attributes)) {
    const name = attribute.name.toLowerCase();
    if (!allowed?.has(name)) {
      // Catches every on* handler and every style/srcset trick in one rule.
      node.removeAttribute(attribute.name);
      continue;
    }
    if (name === "href" && !isSafeHref(attribute.value)) {
      node.removeAttribute(attribute.name);
    }
  }

  if (tag === "a" && node.hasAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noreferrer noopener");
  }
}

/** Returns HTML safe to inject, given the allowlist above. */
export function sanitizeRichText(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  // Clean the children, never the <body> itself: `body` is not in the allowlist,
  // so handing it to clean() unwraps it out of its own document and leaves
  // `parsed.body` null.
  for (const child of Array.from(parsed.body.children)) clean(child);
  return parsed.body.innerHTML;
}

/** True when the editor produced nothing but empty paragraphs and whitespace. */
export function isRichTextEmpty(html: string): boolean {
  if (!html) return true;
  const parsed = new DOMParser().parseFromString(html, "text/html");
  if (parsed.body.querySelector("hr, img, pre")) return false;
  return (parsed.body.textContent ?? "").trim().length === 0;
}

/** Flattens an update body to one line — for previews and notifications. */
export function richTextToPlain(html: string): string {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  return (parsed.body.textContent ?? "").replace(/\s+/g, " ").trim();
}
