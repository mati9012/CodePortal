"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { SelectionCard } from "@/components/ui/choice";
import { SelectField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { GRADES, problemById, totalPoints, type ResultsVisibility } from "./draft";
import { WizardSection } from "./section";
import type { StepProps } from "./wizard";

const VISIBILITY: { value: ResultsVisibility; title: string; description: string }[] = [
  { value: "immediate", title: "Od razu", description: "Uczeń widzi punkty zaraz po zgłoszeniu." },
  { value: "after_end", title: "Po zakończeniu", description: "Wszyscy widzą wyniki, gdy minie czas testu." },
  { value: "after_approval", title: "Po zatwierdzeniu", description: "Najpierw przejrzysz sygnały i ocenisz ręcznie." },
];

const GRADE_COLOR = ["bg-danger", "bg-orange", "bg-warning", "bg-success/70", "bg-success", "bg-accent"];

export function StepGrading({ draft, update, errors }: StepProps) {
  const max = totalPoints(draft.items);
  const t = draft.thresholds;
  const bounds = [0, ...t, 100];
  const needsManual = draft.items.some((i) =>
    (i.kind === "problem" ? [i.id] : i.ids).some((id) => {
      const p = problemById(id);
      return p.type === "web" && p.tests === 0;
    }),
  );

  const setThreshold = (i: number, v: number) => {
    const next = [...t] as typeof t;
    next[i] = Math.min(100, Math.max(1, v));
    update({ thresholds: next });
  };

  const checks = [
    { ok: true, text: `${draft.items.length} ${draft.items.length === 1 ? "zadanie" : "zadania"} · ${max} pkt` },
    { ok: !needsManual, text: needsManual ? "Zadanie WWW bez testów — ocenisz je ręcznie po teście" : "Wszystkie zadania oceniają się automatycznie" },
    { ok: draft.results !== "immediate" || !needsManual, text: draft.results === "immediate" && needsManual ? "Wynik „od razu” nie obejmie oceny ręcznej" : "Widoczność wyników pasuje do zadań" },
  ];

  return (
    <>
      <WizardSection title="Wyniki dla uczniów">
        <div className="grid gap-3 md:grid-cols-3">
          {VISIBILITY.map((v) => (
            <SelectionCard
              key={v.value}
              name="results"
              checked={draft.results === v.value}
              onChange={() => update({ results: v.value })}
              title={v.title}
              description={v.description}
            />
          ))}
        </div>
        <SelectField
          className="mt-4 max-w-sm"
          label="Gdy uczeń zgłosi zadanie kilka razy, liczy się"
          value={draft.scoring}
          onChange={(e) => update({ scoring: e.target.value as "best" | "last" })}
        >
          <option value="best">najlepsze zgłoszenie</option>
          <option value="last">ostatnie zgłoszenie</option>
        </SelectField>
      </WizardSection>

      {draft.mode === "test" && (
        <WizardSection title="Progi ocen" description={`Procent punktów potrzebny na ocenę. Przy ${max || "…"} pkt w teście.`}>
          <div className="flex h-8 overflow-hidden rounded-input" aria-hidden>
            {bounds.slice(0, -1).map((from, i) => {
              const width = Math.max(0, bounds[i + 1]! - from);
              return (
                <div key={i} className={cn("flex items-center justify-center text-xs font-bold text-white", GRADE_COLOR[i])} style={{ width: `${width}%` }}>
                  {width >= 6 && i + 1}
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-3">
            <span>0%</span>
            <span>100%</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {GRADES.map((g, i) => (
              <label key={g.grade} className="flex flex-col gap-1.5 rounded-input border border-line bg-surface p-3 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20">
                <span className="flex items-center gap-2">
                  <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-tag text-xs font-bold text-white", GRADE_COLOR[i + 1])}>
                    {g.grade}
                  </span>
                  <span className="text-xs text-ink-2">{g.name}</span>
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="text-xs text-ink-2">od</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={t[i]}
                    onChange={(e) => setThreshold(i, Number(e.target.value))}
                    aria-label={`Ocena ${g.grade} (${g.name}) od procent`}
                    className="w-10 bg-transparent font-mono text-h3 font-semibold text-ink outline-none"
                  />
                  <span className="text-[13px] text-ink-2">%</span>
                  {max > 0 && <span className="ml-auto font-mono text-[11px] text-ink-3">{Math.ceil((t[i]! / 100) * max)} pkt</span>}
                </span>
              </label>
            ))}
          </div>
          {errors.thresholds && <p className="mt-2 text-xs text-danger-ink">{errors.thresholds}</p>}
        </WizardSection>
      )}

      <WizardSection title="Gotowe do publikacji?">
        <ul className="flex flex-col gap-2">
          {checks.map((c) => (
            <li key={c.text} className="flex items-start gap-2 text-body text-ink">
              {c.ok ? (
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-success-ink" aria-hidden />
              ) : (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning-ink" aria-hidden />
              )}
              {c.text}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-ink-2">
          Po publikacji dostaniesz kod i link. Do czasu rozpoczęcia możesz jeszcze wszystko zmienić.
        </p>
      </WizardSection>
    </>
  );
}
