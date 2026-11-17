import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const LINKS = [
  { href: "/regulamin", label: "Regulamin" },
  { href: "/prywatnosc", label: "Prywatność" },
  { href: "/kontakt", label: "Kontakt" },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-10 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <Logo />
      <nav aria-label="Stopka" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-ink-2 underline decoration-line underline-offset-4 hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
        <span className="inline-flex items-center gap-1.5 text-ink-2">
          <span aria-hidden className="size-2 rounded-full bg-success" />
          Wszystkie systemy działają
        </span>
        <span className="text-ink-3">© 2026 CodePortal</span>
      </nav>
    </footer>
  );
}
