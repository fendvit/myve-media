/**
 * Tiny funnel-event helper.
 *
 * Forwards to Vercel Web Analytics when its script is on the page (see the
 * snippet in index.html) and is a silent no-op everywhere else, including
 * the native build and tests. Keep event names stable — they are what the
 * dashboard filters on.
 */
type EventProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    va?: (command: "event", payload: { name: string; data?: EventProps }) => void;
  }
}

export const FUNNEL_EVENTS = {
  ctaClick: "cta_click",
  contactSubmit: "contact_submit",
  contactSuccess: "contact_success",
  contactFollowUp: "contact_followup",
} as const;

export function track(name: string, data?: EventProps) {
  if (typeof window === "undefined") return;
  try {
    window.va?.("event", { name, data });
  } catch {
    // Analytics must never break the funnel it measures.
  }
}
