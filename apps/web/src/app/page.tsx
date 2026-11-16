import Link from "next/link";
import { Bit } from "@/components/brand/bit";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-4 py-16 sm:px-8 md:flex-row md:items-center">
      <div className="flex-1">
        <Logo />
        <h1 className="mt-6 font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.1] font-extrabold tracking-[-0.035em]">
          Sprawdzian z programowania w 5 minut.{" "}
          <span className="text-accent">Ocenia się</span> <span className="text-mint-500">sam.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-6 text-ink-2">
          Uczniowie piszą kod w edytorze jak w IDE – bez AI. System uruchamia go na testach, wystawia
          punkty i pokazuje, jak powstawało rozwiązanie.
        </p>
        <p className="mt-6 text-body text-ink-2">Etap 1 (MVP) w budowie.</p>
        <Link href="/design" className={buttonClasses({ className: "mt-3" })}>
          Zobacz design system
        </Link>
      </div>
      <Bit size="xl" preload className="self-center" />
    </main>
  );
}
