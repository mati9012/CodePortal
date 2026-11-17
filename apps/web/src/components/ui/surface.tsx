import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-card border border-line bg-surface shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-line px-4 py-3",
        className,
      )}
    >
      <h3 className="text-body font-semibold text-ink">{title}</h3>
      {action}
    </div>
  );
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-label uppercase text-ink-2", className)} {...props} />;
}

export type TagTone = "neutral" | "accent" | "mint" | "success" | "warning" | "danger";

const tagTones: Record<TagTone, string> = {
  neutral: "bg-subtle text-ink-2",
  accent: "bg-accent-soft text-accent-ink",
  mint: "bg-mint-100 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300",
  success: "bg-success-soft text-success-ink",
  warning: "bg-warning-soft text-warning-ink",
  danger: "bg-danger-soft text-danger-ink",
};

export function Tag({
  tone = "neutral",
  pill = false,
  className,
  ...props
}: ComponentProps<"span"> & { tone?: TagTone; pill?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 px-2 text-xs font-medium",
        pill ? "rounded-full" : "rounded-tag",
        tagTones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 items-center rounded-[5px] border border-line bg-surface px-1.5 font-mono text-[11px] text-ink-2",
        className,
      )}
      {...props}
    />
  );
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-ink",
        { sm: "size-7 text-[11px]", md: "size-8 text-xs", lg: "size-11 text-sm" }[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function StatCard({
  label,
  value,
  unit,
  note,
  noteTone = "neutral",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  note?: ReactNode;
  noteTone?: "neutral" | "success" | "danger";
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-1 p-4", className)}>
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-h2 tabular-nums text-ink">{value}</span>
        {unit && <span className="text-[13px] text-ink-2">{unit}</span>}
      </span>
      {note && (
        <span
          className={cn(
            "text-xs",
            { neutral: "text-ink-2", success: "text-success-ink", danger: "text-danger-ink" }[noteTone],
          )}
        >
          {note}
        </span>
      )}
    </Card>
  );
}
