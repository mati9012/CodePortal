"use client";

import { ClipboardCheck, Trophy } from "lucide-react";
import { SelectionCard } from "@/components/ui/choice";
import { Field, Input, SelectField, TextareaField, TextField } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { GroupSummary } from "@codeportal/contracts";
import { useApi } from "@/lib/api";
import { WizardSection } from "./section";
import type { StepProps } from "./wizard";

const DURATIONS = [
  { min: 20, label: "Kartkówka" },
  { min: 45, label: "Lekcja" },
  { min: 90, label: "Dwie lekcje" },
];

export function StepBasics({ draft, update, errors }: StepProps) {
  const { data: groups = [] } = useApi<GroupSummary[]>("/panel/groups");
  return (
    <>
      <WizardSection title="Podstawy" description="Nazwę i instrukcję uczniowie zobaczą przed rozpoczęciem testu.">
        <div className="flex flex-col gap-5">
          <TextField
            label="Nazwa testu"
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="np. Sprawdzian – pętle i tablice"
            maxLength={120}
            error={errors.title}
            autoFocus
          />
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold text-ink">Rodzaj</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectionCard
                name="mode"
                checked={draft.mode === "test"}
                onChange={() => update({ mode: "test" })}
                title={
                  <>
                    <ClipboardCheck className="size-4 text-accent-ink" aria-hidden /> Sprawdzian
                  </>
                }
                description="Ocena na koniec, wyniki po twoim zatwierdzeniu."
              />
              <SelectionCard
                name="mode"
                checked={draft.mode === "contest"}
                onChange={() => update({ mode: "contest", results: "immediate" })}
                title={
                  <>
                    <Trophy className="size-4 text-mint-700 dark:text-mint-300" aria-hidden /> Konkurs
                  </>
                }
                description="Ranking na żywo, punkty za każde zgłoszenie."
              />
            </div>
          </fieldset>
          <TextareaField
            label="Instrukcja dla uczniów"
            hint="Opcjonalnie. Np. dozwolone materiały albo kolejność zadań."
            maxLength={280}
            defaultValue={draft.instructions}
            onChange={(e) => update({ instructions: e.target.value })}
            placeholder="Powodzenia! Możesz korzystać z dokumentacji języka."
          />
        </div>
      </WizardSection>

      <WizardSection title="Kto i kiedy" description="Uczniowie z wybranej klasy zobaczą test na swojej liście — bez wpisywania kodu.">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Klasa lub grupa" value={draft.groupId} onChange={(e) => update({ groupId: e.target.value })} className="sm:col-span-2">
            <option value="">Bez klasy — wejście tylko kodem</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.students} uczniów
              </option>
            ))}
          </SelectField>
          <Field id="exam-date" label="Data">
            <Input id="exam-date" type="date" value={draft.date} onChange={(e) => update({ date: e.target.value })} />
          </Field>
          <Field id="exam-time" label="Godzina rozpoczęcia">
            <Input id="exam-time" type="time" value={draft.time} onChange={(e) => update({ time: e.target.value })} />
          </Field>
          <Field id="exam-duration" label="Czas trwania" error={errors.duration} className="sm:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-32">
                <Input
                  id="exam-duration"
                  type="number"
                  min={5}
                  max={300}
                  suffix="min"
                  value={draft.duration || ""}
                  invalid={!!errors.duration}
                  onChange={(e) => update({ duration: Number(e.target.value) })}
                />
              </div>
              {DURATIONS.map((d) => (
                <button
                  key={d.min}
                  type="button"
                  aria-pressed={draft.duration === d.min}
                  onClick={() => update({ duration: d.min })}
                  className={cn(
                    "h-9 rounded-input border px-3 text-[13px] transition-colors",
                    draft.duration === d.min
                      ? "border-accent bg-accent-soft font-semibold text-accent-ink"
                      : "border-line bg-surface text-ink-2 hover:text-ink",
                  )}
                >
                  {d.label} · {d.min} min
                </button>
              ))}
            </div>
          </Field>
        </div>
      </WizardSection>
    </>
  );
}
