"use client";

import { FileArchive, GripVertical, Play, Plus, Trash2 } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { VerdictPill } from "@/components/exam/verdict";
import { Dialog } from "@/components/panel/dialog";
import { useToast } from "@/components/panel/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/choice";
import { Banner } from "@/components/ui/feedback";
import { Input, Select, TextField, TextareaField } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import type { TestCase } from "@/lib/mock/problem-detail";
import type { EditorTabProps } from "./types";

const DT_TEST = "application/x-cp-test";
const MOCK_RUN_MS = 1200;
const MOCK_REFERENCE_MS = 3;
const IMPORTED_TEST_COUNT = 4;
export const FULL_WEIGHT = 100;

export const totalWeight = (tests: TestCase[]) => tests.reduce((n, t) => n + t.weight, 0);

type EditingTest = { test: TestCase; isNew: boolean } | null;

export function TabTests({ detail, update, errors }: EditorTabProps) {
  const [editing, setEditing] = useState<EditingTest>(null);
  const [groupDialog, setGroupDialog] = useState(false);
  const [extraGroups, setExtraGroups] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [dragged, setDragged] = useState<string | null>(null);
  const zipInput = useRef<HTMLInputElement>(null);
  const { show, toast } = useToast();

  const { tests } = detail;
  const groups = [...new Set([...tests.map((t) => t.group), ...extraGroups])];
  const weight = totalWeight(tests);
  const setTests = (change: (list: TestCase[]) => TestCase[]) => update((d) => ({ tests: change(d.tests) }));

  const nextTest = (): TestCase => ({
    id: crypto.randomUUID(),
    name: `Test ${tests.length + 1}`,
    group: groups.at(-1) ?? "podstawowe",
    visible: false,
    input: "",
    output: "",
    weight: 0,
  });

  const runReference = () => {
    if (!detail.referenceSolution.trim()) {
      show("Brak rozwiązania wzorcowego", "Dodaj je w zakładce „Rozwiązanie wzorcowe”.", "warning");
      return;
    }
    setRunning(true);
    setTimeout(() => {
      setTests((list) => list.map((t, i) => ({ ...t, referenceMs: t.referenceMs ?? MOCK_REFERENCE_MS + i })));
      setRunning(false);
      show("Rozwiązanie wzorcowe przechodzi wszystkie testy", `${tests.length}/${tests.length} OK`);
    }, MOCK_RUN_MS);
  };

  const importZip = (file: File) => {
    const imported = Array.from({ length: IMPORTED_TEST_COUNT }, (_, i) => ({
      ...nextTest(),
      id: crypto.randomUUID(),
      name: `Test ${tests.length + i + 1}`,
      group: "z archiwum",
      input: `${file.name.replace(/\.zip$/, "")}/${i + 1}.in`,
      output: `${i + 1}.out`,
    }));
    setTests((list) => [...list, ...imported]);
    show(`Zaimportowano ${IMPORTED_TEST_COUNT} testy`, file.name);
  };

  const drop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData(DT_TEST);
    setDragged(null);
    if (!sourceId || sourceId === targetId) return;
    setTests((list) => {
      const from = list.findIndex((t) => t.id === sourceId);
      const to = list.findIndex((t) => t.id === targetId);
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" icon={<Plus />} onClick={() => setEditing({ test: nextTest(), isNew: true })}>
          Dodaj test
        </Button>
        <Button variant="secondary" icon={<FileArchive />} onClick={() => zipInput.current?.click()}>
          Importuj ZIP
        </Button>
        <input
          ref={zipInput}
          type="file"
          accept=".zip"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importZip(file);
            e.target.value = "";
          }}
        />
        <Button variant="secondary" icon={<Plus />} onClick={() => setGroupDialog(true)}>
          Grupa
        </Button>
        <span className={cn("ml-auto text-[13px]", weight === FULL_WEIGHT ? "text-ink-2" : "font-semibold text-danger-ink")}>
          Suma wag: {weight}%
        </span>
        <Button icon={<Play />} loading={running} loadingText="Sprawdzanie…" disabled={tests.length === 0} onClick={runReference}>
          Sprawdź na rozwiązaniu wzorcowym
        </Button>
      </div>

      {errors.weights && <Banner tone="danger">{errors.weights}</Banner>}

      <Card className="overflow-x-auto">
        {tests.length === 0 ? (
          <p className="px-4 py-12 text-center text-body text-ink-2">
            Brak testów. Dodaj pierwszy albo zaimportuj archiwum ZIP z plikami .in i .out.
          </p>
        ) : (
          <table className="w-full min-w-[820px] text-left text-body">
            <thead className="border-b border-line bg-subtle/60 text-xs text-ink-2">
              <tr>
                <th className="w-8 py-2.5" />
                <th className="px-3 py-2.5 font-medium">Test</th>
                <th className="px-3 py-2.5 font-medium">Grupa</th>
                <th className="px-3 py-2.5 font-medium">Widoczność</th>
                <th className="px-3 py-2.5 font-medium">Wejście</th>
                <th className="px-3 py-2.5 font-medium">Wyjście</th>
                <th className="px-3 py-2.5 text-right font-medium">Waga</th>
                <th className="px-3 py-2.5 font-medium">Wzorcowe</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tests.map((t) => (
                <tr
                  key={t.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DT_TEST, t.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragged(t.id);
                  }}
                  onDragEnd={() => setDragged(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => drop(e, t.id)}
                  className={cn("hover:bg-subtle/50", dragged === t.id && "opacity-40")}
                >
                  <td className="cursor-grab pl-3 text-ink-3" aria-hidden>
                    <GripVertical className="size-4" />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-ink">{t.name}</td>
                  <td className="px-3 py-2.5 text-ink-2">{t.group}</td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setTests((list) => list.map((x) => (x.id === t.id ? { ...x, visible: !x.visible } : x)))}
                      className={cn(
                        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium transition-colors",
                        t.visible ? "bg-accent-soft text-accent-ink" : "bg-subtle text-ink-2 hover:text-ink",
                      )}
                      title="Kliknij, aby zmienić"
                    >
                      {t.visible ? "jawny" : "ukryty"}
                    </button>
                  </td>
                  <td className="max-w-40 truncate px-3 py-2.5 font-mono text-xs text-ink">{t.input.replace(/\n/g, " / ") || "—"}</td>
                  <td className="max-w-28 truncate px-3 py-2.5 font-mono text-xs text-ink">{t.output || "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink">{t.weight}%</td>
                  <td className="px-3 py-2.5">
                    {running ? (
                      <VerdictPill verdict="PENDING" />
                    ) : t.referenceMs === undefined ? (
                      <span className="text-xs text-ink-3">nie sprawdzono</span>
                    ) : (
                      <span className="inline-flex h-6 items-center rounded-tag bg-success-soft px-2 font-mono text-xs font-medium text-success-ink">
                        OK · {t.referenceMs} ms
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ test: t, isNew: false })}>
                      Edytuj
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Banner tone="info">Uczeń widzi diff tylko dla testów jawnych. Ukryte pokazują wyłącznie werdykt, czas i pamięć.</Banner>

      {editing && (
        <TestDialog
          key={editing.test.id}
          initial={editing.test}
          isNew={editing.isNew}
          groups={groups}
          onClose={() => setEditing(null)}
          onSave={(saved) => {
            setTests((list) =>
              editing.isNew ? [...list, saved] : list.map((x) => (x.id === saved.id ? { ...saved, referenceMs: undefined } : x)),
            );
            setEditing(null);
          }}
          onDelete={() => {
            setTests((list) => list.filter((x) => x.id !== editing.test.id));
            setEditing(null);
          }}
        />
      )}
      {groupDialog && (
        <GroupDialog
          existing={groups}
          onClose={() => setGroupDialog(false)}
          onAdd={(name) => {
            setExtraGroups((g) => [...g, name]);
            setGroupDialog(false);
            show(`Dodano grupę „${name}”`, "Przypisz do niej testy w edycji testu.");
          }}
        />
      )}
      {toast}
    </div>
  );
}

function TestDialog({
  initial,
  isNew,
  groups,
  onClose,
  onSave,
  onDelete,
}: {
  initial: TestCase;
  isNew: boolean;
  groups: string[];
  onClose: () => void;
  onSave: (test: TestCase) => void;
  onDelete: () => void;
}) {
  const [test, setTest] = useState(initial);
  const set = (change: Partial<TestCase>) => setTest((t) => ({ ...t, ...change }));
  const valid = test.name.trim() && test.output.trim() && test.weight >= 0 && test.weight <= FULL_WEIGHT;

  return (
    <Dialog
      open
      onClose={onClose}
      className="max-w-2xl"
      title={isNew ? "Nowy test" : `Edycja: ${initial.name}`}
      footer={
        <>
          {!isNew && (
            <Button variant="ghost" className="mr-auto text-danger-ink" icon={<Trash2 />} onClick={onDelete}>
              Usuń
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button disabled={!valid} onClick={() => onSave({ ...test, name: test.name.trim() })}>
            {isNew ? "Dodaj test" : "Zapisz"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Nazwa" value={test.name} onChange={(e) => set({ name: e.target.value })} />
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Grupa
          <Select value={test.group} onChange={(e) => set({ group: e.target.value })}>
            {[...new Set([...groups, test.group])].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
          Waga
          <Input type="number" min={0} max={FULL_WEIGHT} value={test.weight} onChange={(e) => set({ weight: Number(e.target.value) })} suffix="%" />
        </label>
        <TextareaField
          label="Wejście"
          className="sm:col-span-3 [&_textarea]:font-mono"
          rows={4}
          maxLength={10000}
          value={test.input}
          onChange={(e) => set({ input: e.target.value })}
        />
        <TextareaField
          label="Oczekiwane wyjście"
          className="sm:col-span-3 [&_textarea]:font-mono"
          rows={3}
          maxLength={10000}
          value={test.output}
          onChange={(e) => set({ output: e.target.value })}
        />
        <Switch
          className="sm:col-span-3"
          label="Test jawny"
          description="Uczeń zobaczy wejście i porównanie wyników."
          checked={test.visible}
          onChange={(e) => set({ visible: e.target.checked })}
        />
      </div>
    </Dialog>
  );
}

function GroupDialog({ existing, onClose, onAdd }: { existing: string[]; onClose: () => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const duplicate = existing.includes(trimmed);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Nowa grupa testów"
      description="Grupy porządkują testy, np. małe, średnie i duże dane."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button disabled={!trimmed || duplicate} onClick={() => onAdd(trimmed)}>
            Dodaj grupę
          </Button>
        </>
      }
    >
      <TextField
        label="Nazwa"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={duplicate ? "Taka grupa już istnieje." : undefined}
        autoFocus
      />
    </Dialog>
  );
}
