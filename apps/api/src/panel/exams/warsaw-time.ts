const TIME_ZONE = 'Europe/Warsaw';
const MINUTE_MS = 60_000;

const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function warsawParts(date: Date) {
  const parts = Object.fromEntries(
    partsFmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function offsetMs(utc: number) {
  const { date, time } = warsawParts(new Date(utc));
  const asUtc = Date.parse(`${date}T${time}:00Z`);
  return asUtc - Math.floor(utc / MINUTE_MS) * MINUTE_MS;
}

export function fromWarsaw(date: string, time: string) {
  const naive = Date.parse(`${date}T${time}:00Z`);
  const firstGuess = naive - offsetMs(naive);
  return new Date(naive - offsetMs(firstGuess));
}

export const toWarsaw = warsawParts;
