"use client";

import { Copy, MonitorPlay, Pencil, Radio, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScoreChip, StatusDot } from "@/components/exam/score";
import { Dialog } from "@/components/panel/dialog";
import { CopyButton } from "@/components/panel/copy-button";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { formatWhen } from "@/components/panel/format";
import { PageHeader } from "@/components/panel/page-header";
import { SignalBadge } from "@/components/panel/signal-badge";
import { useToast } from "@/components/panel/use-toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, StatCard } from "@/components/ui/surface";
import { Tabs } from "@/components/ui/tabs";
import { examMaxPoints, examProblems, LIVE_EVENTS, LIVE_PARTICIPANTS } from "@/lib/mock/exam-session";
import type { Exam } from "@/lib/mock/panel";
import { useJoinLink } from "@/lib/use-origin";

const SUBMISSIONS_PER_PARTICIPANT = 2.4;

const TABS = [
  { value: "overview", label: "Przegląd" },
  { value: "participants", label: "Uczestnicy" },
  { value: "results", label: "Wyniki" },
  { value: "settings", label: "Ustawienia" },
  { value: "log", label: "Dziennik zdarzeń" },
];

export function ExamDetail({ exam }: { exam: Exam }) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [shareOpen, setShareOpen] = useState(false);
  const { show, toast } = useToast();
  const started = exam.status !== "draft" && exam.status !== "scheduled";

  const openTab = (value: string) => {
    if (value === "results") router.push(`/panel/testy/${exam.id}/wyniki`);
    else setTab(value);
  };

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {exam.title} <ExamStatusTag status={exam.status} />
          </span>
        }
        description={`${exam.group} · ${formatWhen(exam.startsAt)} · ${exam.durationMin} min · ${exam.mode === "test" ? "Sprawdzian" : "Konkurs"}`}
        crumbs={[{ href: "/panel/testy", label: "Testy i konkursy" }]}
        actions={
          <>
            <Button variant="secondary" icon={<Copy />} onClick={() => show("Utworzono kopię testu", "Znajdziesz ją w szkicach.")}>
              Duplikuj
            </Button>
            {exam.code && (
              <Button variant="secondary" icon={<Share2 />} onClick={() => setShareOpen(true)}>
                Udostępnij
              </Button>
            )}
            {exam.status !== "finished" && exam.status !== "review" && (
              <Link href="/panel/testy/nowy" className={buttonClasses({ variant: "secondary" })}>
                <Pencil className="size-4" aria-hidden /> Edytuj
              </Link>
            )}
            {exam.status === "live" && (
              <Link href={`/panel/testy/${exam.id}/na-zywo`} className={buttonClasses()}>
                <Radio className="size-4" aria-hidden /> Panel na żywo
              </Link>
            )}
            {exam.status === "scheduled" && (
              <Link href={`/panel/testy/${exam.id}/rzutnik`} className={buttonClasses()}>
                <MonitorPlay className="size-4" aria-hidden /> Pokaż na rzutniku
              </Link>
            )}
            {(exam.status === "review" || exam.status === "finished") && (
              <Link href={`/panel/testy/${exam.id}/wyniki`} className={buttonClasses()}>
                Otwórz wyniki
              </Link>
            )}
          </>
        }
      />

      <Tabs options={TABS} value={tab} onChange={openTab} aria-label="Sekcje testu" className="mb-6" />

      {tab === "overview" && <Overview exam={exam} started={started} />}
      {tab === "participants" && <Participants exam={exam} started={started} />}
      {tab === "settings" && <Settings exam={exam} />}
      {tab === "log" && <EventLog started={started} />}

      {exam.code && <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} code={exam.code} />}
      {toast}
    </>
  );
}

function Overview({ exam, started }: { exam: Exam; started: boolean }) {
  const problems = examProblems(exam);
  const notJoined = exam.participants.total - exam.participants.joined;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Uczestnicy"
          value={exam.participants.joined}
          unit={`/ ${exam.participants.total}`}
          note={started ? `${notJoined} nie dołączyło` : "jeszcze przed startem"}
        />
        <StatCard
          label="Zgłoszenia"
          value={started ? Math.round(exam.participants.joined * SUBMISSIONS_PER_PARTICIPANT) : 0}
          note={started ? `średnio ${SUBMISSIONS_PER_PARTICIPANT.toLocaleString("pl-PL")} na ucznia` : "—"}
        />
        <StatCard
          label={exam.status === "live" ? "Średni wynik (wstępnie)" : "Średni wynik"}
          value={exam.average ?? (started ? 54 : "—")}
          unit={started ? "/ 100 pkt" : undefined}
        />
        <StatCard
          label="Zdarzenia"
          value={started ? (exam.flagged ?? 0) + LIVE_EVENTS.length : 0}
          note={started ? `u ${Math.max(exam.flagged ?? 0, 5)} uczniów` : "—"}
          noteTone={started ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden">
          <CardHeader title="Zadania" action={<span className="text-xs text-ink-2">{started ? "zaliczalność" : "punkty"}</span>} />
          <ol className="divide-y divide-line">
            {problems.map((p) => (
              <li key={p.number} className="flex items-center gap-4 px-4 py-3 text-body">
                <span className="w-4 shrink-0 text-ink-3 tabular-nums">{p.number}</span>
                <Link href={`/panel/zadania/${p.problemId}`} className="min-w-0 flex-1 truncate font-medium text-ink hover:text-accent-ink">
                  {p.title}
                </Link>
                {started ? (
                  <>
                    <span className="relative hidden h-1.5 w-40 overflow-hidden rounded-full bg-line sm:block">
                      <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${p.passRate}%` }} />
                    </span>
                    <span className="w-10 text-right text-[13px] tabular-nums text-ink-2">{p.passRate}%</span>
                  </>
                ) : (
                  <span className="text-[13px] tabular-nums text-ink-2">{p.max} pkt</span>
                )}
              </li>
            ))}
          </ol>
        </Card>

        {exam.code ? <JoinCard exam={exam} code={exam.code} /> : <DraftCard />}
      </div>
    </div>
  );
}

function JoinCard({ exam, code }: { exam: Exam; code: string }) {
  const link = useJoinLink(code);
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h3 className="text-body font-semibold text-ink">Link i kod</h3>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-input border border-line bg-subtle px-3 py-2 font-mono text-[13px] text-ink">
          {link}
        </span>
        <CopyButton value={link} label="Kopiuj link">
          Kopiuj
        </CopyButton>
      </div>
      <p className="font-mono text-[32px] font-bold leading-none tracking-[0.1em] text-ink">{code}</p>
      <Link href={`/panel/testy/${exam.id}/rzutnik`} className={buttonClasses({ variant: "secondary", className: "w-full" })}>
        <MonitorPlay className="size-4" aria-hidden /> Pokaż na rzutniku
      </Link>
    </Card>
  );
}

function DraftCard() {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h3 className="text-body font-semibold text-ink">Szkic</h3>
      <p className="text-body text-ink-2">Kod i link powstaną po publikacji. Uczniowie nie widzą jeszcze tego testu.</p>
      <Link href="/panel/testy/nowy" className={buttonClasses({ className: "w-full" })}>
        Dokończ i opublikuj
      </Link>
    </Card>
  );
}

function Participants({ exam, started }: { exam: Exam; started: boolean }) {
  if (!started) {
    return (
      <Card>
        <EmptyState title="Nikt jeszcze nie dołączył" description="Lista wypełni się, gdy uczniowie wpiszą kod testu." />
      </Card>
    );
  }
  const maxPoints = examMaxPoints(exam);
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-line">
        {LIVE_PARTICIPANTS.map((p) => {
          const points = p.scores.reduce<number>((n, s) => n + (s ?? 0), 0);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.name}</span>
              <StatusDot status={p.status} className="w-24" />
              <span className="w-28 text-[13px] text-ink-2">{p.lastActivity}</span>
              {p.status === "not_started" ? (
                <span className="w-20 text-right text-ink-3">—</span>
              ) : (
                <ScoreChip score={points} max={maxPoints} className="w-20 justify-center" />
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Settings({ exam }: { exam: Exam }) {
  const rows = [
    ["Rodzaj", exam.mode === "test" ? "Sprawdzian" : "Konkurs"],
    ["Dla", `${exam.group} · ${exam.participants.total} uczniów`],
    ["Termin", formatWhen(exam.startsAt)],
    ["Czas", `${exam.durationMin} min`],
    ["Dostęp", "Kod lub link · spóźnieni do 10 min"],
    ["Ochrona", "Standard · blokada wklejania, pełny ekran"],
    ["Wyniki", "Po zatwierdzeniu przez nauczyciela"],
    ["Ocenianie", "Najlepsze zgłoszenie · progi 30/50/70/85/95%"],
  ];
  return (
    <Card className="max-w-2xl overflow-hidden">
      <dl className="divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4 px-5 py-3 text-body">
            <dt className="w-28 shrink-0 text-ink-2">{label}</dt>
            <dd className="text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function EventLog({ started }: { started: boolean }) {
  if (!started) {
    return (
      <Card>
        <EmptyState title="Dziennik jest pusty" description="Zgłoszenia, wklejenia i wyjścia z pełnego ekranu pojawią się tu w trakcie testu." />
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-line">
        {LIVE_EVENTS.map((e) => (
          <li key={e.id} className="flex items-start gap-3 px-4 py-3">
            <SignalBadge kind={e.kind} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{e.student}</p>
              <p className="text-[13px] text-ink-2">{e.text}</p>
            </div>
            <span className="font-mono text-xs text-ink-2">{e.time}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ShareDialog({ open, onClose, code }: { open: boolean; onClose: () => void; code: string }) {
  const link = useJoinLink(code);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Udostępnij test"
      description="Wyślij link uczniom albo podaj kod — wpiszą go na stronie Dołącz."
      footer={<Button onClick={onClose}>Gotowe</Button>}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate rounded-input border border-line bg-subtle px-3 py-2 font-mono text-[13px] text-ink">
            {link}
          </span>
          <CopyButton value={link} label="Kopiuj link" />
        </div>
        <div className="flex items-center gap-2">
          <span className="flex-1 font-mono text-h2 font-bold tracking-[0.1em] text-ink">{code}</span>
          <CopyButton value={code} label="Kopiuj kod" />
        </div>
      </div>
    </Dialog>
  );
}
