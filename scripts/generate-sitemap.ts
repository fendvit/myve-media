import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { SERVICES } from "../src/seo/content";

const BASE_URL = "https://myve.media";
const TODAY = new Date().toISOString().slice(0, 10);

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/projekty", changefreq: "weekly", priority: "0.8" },
  { path: "/jak-to-delame", changefreq: "monthly", priority: "0.7" },
  { path: "/sluzby", changefreq: "monthly", priority: "0.9" },
  ...SERVICES.map((s) => ({ path: s.path, changefreq: "monthly" as const, priority: "0.9" })),
  { path: "/zasady-ochrany-osobnich-udaju", changefreq: "yearly", priority: "0.2" },
  { path: "/pravni-informace", changefreq: "yearly", priority: "0.2" },
];

// Vercel passes the env; a local build falls back to .env.local / .env
function env(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    if (m) return m[1].trim().replace(/^"|"$/g, "");
  }
}

async function fetchProjects(): Promise<SitemapEntry[]> {
  const url = env("VITE_SUPABASE_URL");
  const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/projects?select=slug,visible&order=sort_order`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string; visible?: boolean }[];
    return rows
      .filter((r) => r.slug && r.visible !== false)
      .map((r) => ({ path: `/projekty/${r.slug}`, changefreq: "monthly" as const, priority: "0.6" }));
  } catch {
    return [];
  }
}

function build(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${e.lastmod || TODAY}</lastmod>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

// the blog: every article in src/blog/posts/, with its own date as lastmod
function blog(): SitemapEntry[] {
  const dir = resolve("src/blog/posts");
  if (!existsSync(dir)) return [];
  const posts = readdirSync(dir).filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(resolve(dir, f), "utf8")) as { slug: string; date: string; updated?: string });
  return [{ path: "/blog", changefreq: "weekly", priority: "0.7" },
          ...posts.map((p) => ({ path: `/blog/${p.slug}`, changefreq: "monthly" as const, priority: "0.6", lastmod: p.updated || p.date }))];
}

const dynamic = await fetchProjects();
const all = [...entries, ...blog(), ...dynamic];
writeFileSync(resolve("public/sitemap.xml"), build(all));
console.log(`sitemap.xml written (${all.length} entries)`);
