import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatScore } from "./format";

type Tone = "success" | "warning" | "danger" | "neutral";

const chipTone: Record<Tone, string> = {
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-ink",
  neutral: "bg-subtle text-ink-2",
};

export function scoreTone(score: number, max: number): Tone {
  if (max <= 0) return "neutral";
  const pct = score / max;
  if (pct >= 0.7) return "success";
  if (pct >= 0.4) return "warning";
  return "danger";
}

export function ScoreChip({
  score,
  max,
  unit,
  className,
}: {
  score: number;
  max: number;
  unit?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-tag px-2 font-mono text-xs font-semibold tabular-nums",
        chipTone[scoreTone(score, max)],
        className,
      )}
    >
      {formatScore(score)} / {formatScore(max)}
      {unit && ` ${unit}`}
    </span>
  );
}

export type RiskLevel = "low" | "medium" | "high";

export function riskLevel(score: number): RiskLevel {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

const RISK_META: Record<RiskLevel, { label: string; bar: string; text: string }> = {
  low: { label: "Niskie", bar: "bg-success", text: "text-success-ink" },
  medium: { label: "Średnie", bar: "bg-orange", text: "text-orange-ink" },
  high: { label: "Wysokie", bar: "bg-danger", text: "text-danger-ink" },
};

export function RiskMeter({
  score,
  variant = "bar",
  className,
}: {
  score: number;
  variant?: "bar" | "compact";
  className?: string;
}) {
  const level = riskLevel(score);
  const meta = RISK_META[level];
  const pct = Math.min(100, Math.max(0, score));
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={score}
      aria-label={`Ryzyko samodzielności: ${score} (${meta.label.toLowerCase()})`}
    >
      <span
        className={cn(
          "relative h-1.5 overflow-hidden rounded-full bg-line",
          variant === "bar" ? "w-40" : "w-8",
        )}
      >
        <span className={cn("absolute inset-y-0 left-0 rounded-full", meta.bar)} style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[13px] font-semibold tabular-nums text-ink">{score}</span>
      <span className={cn("text-xs font-medium", meta.text)}>{meta.label}</span>
    </span>
  );
}

export type ParticipantStatus = "online" | "offline" | "idle" | "finished" | "not_started";

const STATUS_META: Record<ParticipantStatus, { label: string; dot: string }> = {
  online: { label: "online", dot: "bg-success" },
  offline: { label: "offline", dot: "border border-ink-3 bg-transparent" },
  idle: { label: "bezczynny", dot: "bg-orange" },
  finished: { label: "zakończył", dot: "bg-accent" },
  not_started: { label: "nie zaczął", dot: "border border-ink-3 bg-transparent" },
};

export function StatusDot({ status, className }: { status: ParticipantStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] text-ink-2", className)}>
      <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </span>
  );
}

export type ProblemTile = {
  number: number;
  score?: number;
  max: number;
};

export function ProblemTiles({
  problems,
  activeNumber,
  showMax = false,
  className,
}: {
  problems: ProblemTile[];
  activeNumber?: number;
  showMax?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("flex items-center gap-1.5", className)}>
      {problems.map((p) => {
        const active = p.number === activeNumber;
        const tone = p.score === undefined ? null : scoreTone(p.score, p.max);
        return (
          <li
            key={p.number}
            aria-current={active ? "step" : undefined}
            className={cn(
              "inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-tag px-2 font-mono text-xs font-semibold tabular-nums",
              tone ? chipTone[tone] : "border border-dashed border-line text-ink-2",
              active && "ring-[1.5px] ring-accent ring-offset-0",
              active && !tone && "border-solid border-transparent bg-accent-soft text-accent-ink",
            )}
          >
            {p.number}
            {p.score !== undefined && (
              <span className="font-medium">
                · {formatScore(p.score)}
                {showMax && `/${p.max}`}
              </span>
            )}
            {tone === "success" && p.score === p.max && <Check className="size-3" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
