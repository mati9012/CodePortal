"use client";

import { KeyRound, Link2, Lock, School } from "lucide-react";
import { Tag } from "@/components/ui/surface";
import { SelectionCard, Switch } from "@/components/ui/choice";
import { Field, Input, TextField } from "@/components/ui/field";
import type { Access, GroupSummary, Protection } from "@codeportal/contracts";
import { useApi } from "@/lib/api";
import { PROTECTION_PRESET } from "./draft";
import { WizardSection } from "./section";
import type { StepProps } from "./wizard";

const ACCESS: { value: Access; title: string; description: string; icon: typeof Link2; soon?: boolean }[] = [
  { value: "code", title: "Kod lub link", description: "Każdy, kto zna 6-znakowy kod, wpisuje imię i wchodzi.", icon: Link2 },
  { value: "list", title: "Tylko uczniowie klasy", description: "Uczeń wybiera się z listy klasy — obcy nie wejdą.", icon: KeyRound },
  { value: "password", title: "Link + hasło", description: "Dodatkowe hasło podajesz na lekcji, np. na tablicy.", icon: Lock },
  { value: "sso", title: "Konto szkolne", description: "Logowanie Google / Microsoft szkoły.", icon: School, soon: true },
];

const PROTECTION: { value: Protection; title: string; description: string; features: string[] }[] = [
  { value: "loose", title: "Luźny", description: "Ćwiczenia w klasie", features: ["Log zdarzeń dla ciebie"] },
  { value: "standard", title: "Standard", description: "Kartkówki i sprawdziany", features: ["Blokada wklejania", "Pełny ekran"] },
  { value: "exam", title: "Egzamin", description: "Ważne sprawdziany", features: ["Wszystko ze Standardu", "Limit wyjść z pełnego ekranu"] },
];

export function StepAccess({ draft, update, errors }: StepProps) {
  const { data: groups = [] } = useApi<GroupSummary[]>("/panel/groups");
  const hasGroup = groups.some((g) => g.id === draft.groupId);
  return (
    <>
      <WizardSection title="Dostęp" description="Jak uczniowie wejdą do testu. Kod i link dostaniesz po publikacji.">
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCESS.map((a) => {
            const disabled = a.soon || (a.value === "list" && !hasGroup);
            return (
              <SelectionCard
                key={a.value}
                name="access"
                checked={draft.access === a.value}
                disabled={disabled}
                onChange={() => update({ access: a.value })}
                title={
                  <>
                    <a.icon className="size-4 text-ink-2" aria-hidden /> {a.title}
                  </>
                }
                badge={a.soon ? <Tag className="h-5 px-1.5 text-[11px]">wkrótce</Tag> : undefined}
                description={a.value === "list" && !hasGroup ? "Najpierw wybierz klasę w kroku 1." : a.description}
              />
            );
          })}
        </div>
        {draft.access === "password" && (
          <TextField
            className="mt-4 max-w-xs"
            label="Hasło do testu"
            value={draft.password}
            onChange={(e) => update({ password: e.target.value })}
            error={errors.password}
            placeholder="np. pętla42"
            autoComplete="off"
          />
        )}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field id="late-join" label="Spóźnieni mogą dołączyć" hint="Licząc od godziny rozpoczęcia. Czas testu im nie rośnie.">
            <Input id="late-join" type="number" min={0} max={draft.duration} suffix="min" value={draft.lateJoinMin} onChange={(e) => update({ lateJoinMin: Number(e.target.value) })} />
          </Field>
          <Field id="attempts" label="Podejścia na ucznia" hint="Kolejne podejście to nowa sesja z pełnym czasem.">
            <Input id="attempts" type="number" min={1} max={10} value={draft.attempts} onChange={(e) => update({ attempts: Math.max(1, Number(e.target.value)) })} />
          </Field>
        </div>
      </WizardSection>

      <WizardSection
        title="Ochrona przed ściąganiem"
        description="Zdarzenia (wklejenia, wyjścia z pełnego ekranu) trafiają do raportu jako sygnały do twojej oceny — nie jako automatyczny werdykt."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {PROTECTION.map((p) => (
            <SelectionCard
              key={p.value}
              name="protection"
              checked={draft.protection === p.value}
              onChange={() => update({ protection: p.value, ...PROTECTION_PRESET[p.value] })}
              title={p.title}
              description={p.description}
              features={p.features}
            />
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-4 rounded-card border border-line bg-subtle/50 p-4">
          <Switch
            label="Blokada wklejania"
            description="Wklejony tekst spoza edytora jest odrzucany i zapisywany w logu."
            checked={draft.blockPaste}
            onChange={(e) => update({ blockPaste: e.target.checked })}
          />
          <Switch
            label="Wymagany pełny ekran"
            description="Wyjście pokazuje uczniowi ostrzeżenie i trafia do logu."
            checked={draft.fullscreen}
            onChange={(e) => update({ fullscreen: e.target.checked })}
          />
          {draft.protection === "exam" && draft.fullscreen && (
            <Field id="fs-exits" label="Limit wyjść z pełnego ekranu" hint="Po przekroczeniu sesja czeka na twoją decyzję w panelu na żywo." className="ml-12 max-w-xs">
              <Input id="fs-exits" type="number" min={1} max={20} value={draft.fullscreenExits} onChange={(e) => update({ fullscreenExits: Math.max(1, Number(e.target.value)) })} />
            </Field>
          )}
          <Switch
            label="Mieszaj kolejność zadań"
            description="Każdy uczeń dostaje zadania w innej kolejności."
            checked={draft.shuffle}
            onChange={(e) => update({ shuffle: e.target.checked })}
          />
        </div>
      </WizardSection>
    </>
  );
}
