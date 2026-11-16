import { ArrowUp, Braces, ClipboardPaste, Maximize2, Snowflake, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Bit } from "@/components/brand/bit";
import { VerdictPill, type Verdict } from "@/components/exam/verdict";
import { cn } from "@/lib/cn";

/*
 * Ilustracje produktu na stronie głównej. Statyczne makiety z prawdziwych komponentów
 * (werdykty, kolory tokenów), oznaczone aria-hidden — treść niesie tekst obok.
 */

// ── Hero: widok zadania w ciemnym motywie IDE ───────────────────────────────

const kw = "text-[#C792EA]";
const ty = "text-[#82AAFF]";
const num = "text-[#F78C6C]";
const fn = "text-[#5EEAD4]";

const CODE: ReactNode[] = [
  <>
    <span className={ty}>int</span> best = <span className={num}>1</span>, cur ={" "}
    <span className={num}>1</span>;
  </>,
  <>
    <span className={kw}>for</span> (<span className={ty}>int</span> i = <span className={num}>1</span>; i
    &lt; n; i++) {"{"}
  </>,
  <>
    {"  "}
    <span className={kw}>if</span> (a[i] &gt; a[i-<span className={num}>1</span>]) cur++;
  </>,
  <>
    {"  "}
    <span className={kw}>else</span> cur = <span className={num}>1</span>;
  </>,
  <>
    {"  "}best = <span className={fn}>max</span>(best, cur);
  </>,
  <>{"}"}</>,
];

export function HeroPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[520px] pb-10 pl-6 sm:pl-14">
      <div
        data-theme="dark"
        className="overflow-hidden rounded-modal border border-line bg-surface text-ink shadow-lg"
      >
        {/* Pasek testu */}
        <div className="flex items-center gap-2 border-b border-line px-3 py-2 text-xs">
          <span className="truncate font-semibold">Sprawdzian – pętle</span>
          <span className="ml-1 rounded-tag bg-success-soft px-1.5 font-mono text-[11px] text-success-ink">
            1 · 20
          </span>
          <span className="rounded-tag border border-accent px-1.5 font-mono text-[11px] text-accent-ink">
            2
          </span>
          <span className="rounded-tag bg-subtle px-1.5 font-mono text-[11px] text-ink-2">3</span>
          <span className="ml-auto font-mono tabular-nums text-ink-2">32:14</span>
        </div>
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
          {/* Treść zadania */}
          <div className="border-r border-line p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-2">
              Zadanie 2 · 30 pkt
            </p>
            <p className="mt-1.5 font-display text-[13px] leading-snug font-bold">
              Najdłuższy rosnący fragment
            </p>
            <div className="mt-3 space-y-1.5">
              {[100, 85, 92, 60].map((w) => (
                <div key={w} className="h-1.5 rounded-full bg-subtle" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
          {/* Edytor */}
          <pre className="overflow-hidden bg-canvas py-3 font-mono text-[11.5px] leading-[1.7] sm:text-xs">
            {CODE.map((line, i) => (
              <div key={i} className={cn("flex pr-3", i === 2 && "bg-accent/10")}>
                <span className="w-7 shrink-0 select-none pr-2 text-right text-ink-3">{i + 1}</span>
                <span className="whitespace-pre">{line}</span>
              </div>
            ))}
            <div className="h-12" />
          </pre>
        </div>
        {/* Wyniki */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line py-2.5 pl-24 pr-3 text-xs">
          <span className="font-mono font-semibold text-warning-ink">21 / 30 pkt</span>
          <span className="text-ink-2">7 z 10 testów</span>
          <span className="ml-auto flex gap-1">
            {(["OK", "OK", "WA", "TLE"] as Verdict[]).map((v, i) => (
              <VerdictPill key={i} verdict={v} showIcon={false} />
            ))}
          </span>
        </div>
      </div>

      <Bit size="l" className="absolute bottom-0 left-0 drop-shadow-xl max-sm:h-[110px] max-sm:w-auto" />
      <div className="absolute -bottom-1 right-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink shadow-md sm:right-6">
        <b>10 z 10 testów!</b> Ocenione w 0,4 s.
      </div>
    </div>
  );
}

// ── Wspólna rama makiet funkcji ─────────────────────────────────────────────

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("rounded-modal border border-line bg-subtle/70 p-3 shadow-sm sm:p-4", className)}
    >
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({
  lead,
  children,
  meta,
  className,
}: {
  lead: ReactNode;
  children: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-input border border-line bg-surface px-3 py-2 text-[13px] text-ink shadow-sm",
        className,
      )}
    >
      {lead}
      <div className="min-w-0 flex-1">{children}</div>
      {meta && <span className="shrink-0 font-mono text-[11px] text-ink-2">{meta}</span>}
    </div>
  );
}

function Glyph({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] font-mono text-[11px] font-bold [&_svg]:size-3.5",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Edytor: podpowiedzi ─────────────────────────────────────────────────────

export function EditorPreview() {
  return (
    <Frame>
      <div className="rounded-input border border-line bg-surface px-3 py-2 font-mono text-[13px] text-ink shadow-sm">
        <span className="text-ink-3">12 </span> best = <span className="text-accent-ink">ma</span>
        <span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-accent" />
      </div>
      <div className="ml-4 overflow-hidden rounded-input border border-line bg-surface shadow-md sm:ml-10">
        {[
          { g: "ƒ", t: "max(a, b)", k: "funkcja", c: "bg-violet-soft text-violet-ink", active: true },
          { g: "ƒ", t: "max_element(…)", k: "funkcja", c: "bg-violet-soft text-violet-ink" },
          { g: "T", t: "vector<int>", k: "typ", c: "bg-accent-soft text-accent-ink" },
          { g: "k", t: "while", k: "słowo kluczowe", c: "bg-subtle text-ink-2" },
          { g: <Braces />, t: "for (i…n)", k: "snippet", c: "bg-mint-100 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300" },
        ].map((s) => (
          <div
            key={s.t}
            className={cn(
              "flex items-center gap-3 px-3 py-1.5 font-mono text-[12.5px] text-ink",
              s.active && "bg-accent-soft",
            )}
          >
            <Glyph className={s.c}>{s.g}</Glyph>
            <span className="min-w-0 flex-1 truncate">{s.t}</span>
            <span className="shrink-0 text-[11px] text-ink-2">{s.k}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

// ── Ocenianie: wyniki testów ────────────────────────────────────────────────

export function GradingPreview() {
  const tests: { v: Verdict; name: string; ms: string }[] = [
    { v: "OK", name: "Test 1 · jawny", ms: "3 ms" },
    { v: "OK", name: "Test 2 · ukryty", ms: "11 ms" },
    { v: "WA", name: "Test 5 · ukryty", ms: "21 ms" },
    { v: "TLE", name: "Test 10 · ukryty", ms: "> 1 s" },
  ];
  return (
    <Frame>
      {tests.map((t) => (
        <Row key={t.name} lead={<VerdictPill verdict={t.v} className="w-14 justify-center" />} meta={t.ms}>
          {t.name}
        </Row>
      ))}
      <div className="flex items-center justify-between px-1 pt-1 text-[13px]">
        <span className="text-ink-2">Wynik zadania</span>
        <span className="font-mono font-semibold text-warning-ink">21 / 30 pkt</span>
      </div>
    </Frame>
  );
}

// ── Samodzielność: oś zdarzeń ───────────────────────────────────────────────

export function IntegrityPreview() {
  return (
    <Frame>
      <Row lead={<Glyph className="bg-warning-soft text-warning-ink"><Maximize2 /></Glyph>} meta="10:46">
        Wyjście z pełnego ekranu · 4 s
      </Row>
      <Row lead={<Glyph className="bg-orange-soft text-orange-ink"><Zap /></Glyph>} meta="10:52">
        Skok kodu: <span className="font-mono">+40</span> linii w 3 s
      </Row>
      <Row lead={<Glyph className="bg-danger-soft text-danger-ink"><ClipboardPaste /></Glyph>} meta="10:53">
        Próba wklejenia · 214 zn.
      </Row>
      <Row lead={<Glyph className="bg-accent-soft text-accent-ink"><ArrowUp /></Glyph>} meta="10:54">
        Zgłoszenie · <span className="font-mono">21/30</span>
      </Row>
      {/* Pasek odtwarzania przebiegu */}
      <div className="flex items-center gap-3 px-1 pt-1 text-[11px] text-ink-2">
        <span className="font-mono">16×</span>
        <div className="relative h-1.5 flex-1 rounded-full bg-line">
          <div className="absolute inset-y-0 left-0 w-[62%] rounded-full bg-accent" />
          {[18, 47, 55, 81].map((x) => (
            <span
              key={x}
              className="absolute top-1/2 size-2 -translate-1/2 rounded-full border-2 border-surface bg-warning"
              style={{ left: `${x}%` }}
            />
          ))}
        </div>
        <span className="font-mono">10:54</span>
      </div>
    </Frame>
  );
}

// ── Konkursy: ranking ───────────────────────────────────────────────────────

export function ContestPreview() {
  const rows = [
    { n: 1, who: "Kacper W.", solved: "4 zadania", t: "73 min", c: "bg-success-soft text-success-ink" },
    { n: 2, who: "Zofia K.", solved: "4 zadania", t: "81 min", c: "bg-subtle text-ink-2" },
    { n: 3, who: "Maja Z.", solved: "3 zadania", t: "52 min", c: "bg-subtle text-ink-2" },
  ];
  return (
    <Frame>
      {rows.map((r) => (
        <Row key={r.n} lead={<Glyph className={r.c}>{r.n}</Glyph>} meta={r.t}>
          {r.who} <span className="text-ink-2">· {r.solved}</span>
        </Row>
      ))}
      <Row
        lead={<Glyph className="bg-accent-soft text-accent-ink"><Snowflake /></Glyph>}
        meta="15 min"
        className="border-accent/40 bg-accent-soft"
      >
        <span className="font-medium text-accent-ink">Ranking zamrożony do końca</span>
      </Row>
    </Frame>
  );
}
