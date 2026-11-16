"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SelectionCard, Switch } from "@/components/ui/choice";
import { SelectField, TextField } from "@/components/ui/field";
import { Card } from "@/components/ui/surface";
import { ThemeSwitcher } from "@/components/ui/theme";
import { authClient } from "@/lib/auth-client";

export function SettingsForm() {
  const { data } = authClient.useSession();
  return (
    <div className="flex flex-col gap-6">
      <Group title="Profil" description="Imię widzą uczniowie na ekranie testu.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Imię i nazwisko" defaultValue={data?.user.name} key={data?.user.name} />
          <TextField label="E-mail" defaultValue={data?.user.email} key={data?.user.email} disabled hint="Zmiana adresu wkrótce." />
        </div>
      </Group>
      <Group title="Wygląd" description="Motyw panelu. Widok testu ucznia ma zawsze ciemny motyw edytora.">
        <ThemeSwitcher />
      </Group>
      <Group title="Domyślne ustawienia testów" description="Każdy nowy test zaczyna od tych wartości — zmienisz je w kreatorze.">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Czas trwania" defaultValue="45">
            <option value="20">20 min (kartkówka)</option>
            <option value="45">45 min (lekcja)</option>
            <option value="90">90 min (dwie lekcje)</option>
          </SelectField>
          <SelectField label="Wyniki dla uczniów" defaultValue="after_approval">
            <option value="immediate">Od razu po teście</option>
            <option value="after_end">Po zakończeniu testu</option>
            <option value="after_approval">Po moim zatwierdzeniu</option>
          </SelectField>
        </div>
        <p className="mb-2 mt-5 text-[13px] font-semibold text-ink">Poziom ochrony</p>
        <div className="grid gap-3 md:grid-cols-3">
          <SelectionCard name="protection" value="loose" title="Luźny" description="Ćwiczenia w klasie" features={["Log zdarzeń"]} />
          <SelectionCard
            name="protection"
            value="standard"
            defaultChecked
            title="Standard"
            description="Kartkówki i sprawdziany"
            features={["Blokada wklejania", "Pełny ekran"]}
          />
          <SelectionCard
            name="protection"
            value="exam"
            title="Egzamin"
            description="Ważne sprawdziany"
            features={["Wszystko ze Standardu", "Limit wyjść z pełnego ekranu"]}
          />
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <Switch label="Pokazuj uczniom testy jawne" description="Uczeń widzi wynik przykładowych testów przed zgłoszeniem." defaultChecked />
          <Switch label="Mieszaj kolejność zadań" description="Każdy uczeń dostaje zadania w innej kolejności." />
        </div>
      </Group>
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Anuluj</Button>
        <Button>Zapisz zmiany</Button>
      </div>
    </div>
  );
}

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
      <div>
        <h2 className="font-display text-h3 text-ink">{title}</h2>
        {description && <p className="mt-1 text-[13px] text-ink-2">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </Card>
  );
}
