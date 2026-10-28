import type { ChangeRequestStatus } from "./types";

/** The order the admin's status buttons appear in. */
export const CHANGE_STATUSES: ChangeRequestStatus[] = ["new", "in_progress", "done", "declined"];

const LABELS: Record<ChangeRequestStatus, string> = {
  new: "Přijato",
  in_progress: "V řešení",
  done: "Hotovo",
  declined: "Zamítnuto",
};

/** Same palette as the project statuses (status.ts), so one colour means one thing. */
const TONES: Record<ChangeRequestStatus, string> = {
  new: "bg-slate-500/12 text-slate-600 border-slate-500/25 dark:bg-slate-400/15 dark:text-slate-300 dark:border-slate-400/25",
  in_progress: "bg-primary/12 text-primary border-primary/25",
  done: "bg-emerald-500/12 text-emerald-700 border-emerald-500/25 dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-400/25",
  declined:
    "bg-rose-500/12 text-rose-700 border-rose-500/25 dark:bg-rose-400/15 dark:text-rose-300 dark:border-rose-400/25",
};

export function changeStatusLabel(status: ChangeRequestStatus): string {
  return LABELS[status] ?? status;
}

export function changeStatusTone(status: ChangeRequestStatus): string {
  return TONES[status] ?? "bg-secondary text-muted-foreground border-border";
}
