const dateTime = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("cs-CZ", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeOnly = new Intl.DateTimeFormat("cs-CZ", {
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));
export const formatTime = (iso: string) => timeOnly.format(new Date(iso));

/** "dnes" / "včera" / a full date — used as the chat day separator. */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (sameDay(date, today)) return "Dnes";
  if (sameDay(date, yesterday)) return "Včera";
  return dateOnly.format(date);
}

export function relativeFromNow(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "právě teď";
  if (minutes < 60) return `před ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `před ${hours} h`;

  const days = Math.round(hours / 24);
  if (days < 30) return `před ${days} dny`;

  return dateOnly.format(new Date(iso));
}
