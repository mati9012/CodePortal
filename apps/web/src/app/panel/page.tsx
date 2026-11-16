import {
  ArrowRight,
  Check,
  ClipboardPaste,
  Maximize2,
  Radio,
  Send,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Bit } from "@/components/brand/bit";
import { ScoreChip, RiskMeter } from "@/components/exam/score";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { formatWhen } from "@/components/panel/format";
import { PageHeader } from "@/components/panel/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { ACTIVITY, EXAMS, GROUPS, TO_REVIEW } from "@/lib/mock/panel";
import { Greeting } from "./greeting";

export const metadata: Metadata = { title: "Pulpit · CodePortal" };

const live = EXAMS.find((e) => e.status === "live");
const upcoming = EXAMS.filter((e) => e.status === "scheduled" || e.status === "draft");
const reviewCount = EXAMS.reduce((n, e) => n + (e.toReview ?? 0), 0);

const STEPS = [
  { label: "Załóż konto", done: true },
  { label: "Dodaj pierwsze zadanie do banku", done: true, href: "/panel/zadania" },
  { label: "Utwórz klasę i zaproś uczniów", done: true, href: "/panel/klasy" },
  { label: "Opublikuj pierwszy test", done: false, href: "/panel/testy/nowy" },
  { label: "Wypróbuj test jako uczeń", done: false, href: "/panel/testy" },
];

/** F1 · Pulpit organizatora (+ C2 checklista „Pierwsze kroki”). */
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title={<Greeting />}
        description={`Poniedziałek, 16 listopada · 1 test trwa, ${reviewCount} prac czeka na sprawdzenie.`}
      />

      {live && (
        <Card className="mb-6 flex flex-col gap-4 overflow-hidden border-success/30 bg-success-soft/50 p-4 sm:flex-row sm:items-center sm:p-5">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-card bg-success text-white">
            <Radio className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ExamStatusTag status="live" />
              <span className="text-[13px] text-ink-2">
                {live.group} · kod <span className="font-mono font-semibold text-ink">{live.code}</span> · zostało 18 min
              </span>
            </div>
            <p className="mt-1 truncate font-display text-h3 text-ink">{live.title}</p>
            <p className="text-[13px] text-ink-2">
              <b className="text-ink">{live.participants.joined}</b> z {live.participants.total} uczniów w teście ·{" "}
              <span className="text-warning-ink">2 sygnały do przejrzenia</span>
            </p>
          </div>
          <Link href={`/panel/testy/${live.id}/na-zywo`} className={buttonClasses({ size: "lg", className: "shrink-0" })}>
            Panel na żywo <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Aktywne i zaplanowane" value={EXAMS.filter((e) => e.status === "live" || e.status === "scheduled").length} unit="testy" note="najbliższy w środę" />
        <StatCard label="Do sprawdzenia" value={reviewCount} unit="prac" note="w 2 testach" />
        <StatCard label="Średni wynik · 30 dni" value="64" unit="%" note="+6 pkt vs październik" noteTone="success" />
        <StatCard label="Uczniowie" value={GROUPS.reduce((n, g) => n + g.students, 0)} unit={`w ${GROUPS.length} grupach`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Section title="Najbliższe testy" href="/panel/testy" linkLabel="Wszystkie testy">
            <ul className="divide-y divide-line">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link href={`/panel/testy/${e.id}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-subtle/60 sm:px-5">
                    <DateBadge iso={e.startsAt} muted={e.status === "draft"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold text-ink">{e.title}</p>
                      <p className="truncate text-[13px] text-ink-2">
                        {e.group} · {e.problems} {e.problems === 1 ? "zadanie" : "zadania"} · {e.durationMin} min
                        {e.status === "scheduled" && <> · {formatWhen(e.startsAt).split(" · ")[1]}</>}
                      </p>
                    </div>
                    <ExamStatusTag status={e.status} className="max-sm:hidden" />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Czeka na ciebie" href="/panel/wyniki" linkLabel="Wszystkie wyniki">
            <p className="px-4 pb-1 pt-3 text-xs text-ink-2 sm:px-5">
              Sygnały samodzielności to wskazówki do oceny nauczyciela, nie automatyczny werdykt.
            </p>
            <ul className="divide-y divide-line">
              {TO_REVIEW.map((r) => (
                <li key={r.student} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate text-body font-semibold text-ink">{r.student}</p>
                    <p className="truncate text-[13px] text-ink-2">
                      {r.exam} · {r.group} · {r.reason}
                    </p>
                  </div>
                  <RiskMeter score={r.risk} variant="compact" />
                  <ScoreChip score={r.score} max={r.max} />
                  <Link href="/panel/wyniki" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    Sprawdź
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Checklist />
          <Section title="Ostatnia aktywność">
            <ol className="flex flex-col gap-3 px-4 py-4 sm:px-5">
              {ACTIVITY.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5",
                      {
                        accent: "bg-accent-soft text-accent-ink",
                        warning: "bg-warning-soft text-warning-ink",
                        success: "bg-success-soft text-success-ink",
                        neutral: "bg-subtle text-ink-2",
                      }[a.tone],
                    )}
                    aria-hidden
                  >
                    {{ accent: <Send />, warning: <Maximize2 />, success: <Users />, neutral: <ClipboardPaste /> }[a.tone]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] text-ink">{a.text}</p>
                    <p className="font-mono text-[11px] text-ink-3">{a.when}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </>
  );
}

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h2 className="font-display text-h3 text-ink">{title}</h2>
        {href && (
          <Link href={href} className="text-[13px] font-medium text-accent-ink hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </Card>
  );
}

function DateBadge({ iso, muted }: { iso: string; muted?: boolean }) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("pl-PL", { day: "numeric", timeZone: "Europe/Warsaw" }).format(d);
  const month = new Intl.DateTimeFormat("pl-PL", { month: "short", timeZone: "Europe/Warsaw" }).format(d);
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 flex-col items-center justify-center rounded-card border leading-none",
        muted ? "border-dashed border-line text-ink-3" : "border-accent/20 bg-accent-soft text-accent-ink",
      )}
    >
      <span className="font-display text-[17px] font-bold">{day}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{month}</span>
    </span>
  );
}

function Checklist() {
  const done = STEPS.filter((s) => s.done).length;
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_100%_0%,rgb(20_184_166/0.16),transparent),radial-gradient(60%_100%_at_0%_0%,rgb(51_92_255/0.12),transparent)]" />
      <div className="relative flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-label uppercase text-accent-ink">Pierwsze kroki</p>
          <h2 className="mt-1 font-display text-h3 text-ink">
            Jeszcze {STEPS.length - done} kroki do pierwszego testu
          </h2>
        </div>
        <Bit size="s" className="-mr-1 -mt-1 shrink-0" />
      </div>
      <div className="relative mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-accent" style={{ width: `${(done / STEPS.length) * 100}%` }} />
        </div>
        <span className="font-mono text-xs tabular-nums text-ink-2">
          {done}/{STEPS.length}
        </span>
      </div>
      <ul className="relative mt-4 flex flex-col gap-1">
        {STEPS.map((s) => {
          const body = (
            <>
              <span
                className={cn(
                  "inline-flex size-5 shrink-0 items-center justify-center rounded-full border",
                  s.done ? "border-success bg-success text-white" : "border-line bg-surface",
                )}
                aria-hidden
              >
                {s.done && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className={cn("flex-1", s.done && "text-ink-2 line-through decoration-ink-3")}>{s.label}</span>
              {!s.done && <ArrowRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />}
            </>
          );
          return (
            <li key={s.label}>
              {s.href && !s.done ? (
                <Link href={s.href} className="group flex items-center gap-3 rounded-input px-2 py-1.5 text-body text-ink hover:bg-subtle">
                  {body}
                </Link>
              ) : (
                <span className="flex items-center gap-3 px-2 py-1.5 text-body">{body}</span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
