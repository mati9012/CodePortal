"use client";

import type { Created, GroupSummary, Published as PublishedCode } from "@codeportal/contracts";
import { ArrowLeft, ArrowRight, Rocket } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AutosaveStatus } from "@/components/exam/timer";
import { PageHeader } from "@/components/panel/page-header";
import { QueryView } from "@/components/panel/query-view";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Card } from "@/components/ui/surface";
import { Stepper, type StepState } from "@/components/ui/stepper";
import { api, errorMessage, useApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { ACCESS_LABEL, PROTECTION_LABEL } from "@/lib/panel-labels";
import { useNow } from "@/lib/use-now";
import { initialDraft, totalPoints, type Draft } from "./draft";
import { Published } from "./published";
import { StepAccess } from "./step-access";
import { StepBasics } from "./step-basics";
import { StepGrading } from "./step-grading";
import { StepProblems } from "./step-problems";

const SAVE_DELAY_MS = 700;
const SAVED_LABEL_REFRESH_MS = 5000;
const MIN_DURATION_MIN = 5;
const MIN_PASSWORD_LENGTH = 4;
const SECOND_MS = 1000;

const STEPS = ["Podstawy", "Zadania", "Dostęp i ochrona", "Ocenianie i publikacja"];

export type StepProps = {
  draft: Draft;
  update: (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void;
  errors: Partial<Record<keyof Draft, string>>;
};

type SaveState = { saving: boolean; at: number | null; error: string | null };

function validate(step: number, d: Draft): StepProps["errors"] {
  const e: StepProps["errors"] = {};
  if (step === 0) {
    if (!d.title.trim()) e.title = "Nadaj testowi nazwę — zobaczą ją uczniowie.";
    if (!d.duration || d.duration < MIN_DURATION_MIN) e.duration = `Minimum ${MIN_DURATION_MIN} minut.`;
  }
  if (step === 1 && d.items.length === 0) e.items = "Dodaj przynajmniej jedno zadanie.";
  const password = d.password.trim();
  if (step === 2 && d.access === "password" && password && password.length < MIN_PASSWORD_LENGTH)
    e.password = `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaki.`;
  if (step === 3 && d.thresholds.some((t, i) => i > 0 && t <= d.thresholds[i - 1]!))
    e.thresholds = "Progi muszą rosnąć od oceny 2 do 6.";
  return e;
}

export function TestWizardEntry() {
  const params = useSearchParams();
  const [{ examId, groupId }] = useState(() => ({ examId: params.get("id"), groupId: params.get("group") ?? "" }));
  const now = useNow(SAVED_LABEL_REFRESH_MS);
  const existing = useApi<Draft>(examId ? `/panel/exams/${examId}/draft` : null, { revalidateOnFocus: false });
  if (!examId) return now ? <TestWizard key="new" initial={{ ...initialDraft(now), groupId }} initialId={null} /> : null;
  return <QueryView query={existing}>{(draft) => <TestWizard key={examId} initial={draft} initialId={examId} />}</QueryView>;
}

function TestWizard({ initial, initialId }: { initial: Draft; initialId: string | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<StepProps["errors"]>({});
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState<{ id: string; code: string } | null>(null);
  const [save, setSave] = useState<SaveState>({ saving: false, at: null, error: null });
  const now = useNow(SAVED_LABEL_REFRESH_MS);
  const examId = useRef<string | null>(initialId);
  const latest = useRef(draft);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<Promise<void>>(Promise.resolve());
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  function persist() {
    const body = latest.current;
    pending.current = pending.current.then(async () => {
      try {
        if (examId.current) {
          await api(`/panel/exams/${examId.current}/draft`, { method: "PUT", body });
        } else {
          const { id } = await api<Created>("/panel/exams", { body });
          examId.current = id;
          router.replace(`/panel/testy/nowy?id=${id}`, { scroll: false });
        }
        setSave({ saving: false, at: Date.now(), error: null });
      } catch (err) {
        setSave({ saving: false, at: null, error: errorMessage(err) });
      }
    });
    return pending.current;
  }

  function update(patch: Parameters<StepProps["update"]>[0]) {
    setDraft((d) => {
      const next = { ...d, ...(typeof patch === "function" ? patch(d) : patch) };
      latest.current = next;
      return next;
    });
    setErrors((e) => {
      if (typeof patch === "function") return {};
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof Draft];
      return next;
    });
    setSave((s) => ({ ...s, saving: true }));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persist, SAVE_DELAY_MS);
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

  async function publish() {
    const e = validate(3, draft);
    if (Object.keys(e).length) return setErrors(e);
    clearTimeout(saveTimer.current);
    await persist();
    if (!examId.current) return;
    try {
      const { code } = await api<PublishedCode>(`/panel/exams/${examId.current}/publish`, { method: "POST" });
      setPublishError(null);
      setPublished({ id: examId.current, code });
    } catch (err) {
      setPublishError(errorMessage(err));
    }
  }

  if (published) {
    return (
      <Published
        draft={draft}
        examId={published.id}
        code={published.code}
        onReset={() => {
          examId.current = null;
          router.push("/panel/testy/nowy");
          setDraft(initialDraft(Date.now()));
          setStep(0);
          setPublished(null);
          setSave({ saving: false, at: null, error: null });
        }}
      />
    );
  }

  const states: StepState[] = STEPS.map((_, i) => (i < step ? "done" : i === step ? "current" : "upcoming"));
  const Step = [StepBasics, StepProblems, StepAccess, StepGrading][step]!;
  const shownError = publishError ?? save.error;

  return (
    <div ref={top} className="scroll-mt-24">
      <PageHeader
        title={draft.title.trim() || (initialId ? "Szkic testu" : "Nowy test")}
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
                  : { kind: "saved", secondsAgo: Math.max(0, Math.round((now - save.at!) / SECOND_MS)) }
              }
            />
          ) : save.error ? (
            <AutosaveStatus state={{ kind: "offline" }} />
          ) : (
            <span className="text-xs text-ink-3">Szkic zapisuje się automatycznie</span>
          )
        }
      />

      <Stepper steps={STEPS.map((label, i) => ({ label, state: states[i]! }))} className="mb-6 max-sm:[&_li>span:last-child]:hidden" />

      <div className={cn("grid gap-6", step !== 1 && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
        <div className="flex min-w-0 flex-col gap-4">
          {Object.keys(errors).length > 0 && (
            <Banner tone="danger" title="Popraw zaznaczone pola.">
              {Object.values(errors)[0]}
            </Banner>
          )}
          {shownError && (
            <Banner tone="danger" title={publishError ? "Nie opublikowano." : "Nie zapisano szkicu."}>
              {shownError}
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
  const { data: groups = [] } = useApi<GroupSummary[]>("/panel/groups");
  const group = groups.find((g) => g.id === draft.groupId);
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
