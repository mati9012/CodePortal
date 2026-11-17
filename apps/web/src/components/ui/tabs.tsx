"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type TabOption = { value: string; label: ReactNode; count?: ReactNode; disabled?: boolean };

type TabsBaseProps = {
  options: TabOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  "aria-label"?: string;
};

function useTabState({ options, value, defaultValue, onChange }: TabsBaseProps) {
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value);
  const current = value ?? inner;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const select = (v: string) => {
    if (value === undefined) setInner(v);
    onChange?.(v);
  };
  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    for (let step = 1; step <= options.length; step++) {
      const i = (index + dir * step + options.length) % options.length;
      if (!options[i].disabled) {
        refs.current[i]?.focus();
        select(options[i].value);
        break;
      }
    }
  };
  return { current, select, refs, onKeyDown };
}

export function Tabs(props: TabsBaseProps) {
  const { options, className } = props;
  const { current, select, refs, onKeyDown } = useTabState(props);
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={props["aria-label"]}
      className={cn(
        "flex gap-5 overflow-x-auto shadow-[inset_0_-1px_0_var(--cp-border)] [scrollbar-width:none]",
        className,
      )}
    >
      {options.map((o, i) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${id}-${o.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={o.disabled}
            onClick={() => select(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-body font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/25 rounded-t-sm",
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-2 hover:text-ink disabled:text-ink-3",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-accent-soft text-accent-ink" : "bg-subtle text-ink-2",
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedControl(props: TabsBaseProps & { size?: "sm" | "md" }) {
  const { options, className, size = "md" } = props;
  const { current, select, refs, onKeyDown } = useTabState(props);
  return (
    <div
      role="tablist"
      aria-label={props["aria-label"]}
      className={cn("inline-flex rounded-input border border-line bg-subtle p-0.5", className)}
    >
      {options.map((o, i) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={o.disabled}
            onClick={() => select(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/25",
              size === "sm" ? "h-6 px-2 text-xs" : "h-7 px-3 text-[13px]",
              active ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
            {o.count !== undefined && <span className="tabular-nums text-ink-2">· {o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
