import type { StudentProblem, StudentSubmission } from "@codeportal/contracts";
import { ArrowUp, Play } from "lucide-react";
import { useState } from "react";
import { ScoreChip } from "@/components/exam/score";
import { VerdictPill } from "@/components/exam/verdict";
import { formatTime } from "@/components/panel/format";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Eyebrow, Tag } from "@/components/ui/surface";
import { Tabs } from "@/components/ui/tabs";

type PanelTab = "console" | "examples" | "submissions";

const RUNNER_MISSING = "Uruchamianie kodu pojawi się po podłączeniu sprawdzarki.";

function SubmissionState({ submission, max }: { submission: StudentSubmission; max: number }) {
  if (submission.state === "grading") return <VerdictPill verdict="PENDING" long />;
  if (submission.state === "error") return <Tag tone="danger">Błąd oceniania</Tag>;
  if (submission.points === null) return <Tag tone="success">Ocenione</Tag>;
  return <ScoreChip score={submission.points} max={max} unit="pkt" />;
}

export function BottomPanel({
  problem,
  submitting,
  locked,
  onSubmit,
}: {
  problem: StudentProblem;
  submitting: boolean;
  locked: boolean;
  onSubmit: () => void;
}) {
  const [tab, setTab] = useState<PanelTab>("console");
  const total = problem.submissions.length;

  return (
    <section className="flex min-h-0 flex-col border-t border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 pt-2">
        <Tabs
          aria-label="Panel wyników"
          value={tab}
          onChange={(v) => setTab(v as PanelTab)}
          options={[
            { value: "console", label: "Konsola" },
            { value: "examples", label: "Przykłady", count: problem.examples.length },
            { value: "submissions", label: "Zgłoszenia", count: total },
          ]}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2 pb-2">
          <Button variant="secondary" size="sm" icon={<Play />} disabled title={RUNNER_MISSING}>
            Uruchom
          </Button>
          <Button variant="secondary" size="sm" disabled title={RUNNER_MISSING}>
            Sprawdź na przykładach
          </Button>
          <Button
            size="sm"
            icon={<ArrowUp />}
            onClick={() => {
              setTab("submissions");
              onSubmit();
            }}
            loading={submitting}
            loadingText="Wysyłanie…"
            disabled={locked}
          >
            Zgłoś rozwiązanie
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "console" && (
          <Banner tone="info">
            {RUNNER_MISSING} Zgłoszenia już działają – zapisujemy je i ocenimy automatycznie.
          </Banner>
        )}
        {tab === "examples" &&
          (problem.examples.length === 0 ? (
            <p className="text-body text-ink-2">To zadanie nie ma jawnych przykładów.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {problem.examples.map((example, i) => (
                <li key={i} className="grid gap-3 rounded-input border border-line p-3 sm:grid-cols-2">
                  <div>
                    <Eyebrow>Przykład {i + 1} · wejście</Eyebrow>
                    <pre className="mt-1 overflow-x-auto font-mono text-code text-ink">{example.input}</pre>
                  </div>
                  <div>
                    <Eyebrow>Oczekiwane wyjście</Eyebrow>
                    <pre className="mt-1 overflow-x-auto font-mono text-code text-ink">{example.output}</pre>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        {tab === "submissions" &&
          (total === 0 ? (
            <p className="text-body text-ink-2">
              Nie masz jeszcze zgłoszeń w tym zadaniu. Kliknij „Zgłoś rozwiązanie”, gdy kod będzie gotowy.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {problem.submissions.map((submission, i) => (
                <li key={submission.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-body text-ink">
                    Zgłoszenie #{total - i}
                    <span className="text-ink-2"> · {formatTime(submission.submittedAt)}</span>
                  </span>
                  <SubmissionState submission={submission} max={problem.max} />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </section>
  );
}
