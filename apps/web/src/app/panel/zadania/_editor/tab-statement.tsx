"use client";

import { TextField, TextareaField } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import { SegmentedControl } from "@/components/ui/tabs";
import type { Problem } from "@/lib/mock/panel";
import type { EditorTabProps } from "./types";

const DIFFICULTY_OPTIONS = [
  { value: "1", label: "Łatwe" },
  { value: "2", label: "Średnie" },
  { value: "3", label: "Trudne" },
];

export function TabStatement({ detail, update, errors }: EditorTabProps) {
  const setProblem = (change: Partial<Problem>) => update((d) => ({ problem: { ...d.problem, ...change } }));
  const examples = detail.tests.filter((t) => t.visible);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="flex flex-col gap-5 p-5">
        <TextField
          label="Tytuł"
          value={detail.problem.title}
          onChange={(e) => setProblem({ title: e.target.value })}
          error={errors.title}
          maxLength={120}
          placeholder="np. Najdłuższy rosnący fragment"
        />
        <TextareaField
          label="Treść"
          value={detail.statement}
          onChange={(e) => update(() => ({ statement: e.target.value }))}
          error={errors.statement}
          maxLength={4000}
          rows={6}
          placeholder="Opisz problem tak, jak zobaczy go uczeń."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <TextareaField
            label="Wejście"
            value={detail.inputSpec}
            onChange={(e) => update(() => ({ inputSpec: e.target.value }))}
            maxLength={1000}
            rows={4}
          />
          <TextareaField
            label="Wyjście"
            value={detail.outputSpec}
            onChange={(e) => update(() => ({ outputSpec: e.target.value }))}
            maxLength={1000}
            rows={4}
          />
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-ink">Poziom</span>
            <SegmentedControl
              aria-label="Poziom trudności"
              value={String(detail.problem.difficulty)}
              onChange={(v) => setProblem({ difficulty: Number(v) as Problem["difficulty"] })}
              options={DIFFICULTY_OPTIONS}
            />
          </div>
          <TextField
            label="Tagi"
            hint="Oddziel przecinkami."
            value={detail.problem.tags.join(", ")}
            onChange={(e) => setProblem({ tags: e.target.value.split(",").map((t) => t.trimStart()) })}
            onBlur={() => setProblem({ tags: detail.problem.tags.map((t) => t.trim()).filter(Boolean) })}
          />
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <span className="text-[13px] font-semibold text-ink">Przykłady w treści</span>
          {examples.length === 0 ? (
            <p className="text-[13px] text-ink-2">Oznacz test jako jawny, a pojawi się tu jako przykład.</p>
          ) : (
            examples.map((t) => (
              <div key={t.id} className="grid grid-cols-2 gap-2">
                <pre className="truncate rounded-input bg-subtle px-2.5 py-2 font-mono text-xs text-ink">{t.input}</pre>
                <pre className="truncate rounded-input bg-subtle px-2.5 py-2 font-mono text-xs text-ink">{t.output}</pre>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
