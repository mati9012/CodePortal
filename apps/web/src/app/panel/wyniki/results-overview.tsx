"use client";

import type { Dashboard, ExamSummary } from "@codeportal/contracts";
import Link from "next/link";
import { useState } from "react";
import { RiskMeter, ScoreChip } from "@/components/exam/score";
import { Dialog } from "@/components/panel/dialog";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { formatDay } from "@/components/panel/format";
import { PageHeader } from "@/components/panel/page-header";
import { QueryView } from "@/components/panel/query-view";
import { useToast } from "@/components/panel/use-toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/surface";
import { api, errorMessage, useApi } from "@/lib/api";
import { groupLabel } from "@/lib/panel-labels";

export function ResultsOverview() {
  const exams = useApi<ExamSummary[]>("/panel/exams");
  const dashboard = useApi<Dashboard>("/panel/dashboard");
  const [approving, setApproving] = useState<ExamSummary | null>(null);
  const { show, toast } = useToast();

  const approve = async (exam: ExamSummary) => {
    try {
      await api(`/panel/exams/${exam.id}/results/approve`, { method: "POST" });
      await Promise.all([exams.mutate(), dashboard.mutate()]);
      show("Wyniki zatwierdzone", "Uczniowie zobaczą je po zalogowaniu.");
    } catch (err) {
      show("Nie udało się zatwierdzić wyników", errorMessage(err), "warning");
    }
    setApproving(null);
  };

  return (
    <>
      <PageHeader
        title="Wyniki"
        description="Sprawdź oznaczone prace i zatwierdź wyniki — dopiero wtedy zobaczą je uczniowie."
        crumbs={[{ href: "/panel", label: "Pulpit" }]}
      />

      <Banner tone="info" className="mb-6">
        Wskaźnik ryzyka to sygnał do twojej oceny, nie automatyczny werdykt. Zawsze możesz obejrzeć przebieg pisania.
      </Banner>

      <QueryView query={exams}>
        {(list) => {
          const graded = list.filter((e) => e.status === "review" || e.status === "finished");
          if (graded.length === 0) {
            return (
              <Card>
                <EmptyState title="Jeszcze nie ma wyników" description="Pojawią się tu po zakończeniu pierwszego testu." />
              </Card>
            );
          }
          return (
            <div className="grid gap-3 md:grid-cols-2">
              {graded.map((e) => (
                <Card key={e.id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{e.title}</p>
                      <p className="text-[13px] text-ink-2">
                        {groupLabel(e.group)} · {formatDay(e.startsAt)} · {e.participants.joined} prac
                      </p>
                    </div>
                    <ExamStatusTag status={e.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-2">
                    {e.average !== undefined && (
                      <span className="flex items-center gap-2">
                        Średnia <ScoreChip score={e.average} max={100} unit="%" />
                      </span>
                    )}
                    {!!e.toReview && <span className="text-warning-ink">{e.toReview} do sprawdzenia</span>}
                    {!!e.flagged && <span className="text-danger-ink">{e.flagged} z ryzykiem ≥ 60</span>}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Link href={`/panel/testy/${e.id}/wyniki`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                      Otwórz wyniki
                    </Link>
                    {e.status === "review" && (
                      <Button size="sm" onClick={() => setApproving(e)}>
                        Zatwierdź i pokaż uczniom
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          );
        }}
      </QueryView>

      <h2 className="mb-3 mt-10 font-display text-h3 text-ink">Prace do przejrzenia</h2>
      <QueryView query={dashboard}>
        {({ toReview }) =>
          toReview.length === 0 ? (
            <Card className="p-8 text-center text-body text-ink-2">Wszystkie prace są przejrzane.</Card>
          ) : (
            <Card className="overflow-hidden">
              <table className="w-full text-left text-body">
                <thead className="border-b border-line bg-subtle/60 text-xs text-ink-2 max-md:hidden">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Uczeń</th>
                    <th className="px-3 py-2.5 font-medium">Powód</th>
                    <th className="px-3 py-2.5 font-medium">Ryzyko</th>
                    <th className="px-3 py-2.5 font-medium">Wynik</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {toReview.map((r) => (
                    <tr key={r.sessionId} className="max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-1.5 max-md:px-4 max-md:py-3">
                      <td className="px-5 py-3 max-md:w-full max-md:p-0">
                        <p className="font-semibold text-ink">{r.student}</p>
                        <p className="text-[13px] text-ink-2">
                          {r.exam} · {groupLabel(r.group)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-ink-2 max-md:w-full max-md:p-0">{r.reason}</td>
                      <td className="px-3 py-3 max-md:p-0">
                        <RiskMeter score={r.risk} variant="compact" />
                      </td>
                      <td className="px-3 py-3 max-md:p-0">
                        <ScoreChip score={r.score} max={r.max} />
                      </td>
                      <td className="px-3 py-3 text-right max-md:ml-auto max-md:p-0">
                        <Link href={`/panel/testy/${r.examId}/wyniki/${r.sessionId}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                          Raport
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )
        }
      </QueryView>

      <Dialog
        open={approving !== null}
        onClose={() => setApproving(null)}
        title="Pokazać wyniki uczniom?"
        description={
          approving?.toReview
            ? `Prace, których nie przejrzano (${approving.toReview}), zostaną zatwierdzone z wynikiem automatycznym.`
            : "Uczniowie zobaczą punkty, oceny i uzasadnienia korekt."
        }
        iconTone={approving?.toReview ? "warning" : "info"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setApproving(null)}>
              Anuluj
            </Button>
            <Button onClick={() => approving && approve(approving)}>Zatwierdź i pokaż</Button>
          </>
        }
      />
      {toast}
    </>
  );
}
