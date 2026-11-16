import { Check, ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Bit } from "@/components/brand/bit";
import { JoinCodeForm } from "@/components/landing/join-code-form";
import {
  ContestPreview,
  EditorPreview,
  GradingPreview,
  HeroPreview,
  IntegrityPreview,
} from "@/components/landing/previews";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonClasses } from "@/components/ui/button";
import { Eyebrow, Tag } from "@/components/ui/surface";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "CodePortal – sprawdziany z programowania, które oceniają się same",
  description:
    "Uczniowie piszą kod w edytorze jak w IDE – bez AI. CodePortal uruchamia go na testach, wystawia punkty i pokazuje, jak powstawało rozwiązanie.",
};

// ── Treść ───────────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: "Stwórz zadanie",
    body: "Treść w Markdown, testy jawne i ukryte, limity czasu i pamięci. Albo weź gotowe z biblioteki.",
  },
  {
    title: "Wyślij link",
    body: "Kod dostępu i QR na rzutniku. Uczniowie wchodzą bez zakładania kont.",
  },
  {
    title: "Zobacz wyniki i przebieg pracy",
    body: "Punkty, oceny według twoich progów i odtworzenie, jak powstawał każdy kod.",
  },
];

const FEATURES: {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  preview: ReactNode;
}[] = [
  {
    eyebrow: "Edytor",
    title: "Edytor jak w IDE – bez AI",
    body: "Kolorowanie składni, podpowiedzi, formatowanie i konsola z własnym wejściem. Bez asystenta AI i bez wklejania z zewnątrz.",
    points: ["HTML, CSS, JS, Python, Java, C#, C++, PHP – także łączone", "Autozapis co 2 sekundy, także offline", "Ciemny motyw domyślnie"],
    preview: <EditorPreview />,
  },
  {
    eyebrow: "Ocenianie",
    title: "Automatyczne ocenianie na testach",
    body: "Kod uruchamia się w izolowanym środowisku na testach jawnych i ukrytych. Punkty i ocena według twoich progów.",
    points: ["Werdykty OK / WA / TLE / MLE / RE / CE", "Limity czasu i pamięci na zadanie", "Eksport do CSV i XLSX"],
    preview: <GradingPreview />,
  },
  {
    eyebrow: "Samodzielność",
    title: "Raport samodzielności",
    body: "Odtwórz, jak powstawał kod, i zobacz zdarzenia: wyjścia z pełnego ekranu, próby wklejenia, skoki kodu. To sygnały do twojej oceny – nie automatyczny werdykt.",
    points: ["Odtwarzanie przebiegu 1× / 4× / 16×", "Porównanie podobnych rozwiązań", "Pytanie kontrolne po zgłoszeniu"],
    preview: <IntegrityPreview />,
  },
  {
    eyebrow: "Konkursy",
    title: "Konkursy z rankingiem na żywo",
    body: "Tablica wyników na rzutnik, czas karny, wyróżnienie pierwszego rozwiązania i zamrożenie rankingu przed końcem.",
    points: ["Publiczny link do rankingu", "Kategorie: SP / szkoła średnia", "Komunikaty i pytania uczestników"],
    preview: <ContestPreview />,
  },
];

const LANGUAGES = ["HTML", "CSS", "JavaScript", "Python", "Java", "C#", "C++", "PHP"];

// TODO: ceny planów Szkoła i Organizator – do ustalenia (w projekcie „[CENA]”).
const PLANS: {
  name: string;
  price: string;
  unit?: string;
  body: string;
  cta: string;
  href: string;
  featured?: boolean;
}[] = [
  {
    name: "Nauczyciel",
    price: "0 zł",
    body: "Do 40 uczniów w teście, 5 testów miesięcznie.",
    cta: "Załóż konto",
    href: "/rejestracja",
  },
  {
    name: "Szkoła",
    price: "Wycena",
    unit: "/ rok",
    body: "Wielu nauczycieli, wspólny bank zadań, raporty samodzielności bez limitu.",
    cta: "Zamów prezentację",
    href: "/kontakt?temat=szkola",
    featured: true,
  },
  {
    name: "Organizator konkursów",
    price: "Wycena",
    unit: "/ wydarzenie",
    body: "Ranking na żywo, tryb rzutnika, rejestracja uczestników z wielu szkół.",
    cta: "Porozmawiajmy",
    href: "/kontakt?temat=konkurs",
  },
];

const FAQ = [
  {
    q: "Czy uczniowie muszą zakładać konta?",
    a: "Nie. Wystarczy link lub kod i imię z nazwiskiem. Możesz też wymagać konta szkolnego Google lub Microsoft.",
  },
  {
    q: "Jak CodePortal utrudnia korzystanie z AI?",
    a: "Edytor nie ma asystenta AI, blokuje wklejanie z zewnątrz i wymaga pełnego ekranu. Każde odstępstwo trafia do raportu jako sygnał – decyzję podejmuje nauczyciel.",
  },
  {
    q: "Gdzie są przechowywane dane uczniów?",
    a: "Na serwerach w UE. Szkoły dostają umowę powierzenia przetwarzania danych.",
  },
  {
    q: "Czy mogę zaimportować zadania z innych systemów?",
    a: "Tak – paczki ZIP z testami i format Szkopuła (w kolejnym etapie).",
  },
  {
    q: "Czy jest faktura VAT dla szkoły?",
    a: "Tak, także faktura proforma przed płatnością.",
  },
];

// ── Strona ──────────────────────────────────────────────────────────────────

const container = "mx-auto w-full max-w-6xl px-4 sm:px-8";

function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="font-display text-[1.75rem] leading-9 font-bold tracking-[-0.025em] text-ink sm:text-h1">
        {children}
      </h2>
      {sub && <p className="mt-2 text-[15px] text-ink-2">{sub}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[radial-gradient(60%_80%_at_80%_30%,rgb(20_184_166/0.12),transparent_70%),radial-gradient(50%_60%_at_10%_0%,rgb(51_92_255/0.10),transparent_70%)]">
          <div className={cn(container, "grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr]")}>
            <div className="min-w-0">
              <Tag tone="accent" pill className="h-7 px-3 font-semibold">
                Dla nauczycieli informatyki i organizatorów konkursów
              </Tag>
              <h1 className="mt-5 font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.08] font-extrabold tracking-[-0.035em] text-ink">
                Sprawdzian z programowania w 5 minut.{" "}
                <span className="text-accent">Ocenia się</span>{" "}
                <span className="text-mint-500">sam.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-ink-2">
                Uczniowie piszą kod w edytorze jak w IDE – bez AI. System uruchamia go na testach,
                wystawia punkty i pokazuje, jak powstawało rozwiązanie.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/rejestracja" className={buttonClasses({ size: "lg" })}>
                  Załóż darmowe konto
                </Link>
                <Link href="/demo" className={buttonClasses({ size: "lg", variant: "secondary" })}>
                  Zobacz przykładowy test
                </Link>
              </div>
              <JoinCodeForm className="mt-6" />
            </div>
            <HeroPreview />
          </div>
        </section>

        {/* Trzy kroki */}
        <section className="border-y border-line bg-surface py-16 sm:py-20">
          <div className={container}>
            <SectionTitle>Trzy kroki do pierwszego sprawdzianu</SectionTitle>
            <ol className="grid gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="font-mono text-[13px] font-semibold text-accent-ink">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-h3 text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-body text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Funkcje */}
        <section id="funkcje" className="scroll-mt-16 py-16 sm:py-24">
          <div className={cn(container, "flex flex-col gap-20 sm:gap-28")}>
            {FEATURES.map((f, i) => (
              <article key={f.eyebrow} className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
                <div className={cn("min-w-0", i % 2 === 1 && "md:order-2")}>
                  <Eyebrow className="text-accent-ink">{f.eyebrow}</Eyebrow>
                  <h2 className="mt-2 font-display text-[1.625rem] leading-8 font-bold tracking-[-0.025em] text-ink">
                    {f.title}
                  </h2>
                  <p className="mt-3 text-[15px] leading-6 text-ink-2">{f.body}</p>
                  <ul className="mt-5 space-y-2">
                    {f.points.map((p) => (
                      <li key={p} className="flex gap-2.5 text-body text-ink">
                        <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="min-w-0">{f.preview}</div>
              </article>
            ))}
          </div>
        </section>

        {/* Języki */}
        <section aria-label="Języki programowania" className="border-y border-line bg-surface py-8">
          <div className={cn(container, "flex flex-wrap items-center justify-center gap-3")}>
            <span className="mr-2 text-body text-ink-2">Języki programowania:</span>
            {LANGUAGES.map((name) => (
              <span
                key={name}
                className="inline-flex h-9 items-center rounded-input border border-line bg-canvas px-3 font-mono text-[13px] font-medium text-ink shadow-sm"
              >
                {name}
              </span>
            ))}
            <span className="inline-flex h-9 items-center gap-2 rounded-input border border-accent/40 bg-accent-soft px-3 text-[13px] text-accent-ink">
              <span className="font-mono font-medium">HTML + CSS + PHP</span>
              <span className="text-[11px]">i inne połączenia</span>
            </span>
          </div>
        </section>

        {/* Cennik */}
        <section id="cennik" className="scroll-mt-16 py-16 sm:py-24">
          <div className={container}>
            <SectionTitle sub="Zacznij za darmo. Faktura VAT dla szkół.">Cennik</SectionTitle>
            <div className="grid gap-5 md:grid-cols-3">
              {PLANS.map((p) => (
                <div
                  key={p.name}
                  className={cn(
                    "flex flex-col rounded-modal border bg-surface p-6 shadow-sm",
                    p.featured ? "border-accent ring-1 ring-accent" : "border-line",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-h3 text-ink">{p.name}</h3>
                    {p.featured && (
                      <Tag tone="accent" pill>
                        najczęściej wybierany
                      </Tag>
                    )}
                  </div>
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-display text-[2rem] font-extrabold tracking-[-0.03em] text-ink">
                      {p.price}
                    </span>
                    {p.unit && <span className="text-body text-ink-2">{p.unit}</span>}
                  </p>
                  <p className="mt-2 flex-1 text-body text-ink-2">{p.body}</p>
                  <Link
                    href={p.href}
                    className={buttonClasses({
                      variant: p.featured ? "primary" : "secondary",
                      className: "mt-6 w-full",
                    })}
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center">
              <Link href="/cennik" className={buttonClasses({ variant: "link" })}>
                Pełne porównanie planów →
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="pytania" className="scroll-mt-16 pb-16 sm:pb-24">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-8">
            <SectionTitle>Częste pytania</SectionTitle>
            <div className="flex flex-col gap-3">
              {FAQ.map((f) => (
                <details
                  key={f.q}
                  name="faq"
                  className="group rounded-card border border-line bg-surface shadow-sm open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-5 py-4 text-[15px] font-semibold text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/25 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown
                      className="size-4 shrink-0 text-ink-2 transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <p className="-mt-1 px-5 pb-4 text-body text-ink-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Końcowe CTA */}
        <section className={cn(container, "pb-16")}>
          <div className="relative flex overflow-hidden rounded-[24px] bg-[#090B12] bg-[radial-gradient(45%_90%_at_15%_110%,rgb(51_92_255/0.45),transparent_70%),radial-gradient(40%_90%_at_90%_0%,rgb(20_184_166/0.35),transparent_70%)] px-6 pt-10 text-white sm:px-12 md:items-center">
            <div className="relative z-10 pb-10 md:max-w-[60%]">
              <h2 className="font-display text-[1.75rem] leading-9 font-extrabold tracking-[-0.03em] sm:text-[2rem] sm:leading-10">
                Pierwszy sprawdzian jeszcze w tym tygodniu
              </h2>
              <p className="mt-3 text-[15px] text-[#A3ADC2]">
                Gotowe zadania z pętli i tablic czekają w przykładowym teście. Bit już je sprawdził.
              </p>
              <Link
                href="/rejestracja"
                className={buttonClasses({ size: "lg", className: "mt-6 ring-offset-[#090B12]" })}
              >
                Załóż darmowe konto
              </Link>
            </div>
            <Bit size="l" className="ml-auto hidden self-end md:block" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
