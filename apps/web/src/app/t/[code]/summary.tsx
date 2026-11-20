"use client";

import type { StudentResult } from "@codeportal/contracts";
import { Info, LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { Bit } from "@/components/brand/bit";
import { formatClock } from "@/components/exam/format";
import { scoreTone } from "@/components/exam/score";
import { formatTime } from "@/components/panel/format";
import { Banner } from "@/components/ui/feedback";
import { Card, Eyebrow } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import type { LiveSession } from "@/lib/exam-session";
import { GRADE_NAME } from "@/lib/panel-labels";
import { pluralPl } from "@/lib/plural";
import { leaveFullscreen } from "./fullscreen";
import { StudentShell } from "./student-shell";

const BAR_TONE = { success: "bg-success", warning: "bg-orange", danger: "bg-danger", neutral: "bg-line" } as const;

export function Summary({ session }: { session: LiveSession }) {
  useEffect(leaveFullscreen, []);
  const { result } = session;
  return (
    <StudentShell title={session.exam.title} subtitle={session.name}>
      {result?.visible ? (
        <ScoreCard session={session} result={result} />
      ) : (
        <PendingCard result={result} />
      )}
    </StudentShell>
  );
}

function ScoreCard({ session, result }: { session: LiveSession; result: Extract<StudentResult, { visible: true }> }) {
  return (
    <Card className="w-full max-w-xl p-6 sm:p-8">
      <Eyebrow>
        {session.exam.title}
        {session.finishedAt && ` · ukończono ${formatTime(session.finishedAt)}`}
      </Eyebrow>
      <h1 className="mt-1 font-display text-h2 text-ink">Test zakończony</h1>
      <dl className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-input border border-line bg-line">
        <div className="bg-surface p-3.5">
          <dt className="text-[13px] text-ink-2">Punkty</dt>
          <dd className="font-display text-h1 text-ink">
            {result.points} <span className="text-body font-normal text-ink-2">/ {result.max}</span>
          </dd>
        </div>
        <div className="bg-surface p-3.5">
          <dt className="text-[13px] text-ink-2">Wynik</dt>
          <dd className="font-display text-h1 text-ink">{result.percent}%</dd>
        </div>
        <div className="bg-surface p-3.5">
          <dt className="text-[13px] text-ink-2">Ocena</dt>
          <dd className="font-display text-h1 text-ink">
            {result.grading > 0 ? (
              "—"
            ) : (
              <>
                {result.grade} <span className="text-body font-normal text-ink-2">{GRADE_NAME[result.grade]}</span>
              </>
            )}
          </dd>
        </div>
      </dl>
      <h2 className="mt-6 text-body font-semibold text-ink">Rozbicie na zadania</h2>
      <ul className="mt-2 divide-y divide-line">
        {result.breakdown.map((p) => (
          <li key={p.number} className="flex items-center gap-4 py-2.5">
            <span className="min-w-0 flex-1 truncate text-ink">
              {p.number} · {p.title}
            </span>
            <span className="h-1.5 w-28 overflow-hidden rounded-full bg-line sm:w-40" aria-hidden>
              <span
                className={cn("block h-full rounded-full", BAR_TONE[scoreTone(p.points, p.max)])}
                style={{ width: `${p.max ? (p.points / p.max) * 100 : 0}%` }}
              />
            </span>
            <span className="w-16 text-right font-mono text-[13px] font-semibold tabular-nums text-ink">
              {p.points} / {p.max}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-col gap-3">
        {result.grading > 0 && (
          <Banner tone="info" icon={<LoaderCircle className="animate-spin" />}>
            Ocenianie {result.grading} {pluralPl(result.grading, "zgłoszenia", "zgłoszeń", "zgłoszeń")}… Wynik
            zaktualizuje się sam.
          </Banner>
        )}
        {!result.approved && (
          <Banner tone="info" icon={<Info />}>
            Nauczyciel może jeszcze skorygować punkty po przejrzeniu rozwiązań.
          </Banner>
        )}
      </div>
    </Card>
  );
}

function PendingCard({ result }: { result: StudentResult | null }) {
  return (
    <Card className="flex w-full max-w-xl flex-col items-center p-6 text-center sm:p-8">
      <Bit size="l" preload />
      <h1 className="mt-4 font-display text-h2 text-ink">Test zakończony. Dobra robota!</h1>
      <p className="mt-2 max-w-md text-body text-ink-2">
        Wyniki pojawią się po zatwierdzeniu przez nauczyciela. Dostaniesz je na lekcji.
      </p>
      {result && (
        <dl className="mt-6 w-full max-w-sm divide-y divide-line rounded-input border border-line text-left">
          <SummaryRow label="Zgłoszone zadania" value={`${result.submitted} z ${result.problems}`} />
          <SummaryRow label="Czas pracy" value={formatClock(result.workSec)} />
          <SummaryRow label="Identyfikator oddania" value={result.receipt} />
        </dl>
      )}
      <p className="mt-5 text-[13px] text-ink-2">Możesz zamknąć tę kartę.</p>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-body text-ink-2">{label}</dt>
      <dd className="font-mono text-[13px] font-semibold text-ink">{value}</dd>
    </div>
  );
}
