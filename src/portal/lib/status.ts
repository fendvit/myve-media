/** The statuses the admin can pick with one tap. `status` is free text in the
 *  database, so anything else still renders — just in the neutral tone. */
export const STATUS_PRESETS = [
  "V přípravě",
  "Probíhá",
  "Ke kontrole",
  "Hotovo",
  "Pozastaveno",
] as const;

/** Badge classes per status. Written twice — once per theme — because the
 *  saturated tints that read well on ink are washed out on paper. */
const TONES: Record<string, string> = {
  "V přípravě":
    "bg-slate-500/12 text-slate-600 border-slate-500/25 dark:bg-slate-400/15 dark:text-slate-300 dark:border-slate-400/25",
  Probíhá: "bg-primary/12 text-primary border-primary/25",
  "Ke kontrole":
    "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/25",
  Hotovo:
    "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/25",
  Pozastaveno:
    "bg-rose-500/12 text-rose-700 border-rose-500/25 dark:bg-rose-400/15 dark:text-rose-300 dark:border-rose-400/25",
};

const NEUTRAL_TONE = "bg-secondary text-muted-foreground border-border";

export function statusTone(status: string): string {
  return TONES[status] ?? NEUTRAL_TONE;
}
