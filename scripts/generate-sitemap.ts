import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://myve.media";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const entries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/projekty", changefreq: "weekly", priority: "0.8" },
  { path: "/jak-to-delame", changefreq: "monthly", priority: "0.7" },
];

async function fetchProjects(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/rest/v1/projects?select=slug`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string }[];
    return rows
      .filter((r) => r.slug)
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

const dynamic = await fetchProjects();
const all = [...entries, ...dynamic];
writeFileSync(resolve("public/sitemap.xml"), build(all));
console.log(`sitemap.xml written (${all.length} entries)`);
