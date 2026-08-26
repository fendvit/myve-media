import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

/**
 * Everything in public/ that the portal actually loads. The rest of that folder
 * is marketing media — 40 MB of frames and video that would ride along into the
 * APK unused, so the native build opts out of publicDir and copies this instead.
 * The manifest earns its kilobyte only by keeping portal.html's <link> from 404ing.
 */
const NATIVE_PUBLIC_FILES = ["favicon.ico", "favicon.png", "portal-manifest.webmanifest"];

/**
 * Shapes the portal build into something a WebView can open: copies the assets
 * above, then renames portal.html to index.html — Rollup names HTML outputs
 * after their input, and Capacitor loads the document at the root, so without
 * the rename the app launches to a blank screen.
 */
function nativePayload(outDir: string): Plugin {
  return {
    name: "native-payload",
    apply: "build",
    closeBundle() {
      const dir = path.resolve(__dirname, outDir);

      for (const file of NATIVE_PUBLIC_FILES) {
        const from = path.resolve(__dirname, "public", file);
        if (fs.existsSync(from)) fs.copyFileSync(from, path.resolve(dir, file));
      }

      const html = path.resolve(dir, "portal.html");
      if (fs.existsSync(html)) fs.renameSync(html, path.resolve(dir, "index.html"));
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // `--mode native` builds the Capacitor payload: the portal on its own, in its
  // own directory, so a native build can never overwrite the web deploy.
  const native = mode === "native";
  const outDir = native ? "dist-native" : "dist";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      native && nativePayload(outDir),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Opted out for native so the marketing media stays out of the APK; the
    // nativePayload plugin copies back the handful of files the portal needs.
    publicDir: native ? false : undefined,
    build: {
      outDir,
      rollupOptions: {
        // Two independent apps from one codebase: the marketing site and the
        // client portal served at portal.myve.media (see vercel.json).
        input: native
          ? { portal: path.resolve(__dirname, "portal.html") }
          : {
              main: path.resolve(__dirname, "index.html"),
              portal: path.resolve(__dirname, "portal.html"),
            },
      },
    },
  };
});
