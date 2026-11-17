"use client";

import type { ExamProblem, ExamResults, ResultRow } from "@codeportal/contracts";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RiskMeter, riskLevel } from "@/components/exam/score";
import { ActionMenu } from "@/components/panel/action-menu";
import { Dialog } from "@/components/panel/dialog";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { GradeHistogram } from "@/components/panel/grade-histogram";
import { PageHeader } from "@/components/panel/page-header";
import { ReviewStatusTag } from "@/components/panel/review-status";
import { QueryView } from "@/components/panel/query-view";
import { useToast } from "@/components/panel/use-toast";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { Card, StatCard } from "@/components/ui/surface";
import { SegmentedControl } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { api, errorMessage, useApi } from "@/lib/api";
import { gradeFor } from "@/lib/panel-labels";
import { pluralPl } from "@/lib/plural";
import { downloadCsv, gradebookText, resultsCsv } from "./export";

type SortKey = "total" | "risk" | "name";

function heatClass(score: number, max: number) {
  const ratio = max ? score / max : 0;
  if (ratio >= 0.9) return "bg-success/30 text-success-ink";
  if (ratio >= 0.6) return "bg-success-soft text-success-ink";
  if (ratio >= 0.4) return "bg-warning-soft text-warning-ink";
  return "bg-danger-soft text-danger-ink";
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

const formatOneDecimal = (n: number) => n.toLocaleString("pl-PL", { maximumFractionDigits: 1 });

export function ResultsView({ id }: { id: string }) {
  const query = useApi<ExamResults>(`/panel/exams/${id}/results`);
  return <QueryView query={query}>{(data) => <ResultsBoard data={data} reload={() => query.mutate()} />}</QueryView>;
}

function ResultsBoard({ data, reload }: { data: ExamResults; reload: () => Promise<unknown> }) {
  const { exam, problems, thresholds, approved } = data;
  const results = data.rows;
  const maxPoints = problems.reduce((n, p) => n + p.max, 0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("total");
  const { show, toast } = useToast();

  const rows = useMemo(() => {
    const withTotals = results.map((r) => {
      const total = r.scores.reduce((n, s) => n + s, 0);
      const percent = maxPoints ? Math.round((total / maxPoints) * 100) : 0;
      return { ...r, total, percent, grade: gradeFor(percent, thresholds) };
    });
    const q = query.trim().toLowerCase();
    const compare: Record<SortKey, (a: (typeof withTotals)[number], b: (typeof withTotals)[number]) => number> = {
      total: (a, b) => b.total - a.total,
      risk: (a, b) => b.risk - a.risk,
      name: (a, b) => a.name.localeCompare(b.name, "pl"),
    };
    return withTotals
      .filter((r) => (!flaggedOnly || r.review === "flagged") && (!q || r.name.toLowerCase().includes(q)))
      .sort(compare[sort]);
  }, [results, maxPoints, thresholds, query, flaggedOnly, sort]);

  const percents = results.map((r) => (maxPoints ? (r.scores.reduce((n, s) => n + s, 0) / maxPoints) * 100 : 0));
  const average = percents.length ? percents.reduce((n, p) => n + p, 0) / percents.length : 0;
  const hardest = problems
    .map((p, i) => ({ ...p, avg: results.length && p.max ? results.reduce((n, r) => n + r.scores[i]! / p.max, 0) / results.length : 0 }))
    .sort((a, b) => a.avg - b.avg)[0];

  const approve = async () => {
    setConfirmOpen(false);
    try {
      await api(`/panel/exams/${exam.id}/results/approve`, { method: "POST" });
      await reload();
      show("Wyniki zatwierdzone", "Uczniowie zobaczą je po zalogowaniu.");
    } catch (err) {
      show("Nie udało się zatwierdzić wyników", errorMessage(err), "warning");
    }
  };

  const copyGradebook = async () => {
    try {
      await navigator.clipboard.writeText(gradebookText(rows));
      show("Skopiowano oceny", "Wklej je w dzienniku elektronicznym.");
    } catch {
      show("Nie udało się skopiować", "Przeglądarka zablokowała schowek.", "warning");
    }
  };
  const flagged = results.filter((r) => r.review === "flagged").length;
  const highRisk = results.filter((r) => riskLevel(r.risk) === "high").length;
  const pending = results.filter((r) => r.review === "pending").length;
  const reviewed = results.length - pending;

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex flex-wrap items-center gap-3">
            {exam.title} <ExamStatusTag status={approved ? "finished" : exam.status === "live" ? "live" : "review"} />
          </span>
        }
        crumbs={[
          { href: "/panel/testy", label: "Testy i konkursy" },
          { href: `/panel/testy/${exam.id}`, label: exam.title },
        ]}
        actions={
          <>
            <ActionMenu
              label="Eksport"
              trigger={({ open, toggle }) => (
                <Button variant="secondary" iconRight={<ChevronDown />} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
                  Eksport
                </Button>
              )}
              actions={[
                { label: "Plik CSV", onSelect: () => downloadCsv(`${exam.title}.csv`, resultsCsv(problems, rows)) },
                { label: "Oceny do dziennika", onSelect: copyGradebook },
              ]}
            />
            {!approved && exam.status !== "live" && <Button onClick={() => setConfirmOpen(true)}>Zatwierdź i pokaż wyniki uczniom</Button>}
          </>
        }
      />

      {approved ? (
        <Banner tone="success" className="mb-6">
          Wyniki zatwierdzone — uczniowie widzą punkty, oceny i uzasadnienia korekt.
        </Banner>
      ) : (
        <Banner
          tone="info"
          className="mb-6"
          action={
            flagged > 0 && (
              <button type="button" onClick={() => setFlaggedOnly(true)} className="text-accent-ink underline underline-offset-4">
                Pokaż oznaczone
              </button>
            )
          }
        >
          Wyniki niezatwierdzone — uczniowie ich jeszcze nie widzą. Sprawdzono {reviewed} z {results.length} raportów,{" "}
          {flagged} {pluralPl(flagged, "oznaczony", "oznaczone", "oznaczonych")}.
        </Banner>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.4fr)]">
        <StatCard label="Średnia" value={formatOneDecimal(average)} note="/ 100 pkt" />
        <StatCard label="Mediana" value={formatOneDecimal(median(percents))} note="/ 100 pkt" />
        <StatCard
          label="Najtrudniejsze"
          value={hardest ? `Z${hardest.number}` : "—"}
          note={hardest ? `${hardest.title} · śr. ${Math.round(hardest.avg * 100)}%` : undefined}
        />
        <StatCard
          label="Oznaczone"
          value={<span className="text-orange-ink">{highRisk}</span>}
          note="ryzyko ≥ 60"
        />
        <Card className="col-span-2 flex flex-col gap-2 p-4 lg:col-span-1">
          <p className="flex items-baseline justify-between gap-2 text-[13px] text-ink-2">
            Rozkład ocen <span className="text-xs">{results.length} uczniów</span>
          </p>
          <GradeHistogram grades={percents.map((p) => gradeFor(p, thresholds))} className="mt-auto" />
        </Card>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SegmentedControl
          aria-label="Filtr wyników"
          value={flaggedOnly ? "flagged" : "all"}
          onChange={(v) => setFlaggedOnly(v === "flagged")}
          options={[
            { value: "all", label: "Wszyscy", count: results.length },
            { value: "flagged", label: "Tylko oznaczone", count: flagged },
          ]}
        />
        <div className="relative w-full sm:w-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj ucznia" className="pl-9" aria-label="Szukaj ucznia" />
        </div>
        <span className="ml-auto flex items-center gap-2 text-xs text-ink-2 max-md:hidden">
          Komórki: % punktów za zadanie
          <span className="flex gap-0.5" aria-hidden>
            {["bg-danger-soft", "bg-warning-soft", "bg-success-soft", "bg-success/30"].map((c) => (
              <span key={c} className={cn("h-3 w-4 rounded-[2px]", c)} />
            ))}
          </span>
        </span>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-body">
          <thead className="border-b border-line bg-subtle/60 text-xs text-ink-2">
            <tr>
              <SortHeader label="Uczeń" active={sort === "name"} onClick={() => setSort("name")} className="px-4" />
              {problems.map((p) => (
                <th key={p.number} className="w-16 px-2 py-2.5 text-center font-medium" title={`${p.title} · ${p.max} pkt`}>
                  Z{p.number}
                </th>
              ))}
              <SortHeader label="Suma" active={sort === "total"} onClick={() => setSort("total")} className="text-right" />
              <th className="px-3 py-2.5 text-right font-medium">%</th>
              <th className="px-3 py-2.5 font-medium">Ocena</th>
              <SortHeader label="Ryzyko" active={sort === "risk"} onClick={() => setSort("risk")} />
              <th className="px-3 py-2.5 font-medium">Sprawdzenie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <ResultTableRow key={r.sessionId} row={r} examId={exam.id} problems={problems} />
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-10 text-center text-body text-ink-2">Nikt nie pasuje do filtra.</p>}
      </Card>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Pokazać wyniki uczniom?"
        description={
          pending > 0
            ? `${pending} ${pluralPl(pending, "praca czeka", "prace czekają", "prac czeka")} na przejrzenie — ${pluralPl(pending, "zostanie zatwierdzona", "zostaną zatwierdzone", "zostanie zatwierdzonych")} z wynikiem automatycznym.`
            : "Uczniowie zobaczą punkty, oceny i uzasadnienia korekt."
        }
        iconTone={pending > 0 ? "warning" : "info"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={approve}>Zatwierdź i pokaż</Button>
          </>
        }
      />
      {toast}
    </>
  );
}

function SortHeader({ label, active, onClick, className }: { label: string; active: boolean; onClick: () => void; className?: string }) {
  return (
    <th className={cn("px-3 py-2.5 font-medium", className)} aria-sort={active ? "descending" : undefined}>
      <button type="button" onClick={onClick} className={cn("hover:text-ink", active && "text-ink")}>
        {label}
        {active && " ↓"}
      </button>
    </th>
  );
}

function ResultTableRow({
  row,
  examId,
  problems,
}: {
  row: ResultRow & { total: number; percent: number; grade: number };
  examId: string;
  problems: ExamProblem[];
}) {
  return (
    <tr className="hover:bg-subtle/50">
      <td className="px-4 py-2">
        <Link href={`/panel/testy/${examId}/wyniki/${row.sessionId}`} className="font-medium text-ink hover:text-accent-ink hover:underline">
          {row.name}
        </Link>
      </td>
      {problems.map((p, i) => (
        <td key={p.number} className="p-0.5">
          <span className={cn("flex h-9 items-center justify-center rounded-[4px] font-mono text-[13px] font-semibold tabular-nums", heatClass(row.scores[i]!, p.max))}>
            {row.scores[i]}
          </span>
        </td>
      ))}
      <td className="px-3 py-2 text-right font-semibold tabular-nums text-ink">{row.total}</td>
      <td className="px-3 py-2 text-right tabular-nums text-ink-2">{row.percent}%</td>
      <td className="px-3 py-2 font-semibold tabular-nums text-ink">{row.grade}</td>
      <td className="px-3 py-2">
        <RiskMeter score={row.risk} variant="compact" />
      </td>
      <td className="px-3 py-2">
        <ReviewStatusTag status={row.review} />
      </td>
    </tr>
  );
}
