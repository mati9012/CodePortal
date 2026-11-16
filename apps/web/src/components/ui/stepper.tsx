import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StepState = "done" | "current" | "upcoming";

/** Stepper kreatora testu: pasek postępu nad każdym krokiem. */
export function Stepper({
  steps,
  className,
}: {
  steps: { label: ReactNode; state: StepState }[];
  className?: string;
}) {
  return (
    <ol className={cn("grid gap-3", className)} style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((s, i) => (
        <li key={i} aria-current={s.state === "current" ? "step" : undefined} className="flex flex-col gap-2">
          <span
            className={cn(
              "h-1 rounded-full",
              s.state === "upcoming" ? "bg-line" : "bg-accent",
            )}
          />
          <span className="flex items-center gap-1.5 text-label uppercase text-ink-3">
            Krok {i + 1}
            {s.state === "done" && (
              <>
                · gotowe <Check className="size-3 text-success-ink" aria-hidden />
              </>
            )}
            {s.state === "current" && <span className="text-accent-ink">· teraz</span>}
          </span>
          <span
            className={cn(
              "text-body font-semibold",
              s.state === "upcoming" ? "text-ink-2" : "text-ink",
            )}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
