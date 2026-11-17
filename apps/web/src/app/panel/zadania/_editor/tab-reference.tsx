"use client";

import { Select } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import type { Language } from "@codeportal/contracts";
import { LANGUAGE_LABEL } from "@/lib/panel-labels";
import type { EditorTabProps } from "./types";

export function TabReference({ detail, update }: EditorTabProps) {
  const languages = [...new Set(detail.problem.languages.flat())];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            aria-label="Język rozwiązania"
            value={detail.referenceLanguage}
            onChange={(e) => update(() => ({ referenceLanguage: e.target.value as Language }))}
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABEL[l]}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-[13px] text-ink-2">Uczniowie nigdy go nie widzą. Na nim sprawdzasz, czy testy mają poprawne wyniki.</p>
      </div>
      <Card data-theme="dark" className="overflow-hidden bg-canvas">
        <textarea
          aria-label="Rozwiązanie wzorcowe"
          spellCheck={false}
          value={detail.referenceSolution}
          onChange={(e) => update(() => ({ referenceSolution: e.target.value }))}
          placeholder="Wklej albo napisz rozwiązanie wzorcowe…"
          className="block min-h-[420px] w-full resize-y bg-transparent p-4 font-mono text-code text-ink outline-none placeholder:text-ink-3"
        />
      </Card>
    </div>
  );
}
