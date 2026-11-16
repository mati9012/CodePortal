import type { ReactNode } from "react";
import { Bit } from "@/components/brand/bit";
import { cn } from "@/lib/cn";

/**
 * Pusty stan — zawsze z wezwaniem do działania.
 * Bit (M) pojawia się domyślnie; wyłącz go (`mascot={false}`) w kontekstach,
 * w których maskotki nie ma (raporty, błędy, oceny).
 */
export function EmptyState({
  title,
  description,
  action,
  mascot = true,
  icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  mascot?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      {mascot ? (
        <Bit size="m" className="mb-4" />
      ) : (
        icon && (
          <span className="mb-4 inline-flex size-12 items-center justify-center rounded-card bg-subtle text-ink-2 [&_svg]:size-6">
            {icon}
          </span>
        )
      )}
      <h3 className="font-display text-h3 text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-body text-ink-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
