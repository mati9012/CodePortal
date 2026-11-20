import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export function EntryShell({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-8">
          <Link href="/" aria-label="CodePortal – strona główna" className="rounded-sm">
            <Logo />
          </Link>
          <div className="ml-auto min-w-0 truncate text-[13px] text-ink-2">{aside}</div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8 sm:py-12">{children}</main>
    </div>
  );
}
