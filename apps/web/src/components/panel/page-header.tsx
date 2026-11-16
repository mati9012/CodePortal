import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** Okruszki nad tytułem H1, akcje po prawej (DESIGN: layout aplikacji organizatora). */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  crumbs?: { href: string; label: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {crumbs && (
          <nav aria-label="Okruszki" className="mb-2 flex items-center gap-1 text-[13px] text-ink-2">
            {crumbs.map((c) => (
              <span key={c.href} className="flex items-center gap-1">
                <Link href={c.href} className="hover:text-ink">
                  {c.label}
                </Link>
                <ChevronRight className="size-3.5 text-ink-3" aria-hidden />
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-display text-h2 text-ink sm:text-h1">{title}</h1>
        {description && <p className="mt-1.5 text-body text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
