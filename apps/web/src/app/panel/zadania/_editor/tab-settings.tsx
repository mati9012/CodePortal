"use client";

import { Checkbox, SelectionCard } from "@/components/ui/choice";
import { Input, SelectField } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import { LANGUAGE_LABEL, PROBLEM_TYPE_LABEL, type Language, type Problem } from "@/lib/mock/panel";
import { CHECKER_LABEL, type Checker } from "@/lib/mock/problem-detail";
import type { EditorTabProps } from "./types";

const TYPE_DESCRIPTION: Record<Problem["type"], string> = {
  io: "Program czyta dane i wypisuje wynik, porównywany z oczekiwanym.",
  unit: "Uczeń pisze klasę lub funkcję, sprawdzają ją testy jednostkowe.",
  web: "Strona HTML/CSS/JS/PHP oceniana testami w przeglądarce albo ręcznie.",
};

const LANGUAGES = Object.keys(LANGUAGE_LABEL) as Language[];

export function TabSettings({ detail, update }: EditorTabProps) {
  const { problem } = detail;
  const setProblem = (change: Partial<Problem>) => update((d) => ({ problem: { ...d.problem, ...change } }));
  const enabled = new Set(problem.languages.flat());

  const toggleLanguage = (lang: Language, on: boolean) => {
    if (problem.type === "web") {
      const next = on ? [...enabled, lang] : [...enabled].filter((l) => l !== lang);
      setProblem({ languages: next.length ? [next] : [] });
      return;
    }
    setProblem({ languages: on ? [...problem.languages, [lang]] : problem.languages.filter((v) => v[0] !== lang) });
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Card className="flex flex-col gap-3 p-5">
        <span className="text-[13px] font-semibold text-ink">Rodzaj zadania</span>
        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(PROBLEM_TYPE_LABEL) as Problem["type"][]).map((type) => (
            <SelectionCard
              key={type}
              name="problem-type"
              checked={problem.type === type}
              onChange={() => setProblem({ type })}
              title={PROBLEM_TYPE_LABEL[type]}
              description={TYPE_DESCRIPTION[type]}
            />
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <span className="text-[13px] font-semibold text-ink">
          {problem.type === "web" ? "Języki w jednym projekcie" : "Języki do wyboru przez ucznia"}
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LANGUAGES.map((lang) => (
            <Checkbox
              key={lang}
              label={LANGUAGE_LABEL[lang]}
              checked={enabled.has(lang)}
              onChange={(e) => toggleLanguage(lang, e.target.checked)}
            />
          ))}
        </div>
      </Card>

      <Card className="grid gap-5 p-5 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Limit czasu
          <Input
            type="number"
            min={100}
            step={100}
            value={detail.timeLimitMs}
            onChange={(e) => update(() => ({ timeLimitMs: Number(e.target.value) }))}
            suffix="ms"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Limit pamięci
          <Input
            type="number"
            min={16}
            step={16}
            value={detail.memoryLimitMb}
            onChange={(e) => update(() => ({ memoryLimitMb: Number(e.target.value) }))}
            suffix="MB"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Punkty domyślnie
          <Input
            type="number"
            min={1}
            value={problem.points}
            onChange={(e) => setProblem({ points: Number(e.target.value) })}
            suffix="pkt"
          />
        </label>
        <SelectField
          label="Porównanie wyniku"
          className="sm:col-span-3"
          value={detail.checker}
          onChange={(e) => update(() => ({ checker: e.target.value as Checker }))}
        >
          {(Object.keys(CHECKER_LABEL) as Checker[]).map((c) => (
            <option key={c} value={c}>
              {CHECKER_LABEL[c]}
            </option>
          ))}
        </SelectField>
      </Card>
    </div>
  );
}
