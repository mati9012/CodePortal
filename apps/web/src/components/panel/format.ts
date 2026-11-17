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
