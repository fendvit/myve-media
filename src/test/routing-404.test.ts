import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { SERVICES } from "@/seo/content";

// Since 2026-11-22 unknown URLs get a real 404 status (vercel.json → /404.html). A page the
// app knows must therefore be either prerendered (scripts/prerender.ts writes its own file,
// which Vercel's filesystem step serves first) or let through by a rule before the 404 one.
// This test fails when a new <Route> is added without either.

const root = resolve(__dirname, "../..");
const vercel = JSON.parse(readFileSync(resolve(root, "vercel.json"), "utf8")) as {
  routes: { src?: string; dest?: string; status?: number; has?: unknown; handle?: string }[];
};
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const prerender = readFileSync(resolve(root, "scripts/prerender.ts"), "utf8");

// rules after `handle: filesystem` on the main host, in order
const afterFs = vercel.routes.slice(vercel.routes.findIndex((r) => r.handle === "filesystem") + 1).filter((r) => !r.has);
const statusFor = (path: string) => {
  const rule = afterFs.find((r) => r.src && new RegExp(`^${r.src}$`).test(path));
  return rule?.status ?? 200;
};

const prerendered = new Set<string>([
  "/",
  ...[...prerender.matchAll(/file: "([a-z0-9-]+)\/index\.html"/g)].map((m) => `/${m[1]}`),
  ...SERVICES.map((s) => s.path),
  // every article in src/blog/posts/ gets its own blog/<slug>/index.html at build
  ...(prerender.includes("file: `blog/${") ? ["/blog/x"] : []),
]);

describe("404 routing", () => {
  it("unknown URLs get status 404", () => {
    expect(statusFor("/neexistuje")).toBe(404);
    expect(statusFor("/sluzby/neco/navic")).toBe(404);
  });

  it("app pages that are not prerendered still get 200", () => {
    expect(statusFor("/admin")).toBe(200);
    expect(statusFor("/reset-password")).toBe(200);
    // a reference published after the last deploy has no static file yet
    expect(statusFor("/projekty/novy-projekt")).toBe(200);
  });

  it("every <Route> in App.tsx is prerendered or let through", () => {
    const routes = [...app.matchAll(/<Route path="([^"*]+)"/g)].map((m) => m[1].replace(":slug", "x"));
    expect(routes.length).toBeGreaterThan(5);
    for (const r of routes) {
      const ok = prerendered.has(r) || statusFor(r) === 200;
      expect(ok, `${r} would answer 404 on the live host`).toBe(true);
    }
  });
});
