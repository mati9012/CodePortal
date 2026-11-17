import type { Metadata } from "next";
import { ArrowUp, ClipboardX, Copy, Link2, Maximize, Play, Plus } from "lucide-react";
import { Bit } from "@/components/brand/bit";
import { Logo } from "@/components/brand/logo";
import { ProblemTiles, RiskMeter, ScoreChip, StatusDot } from "@/components/exam/score";
import { AutosaveStatus, Timer } from "@/components/exam/timer";
import { TestResultsBar, VerdictDetail, VerdictPill, type Verdict } from "@/components/exam/verdict";
import { Button, IconButton } from "@/components/ui/button";
import { Checkbox, Radio, SelectionCard, Switch } from "@/components/ui/choice";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner, ModalPanel, OfflineIcon, Skeleton, Toast } from "@/components/ui/feedback";
import { SelectField, TextField, TextareaField } from "@/components/ui/field";
import { Stepper } from "@/components/ui/stepper";
import { Avatar, Card, Eyebrow, Kbd, StatCard, Tag } from "@/components/ui/surface";
import { SegmentedControl, Tabs } from "@/components/ui/tabs";
import { ThemeSwitcher } from "@/components/ui/theme";

export const metadata: Metadata = { title: "Design system · CodePortal" };

const VERDICTS: Verdict[] = ["OK", "WA", "TLE", "MLE", "RE", "CE"];

const PALETTES = [
  {
    name: "Akcja · Blue",
    swatches: [
      ["50", "#EEF2FF"],
      ["100", "#DFE6FF"],
      ["300", "#9AB2FF"],
      ["500", "#335CFF"],
      ["600", "#2447E0"],
      ["800", "#1A36B8"],
    ],
  },
  {
    name: "Marka · Mint (z Bita)",
    swatches: [
      ["50", "#F0FDFA"],
      ["100", "#CCFBF1"],
      ["300", "#5EEAD4"],
      ["500", "#14B8A6"],
      ["700", "#0F766E"],
      ["900", "#0B2A28"],
    ],
  },
];

const NEUTRALS = ["canvas", "surface", "subtle", "line", "ink-2", "ink"] as const;
const NEUTRAL_CLASS: Record<(typeof NEUTRALS)[number], string> = {
  canvas: "bg-canvas",
  surface: "bg-surface",
  subtle: "bg-subtle",
  line: "bg-line",
  "ink-2": "bg-ink-2",
  ink: "bg-ink",
};

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-1 font-display text-h1 text-ink">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-body text-ink-2">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Panel({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <Card className={`min-w-0 p-5 ${className ?? ""}`}>
      <Eyebrow className="mb-4">{title}</Eyebrow>
      {children}
    </Card>
  );
}

function ButtonMatrix() {
  const rows = [
    ["primary", "Zgłoś", "Wysyłanie…", <ArrowUp key="i" />, "Zgłoś rozwiązanie"],
    ["secondary", "Uruchom", "Uruchamianie…", <Play key="i" />, "Uruchom"],
    ["ghost", "Anuluj", null, <Copy key="i" />, null],
    ["danger", "Zakończ test", null, null, null],
  ] as const;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
        <thead>
          <tr className="text-xs text-ink-2">
            <th className="w-24 font-medium" />
            {["default", "focus", "disabled", "loading", "z ikoną"].map((h) => (
              <th key={h} className="font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([variant, label, loadingText, icon, iconLabel]) => (
            <tr key={variant}>
              <td className="text-xs text-ink-2">{variant}</td>
              <td>
                <Button variant={variant}>{label}</Button>
              </td>
              <td>
                <Button variant={variant} className="ring-[3px] ring-primary-300">
                  {label}
                </Button>
              </td>
              <td>
                <Button variant={variant} disabled>
                  {label}
                </Button>
              </td>
              <td>{loadingText && <Button variant={variant} loading loadingText={loadingText} />}</td>
              <td>
                {iconLabel ? (
                  <Button variant={variant} icon={icon}>
                    {iconLabel}
                  </Button>
                ) : (
                  icon && (
                    <IconButton label="Kopiuj" variant={variant}>
                      {icon}
                    </IconButton>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button size="sm">sm · 28</Button>
        <Button size="md">md · 36</Button>
        <Button size="lg">lg · 44</Button>
        <Button variant="link">Pokaż diff</Button>
      </div>
    </div>
  );
}

function ComponentGallery({ scope }: { scope: string }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Panel title="Przyciski" className="lg:col-span-2">
        <ButtonMatrix />
      </Panel>

      <Panel title="Formularze">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Nazwa testu"
            defaultValue="Sprawdzian – pętle i tablice"
            hint="Widoczna dla uczniów na ekranie wejścia."
          />
          <TextField label="Limit czasu na test" type="number" defaultValue={45} suffix="min" hint="Od 5 do 240 minut." />
          <TextField
            label="Kod dostępu"
            defaultValue="7K2-9QX"
            inputClassName="font-mono"
            error="Nie znaleziono testu o tym kodzie. Sprawdź kod u nauczyciela."
          />
          <SelectField label="Język domyślny" defaultValue="cpp">
            <option value="cpp">C++ 17</option>
            <option value="py">Python 3</option>
          </SelectField>
          <TextareaField
            className="sm:col-span-2"
            label="Uzasadnienie korekty"
            maxLength={280}
            defaultValue="Test 7 – akceptuję wynik z dodatkową spacją."
          />
          <div className="flex flex-wrap gap-x-5 gap-y-2 sm:col-span-2">
            <Checkbox label="Blokada wklejania" defaultChecked />
            <Checkbox label="Kamera" />
            <Radio name={`${scope}-which`} label="Najlepsze" defaultChecked />
            <Radio name={`${scope}-which`} label="Ostatnie" />
          </div>
          <Switch label="Pełny ekran wymagany" defaultChecked />
        </div>
      </Panel>

      <div className="flex flex-col gap-5">
        <Panel title="Selection cards · poziom ochrony">
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectionCard
              name={`${scope}-protection`}
              value="loose"
              title="Luźny"
              description="Kartkówka, ćwiczenia na lekcji."
              features={["Zapis przebiegu pracy", "Wklejanie dozwolone", "Bez pełnego ekranu"]}
            />
            <SelectionCard
              name={`${scope}-protection`}
              value="standard"
              defaultChecked
              title="Standard"
              description="Zwykły sprawdzian w pracowni."
              features={["Pełny ekran wymagany", "Blokada wklejania", "Pytanie kontrolne"]}
            />
            <SelectionCard
              name={`${scope}-protection`}
              value="exam"
              title="Egzamin"
              description="Konkursy i egzaminy próbne."
              features={["Wszystko ze Standardu", "Limit wyjść: 1", "Opcjonalnie kamera"]}
            />
          </div>
        </Panel>
        <Panel title="Zakładki">
          <Tabs
            aria-label="Zadanie"
            options={[
              { value: "content", label: "Treść" },
              { value: "tests", label: "Testy", count: 12 },
              { value: "settings", label: "Ustawienia" },
              { value: "reference", label: "Rozwiązanie wzorcowe" },
            ]}
          />
          <SegmentedControl
            className="mt-4"
            aria-label="Panel konsoli"
            options={[
              { value: "console", label: "Konsola" },
              { value: "samples", label: "Przykłady" },
              { value: "subs", label: "Zgłoszenia", count: 3 },
            ]}
          />
        </Panel>
      </div>

      <Panel title="Werdykty">
        <div className="flex flex-wrap gap-1.5">
          {VERDICTS.map((v) => (
            <VerdictPill key={v} verdict={v} />
          ))}
          <VerdictPill verdict="PENDING" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <VerdictDetail verdict="OK" timeMs={42} memoryKb={3174} />
          <VerdictDetail verdict="TLE" timeMs={1000} />
          <TestResultsBar verdicts={["OK", "OK", "OK", "OK", "WA", "OK", "OK", "OK", "WA", "TLE"]} />
        </div>
      </Panel>

      <Panel title="Wynik · ryzyko · status">
        <div className="flex flex-wrap gap-1.5">
          <ScoreChip score={92} max={100} />
          <ScoreChip score={55} max={100} />
          <ScoreChip score={20} max={100} />
          <ScoreChip score={21} max={30} unit="pkt" />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <RiskMeter score={12} />
          <RiskMeter score={41} />
          <RiskMeter score={73} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          <StatusDot status="online" />
          <StatusDot status="offline" />
          <StatusDot status="idle" />
          <StatusDot status="finished" />
        </div>
      </Panel>

      <Panel title="Timer · autozapis · zadania">
        <div className="flex flex-wrap gap-2">
          <Timer secondsLeft={32 * 60 + 14} />
          <Timer secondsLeft={8 * 60 + 41} />
          <Timer secondsLeft={4 * 60 + 2} />
          <Timer secondsLeft={0} />
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          <AutosaveStatus state={{ kind: "saved", secondsAgo: 2 }} />
          <AutosaveStatus state={{ kind: "saving" }} />
          <AutosaveStatus state={{ kind: "offline" }} />
        </div>
        <ProblemTiles
          className="mt-4"
          activeNumber={3}
          problems={[
            { number: 1, score: 100, max: 100 },
            { number: 2, score: 70, max: 100 },
            { number: 3, max: 100 },
            { number: 4, max: 100 },
          ]}
        />
      </Panel>

      <Panel title="Dane">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Średnia" value="68,4" unit="/ 100" note="+6,1 pkt vs poprzedni" noteTone="success" />
          <StatCard label="Najtrudniejsze zadanie" value="Z3" note="średnio 31% punktów" />
        </div>
        <Stepper
          className="mt-5"
          steps={[
            { label: "Podstawy", state: "done" },
            { label: "Zadania", state: "done" },
            { label: "Dostęp i ochrona", state: "current" },
            { label: "Ocenianie", state: "upcoming" },
          ]}
        />
        <div className="mt-5 flex items-center gap-3">
          <Avatar name="Anna Nowak" />
          <div className="flex flex-col">
            <span className="text-body font-semibold">Anna Nowak</span>
            <span className="text-xs text-ink-2">Plan Szkoła</span>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-ink-2">
            Szukaj <Kbd>Ctrl K</Kbd>
          </span>
        </div>
      </Panel>

      <Panel title="Bannery i toasty" className="lg:col-span-2">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Banner tone="danger" title="Utracono połączenie." icon={OfflineIcon} action={<span className="text-danger-ink">Ponawianie za 4 s</span>}>
              Kod zapisuje się lokalnie – wyślemy go po powrocie sieci.
            </Banner>
            <Banner tone="warning" title="Test kończy się za 5 minut.">
              Zgłoś rozwiązania, które chcesz oddać.
            </Banner>
            <Banner tone="info" action={<Button variant="link">Zatwierdź</Button>}>
              Wyniki niezatwierdzone – uczniowie ich jeszcze nie widzą.
            </Banner>
          </div>
          <div className="flex flex-col gap-3">
            <Toast tone="warning" title="Wklejanie jest wyłączone" icon={<ClipboardX />}>
              Próba została zapisana w przebiegu pracy.
            </Toast>
            <Toast tone="success" title="Link skopiowany" icon={<Link2 />} action={<Button variant="link">Cofnij</Button>}>
              <span className="font-mono">codeportal.pl/t/7K2-9QX</span>
            </Toast>
          </div>
        </div>
      </Panel>

      <Panel title="Modal blokujący">
        <div className="flex justify-center rounded-card bg-overlay p-6">
          <ModalPanel
            icon={<Maximize />}
            title="Wyszedłeś z trybu pełnoekranowego"
            description="To zdarzenie zostało zapisane i zobaczy je nauczyciel. Wróć do pełnego ekranu, aby kontynuować. Czas testu nadal płynie."
            footer={
              <>
                <span className="mr-auto text-[13px] text-ink-2">
                  Wyjście <strong className="text-ink">2</strong> z dozwolonych 3
                </span>
                <Button>Wróć do pełnego ekranu</Button>
              </>
            }
          />
        </div>
      </Panel>

      <Panel title="Pusty stan · ładowanie">
        <EmptyState
          title="Bank zadań jest pusty"
          description="Dodaj pierwsze zadanie albo zaimportuj paczkę ZIP z testami."
          action={<Button icon={<Plus />}>Nowe zadanie</Button>}
        />
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Panel>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="flex flex-col">
      <header
        data-theme="dark"
        className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_85%_10%,rgb(20_184_166/0.25),transparent_45%),radial-gradient(90%_90%_at_0%_100%,rgb(51_92_255/0.35),transparent_55%)] bg-canvas"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-8 md:flex-row md:items-center">
          <div className="flex-1">
            <Logo />
            <div className="mt-5">
              <Tag pill>Design system 2.0 · listopad 2026</Tag>
            </div>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.1] font-extrabold tracking-[-0.035em]">
              Sprawdziany z kodu,{" "}
              <span className="bg-gradient-to-r from-primary-300 to-mint-300 bg-clip-text text-transparent">
                które ocenia Bit.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-ink-2">
              Tokeny i komponenty z projektu — źródło: docs/DESIGN.md. Każdy komponent korzysta wyłącznie z
              tokenów semantycznych, więc sam przełącza się między motywem jasnym a ciemnym (IDE).
            </p>
          </div>
          <Bit size="xl" preload className="self-center" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-body text-ink-2">Motyw całej strony:</p>
          <ThemeSwitcher />
        </div>

        <Section
          eyebrow="Maskotka"
          title="Poznaj Bita"
          description="Dodaje ciepła tam, gdzie użytkownik zaczyna, czeka albo świętuje. Nigdy nie ocenia ucznia i nie pojawia się w trakcie pisania testu."
        >
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {(
              [
                ["xl", "XL · 240 px", "hero, logowanie, CTA"],
                ["l", "L · 150 px", "sukces, powitanie"],
                ["m", "M · 84 px", "puste stany"],
                ["s", "S · 56 px", "checklista, toasty"],
              ] as const
            ).map(([size, label, use]) => (
              <Card key={size} className="flex flex-col items-center justify-end gap-3 p-5 text-center">
                <div className="flex h-[150px] items-end">
                  <Bit size={size === "xl" ? "l" : size} className={size === "xl" ? "scale-100" : undefined} />
                </div>
                <div>
                  <p className="text-body font-semibold">{label}</p>
                  <p className="text-xs text-ink-2">{use}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>

        <Section
          eyebrow="Kolory"
          title="Paleta 2.0"
          description="Żywszy niebieski jako akcja, morski z maskotki jako akcent marki. Chłodne neutralne (slate) zamiast szarych."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {PALETTES.map((p) => (
              <Panel key={p.name} title={p.name}>
                <div className="grid grid-cols-6 gap-2">
                  {p.swatches.map(([step, hex]) => (
                    <div key={step} className="flex flex-col gap-1.5">
                      <span className="h-12 rounded-tag border border-line" style={{ background: hex }} />
                      <span className="text-xs font-semibold">{step}</span>
                      <span className="font-mono text-[10px] text-ink-2">{hex}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            ))}
            {(["light", "dark"] as const).map((theme) => (
              <div key={theme} data-theme={theme} className="rounded-card">
                <Panel title={theme === "light" ? "Neutralne · jasny" : "Neutralne · ciemny (IDE)"}>
                  <div className="grid grid-cols-6 gap-2">
                    {NEUTRALS.map((n) => (
                      <div key={n} className="flex flex-col gap-1.5">
                        <span className={`h-12 rounded-tag border border-line ${NEUTRAL_CLASS[n]}`} />
                        <span className="text-xs font-semibold">{n}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="Typografia i kształty" title="Typografia">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="flex flex-col gap-4 p-6">
              {(
                [
                  ["font-display text-display", "Ocenia się sam.", "Display · Plus Jakarta Sans 800 · 56/62"],
                  ["font-display text-h1", "Wyniki testu", "H1 · Plus Jakarta Sans 800 · 32/40"],
                  ["font-display text-h3", "Dostęp i ochrona", "H3 · Plus Jakarta Sans 700 · 18/26"],
                  ["text-body", "Wczytaj liczbę n i wypisz sumę jej cyfr.", "Body · Inter 400 · 14/22"],
                  ["font-mono text-code", "for (int i = 0; i < n; i++)", "Code · JetBrains Mono · 14/22 · bez ligatur"],
                ] as const
              ).map(([cls, sample, spec]) => (
                <div key={spec}>
                  <p className={cls}>{sample}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-3">{spec}</p>
                </div>
              ))}
            </Card>
            <div className="flex flex-col gap-4">
              <Panel title="Kształty">
                <div className="flex flex-wrap items-end gap-3">
                  {(
                    [
                      ["rounded-tag", "8 · tag"],
                      ["rounded-input", "10 · input"],
                      ["rounded-card", "14 · karta"],
                      ["rounded-modal", "20 · modal"],
                      ["rounded-full", "pigułka"],
                    ] as const
                  ).map(([cls, label]) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <span className={`size-11 border-[1.5px] border-accent bg-accent-soft ${cls}`} />
                      <span className="text-[11px] text-ink-2">{label}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Głębia">
                <div className="grid grid-cols-3 gap-3">
                  {(["shadow-sm", "shadow-md", "shadow-lg"] as const).map((s, i) => (
                    <span
                      key={s}
                      className={`flex h-14 items-center justify-center rounded-card bg-surface text-xs ${s}`}
                    >
                      {["sm · karty", "md · popover", "lg · modal"][i]}
                    </span>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </Section>

        <Section eyebrow="Biblioteka" title="Komponenty" description="Motyw jak wybrany powyżej.">
          <ComponentGallery scope="light" />
        </Section>

        <Section
          eyebrow="Biblioteka"
          title="Komponenty · ciemny (IDE)"
          description="Ten sam zestaw w kontenerze z data-theme=&quot;dark&quot; — tak działa widok testu ucznia."
        >
          <div data-theme="dark" className="rounded-modal bg-canvas p-4 sm:p-6">
            <ComponentGallery scope="dark" />
          </div>
        </Section>
      </main>
    </div>
  );
}
