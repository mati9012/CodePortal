"use client";

import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { RiskMeter, ScoreChip } from "@/components/exam/score";
import { Dialog } from "@/components/panel/dialog";
import { Breadcrumbs } from "@/components/panel/page-header";
import { SignalBadge } from "@/components/panel/signal-badge";
import { useToast } from "@/components/panel/use-toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Input, TextareaField } from "@/components/ui/field";
import { Avatar, Card, CardHeader, Tag } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import {
  examMaxPoints,
  examProblems,
  GRADE_NAME,
  gradeFor,
  REVIEW_STATUS_LABEL,
  RUBRIC,
  signalsForRisk,
  SIMILAR_SOLUTIONS,
  type ResultRow,
  type ReviewStatus,
} from "@/lib/mock/exam-session";
import type { Exam } from "@/lib/mock/panel";
import { WorkReplay } from "./work-replay";

const SIGNAL_BAR_SCALE = 25;
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

export function StudentReport({
  exam,
  row,
  previousId,
  nextId,
}: {
  exam: Exam;
  row: ResultRow;
  previousId?: string;
  nextId?: string;
}) {
  const problems = examProblems(exam);
  const maxPoints = examMaxPoints(exam);
  const total = row.scores.reduce((n, s) => n + s, 0);
  const grade = gradeFor(Math.round((total / maxPoints) * 100));
  const signals = signalsForRisk(row.risk);
  const similar = row.risk >= 30 ? SIMILAR_SOLUTIONS.filter((s) => s.studentId !== row.id) : [];
  const reviewedProblem = problems[Math.min(1, problems.length - 1)]!;
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
              {exam.group} · zakończył 11:12 · {problems.length + 1} zgłoszenia
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
          <NeighbourLink href={previousId && reportHref(previousId)} label="Poprzedni uczeń" icon={<ChevronLeft />} />
          <NeighbourLink href={nextId && reportHref(nextId)} label="Następny uczeń" icon={<ChevronRight />} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="overflow-hidden">
            <CardHeader title="Sygnały" action={<span className="text-xs text-ink-2">waga w wyniku 0–100</span>} />
            {signals.length === 0 ? (
              <p className="px-4 py-8 text-center text-body text-ink-2">Brak sygnałów — praca wygląda na samodzielną.</p>
            ) : (
              <ul className="divide-y divide-line">
                {signals.map((s) => (
                  <li key={s.title} className="flex items-center gap-3 px-4 py-3">
                    <SignalBadge kind={s.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-semibold text-ink">{s.title}</p>
                      <p className="text-[13px] text-ink-2">{s.detail}</p>
                    </div>
                    <span className="relative hidden h-1.5 w-28 overflow-hidden rounded-full bg-line sm:block">
                      <span
                        className={cn("absolute inset-y-0 left-0 rounded-full", SIGNAL_BAR_COLOR[s.kind])}
                        style={{ width: `${(s.weight / SIGNAL_BAR_SCALE) * 100}%` }}
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

          <WorkReplay problems={problems.map((p) => p.number)} />
        </div>

        <div className="flex flex-col gap-6">
          {similar.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader title="Podobne rozwiązania" />
              <ul className="divide-y divide-line">
                {similar.map((s) => (
                  <li key={s.studentId} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">
                        {s.student} · {s.problem}
                      </p>
                      <p className="text-xs text-ink-2">{s.note}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className={cn("font-mono text-[13px] font-semibold", s.percent >= 75 ? "text-danger-ink" : "text-orange-ink")}>
                        {s.percent}%
                      </span>
                      <Link href={reportHref(s.studentId)} className="text-xs text-accent-ink underline underline-offset-2">
                        Porównaj
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <ManualReview
            key={row.id}
            initialStatus={row.review}
            problemLabel={`Z${reviewedProblem.number}`}
            autoScore={row.scores[reviewedProblem.number - 1]!}
            max={reviewedProblem.max}
            studentName={row.name}
          />
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

const REVIEW_TONE: Record<ReviewStatus, "success" | "danger" | "warning"> = {
  approved: "success",
  flagged: "danger",
  pending: "warning",
};

function ManualReview({
  initialStatus,
  problemLabel,
  autoScore,
  max,
  studentName,
}: {
  initialStatus: ReviewStatus;
  problemLabel: string;
  autoScore: number;
  max: number;
  studentName: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [rubric, setRubric] = useState(RUBRIC.map((r) => r.checked));
  const [corrected, setCorrected] = useState(autoScore);
  const [justification, setJustification] = useState("");
  const [flagOpen, setFlagOpen] = useState(false);
  const { show, toast } = useToast();
  const changed = corrected !== autoScore;
  const invalid = corrected < 0 || corrected > max;

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body font-semibold text-ink">Ocena ręczna</h2>
        <Tag tone={REVIEW_TONE[status]} pill>
          {REVIEW_STATUS_LABEL[status]}
        </Tag>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[13px] font-semibold text-ink">Rubryka · {problemLabel}</legend>
        {RUBRIC.map((r, i) => (
          <Checkbox
            key={r.label}
            label={r.label}
            checked={rubric[i]}
            onChange={(e) => setRubric((list) => list.map((v, j) => (j === i ? e.target.checked : v)))}
          />
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Automatycznie
          <Input value={`${autoScore} / ${max}`} disabled readOnly />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Po korekcie
          <Input
            type="number"
            min={0}
            max={max}
            value={corrected}
            invalid={invalid}
            onChange={(e) => setCorrected(Number(e.target.value))}
            suffix={`/ ${max}`}
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
        disabled={invalid || (changed && !justification.trim())}
        onClick={() => {
          setStatus("approved");
          show("Zapisano ocenę", `${studentName} · ${corrected}/${max} pkt`);
        }}
      >
        Zapisz ocenę
      </Button>
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
            <Button
              variant="danger"
              onClick={() => {
                setStatus("flagged");
                setFlagOpen(false);
                show("Praca oznaczona", studentName, "warning");
              }}
            >
              Oznacz
            </Button>
          </>
        }
      />
      {toast}
    </Card>
  );
}
