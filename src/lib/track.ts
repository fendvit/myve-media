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
    /* reel-insights first-party analytics (t.js in index.html) */
    vf?: (name: string, props?: EventProps) => void;
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
  try {
    // The same event to the first-party platform. A finished contact form is also the
    // "lead" conversion there, which ties it to the reel or tracked link that brought the visit.
    window.vf?.(name, data);
    if (name === FUNNEL_EVENTS.contactSuccess) window.vf?.("lead", data);
  } catch {
    // same rule
  }
}
