import Link from "next/link";
import { Bit } from "@/components/brand/bit";
import { Logo } from "@/components/brand/logo";

/** Układ ekranów konta (B1–B8): formularz po lewej, Bit na panelu po prawej. */
export default function AccountLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Link href="/" aria-label="CodePortal – strona główna" className="self-start rounded-sm">
          <Logo />
        </Link>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {children}
        </main>
        <p className="text-center text-xs text-ink-3">
          © 2026 CodePortal ·{" "}
          <Link href="/prywatnosc" className="underline underline-offset-4 hover:text-ink-2">
            Prywatność
          </Link>
        </p>
      </div>
      <aside
        aria-hidden
        className="relative hidden flex-col items-center justify-center overflow-hidden border-l border-line bg-subtle p-12 lg:flex"
      >
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,rgb(51_92_255/0.12),transparent),radial-gradient(40%_40%_at_70%_80%,rgb(20_184_166/0.14),transparent)]" />
        <Bit size="xl" preload className="relative drop-shadow-xl" />
        <p className="relative mt-8 max-w-xs text-center font-display text-h3 font-bold text-ink">
          Sprawdzian z programowania w 5 minut.
        </p>
        <p className="relative mt-2 max-w-xs text-center text-body text-ink-2">
          Uczniowie piszą kod, testy oceniają go same, a ty widzisz, jak powstawał.
        </p>
      </aside>
    </div>
  );
}
