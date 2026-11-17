import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RiskMeter, ScoreChip } from "@/components/exam/score";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { formatDay } from "@/components/panel/format";
import { PageHeader } from "@/components/panel/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/surface";
import { EXAMS, TO_REVIEW } from "@/lib/mock/panel";

export const metadata: Metadata = { title: "Wyniki · CodePortal" };

const graded = EXAMS.filter((e) => e.status === "review" || e.status === "finished");

export default function ResultsPage() {
  return (
    <>
      <PageHeader
        title="Wyniki"
        description="Sprawdź oznaczone prace i zatwierdź wyniki — dopiero wtedy zobaczą je uczniowie."
        crumbs={[{ href: "/panel", label: "Pulpit" }]}
        actions={
          <button type="button" className={buttonClasses({ variant: "secondary" })}>
            <Download className="size-4" aria-hidden /> Eksport do dziennika
          </button>
        }
      />

      <Banner tone="info" className="mb-6">
        Wskaźnik ryzyka to sygnał do twojej oceny, nie automatyczny werdykt. Zawsze możesz obejrzeć przebieg pisania.
      </Banner>

      <div className="grid gap-3 md:grid-cols-2">
        {graded.map((e) => (
          <Card key={e.id} className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{e.title}</p>
                <p className="text-[13px] text-ink-2">
                  {e.group} · {formatDay(e.startsAt)} · {e.participants.joined} prac
                </p>
              </div>
              <ExamStatusTag status={e.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-2">
              <span className="flex items-center gap-2">
                Średnia <ScoreChip score={e.average ?? 0} max={100} unit="%" />
              </span>
              {!!e.toReview && <span className="text-warning-ink">{e.toReview} do sprawdzenia</span>}
              {!!e.flagged && <span className="text-danger-ink">{e.flagged} z ryzykiem ≥ 60</span>}
            </div>
            <div className="mt-auto flex gap-2">
              <Link href={`/panel/testy/${e.id}/wyniki`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                Otwórz wyniki
              </Link>
              {e.status === "review" && (
                <button type="button" className={buttonClasses({ size: "sm" })}>
                  Zatwierdź i pokaż uczniom
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-10 font-display text-h3 text-ink">Prace do przejrzenia</h2>
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
            {TO_REVIEW.map((r) => (
              <tr key={r.student} className="max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-1.5 max-md:px-4 max-md:py-3">
                <td className="px-5 py-3 max-md:w-full max-md:p-0">
                  <p className="font-semibold text-ink">{r.student}</p>
                  <p className="text-[13px] text-ink-2">
                    {r.exam} · {r.group}
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
                  <Link href={`/panel/testy/${r.examId}/wyniki/${r.studentId}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    Raport
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
