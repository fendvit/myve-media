// Error reporting for the public website (Sentry project myve/myve-media, EU region).
// Errors only: no tracing, no session replay, no IP or cookies (sendDefaultPii off).
// Loaded after the page is ready so it never slows the first paint, and only on the
// live web domains: not in the installed MYVE Portál app, not on localhost or previews.
import { Capacitor } from "@capacitor/core";

const DSN =
  "https://9b413d1ad938c8a364bc92817ab97190@o4512335070625792.ingest.de.sentry.io/4512475926888528";

const LIVE_HOSTS = ["myve.media", "www.myve.media", "portal.myve.media"];

export function startErrorReporting(): void {
  if (typeof window === "undefined") return;
  if (Capacitor.isNativePlatform()) return;
  if (!LIVE_HOSTS.includes(window.location.hostname)) return;

  const load = () => {
    import("@sentry/react")
      .then((Sentry) => {
        Sentry.init({
          dsn: DSN,
          environment: "production",
          sendDefaultPii: false,
          tracesSampleRate: 0,
          // Noise from browser extensions and third-party scripts, not our code.
          denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
          ignoreErrors: ["ResizeObserver loop limit exceeded", "ResizeObserver loop completed"],
        });
      })
      .catch(() => {
        /* reporting must never break the site */
      });
  };

  if (document.readyState === "complete") load();
  else window.addEventListener("load", load, { once: true });
}
