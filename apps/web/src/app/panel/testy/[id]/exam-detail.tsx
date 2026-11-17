"use client";

import type { Created, ExamDetail, ExamSettings } from "@codeportal/contracts";
import { Copy, MonitorPlay, Pencil, Radio, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScoreChip, StatusDot } from "@/components/exam/score";
import { Dialog } from "@/components/panel/dialog";
import { CopyButton } from "@/components/panel/copy-button";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { formatAgo, formatTime, formatWhen } from "@/components/panel/format";
import { PageHeader } from "@/components/panel/page-header";
import { QueryView } from "@/components/panel/query-view";
import { SignalBadge } from "@/components/panel/signal-badge";
import { useToast } from "@/components/panel/use-toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, StatCard } from "@/components/ui/surface";
import { Tabs } from "@/components/ui/tabs";
import { api, errorMessage, useApi } from "@/lib/api";
import { ACCESS_LABEL, groupLabel, PROTECTION_LABEL, RESULTS_VISIBILITY_LABEL } from "@/lib/panel-labels";
import { pluralPl } from "@/lib/plural";
import { useJoinLink } from "@/lib/use-origin";
import { useNow } from "@/lib/use-now";

const REFRESH_MS = 15_000;
const SIGNAL_KINDS = new Set(["paste", "jump", "fullscreen", "similarity"]);
const formatOneDecimal = (n: number) => n.toLocaleString("pl-PL", { maximumFractionDigits: 1 });

const TABS = [
  { value: "overview", label: "Przegląd" },
  { value: "participants", label: "Uczestnicy" },
  { value: "results", label: "Wyniki" },
  { value: "settings", label: "Ustawienia" },
  { value: "log", label: "Dziennik zdarzeń" },
];

export function ExamDetailView({ id }: { id: string }) {
  const query = useApi<ExamDetail>(`/panel/exams/${id}`, { refreshInterval: REFRESH_MS });
  return <QueryView query={query}>{(detail) => <ExamDetailBody detail={detail} />}</QueryView>;
}

function ExamDetailBody({ detail }: { detail: ExamDetail }) {
  const { exam } = detail;
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [shareOpen, setShareOpen] = useState(false);
  const { show, toast } = useToast();
  const started = exam.status !== "draft" && exam.status !== "scheduled";
  const editable = exam.status === "draft" || exam.status === "scheduled";

  const duplicate = async () => {
    try {
      const { id } = await api<Created>(`/panel/exams/${exam.id}/duplicate`, { method: "POST" });
      show("Utworzono kopię testu", "Otwieram szkic.");
      router.push(`/panel/testy/nowy?id=${id}`);
    } catch (err) {
      show("Nie udało się zduplikować testu", errorMessage(err), "warning");
    }
  };

  const openTab = (value: string) => {
    if (value === "results") router.push(`/panel/testy/${exam.id}/wyniki`);
    else setTab(value);
  };

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {exam.title || "Bez nazwy"} <ExamStatusTag status={exam.status} />
          </span>
        }
        description={`${groupLabel(exam.group)} · ${formatWhen(exam.startsAt)} · ${exam.durationMin} min · ${exam.mode === "test" ? "Sprawdzian" : "Konkurs"}`}
        crumbs={[{ href: "/panel/testy", label: "Testy i konkursy" }]}
        actions={
          <>
            <Button variant="secondary" icon={<Copy />} onClick={duplicate}>
              Duplikuj
            </Button>
            {exam.code && (
              <Button variant="secondary" icon={<Share2 />} onClick={() => setShareOpen(true)}>
                Udostępnij
              </Button>
            )}
            {editable && (
              <Link href={`/panel/testy/nowy?id=${exam.id}`} className={buttonClasses({ variant: "secondary" })}>
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

      {tab === "overview" && <Overview detail={detail} started={started} />}
      {tab === "participants" && <Participants detail={detail} started={started} />}
      {tab === "settings" && <Settings detail={detail} />}
      {tab === "log" && <EventLog detail={detail} started={started} />}

      {exam.code && <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} code={exam.code} />}
      {toast}
    </>
  );
}

function Overview({ detail, started }: { detail: ExamDetail; started: boolean }) {
  const { exam, problems } = detail;
  const notJoined = exam.participants.total - exam.participants.joined;
  const maxPoints = problems.reduce((n, p) => n + p.max, 0);
  const joined = detail.participants.filter((p) => p.status !== "not_started");
  const liveAverage = joined.length && maxPoints
    ? joined.reduce((n, p) => n + p.scores.reduce<number>((sum, s) => sum + (s ?? 0), 0), 0) / joined.length / maxPoints * 100
    : null;
  const average = exam.average ?? (liveAverage === null ? null : Math.round(liveAverage));
  const signals = detail.events.filter((e) => SIGNAL_KINDS.has(e.kind)).length;
  const withSignals = detail.participants.filter((p) => p.events > 0).length;
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
          value={detail.submissions}
          note={started && joined.length ? `średnio ${formatOneDecimal(detail.submissions / joined.length)} na ucznia` : "—"}
        />
        <StatCard
          label={exam.status === "live" ? "Średni wynik (wstępnie)" : "Średni wynik"}
          value={started && average !== null ? average : "—"}
          unit={started && average !== null ? "%" : undefined}
        />
        <StatCard
          label="Zdarzenia"
          value={signals}
          note={started ? `u ${withSignals} ${pluralPl(withSignals, "ucznia", "uczniów", "uczniów")}` : "—"}
          noteTone={signals ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden">
          <CardHeader title="Zadania" action={<span className="text-xs text-ink-2">{started ? "średni wynik" : "punkty"}</span>} />
          {problems.length === 0 ? (
            <p className="px-4 py-6 text-body text-ink-2">Test nie ma jeszcze zadań.</p>
          ) : (
            <ol className="divide-y divide-line">
              {problems.map((p) => (
                <li key={p.number} className="flex items-center gap-4 px-4 py-3 text-body">
                  <span className="w-4 shrink-0 text-ink-3 tabular-nums">{p.number}</span>
                  <Link href={`/panel/zadania/${p.problemId}`} className="min-w-0 flex-1 truncate font-medium text-ink hover:text-accent-ink">
                    {p.poolSize > 1 ? `Pula: ${p.title}` : p.title}
                  </Link>
                  {started && p.passRate !== null ? (
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
          )}
        </Card>

        {exam.code ? <JoinCard examId={exam.id} code={exam.code} /> : <DraftCard examId={exam.id} />}
      </div>
    </div>
  );
}

function JoinCard({ examId, code }: { examId: string; code: string }) {
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
      <Link href={`/panel/testy/${examId}/rzutnik`} className={buttonClasses({ variant: "secondary", className: "w-full" })}>
        <MonitorPlay className="size-4" aria-hidden /> Pokaż na rzutniku
      </Link>
    </Card>
  );
}

function DraftCard({ examId }: { examId: string }) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h3 className="text-body font-semibold text-ink">Szkic</h3>
      <p className="text-body text-ink-2">Kod i link powstaną po publikacji. Uczniowie nie widzą jeszcze tego testu.</p>
      <Link href={`/panel/testy/nowy?id=${examId}`} className={buttonClasses({ className: "w-full" })}>
        Dokończ i opublikuj
      </Link>
    </Card>
  );
}

function Participants({ detail, started }: { detail: ExamDetail; started: boolean }) {
  const now = useNow();
  if (!started) {
    return (
      <Card>
        <EmptyState title="Nikt jeszcze nie dołączył" description="Lista wypełni się, gdy uczniowie wpiszą kod testu." />
      </Card>
    );
  }
  const maxPoints = detail.problems.reduce((n, p) => n + p.max, 0);
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-line">
        {detail.participants.map((p) => {
          const points = p.scores.reduce<number>((n, s) => n + (s ?? 0), 0);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.name}</span>
              <StatusDot status={p.status} className="w-24" />
              <span className="w-28 text-[13px] text-ink-2">{now ? formatAgo(p.lastActivityAt, now) : "—"}</span>
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

function protectionText(settings: ExamSettings) {
  const extras = [settings.blockPaste && "blokada wklejania", settings.fullscreen && "pełny ekran"].filter(Boolean);
  return [PROTECTION_LABEL[settings.protection], extras.join(", ")].filter(Boolean).join(" · ");
}

function Settings({ detail }: { detail: ExamDetail }) {
  const { exam, settings } = detail;
  const rows = [
    ["Rodzaj", exam.mode === "test" ? "Sprawdzian" : "Konkurs"],
    ["Dla", exam.group ? `${exam.group} · ${exam.participants.total} uczniów` : groupLabel(null)],
    ["Termin", formatWhen(exam.startsAt)],
    ["Czas", `${exam.durationMin} min`],
    ["Dostęp", `${ACCESS_LABEL[settings.access]} · spóźnieni do ${settings.lateJoinMin} min`],
    ["Ochrona", protectionText(settings)],
    ["Wyniki", RESULTS_VISIBILITY_LABEL[settings.results]],
    ["Ocenianie", `${settings.scoring === "best" ? "Najlepsze zgłoszenie" : "Ostatnie zgłoszenie"} · progi ${settings.thresholds.join("/")}%`],
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

function EventLog({ detail, started }: { detail: ExamDetail; started: boolean }) {
  if (!started || detail.events.length === 0) {
    return (
      <Card>
        <EmptyState title="Dziennik jest pusty" description="Zgłoszenia, wklejenia i wyjścia z pełnego ekranu pojawią się tu w trakcie testu." />
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-line">
        {detail.events.map((e) => (
          <li key={e.id} className="flex items-start gap-3 px-4 py-3">
            <SignalBadge kind={e.kind} />
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold text-ink">{e.student}</p>
              <p className="text-[13px] text-ink-2">{e.text}</p>
            </div>
            <span className="font-mono text-xs text-ink-2">{formatTime(e.at)}</span>
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
