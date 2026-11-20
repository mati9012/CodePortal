import type { StudentProblem } from "@codeportal/contracts";
import { CircleStop } from "lucide-react";
import { formatClock } from "@/components/exam/format";
import { Dialog } from "@/components/panel/dialog";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Tag, type TagTone } from "@/components/ui/surface";
import { latestPoints, progressOf, type ProblemProgress } from "./problem-status";

const PROGRESS_TONE: Record<ProblemProgress, TagTone> = {
  submitted: "success",
  changed: "warning",
  unsubmitted: "danger",
};

function progressLabel(progress: ProblemProgress, problem: StudentProblem) {
  if (progress === "changed") return "zmiany po zgłoszeniu";
  if (progress === "unsubmitted") return "niezgłoszone";
  const points = latestPoints(problem);
  return points === undefined ? "zgłoszone" : `zgłoszone · ${points}/${problem.max}`;
}

function warningText(unsubmitted: number[], changed: number[]) {
  const parts = [
    unsubmitted.length > 0 &&
      `${unsubmitted.length === 1 ? "Zadanie" : "Zadania"} ${unsubmitted.join(", ")} nie ${unsubmitted.length === 1 ? "zostało zgłoszone" : "zostały zgłoszone"}`,
    changed.length > 0 && `w ${changed.length === 1 ? "zadaniu" : "zadaniach"} ${changed.join(", ")} są zmiany po ostatnim zgłoszeniu`,
  ].filter(Boolean);
  return `${parts.join(", a ")} – nie zostaną ocenione.`;
}

export function FinishDialog({
  open,
  problems,
  lastEditAt,
  secondsLeft,
  finishing,
  onClose,
  onFinish,
}: {
  open: boolean;
  problems: StudentProblem[];
  lastEditAt: (problem: StudentProblem) => string | undefined;
  secondsLeft: number;
  finishing: boolean;
  onClose: () => void;
  onFinish: () => void;
}) {
  const rows = problems.map((problem) => ({ problem, progress: progressOf(problem, lastEditAt(problem)) }));
  const numbersWith = (progress: ProblemProgress) =>
    rows.filter((r) => r.progress === progress).map((r) => r.problem.number);
  const unsubmitted = numbersWith("unsubmitted");
  const changed = numbersWith("changed");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<CircleStop />}
      iconTone="danger"
      title="Zakończyć test?"
      description={
        <>
          Po zakończeniu nie wrócisz do zadań. Zostało <span className="font-mono">{formatClock(secondsLeft)}</span>.
        </>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Wróć do zadań
          </Button>
          <Button variant="danger" onClick={onFinish} loading={finishing}>
            Zakończ test
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-line rounded-input border border-line">
        {rows.map(({ problem, progress }) => (
          <li key={problem.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="min-w-0 truncate text-body text-ink">
              {problem.number} · {problem.title}
            </span>
            <Tag tone={PROGRESS_TONE[progress]} pill className="shrink-0">
              {progressLabel(progress, problem)}
            </Tag>
          </li>
        ))}
      </ul>
      {(unsubmitted.length > 0 || changed.length > 0) && (
        <Banner tone="warning" className="mt-3">
          {warningText(unsubmitted, changed)}
        </Banner>
      )}
    </Dialog>
  );
}
