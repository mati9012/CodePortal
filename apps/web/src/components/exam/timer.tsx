import { Check, Clock, CloudOff, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatClock } from "./format";

/**
 * Licznik czasu testu. Czas liczy serwer — komponent tylko wyświetla
 * przekazaną liczbę sekund (odświeżaniem zajmie się widok testu).
 * Kolory: < 10 min bursztynowy, < 5 min czerwony, 0 — „Czas minął”.
 */
export function Timer({
  secondsLeft,
  warnAt = 10 * 60,
  dangerAt = 5 * 60,
  className,
}: {
  secondsLeft: number;
  warnAt?: number;
  dangerAt?: number;
  className?: string;
}) {
  const over = secondsLeft <= 0;
  const tone = over
    ? "bg-subtle text-ink-2"
    : secondsLeft <= dangerAt
      ? "bg-danger-soft text-danger-ink"
      : secondsLeft <= warnAt
        ? "bg-warning-soft text-warning-ink"
        : "bg-subtle text-ink";
  return (
    <span
      role="timer"
      aria-live="off"
      aria-label={over ? "Czas minął" : `Pozostało ${formatClock(secondsLeft)}`}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-input px-2.5 font-mono text-[13px] font-semibold tabular-nums",
        tone,
        className,
      )}
    >
      {over ? (
        <span className="font-sans font-medium">Czas minął</span>
      ) : (
        <>
          <Clock className="size-3.5" aria-hidden />
          {formatClock(secondsLeft)}
        </>
      )}
    </span>
  );
}

export type AutosaveState =
  | { kind: "saved"; secondsAgo: number }
  | { kind: "saving" }
  | { kind: "offline" };

/** „✓ Zapisano 2 s temu” · „Zapisywanie…” · „Brak połączenia – zapisano lokalnie”. */
export function AutosaveStatus({ state, className }: { state: AutosaveState; className?: string }) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs [&_svg]:size-3.5",
        state.kind === "offline" ? "text-orange-ink" : "text-ink-2",
        className,
      )}
    >
      {state.kind === "saved" && (
        <>
          <Check aria-hidden />
          {state.secondsAgo < 5
            ? "Zapisano przed chwilą"
            : `Zapisano ${state.secondsAgo < 60 ? `${state.secondsAgo} s` : `${Math.floor(state.secondsAgo / 60)} min`} temu`}
        </>
      )}
      {state.kind === "saving" && (
        <>
          <LoaderCircle className="animate-spin" aria-hidden />
          Zapisywanie…
        </>
      )}
      {state.kind === "offline" && (
        <>
          <CloudOff aria-hidden />
          Brak połączenia – zapisano lokalnie
        </>
      )}
    </span>
  );
}
