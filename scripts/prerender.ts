// Runs after `vite build` (npm "postbuild"). The site is a single-page app: without this,
// every URL answered with the same <title> and an empty <div id="root">, so Google knew only
// the homepage (Search Console, 2026-10-15: 2 pages shown in 5 months).
//
// For every public page this writes a static HTML file with the page's own title,
// description, canonical, Open Graph, structured data, and its real text inside #root.
// React's createRoot replaces that text with the live app on load, so visitors see the same
// site as before; a crawler gets the content without running JavaScript.
//
//   dist/_home.html                      "/"  (vercel.json routes "/" here; index.html stays the
//                                              plain shell for /admin, /reset-password, new projects)
//   dist/<path>/index.html               every other page, served by Vercel's filesystem step
//   dist/404.html                        every unknown URL, with status 404 (since 2026-11-22)
//   dist/llms.txt                        the page list for AI search (since 2026-11-22)
//
// A project published after the last deploy has no file yet: its URL falls through to the
// shell exactly as before, and the next deploy adds it.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { dirname, resolve } from "path";
import { AREA, BUSINESS, HOW_AFTER, HOW_STEPS, LEGAL, OFFER, OG_IMAGE, PAGES, SERVICES, SITE, breadcrumbLd, businessLd, serviceLd } from "../src/seo/content";
import { BLOG_META, czDate, parts, postLd, sortPosts, type BlogPost } from "../src/blog/types";

const DIST = resolve("dist");

function env(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    if (m) return m[1].trim().replace(/^"|"$/g, "");
  }
}

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ld = (o: object) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

interface Project { slug: string; title: string; category?: string; description?: string; detailed_description?: string;
                    result_text?: string; external_url?: string; image_url?: string; visible?: boolean; sort_order?: number }

async function projects(): Promise<Project[]> {
  const url = env("VITE_SUPABASE_URL"), key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) { console.warn("prerender: no Supabase env, project pages skipped"); return []; }
  try {
    const r = await fetch(`${url}/rest/v1/projects?select=*&order=sort_order`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) { console.warn(`prerender: projects HTTP ${r.status}, project pages skipped`); return []; }
    return ((await r.json()) as Project[]).filter((p) => p.slug && p.visible !== false);
  } catch (e) {
    console.warn(`prerender: projects unreachable (${(e as Error).message}), project pages skipped`);
    return [];
  }
}

// ------------------------------------------------------------------ the shared frame
const NAV = `<nav aria-label="Hlavní navigace"><a href="/">MYVE</a> · <a href="/sluzby">Služby</a> · <a href="/tvorba-webu">Tvorba webů</a> · <a href="/emailing-a-automatizace">E-maily a automatizace</a> · <a href="/aplikace-na-miru">Aplikace na míru</a> · <a href="/projekty">Projekty</a> · <a href="/jak-to-delame">Jak to děláme</a> · <a href="/blog">Blog</a></nav>`;
const FOOT = `<footer><p><strong>${esc(BUSINESS.name)}</strong> · ${esc(BUSINESS.street)}, ${esc(BUSINESS.postalCode)} ${esc(BUSINESS.locality)} · <a href="tel:${BUSINESS.phone}">${esc(BUSINESS.phoneDisplay)}</a> · <a href="mailto:${BUSINESS.email}">${esc(BUSINESS.email)}</a> · IČO ${BUSINESS.ico}</p>
<p>Weby a aplikace pro firmy z oblasti: ${AREA.map(esc).join(", ")}.</p><p><a href="/zasady-ochrany-osobnich-udaju">Ochrana osobních údajů</a> · <a href="/pravni-informace">Právní informace</a> · <a href="/tvorba-webu-jaromer">Tvorba webů Jaroměř</a></p></footer>`;
// visible for the moment before the app takes over (and for anyone without JavaScript)
const STYLE = `<style>.seo-static{max-width:860px;margin:0 auto;padding:96px 24px 48px;font:16px/1.6 system-ui,sans-serif;color:#e8e6e3}.seo-static a{color:#ff5d42}.seo-static h1{font-size:2.4rem;line-height:1.1}.seo-static nav,.seo-static footer{font-size:14px;opacity:.8;margin:24px 0}</style>`;

interface Page { file: string; path: string; title: string; description: string; image?: string; type?: string; lds: object[]; body: string }

function html(shell: string, p: Page) {
  const url = `${SITE}${p.path}`, img = p.image || OG_IMAGE;
  let h = shell.replace(/ data-rh="true"/g, "");  // set() puts it back on each tag it writes
  // data-rh: react-helmet-async takes these tags over when the app starts, instead of adding
  // a second description/canonical next to them
  const set = (re: RegExp, tag: string) => {
    if (!tag.startsWith("<title")) tag = tag.replace(/^<(meta|link) /, '<$1 data-rh="true" ');
    h = re.test(h) ? h.replace(re, tag) : h.replace("</head>", `    ${tag}\n  </head>`);
  };
  set(/<title>[\s\S]*?<\/title>/, `<title>${esc(p.title)}</title>`);
  set(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(p.description)}" />`);
  set(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`);
  set(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${p.type || "website"}" />`);
  set(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(url)}" />`);
  set(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(p.title)}" />`);
  set(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(p.description)}" />`);
  set(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(img)}" />`);
  set(/<meta property="og:locale"[^>]*>/, `<meta property="og:locale" content="cs_CZ" />`);
  set(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(p.title)}" />`);
  set(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(p.description)}" />`);
  set(/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(img)}" />`);
  // the firm block in index.html becomes the full one (area served, what it knows), plus the page's own
  h = h.replace(/<script type="application\/ld\+json" data-seo="business">[\s\S]*?<\/script>/, ld(businessLd()) + p.lds.map(ld).join(""));
  h = h.replace(/<div id="root"><\/div>/, `<div id="root">${STYLE}<div class="seo-static">${NAV}${p.body}${FOOT}</div></div>`);
  if (!h.includes('class="seo-static"')) throw new Error(`prerender: no empty <div id="root"></div> in the shell (${p.file})`);
  return h;
}

const para = (t?: string) => (t ? t.split(/\n{2,}/).map((x) => `<p>${esc(x.trim())}</p>`).join("") : "");

function servicePage(s: (typeof SERVICES)[number], byslug: Map<string, Project>): Page {
  const refs = s.references.map((r) => byslug.get(r)).filter(Boolean) as Project[];
  const body = `<main><p>${esc(s.eyebrow)}</p><h1>${esc(s.h1)}</h1><p>${esc(s.lead)}</p>
${s.sections.map((x) => `<section><h2>${esc(x.h2)}</h2>${(x.text || []).map((t) => `<p>${esc(t)}</p>`).join("")}${
    x.bullets ? `<ul>${x.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}${
    (x.cards || []).map((c) => `<h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>`).join("")}</section>`).join("\n")}
<section><h2>Jak to probíhá</h2><ol>${s.steps.map((st) => `<li><strong>${esc(st.title)}</strong> — ${esc(st.text)}</li>`).join("")}</ol><p><a href="/jak-to-delame">Celý postup krok po kroku</a></p></section>
${refs.length ? `<section><h2>Ukázky naší práce</h2><ul>${refs.map((p) => `<li><a href="/projekty/${esc(p.slug)}">${esc(p.title)}</a> — ${esc(p.description)}</li>`).join("")}</ul></section>` : ""}
<section><h2>Časté otázky</h2>${s.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}</section>
<p><a href="tel:${BUSINESS.phone}">Zavolejte ${esc(BUSINESS.phoneDisplay)}</a> nebo napište na <a href="mailto:${BUSINESS.email}">${esc(BUSINESS.email)}</a>. Odpovídáme do jednoho pracovního dne.</p>
<p><a href="${s.related.path}">${esc(s.related.label)}</a></p></main>`;
  return { file: `${s.path.slice(1)}/index.html`, path: s.path, title: s.title, description: s.description, lds: serviceLd(s), body };
}

async function main() {
  const shellPath = resolve(DIST, "index.html");
  // the shell (every URL without its own file) hands its head tags to Helmet as well
  const shell = readFileSync(shellPath, "utf8")
    .replace(/<meta (name="description"|property="og:[a-z:]+"|name="twitter:(?:card|title|description|image)")/g, '<meta data-rh="true" $1');
  writeFileSync(shellPath, shell);
  const list = await projects();
  const byslug = new Map(list.map((p) => [p.slug, p]));
  const projLinks = list.map((p) => `<li><a href="/projekty/${esc(p.slug)}">${esc(p.title)}</a> — ${esc(p.description)}</li>`).join("");
  const pages: Page[] = [];

  pages.push({ file: "_home.html", path: "/", ...PAGES.home, lds: [], body: `<main>
<h1>Weby, aplikace a automatizace, které vaší firmě šetří čas a přivádějí zákazníky.</h1>
<p>Postavíme vám web, aplikaci nebo automatizaci na míru a postaráme se o ně i po spuštění. Rozsah, termín i cenu znáte předem. <a href="tel:${BUSINESS.phone}">Zavolat ${BUSINESS.phoneDisplay}</a></p>
<p>Jmenuji se Vít Fendrych a pomáhám firmám být vidět online. V rámci projektu MYVE — Making You Visible Everywhere tvoříme webové stránky, aplikace a automatizace na míru. Naším cílem není jen hezký web, ale funkční řešení, které firmě šetří čas a pomáhá jí růst.</p>
<p><a href="/automatizace-pro-firmy">Co znamená automatizace firmy a jak probíhá</a></p>
<h2>Ne jen web. Celý systém.</h2><p>Web, e-maily, automatizace i aplikace — postavené tak, aby na sebe navazovaly, a s někým, kdo se o ně stará i po spuštění.</p><ul>${OFFER.pillars.map((p) => `<li><a href="${p.path}">${esc(p.title)}</a> — ${esc(p.text)}</li>`).join("")}</ul><p><a href="/sluzby">Všechno, co pro vás postavíme</a></p>
<h2>Klientská aplikace MYVE Portál</h2><p>${esc(OFFER.bonuses[0].text)}</p>
<h2>V číslech</h2><ul><li>7+ projektů spuštěných pro české firmy</li><li>14 dní od zadání ke spuštění webu</li><li>2 obchody s aplikacemi — vydáváme na Google Play i do App Storu</li><li>1 pracovní den — déle na naši odpověď nečekáte</li></ul>
${projLinks ? `<h2>Naše práce</h2><ul>${projLinks}</ul>` : ""}
<p><a href="/jak-to-delame">Jak to děláme</a> · <a href="/projekty">Všechny projekty</a></p></main>` });

  pages.push({ file: "projekty/index.html", path: "/projekty", ...PAGES.projects,
    lds: [breadcrumbLd([{ name: "MYVE", path: "/" }, { name: "Projekty", path: "/projekty" }])],
    body: `<main><p>Portfolio</p><h1>Všechny projekty</h1>${projLinks ? `<ul>${projLinks}</ul>` : ""}</main>` });

  pages.push({ file: "jak-to-delame/index.html", path: "/jak-to-delame", ...PAGES.how,
    lds: [breadcrumbLd([{ name: "MYVE", path: "/" }, { name: "Jak to děláme", path: "/jak-to-delame" }])],
    body: `<main><p>Proces</p><h1>Od zadání ke spuštění. Bez překvapení.</h1>
<p>Běžný web spouštíme v průměru za 14 dní a na každou zprávu odpovídáme do jednoho pracovního dne.</p>
${HOW_STEPS.map((s) => `<section><h2>${esc(s.number)} ${esc(s.title)}</h2><p>${esc(s.body)}</p><p><strong>${esc(s.badge.title)}</strong> ${esc(s.badge.subtitle)}</p></section>`).join("")}
<section><h2>${esc(HOW_AFTER.h2)}</h2><p>${esc(HOW_AFTER.lead)}</p><ul>${HOW_AFTER.items.map((i) => `<li><strong>${esc(i.title)}</strong> — ${esc(i.text)}</li>`).join("")}</ul><p><a href="/sluzby">Všechny služby</a></p></section></main>` });

  pages.push({ file: "zasady-ochrany-osobnich-udaju/index.html", path: "/zasady-ochrany-osobnich-udaju", ...PAGES.privacy, lds: [],
    body: `<main><h1>Zásady ochrany osobních údajů</h1><p>${esc(PAGES.privacy.description)}</p></main>` });

  pages.push({ file: "sluzby/index.html", path: "/sluzby", ...PAGES.services,
    lds: [breadcrumbLd([{ name: "MYVE", path: "/" }, { name: "Služby", path: "/sluzby" }]),
          { "@context": "https://schema.org", "@type": "ItemList", name: "Služby MYVE",
            itemListElement: OFFER.pillars.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: `${SITE}${p.path}` })) }],
    body: `<main><p>${esc(OFFER.eyebrow)}</p><h1>${esc(OFFER.h1)}</h1><p>${esc(OFFER.lead)}</p>
<section><h2>Tři pilíře</h2><ol>${OFFER.pillars.map((p) => `<li><a href="${p.path}">${esc(p.title)}</a> — ${esc(p.text)}</li>`).join("")}</ol></section>
<section><h2>A navíc ke každé spolupráci</h2><ul>${OFFER.bonuses.map((b) => `<li><strong>${esc(b.title)}</strong> — ${esc(b.text)}</li>`).join("")}</ul></section>
<section><h2>Co od nás můžete čekat</h2><dl>${OFFER.dials.map((d) => `<dt>${esc(d.k)}</dt><dd>${esc(d.v)}</dd>`).join("")}</dl></section>
<section><h2>Co když…</h2>${OFFER.risks.map((r) => `<h3>${esc(r.q)}</h3><p>${esc(r.a)}</p>`).join("")}</section></main>` });

  pages.push({ file: "pravni-informace/index.html", path: "/pravni-informace", ...PAGES.legal, lds: [],
    body: `<main><h1>Právní informace</h1><p>Aktualizováno ${esc(LEGAL.updated)}</p>${LEGAL.sections.map((x) =>
      `<section${x.id ? ` id="${x.id}"` : ""}><h2>${esc(x.h2)}</h2>${x.text.map((t) => `<p>${esc(t)}</p>`).join("")}</section>`).join("")}</main>` });

  for (const s of SERVICES) pages.push(servicePage(s, byslug));

  for (const p of list) {
    const path = `/projekty/${p.slug}`;
    pages.push({ file: `projekty/${p.slug}/index.html`, path, type: "article", image: p.image_url,
      title: `${p.title} — Projekt | MYVE`, description: (p.description || `Případová studie projektu ${p.title} od studia MYVE.`).slice(0, 155),
      lds: [breadcrumbLd([{ name: "MYVE", path: "/" }, { name: "Projekty", path: "/projekty" }, { name: p.title, path }]),
            { "@context": "https://schema.org", "@type": "CreativeWork", name: p.title, url: `${SITE}${path}`, description: p.description,
              image: p.image_url, creator: { "@id": `${SITE}/#business` }, ...(p.external_url ? { sameAs: p.external_url } : {}) }],
      body: `<main><p><a href="/projekty">Projekty</a></p><h1>${esc(p.title)}</h1>${para(p.description)}${para(p.detailed_description)}${
        p.result_text ? `<h2>Výsledek</h2>${para(p.result_text)}` : ""}${
        p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.title)}" width="1280" height="720" style="max-width:100%;height:auto">` : ""}${
        p.external_url ? `<p><a href="${esc(p.external_url)}" rel="noopener">Živý projekt: ${esc(p.external_url)}</a></p>` : ""}</main>` });
  }

  // the blog: src/blog/posts/*.json (written weekly by C:\AI-OS\systems\blog\)
  const BLOG_DIR = resolve("src/blog/posts");
  const posts = sortPosts(existsSync(BLOG_DIR) ? readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(resolve(BLOG_DIR, f), "utf8")) as BlogPost) : []);
  const rich = (s: string) => parts(s).map((x) => x.href ? `<a href="${esc(x.href)}">${esc(x.text)}</a>` : esc(x.text)).join("");
  pages.push({ file: "blog/index.html", path: "/blog", title: BLOG_META.title, description: BLOG_META.description,
    lds: [breadcrumbLd([{ name: "MYVE", path: "/" }, { name: "Blog", path: "/blog" }])],
    body: `<main><p>Blog</p><h1>Weby, AI a automatizace v praxi</h1><ul>${posts.map((p) =>
      `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a> (${czDate(p.date)}) — ${esc(p.description)}</li>`).join("")}</ul></main>` });
  for (const p of posts) {
    pages.push({ file: `blog/${p.slug}/index.html`, path: `/blog/${p.slug}`, type: "article", title: p.seoTitle, description: p.description,
      lds: postLd(p),
      body: `<main><article><p><a href="/blog">Blog</a> · ${czDate(p.date)} · Vít Fendrych, MYVE</p><h1>${esc(p.title)}</h1><p>${rich(p.lead)}</p>${
        p.sections.map((s) => `<section><h2>${esc(s.h2)}</h2>${(s.text || []).map((t) => `<p>${rich(t)}</p>`).join("")}${
          s.bullets ? `<ul>${s.bullets.map((b) => `<li>${rich(b)}</li>`).join("")}</ul>` : ""}</section>`).join("")}${
        p.faq.length ? `<section><h2>Časté otázky</h2>${p.faq.map((f) => `<h3>${esc(f.q)}</h3><p>${rich(f.a)}</p>`).join("")}</section>` : ""}${
        p.related.length ? `<p>${p.related.map((r) => `<a href="${esc(r.path)}">${esc(r.label)}</a>`).join(" · ")}</p>` : ""}</article></main>` });
  }

  for (const p of pages) {
    const out = resolve(DIST, p.file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html(shell, p));
  }

  // Every unknown URL: vercel.json answers it with this file and status 404 (a real 404, not a
  // 200 that search engines index as a copy of the homepage). The app renders NotFound on top.
  const notFound = html(shell, { file: "404.html", path: "/404", title: "Stránka nenalezena (404) — MYVE",
    description: "Tato stránka neexistuje nebo byla přesunuta. Vraťte se na hlavní stránku studia MYVE.", lds: [],
    body: `<main><h1>Tuto stránku jsme nenašli.</h1><p>Odkaz je pravděpodobně neúplný nebo stránka byla přesunuta.</p>
<p><a href="/">Hlavní stránka</a> · <a href="/sluzby">Služby</a> · <a href="/projekty">Projekty</a></p></main>` })
    .replace(/<link data-rh="true" rel="canonical"[^>]*>\s*/, "")
    .replace("</head>", '    <meta name="robots" content="noindex" />\n  </head>');
  writeFileSync(resolve(DIST, "404.html"), notFound);

  // llms.txt from the same page list, so a new page or reference is in it at the next deploy
  // (until 2026-11-22 it was a hand-kept file in public/ that still listed 3 pages; the sitemap
  // already had its generator, scripts/generate-sitemap.ts). Only the site's own titles and
  // descriptions, no new claims.
  const strip = (t: string) => t.replace(/\s*[|—]\s*MYVE$/, "").replace(/ — Projekt$/, "");
  const line = (p: Page) => `- [${strip(p.title)}](${SITE}${p.path}): ${p.description}`;
  const main = pages.filter((p) => !p.path.startsWith("/projekty/") && !p.path.startsWith("/blog/") && p.path !== "/zasady-ochrany-osobnich-udaju" && p.path !== "/pravni-informace");
  writeFileSync(resolve(DIST, "llms.txt"), `# ${BUSINESS.name}

> ${PAGES.home.description}

Studio MYVE (Making You Visible Everywhere) vede Vít Fendrych. Sídlo: ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.locality}, ${BUSINESS.region}. IČO ${BUSINESS.ico}. Telefon ${BUSINESS.phoneDisplay}, e-mail ${BUSINESS.email}. Weby a aplikace pro firmy z oblasti: ${AREA.join(", ")}.

## Stránky

${main.map(line).join("\n")}

## Projekty

${pages.filter((p) => p.path.startsWith("/projekty/")).map(line).join("\n")}

## Články

${pages.filter((p) => p.path.startsWith("/blog/")).map(line).join("\n")}

## Právní informace

${pages.filter((p) => p.path === "/zasady-ochrany-osobnich-udaju" || p.path === "/pravni-informace").map(line).join("\n")}
`);
  console.log(`prerender: ${pages.length} pages (${list.length} projects, ${posts.length} articles)`);
}

await main();
