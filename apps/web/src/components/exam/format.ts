const plNumber = new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 });

export function formatMemoryKb(kb: number) {
  return kb >= 1024 ? `${plNumber.format(kb / 1024)} MB` : `${plNumber.format(kb)} KB`;
}

export function formatMs(ms: number) {
  return ms >= 1000 ? `${plNumber.format(ms / 1000)} s` : `${ms} ms`;
}

export function formatScore(value: number) {
  return plNumber.format(value);
}

export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
