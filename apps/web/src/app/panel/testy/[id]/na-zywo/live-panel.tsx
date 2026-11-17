"use client";

import type { AddTimeInput, ExamDetail, LiveParticipant } from "@codeportal/contracts";
import { MonitorPlay, Plus, Search, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatClock } from "@/components/exam/format";
import { ProblemTiles, StatusDot } from "@/components/exam/score";
import { ActionMenu } from "@/components/panel/action-menu";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { formatAgo, formatTime } from "@/components/panel/format";
import { PageHeader } from "@/components/panel/page-header";
import { QueryView } from "@/components/panel/query-view";
import { SignalBadge } from "@/components/panel/signal-badge";
import { useToast } from "@/components/panel/use-toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { Avatar, Card } from "@/components/ui/surface";
import { SegmentedControl } from "@/components/ui/tabs";
import { api, errorMessage, useApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useNow } from "@/lib/use-now";
import { AddTimeDialog, EndExamDialog, EndSessionDialog, LiveCodeDialog, MessageDialog } from "./live-dialogs";

const REFRESH_MS = 5000;
const SECOND_MS = 1000;
const MINUTE_SEC = 60;
const WARNING_SEC = 10 * MINUTE_SEC;
const DANGER_SEC = 5 * MINUTE_SEC;

type Filter = "all" | "events" | "idle";
type DialogState =
  | { kind: "add-time"; preselected: string[] }
  | { kind: "end-exam" }
  | { kind: "end-session"; participant: LiveParticipant }
  | { kind: "message"; participant: LiveParticipant }
  | { kind: "code"; participant: LiveParticipant }
  | null;

export function LivePanel({ id }: { id: string }) {
  const query = useApi<ExamDetail>(`/panel/exams/${id}`, { refreshInterval: REFRESH_MS });
  return (
    <QueryView query={query}>
      {(detail) =>
        detail.exam.status === "draft" || detail.exam.status === "scheduled" ? (
          <Card>
            <EmptyState
              title="Test jeszcze się nie rozpoczął"
              description="Panel na żywo ruszy, gdy minie godzina rozpoczęcia."
              action={
                <Link href={`/panel/testy/${id}`} className={buttonClasses()}>
                  Wróć do testu
                </Link>
              }
            />
          </Card>
        ) : (
          <LiveBoard detail={detail} reload={() => query.mutate()} />
        )
      }
    </QueryView>
  );
}

function LiveBoard({ detail, reload }: { detail: ExamDetail; reload: () => Promise<unknown> }) {
  const { exam, problems, participants, events, timing } = detail;
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const { show, toast } = useToast();
  const now = useNow();

  const ended = exam.status !== "live";
  const startsAt = new Date(timing.startsAt);
  const endsAt = new Date(timing.endsAt);
  const totalMin = timing.durationMin + timing.extraMin;
  const totalSec = totalMin * MINUTE_SEC;
  const elapsedSec = now ? Math.max(0, Math.floor((now - startsAt.getTime()) / SECOND_MS)) : 0;
  const left = ended || !now ? 0 : Math.max(0, Math.floor((endsAt.getTime() - now) / SECOND_MS));

  const counts = {
    active: participants.filter((p) => p.status === "online" || p.status === "idle" || p.status === "offline").length,
    finished: participants.filter((p) => p.status === "finished").length,
    notStarted: participants.filter((p) => p.status === "not_started").length,
    events: participants.reduce((n, p) => n + p.events, 0),
    withEvents: participants.filter((p) => p.events > 0).length,
    idle: participants.filter((p) => p.status === "idle" || p.status === "offline").length,
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return participants.filter(
      (p) =>
        (filter === "all" || (filter === "events" ? p.events > 0 : p.status === "idle" || p.status === "offline")) &&
        (!q || p.name.toLowerCase().includes(q)),
    );
  }, [participants, filter, query]);

  const waiting = participants.filter((p) => p.waitingForDecision);

  const run = async (action: () => Promise<unknown>, success: [string, string?]) => {
    try {
      await action();
      await reload();
      show(...success);
    } catch (err) {
      show("Nie udało się", errorMessage(err), "warning");
    }
  };

  const sessionPath = (p: LiveParticipant, action: string) => `/panel/exams/${exam.id}/sessions/${p.sessionId}/${action}`;

  const readmit = (p: LiveParticipant) =>
    run(() => api(sessionPath(p, "readmit"), { method: "POST" }), [`Wpuszczono: ${p.name}`, "Uczeń wraca do testu, czas znów płynie."]);

  const addTime = (ids: string[] | "all", minutes: number, reason: string) => {
    const body: AddTimeInput = { sessionIds: ids, minutes, reason };
    const names = ids === "all" ? [] : participants.filter((p) => ids.includes(p.id)).map((p) => p.name);
    return run(
      () => api(`/panel/exams/${exam.id}/time`, { body }),
      ids === "all" ? [`Dodano ${minutes} min wszystkim`, "Uczniowie zobaczą powiadomienie."] : [`Dodano ${minutes} min`, names.join(", ")],
    );
  };

  const endSession = (p: LiveParticipant) =>
    run(() => api(sessionPath(p, "end"), { method: "POST" }), [`Zakończono sesję: ${p.name}`, "Ostatnia wersja kodu została zgłoszona."]);

  const endExam = () =>
    run(() => api(`/panel/exams/${exam.id}/end`, { method: "POST" }), ["Test zakończony", "Ostatnie wersje kodu zostały zgłoszone automatycznie."]);

  const message = (p: LiveParticipant, text: string) =>
    run(() => api(sessionPath(p, "message"), { body: { text } }), [`Wysłano wiadomość do: ${p.name}`]);

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {exam.title} <ExamStatusTag status={exam.status} />
          </span>
        }
        crumbs={[
          { href: "/panel/testy", label: "Testy i konkursy" },
          { href: `/panel/testy/${exam.id}`, label: exam.title },
        ]}
        actions={
          ended ? (
            <Link href={`/panel/testy/${exam.id}/wyniki`} className={buttonClasses()}>
              Przejdź do wyników
            </Link>
          ) : (
            <>
              <Link href={`/panel/testy/${exam.id}/rzutnik`} className={buttonClasses({ variant: "ghost" })}>
                <MonitorPlay className="size-4" aria-hidden /> Pokaż na rzutniku
              </Link>
              <Button variant="secondary" icon={<Plus />} onClick={() => setDialog({ kind: "add-time", preselected: [] })}>
                Dodaj czas
              </Button>
              <Button variant="danger" onClick={() => setDialog({ kind: "end-exam" })}>
                Zakończ test
              </Button>
            </>
          )
        }
      />

      <Card className="mb-4 grid grid-cols-2 divide-line max-lg:gap-px max-lg:overflow-hidden max-lg:bg-line lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] lg:divide-x">
        <div className="col-span-2 flex flex-col gap-2 bg-surface p-4 lg:col-span-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] text-ink-2">Pozostało</span>
            <span
              role="timer"
              className={cn(
                "font-mono text-h2 font-semibold tabular-nums",
                left === 0 ? "text-ink-2" : left <= DANGER_SEC ? "text-danger-ink" : left <= WARNING_SEC ? "text-warning-ink" : "text-ink",
              )}
            >
              {left === 0 ? "Koniec" : formatClock(left)}
            </span>
          </div>
          <span className="relative h-1.5 overflow-hidden rounded-full bg-line">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width]"
              style={{ width: `${ended ? 100 : Math.min(100, (elapsedSec / totalSec) * 100)}%` }}
            />
          </span>
          <span className="text-xs text-ink-2">
            {formatTime(startsAt)} – {formatTime(endsAt)} · minęło {Math.min(totalMin, Math.floor(elapsedSec / MINUTE_SEC))} z {totalMin} min
            {timing.extraMin > 0 && <b className="font-semibold text-accent-ink"> (+{timing.extraMin})</b>}
          </span>
        </div>
        <LiveStat label="Aktywni" value={counts.active} dot="bg-success" />
        <LiveStat label="Zakończyli" value={counts.finished} dot="bg-accent" />
        <LiveStat label="Nie zaczęli" value={counts.notStarted} dot="border border-ink-3" />
        <LiveStat label="Zdarzenia" value={counts.events} icon />
      </Card>

      {ended && (
        <Banner tone="success" className="mb-4" action={<Link href={`/panel/testy/${exam.id}/wyniki`} className="text-accent-ink underline underline-offset-4">Otwórz wyniki</Link>}>
          Test zakończony. Ostatnie wersje kodu zostały zgłoszone automatycznie.
        </Banner>
      )}

      {waiting.map((p) => (
        <Banner
          key={p.id}
          tone="warning"
          className="mb-4"
          title={`${p.name} czeka na decyzję.`}
          action={
            <span className="flex gap-2">
              <Button size="sm" onClick={() => readmit(p)}>
                Wpuść ponownie
              </Button>
              <Button size="sm" variant="secondary" className="text-danger-ink" onClick={() => setDialog({ kind: "end-session", participant: p })}>
                Zakończ sesję
              </Button>
            </span>
          }
        >
          Przekroczył limit wyjść z pełnego ekranu. Sesja jest wstrzymana, czas płynie.
        </Banner>
      ))}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj ucznia" className="pl-9" aria-label="Szukaj ucznia" />
            </div>
            <SegmentedControl
              aria-label="Filtr uczniów"
              value={filter}
              onChange={(v) => setFilter(v as Filter)}
              options={[
                { value: "all", label: "Wszyscy", count: participants.length },
                { value: "events", label: "Ze zdarzeniami", count: counts.withEvents },
                { value: "idle", label: "Bezczynni", count: counts.idle },
              ]}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-body">
              <thead className="border-b border-line bg-subtle/60 text-xs text-ink-2 max-lg:hidden">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Uczeń</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Zadania</th>
                  <th className="px-3 py-2.5 text-right font-medium">Punkty</th>
                  <th className="px-3 py-2.5 font-medium">Zdarzenia</th>
                  <th className="px-3 py-2.5 font-medium">Ostatnia aktywność</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => {
                  const points = p.scores.reduce<number>((n, s) => n + (s ?? 0), 0);
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        "max-lg:grid max-lg:grid-cols-[1fr_auto] max-lg:gap-x-3 max-lg:gap-y-2 max-lg:px-4 max-lg:py-3",
                        p.events > 0 && "bg-warning-soft/40",
                      )}
                    >
                      <td className="px-4 py-2.5 max-lg:p-0">
                        <span className="flex items-center gap-2.5">
                          <Avatar name={p.name} size="sm" />
                          <span className="truncate font-medium text-ink">{p.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-lg:row-start-1 max-lg:col-start-2 max-lg:p-0 max-lg:text-right">
                        <StatusDot status={p.status} />
                      </td>
                      <td className="px-3 py-2.5 max-lg:col-span-2 max-lg:p-0">
                        <ProblemTiles
                          problems={problems.map((pr, i) => ({ number: pr.number, max: pr.max, score: p.scores[i] ?? undefined }))}
                          activeNumber={p.status === "online" || p.status === "idle" ? p.activeProblem : undefined}
                          scoreOnly
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink max-lg:p-0 max-lg:text-left">
                        {p.status === "not_started" ? "—" : <><span className="text-ink-2 lg:hidden">Punkty: </span>{points}</>}
                      </td>
                      <td className="px-3 py-2.5 max-lg:hidden">
                        {p.events > 0 ? (
                          <span className="inline-flex items-center gap-1 text-warning-ink">
                            <TriangleAlert className="size-3.5" aria-hidden /> {p.events}
                          </span>
                        ) : (
                          <span className="text-ink-3">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[13px] text-ink-2 max-lg:hidden">{now ? formatAgo(p.lastActivityAt, now) : "—"}</td>
                      <td className="px-3 py-2.5 text-right max-lg:row-start-3 max-lg:col-start-2 max-lg:p-0">
                        <ActionMenu
                          label={`Akcje: ${p.name}`}
                          heading={
                            <>
                              <p className="text-[13px] font-semibold text-ink">{p.name}</p>
                              <p className="text-xs text-ink-2">
                                <StatusDot status={p.status} className="text-xs" /> · {p.events} zdarzenia
                              </p>
                            </>
                          }
                          actions={[
                            { label: "Podgląd kodu na żywo", onSelect: () => setDialog({ kind: "code", participant: p }), hidden: p.status === "not_started" },
                            { label: "Dodaj czas…", onSelect: () => setDialog({ kind: "add-time", preselected: [p.id] }), hidden: ended || !p.sessionId || p.status === "finished" },
                            { label: "Wpuść ponownie", onSelect: () => readmit(p), hidden: !p.waitingForDecision },
                            { label: "Wyślij wiadomość", onSelect: () => setDialog({ kind: "message", participant: p }), hidden: ended || !p.sessionId || p.status === "finished" },
                            {
                              label: "Zakończ sesję ucznia…",
                              danger: true,
                              hidden: ended || p.status === "finished" || p.status === "not_started",
                              onSelect: () => setDialog({ kind: "end-session", participant: p }),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && <p className="px-4 py-10 text-center text-body text-ink-2">Nikt nie pasuje do filtra.</p>}
          </div>
        </Card>

        <Card className="flex max-h-[640px] flex-col overflow-hidden xl:sticky xl:top-24 xl:self-start">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-body font-semibold text-ink">Zdarzenia</h2>
            {!ended && (
              <span className="inline-flex items-center gap-1.5 text-xs text-success-ink">
                <span className="size-1.5 animate-pulse rounded-full bg-success" aria-hidden /> na żywo
              </span>
            )}
          </div>
          <ul className="divide-y divide-line overflow-y-auto" aria-live="polite">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                <SignalBadge kind={e.kind} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink">{e.student}</p>
                  <p className="text-[13px] text-ink-2">{e.text}</p>
                </div>
                <span className="font-mono text-xs text-ink-2">{formatTime(e.at)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <AddTimeDialog
        open={dialog?.kind === "add-time"}
        preselected={dialog?.kind === "add-time" ? dialog.preselected : []}
        participants={participants.filter((p) => p.status !== "not_started" && p.status !== "finished")}
        endsAt={endsAt}
        onClose={() => setDialog(null)}
        onConfirm={(ids, minutes, reason) => {
          setDialog(null);
          return addTime(ids, minutes, reason);
        }}
      />
      <EndExamDialog
        open={dialog?.kind === "end-exam"}
        title={exam.title}
        activeCount={counts.active}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          return endExam();
        }}
      />
      {dialog?.kind === "end-session" && (
        <EndSessionDialog
          participant={dialog.participant}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            setDialog(null);
            return endSession(dialog.participant);
          }}
        />
      )}
      {dialog?.kind === "message" && (
        <MessageDialog
          participant={dialog.participant}
          onClose={() => setDialog(null)}
          onSend={(text) => {
            setDialog(null);
            return message(dialog.participant, text);
          }}
        />
      )}
      {dialog?.kind === "code" && <LiveCodeDialog examId={exam.id} participant={dialog.participant} onClose={() => setDialog(null)} />}
      {toast}
    </>
  );
}

function LiveStat({ label, value, dot, icon }: { label: string; value: number; dot?: string; icon?: boolean }) {
  return (
    <div className="flex flex-col gap-1 bg-surface p-4">
      <span className="flex items-center gap-1.5 text-[13px] text-ink-2">
        {dot && <span className={cn("size-2 rounded-full", dot)} aria-hidden />}
        {icon && <TriangleAlert className="size-3.5 text-warning-ink" aria-hidden />}
        {label}
      </span>
      <span className="font-display text-h2 tabular-nums text-ink">{value}</span>
    </div>
  );
}
