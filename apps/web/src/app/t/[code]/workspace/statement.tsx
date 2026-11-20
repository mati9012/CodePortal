import type { StudentProblem } from "@codeportal/contracts";
import type { ReactNode } from "react";
import { formatMs } from "@/components/exam/format";
import { Eyebrow, Tag } from "@/components/ui/surface";
import { pluralPl } from "@/lib/plural";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="font-display text-h3 text-ink">{title}</h2>
      <p className="whitespace-pre-wrap text-ink-2">{children}</p>
    </section>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-surface p-3">
      <span className="text-xs text-ink-2">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export function Statement({ problem, total }: { problem: StudentProblem; total: number }) {
  return (
    <article className="flex flex-col gap-5 p-5 sm:p-6">
      <header className="flex flex-col gap-2">
        <Eyebrow>
          Zadanie {problem.number} z {total} · {problem.max} pkt
        </Eyebrow>
        <h1 className="font-display text-h2 text-ink">{problem.title}</h1>
        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {problem.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        )}
      </header>
      <p className="whitespace-pre-wrap text-[15px] leading-6 text-ink">{problem.statement}</p>
      {problem.inputSpec && <Section title="Wejście">{problem.inputSpec}</Section>}
      {problem.outputSpec && <Section title="Wyjście">{problem.outputSpec}</Section>}
      {problem.examples.map((example, i) => (
        <section key={i} className="overflow-hidden rounded-card border border-line">
          <h2 className="border-b border-line bg-subtle px-4 py-2.5 text-body font-semibold text-ink">
            Przykład {i + 1}
          </h2>
          <div className="grid grid-cols-2 divide-x divide-line">
            <div className="p-4">
              <Eyebrow>Wejście</Eyebrow>
              <pre className="mt-1.5 overflow-x-auto font-mono text-code text-ink">{example.input}</pre>
            </div>
            <div className="p-4">
              <Eyebrow>Oczekiwane wyjście</Eyebrow>
              <pre className="mt-1.5 overflow-x-auto font-mono text-code text-ink">{example.output}</pre>
            </div>
          </div>
        </section>
      ))}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-card border border-line bg-line">
        <Limit label="Limit czasu" value={formatMs(problem.timeLimitMs)} />
        <Limit label="Pamięć" value={`${problem.memoryLimitMb} MB`} />
        <Limit label="Testy" value={`${problem.tests} ${pluralPl(problem.tests, "test", "testy", "testów")}`} />
      </div>
    </article>
  );
}
