"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import type { EditorTabProps } from "./types";

export function TabVariants({ detail, update }: EditorTabProps) {
  const [name, setName] = useState("");
  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    update((d) => ({ variants: [...d.variants, { id: crypto.randomUUID(), name: trimmed, note: "nowy wariant, treść do uzupełnienia" }] }));
    setName("");
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="text-body text-ink-2">
        Warianty to wersje tego samego zadania z inną treścią lub danymi. W teście każdy uczeń dostaje losowy wariant, co utrudnia
        przepisywanie.
      </p>
      {detail.variants.length === 0 ? (
        <Card>
          <EmptyState title="Brak wariantów" description="Wszyscy uczniowie dostaną tę samą treść zadania." mascot={false} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {detail.variants.map((v) => (
              <li key={v.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{v.name}</p>
                  <p className="text-[13px] text-ink-2">{v.note}</p>
                </div>
                <IconButton
                  label={`Usuń: ${v.name}`}
                  onClick={() => update((d) => ({ variants: d.variants.filter((x) => x.id !== v.id) }))}
                >
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <TextField label="Nowy wariant" className="flex-1" placeholder="np. Wariant C – liczby ujemne" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="secondary" icon={<Plus />} disabled={!name.trim()}>
          Dodaj
        </Button>
      </form>
    </div>
  );
}
