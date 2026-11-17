import { Check, Clock, Code2, LoaderCircle, MemoryStick, TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatMemoryKb, formatMs } from "./format";

export type Verdict = "OK" | "WA" | "TLE" | "MLE" | "RE" | "CE";
export type VerdictOrPending = Verdict | "PENDING";

export const VERDICT_META: Record<
  VerdictOrPending,
  { label: string; long: string; className: string; icon: ReactNode }
> = {
  OK: { label: "OK", long: "Zaliczony", className: "bg-success-soft text-success-ink", icon: <Check /> },
  WA: { label: "WA", long: "Zła odpowiedź", className: "bg-danger-soft text-danger-ink", icon: <X /> },
  TLE: { label: "TLE", long: "Przekroczony czas", className: "bg-warning-soft text-warning-ink", icon: <Clock /> },
  MLE: { label: "MLE", long: "Przekroczona pamięć", className: "bg-orange-soft text-orange-ink", icon: <MemoryStick /> },
  RE: { label: "RE", long: "Błąd wykonania", className: "bg-pink-soft text-pink-ink", icon: <TriangleAlert /> },
  CE: { label: "CE", long: "Błąd kompilacji", className: "bg-violet-soft text-violet-ink", icon: <Code2 /> },
  PENDING: {
    label: "Ocenianie",
    long: "Ocenianie…",
    className: "bg-accent-soft text-accent-ink",
    icon: <LoaderCircle className="animate-spin" />,
  },
};

export function VerdictPill({
  verdict,
  showIcon = true,
  long = false,
  className,
}: {
  verdict: VerdictOrPending;
  showIcon?: boolean;
  long?: boolean;
  className?: string;
}) {
  const meta = VERDICT_META[verdict];
  return (
    <span
      title={meta.long}
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 font-mono text-[11px] font-semibold [&_svg]:size-3",
        meta.className,
        className,
      )}
    >
      {showIcon && <span aria-hidden className="inline-flex">{meta.icon}</span>}
      {long ? meta.long : meta.label}
    </span>
  );
}

export function VerdictDetail({
  verdict,
  timeMs,
  memoryKb,
  className,
}: {
  verdict: Verdict;
  timeMs?: number;
  memoryKb?: number;
  className?: string;
}) {
  const meta = VERDICT_META[verdict];
  const parts = [meta.label];
  if (timeMs !== undefined) parts.push(formatMs(timeMs));
  if (memoryKb !== undefined) parts.push(formatMemoryKb(memoryKb));
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-tag px-2 font-mono text-xs font-medium",
        meta.className,
        className,
      )}
    >
      {parts.join(" · ")}
    </span>
  );
}

export function TestResultsBar({ verdicts, className }: { verdicts: VerdictOrPending[]; className?: string }) {
  const color: Record<VerdictOrPending, string> = {
    OK: "bg-success",
    WA: "bg-danger",
    TLE: "bg-warning",
    MLE: "bg-orange",
    RE: "bg-pink",
    CE: "bg-violet",
    PENDING: "bg-line animate-pulse",
  };
  const passed = verdicts.filter((v) => v === "OK").length;
  return (
    <span
      className={cn("inline-flex gap-1", className)}
      role="img"
      aria-label={`${passed} z ${verdicts.length} testów zaliczonych`}
    >
      {verdicts.map((v, i) => (
        <span key={i} className={cn("h-1.5 w-4 rounded-full", color[v])} />
      ))}
    </span>
  );
}
