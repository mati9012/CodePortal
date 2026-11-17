"use client";

import { CircleCheck, Eye, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/components/panel/dialog";
import { formatTime } from "@/components/panel/format";
import { Breadcrumbs } from "@/components/panel/page-header";
import { useToast } from "@/components/panel/use-toast";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Tag } from "@/components/ui/surface";
import { Tabs } from "@/components/ui/tabs";
import type { ProblemDetail } from "@/lib/mock/problem-detail";
import { TabReference } from "./tab-reference";
import { TabSettings } from "./tab-settings";
import { TabStatement } from "./tab-statement";
import { FULL_WEIGHT, TabTests, totalWeight } from "./tab-tests";
import { TabVariants } from "./tab-variants";
import type { EditorTabProps } from "./types";

type Tab = "statement" | "tests" | "settings" | "reference" | "variants";

function validate(d: ProblemDetail): EditorTabProps["errors"] {
  const errors: EditorTabProps["errors"] = {};
  if (!d.problem.title.trim()) errors.title = "Nadaj zadaniu tytuł.";
  if (!d.statement.trim()) errors.statement = "Opisz, co uczeń ma zrobić.";
  if (d.tests.length > 0 && totalWeight(d.tests) !== FULL_WEIGHT) errors.weights = `Wagi testów muszą sumować się do ${FULL_WEIGHT}%.`;
  return errors;
}

const ERROR_TAB: Record<keyof EditorTabProps["errors"], Tab> = { title: "statement", statement: "statement", weights: "tests" };

export function ProblemEditor({ initial, isNew = false }: { initial: ProblemDetail; isNew?: boolean }) {
  const [detail, setDetail] = useState(initial);
  const [tab, setTab] = useState<Tab>("statement");
  const [errors, setErrors] = useState<EditorTabProps["errors"]>({});
  const [savedAt, setSavedAt] = useState<string | null>(isNew ? null : "14:02");
  const [dirty, setDirty] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { show, toast } = useToast();

  const update: EditorTabProps["update"] = (change) => {
    setDetail((d) => ({ ...d, ...change(d) }));
    setDirty(true);
    setErrors({});
  };

  const save = () => {
    const found = validate(detail);
    setErrors(found);
    const first = Object.keys(found)[0] as keyof typeof found | undefined;
    if (first) {
      setTab(ERROR_TAB[first]);
      return;
    }
    setSavedAt(formatTime(new Date()));
    setDirty(false);
    show(isNew ? "Dodano zadanie do banku" : "Zapisano zmiany", detail.problem.title);
  };

  const checked = detail.tests.filter((t) => t.referenceMs !== undefined).length;
  const title = detail.problem.title.trim() || (isNew ? "Nowe zadanie" : "Bez tytułu");
  const firstError = Object.values(errors)[0];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Breadcrumbs crumbs={[{ href: "/panel/zadania", label: "Bank zadań" }]} className="mb-2" />
          <h1 className="truncate font-display text-h2 text-ink sm:text-h1">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {detail.tests.length > 0 && detail.referenceSolution && (
            <Tag tone={checked === detail.tests.length ? "success" : "warning"} pill>
              <CircleCheck className="size-3.5" aria-hidden />
              {checked}/{detail.tests.length} testów zgodnych ze wzorcowym
            </Tag>
          )}
          <span className="text-xs text-ink-2">
            {dirty ? "Niezapisane zmiany" : savedAt ? `Zapisano ${savedAt}` : "Jeszcze nie zapisano"}
          </span>
          <Button variant="secondary" icon={<Eye />} onClick={() => setPreviewOpen(true)}>
            Podgląd jako uczeń
          </Button>
          <Button onClick={save}>Zapisz</Button>
        </div>
      </div>

      <Tabs
        aria-label="Sekcje zadania"
        className="mb-6"
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: "statement", label: "Treść" },
          { value: "tests", label: "Testy", count: detail.tests.length },
          { value: "settings", label: "Ustawienia" },
          { value: "reference", label: "Rozwiązanie wzorcowe" },
          { value: "variants", label: "Warianty", count: detail.variants.length || undefined },
        ]}
      />

      {firstError && (
        <Banner tone="danger" icon={<TriangleAlert />} className="mb-4" title="Nie zapisano.">
          {firstError}
        </Banner>
      )}

      {tab === "statement" && <TabStatement detail={detail} update={update} errors={errors} />}
      {tab === "tests" && <TabTests detail={detail} update={update} errors={errors} />}
      {tab === "settings" && <TabSettings detail={detail} update={update} errors={errors} />}
      {tab === "reference" && <TabReference detail={detail} update={update} errors={errors} />}
      {tab === "variants" && <TabVariants detail={detail} update={update} errors={errors} />}

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        className="max-w-2xl"
        title={title}
        description="Tak uczeń zobaczy treść zadania w teście."
        footer={<Button onClick={() => setPreviewOpen(false)}>Zamknij</Button>}
      >
        <StudentPreview detail={detail} />
      </Dialog>
      {toast}
    </>
  );
}

function StudentPreview({ detail }: { detail: ProblemDetail }) {
  const examples = detail.tests.filter((t) => t.visible);
  return (
    <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto text-body text-ink">
      <p className="whitespace-pre-line">{detail.statement || "Brak treści."}</p>
      <section>
        <h3 className="mb-1 text-label uppercase text-ink-2">Wejście</h3>
        <p className="whitespace-pre-line">{detail.inputSpec || "—"}</p>
      </section>
      <section>
        <h3 className="mb-1 text-label uppercase text-ink-2">Wyjście</h3>
        <p className="whitespace-pre-line">{detail.outputSpec || "—"}</p>
      </section>
      {examples.map((t, i) => (
        <section key={t.id} className="grid gap-2 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 text-label uppercase text-ink-2">Przykład {i + 1} · wejście</h3>
            <pre className="rounded-input bg-subtle p-3 font-mono text-code">{t.input}</pre>
          </div>
          <div>
            <h3 className="mb-1 text-label uppercase text-ink-2">Wyjście</h3>
            <pre className="rounded-input bg-subtle p-3 font-mono text-code">{t.output}</pre>
          </div>
        </section>
      ))}
      <p className="text-xs text-ink-2">
        Limity: {detail.timeLimitMs} ms · {detail.memoryLimitMb} MB · {detail.problem.points} pkt
      </p>
    </div>
  );
}
