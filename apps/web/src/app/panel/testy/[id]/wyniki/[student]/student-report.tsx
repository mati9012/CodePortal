"use client";

import type { ProblemReview, ReviewStatus, StudentReport } from "@codeportal/contracts";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { RiskMeter, ScoreChip } from "@/components/exam/score";
import { Dialog } from "@/components/panel/dialog";
import { formatTime } from "@/components/panel/format";
import { Breadcrumbs } from "@/components/panel/page-header";
import { QueryView } from "@/components/panel/query-view";
import { ReviewStatusTag } from "@/components/panel/review-status";
import { SignalBadge } from "@/components/panel/signal-badge";
import { useToast } from "@/components/panel/use-toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Input, TextareaField } from "@/components/ui/field";
import { Avatar, Card, CardHeader } from "@/components/ui/surface";
import { SegmentedControl } from "@/components/ui/tabs";
import { api, errorMessage, useApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { GRADE_NAME, gradeFor, groupLabel, RUBRIC_CRITERIA } from "@/lib/panel-labels";
import { pluralPl } from "@/lib/plural";
import { WorkReplay } from "./work-replay";

const SIGNAL_BAR_SCALE = 25;
const STRONG_SIMILARITY_PERCENT = 75;
const SIGNAL_BAR_COLOR = {
  paste: "bg-danger",
  jump: "bg-accent",
  fullscreen: "bg-orange",
  similarity: "bg-danger",
  idle: "bg-ink-3",
  submit: "bg-accent",
  finish: "bg-success",
  time: "bg-accent",
  question: "bg-ink-3",
} as const;

export function StudentReportView({ examId, sessionId }: { examId: string; sessionId: string }) {
  const query = useApi<StudentReport>(`/panel/exams/${examId}/results/${sessionId}`);
  return <QueryView query={query}>{(report) => <ReportBody report={report} reload={() => query.mutate()} />}</QueryView>;
}

function ReportBody({ report, reload }: { report: StudentReport; reload: () => Promise<unknown> }) {
  const { exam, problems, row } = report;
  const maxPoints = problems.reduce((n, p) => n + p.max, 0);
  const total = row.scores.reduce((n, s) => n + s, 0);
  const grade = gradeFor(maxPoints ? Math.round((total / maxPoints) * 100) : 0, report.thresholds);
  const reportHref = (id: string) => `/panel/testy/${exam.id}/wyniki/${id}`;

  return (
    <>
      <Breadcrumbs
        className="mb-4"
        crumbs={[
          { href: "/panel/wyniki", label: "Wyniki" },
          { href: `/panel/testy/${exam.id}/wyniki`, label: exam.title },
        ]}
        current={row.name}
      />

      <Card className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-4 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-h2 text-ink">{row.name}</h1>
            <p className="text-[13px] text-ink-2">
              {groupLabel(exam.group)} · {report.finishedAt ? `zakończył(a) ${formatTime(report.finishedAt)}` : "w trakcie"} ·{" "}
              {report.submissions} {pluralPl(report.submissions, "zgłoszenie", "zgłoszenia", "zgłoszeń")}
            </p>
          </div>
        </div>
        <HeaderStat label="Wynik">
          <ScoreChip score={total} max={maxPoints} />
        </HeaderStat>
        <HeaderStat label="Ocena">
          <span className="text-body text-ink">
            <b className="font-display text-h3">{grade}</b> {GRADE_NAME[grade]}
          </span>
        </HeaderStat>
        <HeaderStat label="Ryzyko samodzielności">
          <RiskMeter score={row.risk} />
        </HeaderStat>
        <div className="ml-auto flex gap-2">
          <NeighbourLink href={report.previousId ? reportHref(report.previousId) : undefined} label="Poprzedni uczeń" icon={<ChevronLeft />} />
          <NeighbourLink href={report.nextId ? reportHref(report.nextId) : undefined} label="Następny uczeń" icon={<ChevronRight />} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="overflow-hidden">
            <CardHeader title="Sygnały" action={<span className="text-xs text-ink-2">waga w wyniku 0–100</span>} />
            {report.signals.length === 0 ? (
              <p className="px-4 py-8 text-center text-body text-ink-2">Brak sygnałów — praca wygląda na samodzielną.</p>
            ) : (
              <ul className="divide-y divide-line">
                {report.signals.map((s, i) => (
                  <li key={`${s.kind}-${i}`} className="flex items-center gap-3 px-4 py-3">
                    <SignalBadge kind={s.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-semibold text-ink">{s.title}</p>
                      <p className="text-[13px] text-ink-2">{s.detail}</p>
                    </div>
                    <span className="relative hidden h-1.5 w-28 overflow-hidden rounded-full bg-line sm:block">
                      <span
                        className={cn("absolute inset-y-0 left-0 rounded-full", SIGNAL_BAR_COLOR[s.kind])}
                        style={{ width: `${Math.min(100, (s.weight / SIGNAL_BAR_SCALE) * 100)}%` }}
                      />
                    </span>
                    <span className="w-9 text-right font-mono text-[13px] font-semibold tabular-nums text-ink">+{s.weight}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="flex items-center gap-2 border-t border-line bg-subtle/50 px-4 py-2.5 text-xs text-ink-2">
              <Info className="size-3.5 shrink-0" aria-hidden />
              To sygnały do oceny przez nauczyciela, nie automatyczny werdykt.
            </p>
          </Card>

          <WorkReplay problems={problems.map((p) => p.number)} replay={report.replay} />
        </div>

        <div className="flex flex-col gap-6">
          {report.similar.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader title="Podobne rozwiązania" />
              <ul className="divide-y divide-line">
                {report.similar.map((s) => (
                  <li key={`${s.sessionId}-${s.problem}`} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        {s.student} · {s.problem}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={cn("font-mono text-[13px] font-semibold", s.percent >= STRONG_SIMILARITY_PERCENT ? "text-danger-ink" : "text-orange-ink")}>
                        {s.percent}%
                      </span>
                      <Link href={reportHref(s.sessionId)} className="text-xs text-accent-ink underline underline-offset-2">
                        Porównaj
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {report.reviews.length > 0 && (
            <ManualReview
              key={row.sessionId}
              examId={exam.id}
              sessionId={row.sessionId}
              status={row.review}
              reviews={report.reviews}
              studentName={row.name}
              reload={reload}
            />
          )}
        </div>
      </div>
    </>
  );
}

function HeaderStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-ink-2">{label}</span>
      {children}
    </div>
  );
}

function NeighbourLink({ href, label, icon }: { href?: string; label: string; icon: ReactNode }) {
  const classes = buttonClasses({ variant: "secondary", className: "w-9 px-0 [&_svg]:size-4" });
  if (!href) {
    return (
      <span aria-disabled className={cn(classes, "pointer-events-none opacity-40")} title={label}>
        {icon}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} title={label} className={classes}>
      {icon}
    </Link>
  );
}

function ManualReview({
  examId,
  sessionId,
  status,
  reviews,
  studentName,
  reload,
}: {
  examId: string;
  sessionId: string;
  status: ReviewStatus;
  reviews: ProblemReview[];
  studentName: string;
  reload: () => Promise<unknown>;
}) {
  const [problem, setProblem] = useState(reviews[0]!.problemNumber);
  const [flagOpen, setFlagOpen] = useState(false);
  const { show, toast } = useToast();
  const review = reviews.find((r) => r.problemNumber === problem)!;

  const flag = async () => {
    setFlagOpen(false);
    try {
      await api(`/panel/exams/${examId}/results/${sessionId}/flag`, { method: "POST" });
      await reload();
      show("Praca oznaczona", studentName, "warning");
    } catch (err) {
      show("Nie udało się oznaczyć pracy", errorMessage(err), "warning");
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body font-semibold text-ink">Ocena ręczna</h2>
        <ReviewStatusTag status={status} />
      </div>

      {reviews.length > 1 && (
        <SegmentedControl
          size="sm"
          aria-label="Zadanie do oceny"
          value={String(problem)}
          onChange={(v) => setProblem(Number(v))}
          options={reviews.map((r) => ({ value: String(r.problemNumber), label: `Z${r.problemNumber}` }))}
        />
      )}

      <ProblemReviewForm
        key={problem}
        review={review}
        onSave={async (input) => {
          try {
            await api(`/panel/exams/${examId}/results/${sessionId}/review`, { body: { problemNumber: problem, ...input } });
            await reload();
            show("Zapisano ocenę", `${studentName} · Z${problem}: ${input.score}/${review.max} pkt`);
          } catch (err) {
            show("Nie zapisano oceny", errorMessage(err), "warning");
          }
        }}
      />

      <Button variant="secondary" className="text-danger-ink" onClick={() => setFlagOpen(true)}>
        Oznacz jako niesamodzielne…
      </Button>

      <Dialog
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        iconTone="danger"
        title="Oznaczyć pracę jako niesamodzielną?"
        description={`${studentName} zobaczy adnotację przy wyniku. Decyzję możesz później zmienić.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFlagOpen(false)}>
              Anuluj
            </Button>
            <Button variant="danger" onClick={flag}>
              Oznacz
            </Button>
          </>
        }
      />
      {toast}
    </Card>
  );
}

function ProblemReviewForm({
  review,
  onSave,
}: {
  review: ProblemReview;
  onSave: (input: { score: number; rubric: Record<string, boolean>; comment: string }) => Promise<void>;
}) {
  const [rubric, setRubric] = useState(() => Object.fromEntries(RUBRIC_CRITERIA.map((c) => [c, review.rubric[c] ?? false])));
  const [corrected, setCorrected] = useState(review.score ?? review.autoScore);
  const [justification, setJustification] = useState(review.comment);
  const [saving, setSaving] = useState(false);
  const changed = corrected !== review.autoScore;
  const invalid = corrected < 0 || corrected > review.max;

  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold text-ink">Rubryka</legend>
        {RUBRIC_CRITERIA.map((criterion) => (
          <Checkbox
            key={criterion}
            label={criterion}
            checked={rubric[criterion]}
            onChange={(e) => setRubric((r) => ({ ...r, [criterion]: e.target.checked }))}
          />
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Automatycznie
          <Input value={`${review.autoScore} / ${review.max}`} disabled readOnly />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Po korekcie
          <Input
            type="number"
            min={0}
            max={review.max}
            value={corrected}
            invalid={invalid}
            onChange={(e) => setCorrected(Number(e.target.value))}
            suffix={`/ ${review.max}`}
          />
        </label>
      </div>

      <TextareaField
        label="Uzasadnienie korekty"
        hint="Uczeń zobaczy uzasadnienie razem z wynikami."
        placeholder="np. rozmowa z uczniem po lekcji potwierdziła rozumienie kodu"
        maxLength={500}
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        error={changed && !justification.trim() ? "Przy zmianie punktów podaj uzasadnienie." : undefined}
      />

      <Button
        disabled={saving || invalid || (changed && !justification.trim())}
        onClick={async () => {
          setSaving(true);
          await onSave({ score: corrected, rubric, comment: justification.trim() });
          setSaving(false);
        }}
      >
        Zapisz ocenę
      </Button>
    </>
  );
}
