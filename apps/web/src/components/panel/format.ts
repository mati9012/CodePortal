const dateFmt = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });
const timeFmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });
const weekdayFmt = new Intl.DateTimeFormat("pl-PL", { weekday: "short", timeZone: "Europe/Warsaw" });

export function formatWhen(iso: string) {
  const d = new Date(iso);
  return `${weekdayFmt.format(d)}, ${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

export function formatDay(iso: string) {
  return dateFmt.format(new Date(iso));
}

export function formatTime(date: Date | string) {
  return timeFmt.format(typeof date === "string" ? new Date(date) : date);
}

const longDayFmt = new Intl.DateTimeFormat("pl-PL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Warsaw" });

export function formatLongDay(date: Date) {
  const text = longDayFmt.format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const sameDay = (a: Date, b: Date) => formatDay(a.toISOString()) === formatDay(b.toISOString());

export function formatMoment(iso: string, now: number) {
  const date = new Date(iso);
  return sameDay(date, new Date(now)) ? formatTime(date) : formatDay(iso);
}

const SECOND_MS = 1000;
const MINUTE_SEC = 60;
const JUST_NOW_SEC = 10;

export function formatAgo(iso: string | null, now: number) {
  if (!iso) return "—";
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / SECOND_MS));
  if (seconds < JUST_NOW_SEC) return "przed chwilą";
  if (seconds < MINUTE_SEC) return `${seconds} s temu`;
  if (seconds < MINUTE_SEC * MINUTE_SEC) return `${Math.floor(seconds / MINUTE_SEC)} min temu`;
  return formatTime(iso);
}
