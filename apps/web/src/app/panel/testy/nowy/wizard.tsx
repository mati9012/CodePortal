"use client";

import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AutosaveStatus } from "@/components/exam/timer";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/surface";
import { Stepper, type StepState } from "@/components/ui/stepper";
import { cn } from "@/lib/cn";
import { GROUPS } from "@/lib/mock/panel";
import {
  ACCESS_LABEL,
  INITIAL_DRAFT,
  PROTECTION_LABEL,
  totalPoints,
  type Draft,
} from "./draft";
import { Published } from "./published";
import { StepAccess } from "./step-access";
import { StepBasics } from "./step-basics";
import { StepGrading } from "./step-grading";
import { StepProblems } from "./step-problems";

const STEPS = ["Podstawy", "Zadania", "Dostęp i ochrona", "Ocenianie i publikacja"];

export type StepProps = {
  draft: Draft;
  /** Obiekt albo funkcja od aktualnego szkicu (przy kilku zmianach pod rząd, np. szybkie „Dodaj”). */
  update: (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void;
  errors: Partial<Record<keyof Draft, string>>;
};

/** Błędy blokujące przejście dalej z danego kroku. */
function validate(step: number, d: Draft): StepProps["errors"] {
  const e: StepProps["errors"] = {};
  if (step === 0) {
    if (!d.title.trim()) e.title = "Nadaj testowi nazwę — zobaczą ją uczniowie.";
    if (!d.duration || d.duration < 5) e.duration = "Minimum 5 minut.";
  }
  if (step === 1 && d.items.length === 0) e.items = "Dodaj przynajmniej jedno zadanie.";
  if (step === 2 && d.access === "password" && d.password.trim().length < 4)
    e.password = "Hasło musi mieć co najmniej 4 znaki.";
  if (step === 3 && d.thresholds.some((t, i) => i > 0 && t <= d.thresholds[i - 1]!))
    e.thresholds = "Progi muszą rosnąć od oceny 2 do 6.";
  return e;
}

export function TestWizard() {
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<StepProps["errors"]>({});
  const [published, setPublished] = useState<string | null>(null);
  const [save, setSave] = useState<{ saving: boolean; at: number | null }>({ saving: false, at: null });
  // Ustawiane przy zapisie i co 5 s — nie w renderze (prerender nie może czytać zegara).
  const [now, setNow] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const top = useRef<HTMLDivElement>(null);

  // Odświeżanie „Zapisano X s temu”.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  // Autozapis szkicu (na razie udawany — TODO: PATCH /exams/:id).
  function update(patch: Parameters<StepProps["update"]>[0]) {
    setDraft((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
    setErrors((e) => {
      if (typeof patch === "function") return {};
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof Draft];
      return next;
    });
    setSave((s) => ({ ...s, saving: true }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const at = Date.now();
      setNow(at);
      setSave({ saving: false, at });
    }, 700);
  }

  function go(to: number) {
    if (to > step) {
      const e = validate(step, draft);
      if (Object.keys(e).length) {
        setErrors(e);
        return;
      }
    }
    setErrors({});
    setStep(to);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function publish() {
    const e = validate(3, draft);
    if (Object.keys(e).length) return setErrors(e);
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)];
    setPublished(`${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}`);
  }

  if (published) {
    return (
      <Published
        draft={draft}
        code={published}
        onReset={() => {
          setDraft(INITIAL_DRAFT);
          setStep(0);
          setPublished(null);
          setSave({ saving: false, at: null });
        }}
      />
    );
  }

  const states: StepState[] = STEPS.map((_, i) => (i < step ? "done" : i === step ? "current" : "upcoming"));
  const Step = [StepBasics, StepProblems, StepAccess, StepGrading][step]!;

  return (
    <div ref={top} className="scroll-mt-24">
      <PageHeader
        title={draft.title.trim() || "Nowy test"}
        crumbs={[
          { href: "/panel", label: "Pulpit" },
          { href: "/panel/testy", label: "Testy i konkursy" },
        ]}
        actions={
          save.saving || save.at ? (
            <AutosaveStatus
              state={
                save.saving
                  ? { kind: "saving" }
                  : { kind: "saved", secondsAgo: Math.max(0, Math.round((now - save.at!) / 1000)) }
              }
            />
          ) : (
            <span className="text-xs text-ink-3">Szkic zapisuje się automatycznie</span>
          )
        }
      />

      <Stepper steps={STEPS.map((label, i) => ({ label, state: states[i]! }))} className="mb-6 max-sm:[&_li>span:last-child]:hidden" />

      {/* Na kroku „Zadania” lista i bank potrzebują całej szerokości — podsumowanie znika. */}
      <div className={cn("grid gap-6", step !== 1 && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
        <div className="flex min-w-0 flex-col gap-4">
          {Object.keys(errors).length > 0 && (
            <Banner tone="danger" title="Popraw zaznaczone pola.">
              {Object.values(errors)[0]}
            </Banner>
          )}
          <Step draft={draft} update={update} errors={errors} />

          <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-2 border-t border-line bg-canvas/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-card sm:border sm:bg-surface/90 sm:px-4">
            {step > 0 && (
              <Button variant="ghost" icon={<ArrowLeft />} onClick={() => go(step - 1)}>
                Wstecz
              </Button>
            )}
            <span className="ml-auto text-xs text-ink-2 max-sm:hidden">
              Krok {step + 1} z {STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <Button iconRight={<ArrowRight />} onClick={() => go(step + 1)} className="max-sm:ml-auto">
                Dalej: {STEPS[step + 1]}
              </Button>
            ) : (
              <Button icon={<Rocket />} onClick={publish} className="max-sm:ml-auto">
                Opublikuj test
              </Button>
            )}
          </div>
        </div>

        {step !== 1 && <Summary draft={draft} step={step} onJump={go} />}
      </div>
    </div>
  );
}

function Summary({ draft, step, onJump }: { draft: Draft; step: number; onJump: (s: number) => void }) {
  const group = GROUPS.find((g) => g.id === draft.groupId);
  const rows: { label: string; value: string; step: number }[] = [
    { label: "Rodzaj", value: draft.mode === "test" ? "Sprawdzian" : "Konkurs", step: 0 },
    { label: "Dla", value: group ? `${group.name} · ${group.students} uczniów` : "Każdy z kodem", step: 0 },
    { label: "Termin", value: `${draft.date.split("-").reverse().join(".")} · ${draft.time}`, step: 0 },
    { label: "Czas", value: `${draft.duration} min`, step: 0 },
    {
      label: "Zadania",
      value: draft.items.length ? `${draft.items.length} · ${totalPoints(draft.items)} pkt` : "brak",
      step: 1,
    },
    { label: "Dostęp", value: ACCESS_LABEL[draft.access], step: 2 },
    { label: "Ochrona", value: PROTECTION_LABEL[draft.protection], step: 2 },
  ];
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <p className="text-label uppercase text-ink-2">Podsumowanie</p>
          <p className="mt-1 truncate font-display text-h3 text-ink">{draft.title.trim() || "Bez nazwy"}</p>
        </div>
        <dl className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
              <dt className="w-16 shrink-0 text-ink-2">{r.label}</dt>
              <dd className="min-w-0 flex-1 truncate font-medium text-ink">{r.value}</dd>
              {r.step < step && (
                <button type="button" onClick={() => onJump(r.step)} className="text-xs text-accent-ink hover:underline">
                  Zmień
                </button>
              )}
            </div>
          ))}
        </dl>
      </Card>
    </aside>
  );
}
