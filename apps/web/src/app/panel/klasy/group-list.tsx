"use client";

import type { GroupInput, GroupSummary } from "@codeportal/contracts";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ScoreChip } from "@/components/exam/score";
import { Dialog } from "@/components/panel/dialog";
import { PageHeader } from "@/components/panel/page-header";
import { QueryView } from "@/components/panel/query-view";
import { useToast } from "@/components/panel/use-toast";
import { Button } from "@/components/ui/button";
import { SelectionCard } from "@/components/ui/choice";
import { Select, TextField } from "@/components/ui/field";
import { Card, Tag } from "@/components/ui/surface";
import { api, errorMessage, useApi } from "@/lib/api";
import { pluralPl } from "@/lib/plural";

const SCHOOL_YEARS = ["2026/27", "2025/26"];

export function GroupList() {
  const query = useApi<GroupSummary[]>("/panel/groups");
  const [year, setYear] = useState(SCHOOL_YEARS[0]!);
  const [creating, setCreating] = useState(false);
  const { show, toast } = useToast();

  const create = async (input: GroupInput) => {
    try {
      const group = await api<GroupSummary>("/panel/groups", { body: input });
      await query.mutate();
      setCreating(false);
      show(`Utworzono: ${group.name}`, "Dodaj uczniów ręcznie albo zaimportuj plik CSV.");
    } catch (err) {
      show("Nie utworzono klasy", errorMessage(err), "warning");
    }
  };

  return (
    <>
      <PageHeader
        title="Klasy i grupy"
        description="Uczniowie z klas dostają test od razu, bez wpisywania kodu."
        crumbs={[{ href: "/panel", label: "Pulpit" }]}
        actions={
          <>
            <div className="w-44">
              <Select aria-label="Rok szkolny" value={year} onChange={(e) => setYear(e.target.value)}>
                {SCHOOL_YEARS.map((y) => (
                  <option key={y} value={y}>
                    Rok szkolny {y}
                  </option>
                ))}
              </Select>
            </div>
            <Button icon={<Plus />} onClick={() => setCreating(true)}>
              Nowa klasa
            </Button>
          </>
        }
      />

      <QueryView query={query}>
        {(groups) => {
          const visible = groups.filter((g) => g.year === year);
          return visible.length === 0 ? (
            <Card className="p-10 text-center text-body text-ink-2">W roku szkolnym {year} nie masz jeszcze klas.</Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((g) => (
                <GroupCard key={g.id} group={g} />
              ))}
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line text-body font-medium text-ink-2 transition-colors hover:border-accent hover:bg-accent-soft/40 hover:text-accent-ink"
              >
                <Plus className="size-5" aria-hidden />
                Dodaj klasę lub grupę
              </button>
            </div>
          );
        }}
      </QueryView>

      {creating && (
        <NewGroupDialog
          year={year}
          taken={(query.data ?? []).filter((g) => g.year === year).map((g) => g.name.toLowerCase())}
          onClose={() => setCreating(false)}
          onCreate={create}
        />
      )}
      {toast}
    </>
  );
}

function GroupCard({ group: g }: { group: GroupSummary }) {
  return (
    <Link href={`/panel/klasy/${g.id}`} className="group block rounded-card">
      <Card className="flex h-full flex-col gap-4 p-5 transition-[border-color,box-shadow] group-hover:border-ink-3/50 group-hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-h3 text-ink group-hover:text-accent-ink">{g.name}</p>
            <p className="text-[13px] text-ink-2">Rok szkolny {g.year}</p>
          </div>
          <Tag tone={g.kind === "class" ? "accent" : "mint"}>{g.kind === "class" ? "Klasa" : "Grupa"}</Tag>
        </div>
        <div className="flex items-center gap-2 text-body text-ink">
          <Users className="size-4 text-ink-2" aria-hidden />
          <b className="tabular-nums">{g.students}</b> {pluralPl(g.students, "uczeń", "uczniów", "uczniów")}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-[13px]">
          <span className="min-w-0 truncate text-ink-2">{g.lastExam ? `Ostatnio: ${g.lastExam}` : "Jeszcze bez testów"}</span>
          {g.average !== undefined && <ScoreChip score={g.average} max={100} unit="%" />}
        </div>
      </Card>
    </Link>
  );
}

function NewGroupDialog({
  year,
  taken,
  onClose,
  onCreate,
}: {
  year: string;
  taken: string[];
  onClose: () => void;
  onCreate: (input: GroupInput) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GroupInput["kind"]>("class");
  const [saving, setSaving] = useState(false);
  const trimmed = name.trim();
  const duplicate = taken.includes(trimmed.toLowerCase());
  return (
    <Dialog
      open
      onClose={onClose}
      title="Nowa klasa lub grupa"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            disabled={!trimmed || duplicate || saving}
            onClick={async () => {
              setSaving(true);
              await onCreate({ name: trimmed, kind, year });
              setSaving(false);
            }}
          >
            Utwórz
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Nazwa"
          placeholder={kind === "class" ? "np. 3TI" : "np. Koło informatyczne"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={duplicate ? "Masz już klasę o tej nazwie." : undefined}
          autoFocus
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectionCard name="group-kind" checked={kind === "class"} onChange={() => setKind("class")} title="Klasa" description="Cała klasa z dziennika." />
          <SelectionCard name="group-kind" checked={kind === "group"} onChange={() => setKind("group")} title="Grupa" description="Koło, grupa maturalna, zajęcia dodatkowe." />
        </div>
        <p className="text-[13px] text-ink-2">Rok szkolny {year}</p>
      </div>
    </Dialog>
  );
}
