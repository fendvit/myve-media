// One blog article = one JSON file in src/blog/posts/<slug>.json (written weekly by the
// automation in C:\AI-OS\systems\blog\). Plain data, no HTML: the page and the prerender
// both render it, and an article cannot inject markup. Inline links: [text](/internal-path).
import { SITE, breadcrumbLd } from "../seo/content";

export interface BlogSection { h2: string; text?: string[]; bullets?: string[] }

export interface BlogPost {
  slug: string;
  title: string;          // the H1, a real question or task people search for
  seoTitle: string;       // <title>, ≤ 65 chars, ends with "| MYVE"
  description: string;   // meta description, 120–160 chars
  date: string;           // YYYY-MM-DD, publish date
  updated?: string;
  query: string;          // the search query the article answers (internal, not shown)
  lead: string;           // the short direct answer first (what AI tools quote)
  sections: BlogSection[];
  faq: { q: string; a: string }[];
  related: { label: string; path: string }[];  // our service pages / other articles
  readMinutes?: number;
}

export type Part = { text: string; href?: string };

// "[text](/path)" -> link parts; only internal paths, anything else stays text
export function parts(s: string): Part[] {
  const out: Part[] = [];
  const re = /\[([^\]]+)\]\((\/[a-z0-9\-/#]*)\)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push({ text: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

export const plain = (s: string) => parts(s).map((p) => p.text).join("");

export const sortPosts = (list: BlogPost[]) => [...list].sort((a, b) => b.date.localeCompare(a.date));

export function readMinutes(p: BlogPost) {
  const words = [p.lead, ...p.sections.flatMap((s) => [...(s.text || []), ...(s.bullets || [])]), ...p.faq.flatMap((f) => [f.q, f.a])]
    .join(" ").split(/\s+/).length;
  return p.readMinutes || Math.max(2, Math.round(words / 200));
}

export const czDate = (d: string) => { const [y, m, day] = d.split("-").map(Number); return `${day}. ${m}. ${y}`; };

export const BLOG_META = {
  path: "/blog",
  title: "Blog — weby, AI a automatizace firem v praxi | MYVE",
  description: "Praktické články o tom, jak firmy využívají umělou inteligenci, automatizace a moderní weby. Odpovědi na otázky, které nám klienti kladou nejčastěji.",
};

export function postLd(p: BlogPost) {
  const url = `${SITE}/blog/${p.slug}`;
  return [
    { "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.description, url,
      mainEntityOfPage: url, datePublished: p.date, dateModified: p.updated || p.date, inLanguage: "cs-CZ",
      author: { "@type": "Person", name: "Vít Fendrych", url: SITE }, publisher: { "@id": `${SITE}/#business` } },
    ...(p.faq.length ? [{ "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: p.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: plain(f.a) } })) }] : []),
    breadcrumbLd([{ name: "MYVE", path: "/" }, { name: "Blog", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]),
  ];
}
