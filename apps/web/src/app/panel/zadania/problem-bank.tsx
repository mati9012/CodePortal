"use client";

import { Code2, FlaskConical, Globe, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDay } from "@/components/panel/format";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";
import { Card, Tag } from "@/components/ui/surface";
import { SegmentedControl } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import {
  LANGUAGE_LABEL,
  PROBLEM_TYPE_LABEL,
  PROBLEMS,
  type Language,
  type Problem,
} from "@/lib/mock/panel";

const LANGS = Object.keys(LANGUAGE_LABEL) as Language[];
const TYPE_ICON = { io: Code2, unit: FlaskConical, web: Globe } as const;

export function ProblemBank() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [langs, setLangs] = useState<Language[]>([]);

  const rows = useMemo(
    () =>
      PROBLEMS.filter(
        (p) =>
          (type === "all" || p.type === type) &&
          (langs.length === 0 || p.languages.some((v) => langs.some((l) => v.includes(l)))) &&
          `${p.title} ${p.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query, type, langs],
  );

  const toggle = (l: Language) =>
    setLangs((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1 lg:max-w-xs">
          <span className="sr-only">Szukaj zadania</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj po nazwie lub tagu…" className="pl-9" />
        </label>
        <SegmentedControl
          aria-label="Typ zadania"
          size="sm"
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "Wszystkie" },
            { value: "io", label: "We/wy" },
            { value: "unit", label: "Jednostkowe" },
            { value: "web", label: "WWW" },
          ]}
        />
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Języki">
        {LANGS.map((l) => {
          const on = langs.includes(l);
          return (
            <button
              key={l}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(l)}
              className={cn(
                "h-7 rounded-full border px-3 text-[13px] font-medium transition-colors",
                on ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-ink-2 hover:border-ink-3/60 hover:text-ink",
              )}
            >
              {LANGUAGE_LABEL[l]}
            </button>
          );
        })}
        {langs.length > 0 && (
          <button type="button" onClick={() => setLangs([])} className="h-7 px-2 text-[13px] text-ink-2 underline underline-offset-4 hover:text-ink">
            Wyczyść
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="Nic nie pasuje do filtrów"
            description="Zmień filtry albo dodaj nowe zadanie — wystarczy treść i kilka testów."
            action={
              <Link href="/panel/zadania/nowe" className={buttonClasses()}>
                Nowe zadanie
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <ProblemCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProblemCard({ p }: { p: Problem }) {
  const Icon = TYPE_ICON[p.type];
  return (
    <Link href={`/panel/zadania/${p.id}`} className="group block rounded-card focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/25">
      <Card className="flex h-full flex-col gap-3 p-4 transition-[border-color,box-shadow] group-hover:border-ink-3/50 group-hover:shadow-md">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-input [&_svg]:size-[18px]",
              { io: "bg-accent-soft text-accent-ink", unit: "bg-violet-soft text-violet-ink", web: "bg-mint-100 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300" }[p.type],
            )}
            aria-hidden
          >
            <Icon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-ink group-hover:text-accent-ink">{p.title}</p>
            <p className="mt-0.5 text-xs text-ink-2">{PROBLEM_TYPE_LABEL[p.type]}</p>
          </div>
          <Difficulty level={p.difficulty} />
        </div>
        <div className="flex flex-wrap gap-1">
          {p.languages.map((v) => (
            <span key={v.join("+")} className="inline-flex h-6 items-center rounded-tag border border-line px-2 font-mono text-[11px] text-ink">
              {v.map((l) => LANGUAGE_LABEL[l]).join(" + ")}
            </span>
          ))}
          {p.tags.map((t) => (
            <Tag key={t} className="h-6">
              {t}
            </Tag>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-3 border-t border-line pt-3 text-xs text-ink-2">
          <span className="font-mono tabular-nums">{p.points} pkt</span>
          <span>·</span>
          <span>{p.type === "web" && p.tests === 0 ? "ocena ręczna" : `${p.tests} testów`}</span>
          <span className="ml-auto">{p.usedIn ? `w ${p.usedIn} testach` : "nieużyte"} · {formatDay(p.updatedAt)}</span>
        </div>
      </Card>
    </Link>
  );
}

function Difficulty({ level }: { level: 1 | 2 | 3 }) {
  const label = ["łatwe", "średnie", "trudne"][level - 1];
  return (
    <span className="flex shrink-0 items-center gap-0.5 pt-1" title={`Trudność: ${label}`} aria-label={`Trudność: ${label}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("h-3 w-1 rounded-full", i <= level ? ["bg-success", "bg-warning", "bg-danger"][level - 1] : "bg-line")} />
      ))}
    </span>
  );
}
