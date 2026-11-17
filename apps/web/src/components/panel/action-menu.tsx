"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type MenuAction = { label: string; onSelect: () => void; danger?: boolean; hidden?: boolean };

const MENU_GAP_PX = 4;
const MENU_MIN_SPACE_PX = 280;

function menuPosition(trigger: HTMLElement, align: "left" | "right"): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const openUp = window.innerHeight - rect.bottom < MENU_MIN_SPACE_PX && rect.top > MENU_MIN_SPACE_PX;
  return {
    ...(openUp ? { bottom: window.innerHeight - rect.top + MENU_GAP_PX } : { top: rect.bottom + MENU_GAP_PX }),
    ...(align === "right" ? { right: window.innerWidth - rect.right } : { left: rect.left }),
  };
}

export function ActionMenu({
  label,
  heading,
  actions,
  trigger,
  align = "right",
}: {
  label: string;
  heading?: ReactNode;
  actions: MenuAction[];
  trigger?: (props: { open: boolean; toggle: (e: ReactMouseEvent<HTMLElement>) => void }) => ReactNode;
  align?: "left" | "right";
}) {
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const open = position !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);
    const closeOutside = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    const closeOnEscape = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = (e: ReactMouseEvent<HTMLElement>) => setPosition(open ? null : menuPosition(e.currentTarget, align));
  const visible = actions.filter((a) => !a.hidden);
  const firstDanger = visible.findIndex((a) => a.danger);

  return (
    <div ref={root} className="inline-flex">
      {trigger ? (
        trigger({ open, toggle })
      ) : (
        <IconButton label={label} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
          <MoreHorizontal />
        </IconButton>
      )}
      {position && (
        <div
          role="menu"
          style={position}
          className="fixed z-40 w-56 overflow-hidden rounded-card border border-line bg-surface py-1 text-left shadow-md"
        >
          {heading && <div className="border-b border-line px-3 py-2">{heading}</div>}
          {visible.map((a, i) => (
            <button
              key={a.label}
              role="menuitem"
              type="button"
              onClick={() => {
                setPosition(null);
                a.onSelect();
              }}
              className={cn(
                "flex w-full px-3 py-2 text-body",
                i === firstDanger && i > 0 && "mt-1 border-t border-line pt-2.5",
                a.danger ? "text-danger-ink hover:bg-danger-soft" : "text-ink hover:bg-subtle",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
