/**
 * Builds the source art that @capacitor/assets expands into Android mipmaps.
 *
 * The brand favicon is the M mark stacked over a "MYVE" wordmark, sized for a
 * browser tab. An Android launcher icon can't use it as-is: adaptive icons are
 * masked to a circle or squircle and only the centre ~66% is guaranteed to
 * survive, which would clip the wordmark into unreadable stubs. So we lift the
 * mark alone and re-centre it inside the safe zone.
 *
 * Run with `npm run icons`, which also regenerates the mipmaps.
 */
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { execFileSync } from "child_process";

// Resolved from the working directory, like scripts/generate-sitemap.ts — npm
// runs both from the package root.
const SOURCE = path.resolve("public/favicon.png");
const OUT = path.resolve("assets");

/** Cream and near-black, matching the portal's two themes (see portal.html). */
const LIGHT = "#f8f5f0";
const DARK = "#0a0a0b";

const ICON = 1024;
const SPLASH = 2732;

/**
 * @capacitor/assets emits an adaptive-icon XML that already insets both layers
 * by 16.7%, so this canvas maps onto the safe zone rather than the full tile —
 * reserving another margin here would shrink the mark twice. 0.72 fills the
 * safe zone the way a typical launcher glyph does without touching the mask.
 */
const SAFE_FRACTION = 0.72;

type Box = { left: number; top: number; width: number; height: number };

/**
 * Tight bounding box of everything that isn't transparent or near-white.
 * `rows` limits the scan so we can isolate the mark from the wordmark below it.
 */
async function contentBox(file: string, rows?: { from: number; to: number }): Promise<Box> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const yStart = rows?.from ?? 0;
  const yEnd = rows?.to ?? height - 1;

  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;

  for (let y = yStart; y <= yEnd; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const opaque = data[i + 3] > 16;
      const inked = data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240;
      if (!opaque || !inked) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error(`No content found in ${file}`);
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Splits the artwork into horizontal bands of content separated by blank rows.
 * The first band is the mark, the second the wordmark — deriving that instead
 * of hardcoding pixel offsets keeps this working if the favicon is redrawn.
 */
async function contentBands(file: string): Promise<Array<{ from: number; to: number }>> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const bands: Array<{ from: number; to: number }> = [];
  let start = -1;

  for (let y = 0; y < height; y++) {
    let inked = false;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i + 3] > 16 && (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240)) {
        inked = true;
        break;
      }
    }
    if (inked && start < 0) start = y;
    if (!inked && start >= 0) {
      bands.push({ from: start, to: y - 1 });
      start = -1;
    }
  }
  if (start >= 0) bands.push({ from: start, to: height - 1 });
  return bands;
}

/** The mark, trimmed and scaled to fill `fraction` of a transparent square. */
async function markOnCanvas(mark: Buffer, canvas: number, fraction: number): Promise<Buffer> {
  const target = Math.round(canvas * fraction);
  const scaled = await sharp(mark)
    .resize({ width: target, height: target, fit: "inside", withoutEnlargement: false })
    .toBuffer();

  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: scaled, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SOURCE)) throw new Error(`Missing source art: ${SOURCE}`);
  fs.mkdirSync(OUT, { recursive: true });

  const bands = await contentBands(SOURCE);
  if (bands.length < 1) throw new Error("Could not find any artwork in the favicon");
  const markBand = bands[0];
  console.log(
    `Bands: ${bands.map((b) => `${b.from}-${b.to}`).join(", ")} — using ${markBand.from}-${markBand.to} as the mark`,
  );

  const box = await contentBox(SOURCE, markBand);
  const mark = await sharp(SOURCE).extract(box).png().toBuffer();

  // Adaptive icon: foreground and background ship as separate layers so the
  // launcher can parallax them.
  const foreground = await markOnCanvas(mark, ICON, SAFE_FRACTION);
  await sharp(foreground).toFile(path.join(OUT, "icon-foreground.png"));

  await sharp({
    create: { width: ICON, height: ICON, channels: 4, background: LIGHT },
  })
    .png()
    .toFile(path.join(OUT, "icon-background.png"));

  // Legacy square icon for pre-adaptive launchers: the same layers, flattened.
  // Padded harder than the adaptive foreground because nothing crops it.
  const legacyMark = await markOnCanvas(mark, ICON, 0.62);
  await sharp({ create: { width: ICON, height: ICON, channels: 4, background: LIGHT } })
    .composite([{ input: legacyMark }])
    .png()
    .toFile(path.join(OUT, "icon.png"));

  // Splash art sits in the middle of a very large canvas that gets centre-cropped
  // to each device aspect, so the mark stays small.
  for (const [name, background] of [
    ["splash.png", LIGHT],
    ["splash-dark.png", DARK],
  ] as const) {
    const splashMark = await markOnCanvas(mark, SPLASH, 0.18);
    await sharp({ create: { width: SPLASH, height: SPLASH, channels: 4, background } })
      .composite([{ input: splashMark }])
      .png()
      .toFile(path.join(OUT, name));
  }

  console.log(`Wrote source art to ${path.relative(process.cwd(), OUT)}/`);

  console.log("Expanding into Android mipmaps…");
  // Named explicitly rather than via `shell: true`, which would splice these
  // into a command string — the repo path has spaces and diacritics in it.
  const [bin, binArgs] =
    process.platform === "win32" ? ["cmd", ["/c", "npx"]] : ["npx", [] as string[]];
  execFileSync(bin, [...binArgs, "@capacitor/assets", "generate", "--android"], {
    stdio: ["ignore", "ignore", "inherit"],
  });

  fixAdaptiveIconBackground();
}

/**
 * @capacitor/assets writes an adaptive icon that insets *both* layers by 16.7%.
 * That's right for the foreground, which has to clear the launcher mask, but
 * wrong for the background: an inset background stops short of the tile edge,
 * so any mask wider than the inset — the squircle, the rounded square — exposes
 * transparent corners. Swapping it for a colour drawable fills the tile at every
 * shape, and lets the now-unreferenced background PNGs be deleted.
 *
 * Re-running the generator reverts this, which is why it lives in the same
 * script rather than being a one-off hand edit.
 */
function fixAdaptiveIconBackground() {
  const res = path.resolve("android/app/src/main/res");

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground>
        <inset android:drawable="@mipmap/ic_launcher_foreground" android:inset="16.7%" />
    </foreground>
</adaptive-icon>
`;

  for (const name of ["ic_launcher.xml", "ic_launcher_round.xml"]) {
    fs.writeFileSync(path.join(res, "mipmap-anydpi-v26", name), xml);
  }

  fs.writeFileSync(
    path.join(res, "values", "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${LIGHT.toUpperCase()}</color>
</resources>
`,
  );

  // The background PNGs the generator emitted are now unreferenced; left in
  // place they'd still be packaged at every density.
  let dropped = 0;
  for (const dir of fs.readdirSync(res)) {
    if (!dir.startsWith("mipmap-")) continue;
    const png = path.join(res, dir, "ic_launcher_background.png");
    if (fs.existsSync(png)) {
      fs.unlinkSync(png);
      dropped++;
    }
  }

  console.log(
    `Patched adaptive icon to a full-bleed colour background (dropped ${dropped} unused PNGs)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
