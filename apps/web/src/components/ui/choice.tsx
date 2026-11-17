import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const box =
  "peer relative size-4 shrink-0 appearance-none border border-line bg-surface transition-colors " +
  "checked:border-accent checked:bg-accent focus-visible:outline-none focus-visible:ring-[3px] " +
  "focus-visible:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50";

type ChoiceProps = Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode };

function ChoiceLabel({
  children,
  label,
  description,
  disabled,
}: {
  children: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-start gap-2.5 text-body text-ink",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <span className="relative mt-[3px] inline-flex">{children}</span>
      <span className="flex flex-col">
        <span>{label}</span>
        {description && <span className="text-xs text-ink-2">{description}</span>}
      </span>
    </label>
  );
}

export function Checkbox({ label, description, className, ...props }: ChoiceProps) {
  return (
    <ChoiceLabel label={label} description={description} disabled={props.disabled}>
      <input type="checkbox" className={cn(box, "rounded-[4px]", className)} {...props} />
      <Check
        className="pointer-events-none absolute inset-0 m-auto size-3 text-white opacity-0 peer-checked:opacity-100"
        strokeWidth={3.5}
        aria-hidden
      />
    </ChoiceLabel>
  );
}

export function Radio({ label, description, className, ...props }: ChoiceProps) {
  return (
    <ChoiceLabel label={label} description={description} disabled={props.disabled}>
      <input type="radio" className={cn(box, "rounded-full", className)} {...props} />
      <span className="pointer-events-none absolute inset-0 m-auto size-1.5 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
    </ChoiceLabel>
  );
}

export function Switch({ label, description, className, ...props }: ChoiceProps) {
  return (
    <label
      className={cn(
        "inline-flex items-start gap-3 text-body text-ink",
        props.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <span className="relative mt-px inline-flex">
        <input
          type="checkbox"
          role="switch"
          className={cn(
            "peer h-5 w-9 shrink-0 cursor-[inherit] appearance-none rounded-full bg-line transition-colors",
            "checked:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/25",
            className,
          )}
          {...props}
        />
        <span className="pointer-events-none absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
      <span className="flex flex-col">
        <span>{label}</span>
        {description && <span className="text-xs text-ink-2">{description}</span>}
      </span>
    </label>
  );
}

export function SelectionCard({
  title,
  description,
  features,
  badge,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type" | "title"> & {
  title: ReactNode;
  description?: ReactNode;
  features?: ReactNode[];
  badge?: ReactNode;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1 rounded-card border border-line bg-surface p-4 transition-colors",
        "hover:border-ink-3/60 has-checked:border-accent has-checked:bg-accent-soft/60 has-checked:ring-1 has-checked:ring-accent",
        "has-focus-visible:ring-[3px] has-focus-visible:ring-accent/25 has-disabled:cursor-not-allowed has-disabled:opacity-60",
        className,
      )}
    >
      <input type="radio" className="peer sr-only" {...props} />
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-body font-semibold text-ink">
          {title}
          {badge}
        </span>
        <span className="relative size-4 shrink-0 rounded-full border border-line bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent group-has-checked:border-accent group-has-checked:bg-accent">
          <span className="absolute inset-0 m-auto size-1.5 rounded-full bg-white opacity-0 group-has-checked:opacity-100" />
        </span>
      </span>
      {description && <span className="text-[13px] text-ink-2">{description}</span>}
      {features && features.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-ink-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-accent-ink" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
