"use client";

import {
  ArrowDown,
  ArrowUp,
  Dices,
  GripVertical,
  Plus,
  Search,
  Split,
  X,
} from "lucide-react";
import { useMemo, useState, type DragEvent } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { LANGUAGE_LABEL, PROBLEMS, type Problem } from "@/lib/mock/panel";
import { problemById, totalPoints, usedProblemIds, type Item } from "./draft";
import type { StepProps } from "./wizard";

const DT_PROBLEM = "application/x-cp-problem";
const DT_ITEM = "application/x-cp-item";

let seq = 0;
const newKey = () => `i${++seq}-${Math.random().toString(36).slice(2, 7)}`;

const langs = (p: Problem) => p.languages.map((v) => v.map((l) => LANGUAGE_LABEL[l]).join(" + ")).join(" · ");

export function StepProblems({ draft, update, errors }: StepProps) {
  const items = draft.items;
  const [selected, setSelected] = useState<string[]>([]);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const setItems = (fn: (cur: Item[]) => Item[]) => update((d) => ({ items: fn(d.items) }));

  const add = (id: string, at?: number) => {
    const item: Item = { key: newKey(), kind: "problem", id, points: problemById(id).points };
    setItems((cur) => {
      const i = at ?? cur.length;
      return [...cur.slice(0, i), item, ...cur.slice(i)];
    });
  };
  const remove = (key: string) => {
    setItems((cur) => cur.filter((i) => i.key !== key));
    setSelected((s) => s.filter((k) => k !== key));
  };
  const move = (from: number, to: number) =>
    setItems((cur) => {
      if (to < 0 || to > cur.length || to === from || to === from + 1) return cur;
      const next = [...cur];
      const [it] = next.splice(from, 1);
      next.splice(from < to ? to - 1 : to, 0, it!);
      return next;
    });
  const setPoints = (key: string, points: number) =>
    setItems((cur) => cur.map((i) => (i.key === key ? { ...i, points } : i)));

  const makePool = () => {
    const chosen = items.filter((i) => selected.includes(i.key) && i.kind === "problem");
    if (chosen.length < 2) return;
    const at = items.findIndex((i) => i.key === chosen[0]!.key);
    const pool: Item = {
      key: newKey(),
      kind: "pool",
      ids: chosen.map((c) => (c.kind === "problem" ? c.id : "")),
      points: Math.max(...chosen.map((c) => c.points)),
    };
    const rest = items.filter((i) => !selected.includes(i.key));
    rest.splice(Math.min(at, rest.length), 0, pool);
    setItems(() => rest);
    setSelected([]);
  };
  const splitPool = (key: string) => {
    const at = items.findIndex((i) => i.key === key);
    const pool = items[at];
    if (pool?.kind !== "pool") return;
    const singles: Item[] = pool.ids.map((id) => ({ key: newKey(), kind: "problem", id, points: problemById(id).points }));
    setItems((cur) => [...cur.slice(0, at), ...singles, ...cur.slice(at + 1)]);
  };
  const removeFromPool = (key: string, id: string) => {
    const pool = items.find((i) => i.key === key);
    if (pool?.kind !== "pool") return;
    const ids = pool.ids.filter((x) => x !== id);
    if (ids.length === 1) {
      setItems((cur) => cur.map((i) => (i.key === key ? { key, kind: "problem", id: ids[0]!, points: i.points } : i)));
    } else {
      setItems((cur) => cur.map((i) => (i.key === key ? { ...pool, ids } : i)));
    }
  };

  const onDragOverList = (e: DragEvent, index: number) => {
    if (!e.dataTransfer.types.includes(DT_PROBLEM) && !e.dataTransfer.types.includes(DT_ITEM)) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropAt(e.clientY > rect.top + rect.height / 2 ? index + 1 : index);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const at = dropAt ?? items.length;
    setDropAt(null);
    const pid = e.dataTransfer.getData(DT_PROBLEM);
    if (pid) return add(pid, at);
    const key = e.dataTransfer.getData(DT_ITEM);
    const from = items.findIndex((i) => i.key === key);
    if (from >= 0) move(from, at);
  };

  const selectable = selected.filter((k) => items.find((i) => i.key === k)?.kind === "problem").length;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <Card className="flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-h3 text-ink">Zadania w teście</h2>
          <span className="font-mono text-[13px] tabular-nums text-ink-2">
            {items.length} · <b className="text-ink">{totalPoints(items)} pkt</b>
          </span>
        </div>
        <p className="mt-1 text-[13px] text-ink-2">
          Przeciągnij, żeby zmienić kolejność. Zaznacz kilka zadań i połącz je w pulę — każdy uczeń wylosuje jedno.
        </p>

        {selectable >= 2 && (
          <div className="mt-4 flex items-center gap-3 rounded-input border border-mint-500/30 bg-mint-50 px-3 py-2 text-[13px] text-ink dark:bg-mint-500/10">
            <Dices className="size-4 text-mint-700 dark:text-mint-300" aria-hidden />
            Zaznaczono {selectable}
            <Button size="sm" className="ml-auto" onClick={makePool}>
              Połącz w pulę
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>
              Anuluj
            </Button>
          </div>
        )}

        <ol
          className={cn(
            "mt-4 flex min-h-40 flex-1 flex-col gap-2 rounded-card",
            items.length === 0 && "items-center justify-center border-2 border-dashed p-6 text-center",
            items.length === 0 && (dropAt !== null ? "border-accent bg-accent-soft/50" : errors.items ? "border-danger/50" : "border-line"),
          )}
          onDragOver={(e) => items.length === 0 && onDragOverList(e, 0)}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropAt(null);
          }}
          onDrop={onDrop}
          aria-label="Zadania w teście"
        >
          {items.length === 0 && (
            <li className="list-none text-[13px] text-ink-2">
              <Plus className="mx-auto mb-2 size-5 text-ink-3" aria-hidden />
              Przeciągnij tu zadania z banku
              <br />
              albo kliknij <b className="text-ink">Dodaj</b> obok zadania.
            </li>
          )}
          {items.map((it, index) => (
            <li
              key={it.key}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(DT_ITEM, it.key);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDropAt(null)}
              onDragOver={(e) => onDragOverList(e, index)}
              className={cn(
                "relative list-none",
                dropAt === index && "before:absolute before:-top-1.5 before:inset-x-0 before:h-0.5 before:rounded-full before:bg-accent",
                dropAt === index + 1 && index === items.length - 1 && "after:absolute after:-bottom-1.5 after:inset-x-0 after:h-0.5 after:rounded-full after:bg-accent",
              )}
            >
              <ItemRow
                item={it}
                index={index}
                count={items.length}
                checked={selected.includes(it.key)}
                onCheck={(on) => setSelected((s) => (on ? [...s, it.key] : s.filter((k) => k !== it.key)))}
                onPoints={(p) => setPoints(it.key, p)}
                onMove={(dir) => move(index, dir < 0 ? index - 1 : index + 2)}
                onRemove={() => remove(it.key)}
                onSplit={() => splitPool(it.key)}
                onRemoveFromPool={(id) => removeFromPool(it.key, id)}
              />
            </li>
          ))}
        </ol>
      </Card>

      <Bank used={usedProblemIds(items)} onAdd={(id) => add(id)} />
    </div>
  );
}

function ItemRow({
  item,
  index,
  count,
  checked,
  onCheck,
  onPoints,
  onMove,
  onRemove,
  onSplit,
  onRemoveFromPool,
}: {
  item: Item;
  index: number;
  count: number;
  checked: boolean;
  onCheck: (on: boolean) => void;
  onPoints: (p: number) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onSplit: () => void;
  onRemoveFromPool: (id: string) => void;
}) {
  const pool = item.kind === "pool";
  const title = pool ? `Pula · losuj 1 z ${item.ids.length}` : problemById(item.id).title;
  return (
    <div
      className={cn(
        "group flex items-start gap-2 rounded-input border bg-surface p-2.5 shadow-sm transition-colors sm:gap-3",
        pool ? "border-mint-500/40 bg-mint-50/60 dark:bg-mint-500/5" : checked ? "border-accent" : "border-line",
      )}
    >
      <span className="mt-1.5 cursor-grab text-ink-3 active:cursor-grabbing max-sm:hidden" aria-hidden>
        <GripVertical className="size-4" />
      </span>
      {!pool ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          aria-label={`Zaznacz do puli: ${title}`}
          className="mt-2 size-4 shrink-0 accent-[var(--cp-accent)]"
        />
      ) : (
        <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-tag bg-mint-100 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300" aria-hidden>
          <Dices className="size-3.5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2 text-body font-semibold text-ink">
          <span className="font-mono text-xs text-ink-3">{index + 1}.</span>
          <span className="line-clamp-2 sm:truncate">{title}</span>
        </p>
        {pool ? (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {item.ids.map((id) => (
              <li key={id} className="inline-flex h-6 items-center gap-1 rounded-tag border border-line bg-surface pl-2 pr-1 text-xs text-ink">
                {problemById(id).title}
                <button type="button" onClick={() => onRemoveFromPool(id)} aria-label={`Usuń z puli: ${problemById(id).title}`} className="rounded-sm p-0.5 text-ink-3 hover:text-danger-ink">
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="truncate text-xs text-ink-2">{langs(problemById(item.id))}</p>
        )}
      </div>
      <div className="w-24 shrink-0">
        <Input
          type="number"
          min={0}
          max={1000}
          suffix="pkt"
          aria-label={`Punkty: ${title}`}
          value={item.points}
          onChange={(e) => onPoints(Math.max(0, Number(e.target.value)))}
          className="h-8 px-2 text-right font-mono text-[13px]"
        />
      </div>
      <div className="flex shrink-0 items-center">
        <IconButton label="Wyżej" size="sm" disabled={index === 0} onClick={() => onMove(-1)} className="max-sm:hidden">
          <ArrowUp />
        </IconButton>
        <IconButton label="Niżej" size="sm" disabled={index === count - 1} onClick={() => onMove(1)} className="max-sm:hidden">
          <ArrowDown />
        </IconButton>
        {pool && (
          <IconButton label="Rozdziel pulę" size="sm" onClick={onSplit}>
            <Split />
          </IconButton>
        )}
        <IconButton label={`Usuń: ${title}`} size="sm" onClick={onRemove} className="hover:text-danger-ink">
          <X />
        </IconButton>
      </div>
    </div>
  );
}

function Bank({ used, onAdd }: { used: Set<string>; onAdd: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => PROBLEMS.filter((p) => `${p.title} ${p.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );
  return (
    <Card className="flex min-w-0 flex-col p-5 sm:p-6 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-8rem)] xl:self-start">
      <h2 className="font-display text-h3 text-ink">Bank zadań</h2>
      <label className="relative mt-3">
        <span className="sr-only">Szukaj w banku</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj po nazwie lub tagu…" className="pl-9" />
      </label>
      <ul className="-mx-2 mt-3 flex flex-col overflow-y-auto">
        {rows.map((p) => {
          const isUsed = used.has(p.id);
          return (
            <li
              key={p.id}
              draggable={!isUsed}
              onDragStart={(e) => {
                e.dataTransfer.setData(DT_PROBLEM, p.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className={cn(
                "flex items-center gap-2 rounded-input px-2 py-2",
                isUsed ? "opacity-60" : "cursor-grab hover:bg-subtle active:cursor-grabbing",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{p.title}</p>
                <p className="truncate text-xs text-ink-2">
                  {langs(p)} · {p.points} pkt
                </p>
              </div>
              {isUsed ? (
                <span className="shrink-0 text-xs text-ink-3">w teście</span>
              ) : (
                <Button size="sm" variant="secondary" icon={<Plus />} onClick={() => onAdd(p.id)} aria-label={`Dodaj: ${p.title}`}>
                  Dodaj
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
