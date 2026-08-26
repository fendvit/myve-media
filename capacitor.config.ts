import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "media.myve.portal",
  appName: "MYVE Portál",
  // Built by `npm run build:native`, which ships the portal alone. Pointing at
  // `dist` instead would bundle the marketing site and open it on launch.
  webDir: "dist-native",
};

export default config;
