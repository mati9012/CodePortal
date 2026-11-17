"use client";

import {
  BarChart3,
  Bell,
  ChevronsUpDown,
  ClipboardList,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { buttonClasses, IconButton } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { Avatar, Kbd } from "@/components/ui/surface";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import type { ExamSummary } from "@codeportal/contracts";
import { useApi } from "@/lib/api";

const NAV = [
  { href: "/panel", label: "Pulpit", icon: LayoutDashboard, exact: true },
  { href: "/panel/testy", label: "Testy i konkursy", icon: ClipboardList },
  { href: "/panel/zadania", label: "Bank zadań", icon: Library },
  { href: "/panel/klasy", label: "Klasy i grupy", icon: Users },
  { href: "/panel/wyniki", label: "Wyniki", icon: BarChart3, countsReviews: true },
  { href: "/panel/ustawienia", label: "Ustawienia", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!isPending && !data) {
      router.replace(`/logowanie?next=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isPending, data, router]);

  const sidebar = (
    <Sidebar
      user={data?.user}
      onNavigate={() => setDrawer(false)}
      onSignOut={async () => {
        await authClient.signOut();
        router.replace("/logowanie");
      }}
    />
  );

  return (
    <div className="flex min-h-dvh flex-1 bg-canvas">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-surface lg:block">
        {sidebar}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            aria-label="Zamknij menu"
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={() => setDrawer(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-surface shadow-lg">
            <IconButton label="Zamknij menu" className="absolute right-3 top-3.5" onClick={() => setDrawer(false)}>
              <X />
            </IconButton>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:gap-3 sm:px-6">
          <IconButton label="Otwórz menu" className="-ml-1 lg:hidden" onClick={() => setDrawer(true)}>
            <Menu />
          </IconButton>
          <Link href="/panel" className="rounded-sm lg:hidden" aria-label="Pulpit">
            <Logo />
          </Link>
          <button
            type="button"
            className="ml-auto hidden h-9 w-full max-w-sm items-center gap-2 rounded-input border border-line bg-canvas px-3 text-body text-ink-3 transition-colors hover:border-ink-3/60 md:flex lg:ml-0"
            title="Szukaj testów, zadań i uczniów"
          >
            <Search className="size-4" aria-hidden />
            Szukaj testów, zadań, uczniów…
            <Kbd className="ml-auto">Ctrl K</Kbd>
          </button>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <IconButton label="Szukaj" className="md:hidden">
              <Search />
            </IconButton>
            <span className="relative">
              <IconButton label="Powiadomienia">
                <Bell />
              </IconButton>
              <span className="pointer-events-none absolute right-2 top-2 size-2 rounded-full border-2 border-surface bg-danger" />
            </span>
            <Link href="/panel/testy/nowy" className={buttonClasses({ className: "max-sm:w-9 max-sm:px-0" })}>
              <Plus className="size-4" aria-hidden />
              <span className="max-sm:sr-only">Nowy test</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function Sidebar({
  user,
  onNavigate,
  onSignOut,
}: {
  user?: { name: string; email: string };
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/panel" className="rounded-sm" aria-label="Pulpit" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <Suspense fallback={<NavList pathname={null} onNavigate={onNavigate} />}>
        <ActiveNav onNavigate={onNavigate} />
      </Suspense>

      <div className="flex flex-col gap-2 border-t border-line p-3">
        <button
          type="button"
          className="flex items-center gap-3 rounded-input px-2 py-2 text-left transition-colors hover:bg-subtle"
        >
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-input bg-mint-100 font-display text-xs font-bold text-mint-700 dark:bg-mint-500/15 dark:text-mint-300">
            SP
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink">SP nr 12 w Krakowie</span>
            <span className="block text-xs text-ink-2">Plan Szkoła</span>
          </span>
          <ChevronsUpDown className="size-4 text-ink-3" aria-hidden />
        </button>
        <UserMenu user={user} onSignOut={onSignOut} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function UserMenu({
  user,
  onSignOut,
  onNavigate,
}: {
  user?: { name: string; email: string };
  onSignOut: () => void;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!user) return <Skeleton className="h-12 w-full" />;
  return (
    <div ref={ref} className="relative">
      {open && (
        <div
          role="menu"
          className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-card border border-line bg-surface py-1 shadow-md"
        >
          <Link
            role="menuitem"
            href="/panel/ustawienia"
            className="flex items-center gap-2 px-3 py-2 text-body text-ink hover:bg-subtle"
            onClick={() => {
              setOpen(false);
              onNavigate();
            }}
          >
            <Settings className="size-4 text-ink-2" aria-hidden /> Ustawienia konta
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-body text-danger-ink hover:bg-danger-soft"
          >
            <LogOut className="size-4" aria-hidden /> Wyloguj się
          </button>
        </div>
      )}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 rounded-input px-2 py-2 text-left transition-colors hover:bg-subtle"
      >
        <Avatar name={user.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink">{user.name}</span>
          <span className="block truncate text-xs text-ink-2">{user.email}</span>
        </span>
        <ChevronsUpDown className="size-4 text-ink-3" aria-hidden />
      </button>
    </div>
  );
}

function ActiveNav({ onNavigate }: { onNavigate: () => void }) {
  return <NavList pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavList({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  const { data: exams } = useApi<ExamSummary[]>("/panel/exams");
  const toReview = exams?.reduce((n, e) => n + (e.toReview ?? 0), 0);
  return (
    <nav aria-label="Panel" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
      {NAV.map(({ href, label, icon: Icon, exact, countsReviews }) => {
        const count = countsReviews ? toReview : undefined;
        const active =
          pathname !== null && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 items-center gap-3 rounded-input px-3 text-body font-medium transition-colors",
              active ? "bg-accent-soft text-accent-ink" : "text-ink-2 hover:bg-subtle hover:text-ink",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
            {!!count && (
              <span
                className={cn(
                  "ml-auto rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-accent text-on-accent" : "bg-warning-soft text-warning-ink",
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
