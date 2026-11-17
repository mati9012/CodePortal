import { cn } from "@/lib/cn";

const GRADES = [1, 2, 3, 4, 5, 6];
const BAR_MAX_PX = 44;

export function GradeHistogram({ grades, className }: { grades: number[]; className?: string }) {
  const counts = GRADES.map((g) => grades.filter((x) => x === g).length);
  const peak = Math.max(1, ...counts);
  return (
    <div className={cn("flex items-end gap-1.5", className)} role="img" aria-label={`Rozkład ocen: ${GRADES.map((g, i) => `${g}: ${counts[i]}`).join(", ")}`}>
      {GRADES.map((g, i) => (
        <div key={g} className="flex min-w-5 flex-1 flex-col items-center gap-1">
          <span className="text-[11px] tabular-nums text-ink-2">{counts[i]}</span>
          <span
            className="w-full rounded-t-[3px] bg-accent"
            style={{ height: Math.max(2, (counts[i]! / peak) * BAR_MAX_PX) }}
          />
          <span className="text-[11px] font-semibold tabular-nums text-ink">{g}</span>
        </div>
      ))}
    </div>
  );
}
