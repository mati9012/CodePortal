import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";

export function StudentShell({
  title,
  subtitle,
  aside,
  children,
}: {
  title: string;
  subtitle?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div data-theme="dark" className="flex min-h-dvh flex-1 flex-col bg-canvas text-ink">
      <header className="flex h-14 items-center gap-3 border-b border-line px-4 sm:px-6">
        <LogoMark size={28} />
        <p className="min-w-0 truncate font-semibold text-ink">
          {title}
          {subtitle && <span className="font-normal text-ink-2"> · {subtitle}</span>}
        </p>
        <div className="ml-auto hidden text-[13px] text-ink-2 sm:block">{aside}</div>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-8 sm:py-12">{children}</main>
    </div>
  );
}
