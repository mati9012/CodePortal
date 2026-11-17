import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";

const NAV = [
  { href: "/#funkcje", label: "Funkcje" },
  { href: "/#cennik", label: "Cennik" },
  { href: "/#pytania", label: "Pytania" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-8">
        <Link href="/" aria-label="CodePortal – strona główna" className="rounded-sm">
          <Logo />
        </Link>
        <nav aria-label="Główna" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-body text-ink-2 transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/logowanie"
            className={buttonClasses({ variant: "ghost", className: "hidden sm:inline-flex" })}
          >
            Zaloguj się
          </Link>
          <Link href="/rejestracja" className={buttonClasses()}>
            Załóż konto
          </Link>
        </div>
      </div>
    </header>
  );
}
