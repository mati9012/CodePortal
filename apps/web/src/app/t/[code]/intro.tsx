"use client";

import type { ExamIntro, JoinResult } from "@codeportal/contracts";
import { Clipboard, Clock, Lock, Maximize, SearchX } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { formatClock } from "@/components/exam/format";
import { formatDay, formatTime } from "@/components/panel/format";
import { QueryView } from "@/components/panel/query-view";
import { Button, buttonClasses } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Banner } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/field";
import { Card, Eyebrow, Tag } from "@/components/ui/surface";
import { api, errorMessage, useApi, type ApiError } from "@/lib/api";
import { LANGUAGE_LABEL } from "@/lib/panel-labels";
import { cn } from "@/lib/cn";
import { pluralPl } from "@/lib/plural";
import { useNow } from "@/lib/use-now";

const SCHEDULED_REFRESH_MS = 5000;
const OPEN_REFRESH_MS = 30_000;
const SECOND_MS = 1000;
const NOT_FOUND = 404;
const BAD_REQUEST = 400;

const MODE_LABEL = { test: "Sprawdzian", contest: "Konkurs" } as const;

export function Intro({ code, onJoined }: { code: string; onJoined: (token: string) => void }) {
  const intro = useApi<ExamIntro>(`/exam/${encodeURIComponent(code)}`, {
    refreshInterval: (data) => (data?.status === "scheduled" ? SCHEDULED_REFRESH_MS : OPEN_REFRESH_MS),
  });
  if (isMissing(intro.error)) return <NotFound code={code} />;
  return (
    <QueryView query={intro}>
      {(exam) => (
        <>
          <Overview exam={exam} />
          {exam.status === "live" && <JoinForm exam={exam} onJoined={onJoined} />}
          {exam.status === "scheduled" && <Countdown startsAt={exam.startsAt} />}
          {exam.status === "closed" && <Closed exam={exam} />}
        </>
      )}
    </QueryView>
  );
}

const isMissing = (error: ApiError | undefined) => error?.status === NOT_FOUND || error?.status === BAD_REQUEST;

function NotFound({ code }: { code: string }) {
  return (
    <Card className="mx-auto w-full max-w-md p-8 text-center">
      <span className="mx-auto inline-flex size-12 items-center justify-center rounded-[14px] bg-danger-soft text-danger-ink">
        <SearchX className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 font-display text-h3 text-ink">Nie znaleźliśmy testu {code}</h1>
      <p className="mt-2 text-body text-ink-2">
        Kod mógł zostać zmieniony albo test usunięto. Poproś nauczyciela o aktualny kod lub link.
      </p>
      <Link href="/dolacz" className={buttonClasses({ variant: "secondary", className: "mt-6 w-full" })}>
        Wpisz kod ponownie
      </Link>
    </Card>
  );
}

function Stat({ label, value, wide = false }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5 bg-surface p-3.5", wide && "col-span-2")}>
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function Overview({ exam }: { exam: ExamIntro }) {
  const byline = [MODE_LABEL[exam.mode], exam.teacher, exam.group].filter(Boolean).join(" · ");
  return (
    <Card className="p-6 sm:p-8">
      <Eyebrow>{byline}</Eyebrow>
      <h1 className="mt-2 font-display text-h1 text-ink">{exam.title}</h1>
      {exam.status === "live" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag tone="success" pill>
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Dostępny teraz
          </Tag>
          <Tag pill>do {formatTime(exam.endsAt)}</Tag>
        </div>
      )}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-input border border-line bg-line sm:grid-cols-3">
        <Stat label="Czas" value={`${exam.durationMin} min`} />
        <Stat label="Zadania" value={`${exam.problems} · ${exam.maxPoints} pkt`} />
        <Stat label="Próby" value={`${exam.attempts} ${pluralPl(exam.attempts, "podejście", "podejścia", "podejść")}`} />
        <Stat label="Języki" value={exam.languages.map((l) => LANGUAGE_LABEL[l]).join(", ") || "—"} />
        <Stat
          wide
          label="Okno dostępności"
          value={`${formatDay(exam.startsAt)}, ${formatTime(exam.startsAt)} – ${formatTime(exam.endsAt)}`}
        />
      </div>
    </Card>
  );
}

function Rule({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-input bg-subtle text-ink-2 [&_svg]:size-4" aria-hidden>
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="font-semibold text-ink">{title}</span>
        <span className="text-body text-ink-2">{children}</span>
      </span>
    </li>
  );
}

function JoinForm({ exam, onJoined }: { exam: ExamIntro; onJoined: (token: string) => void }) {
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fromRoster = exam.access === "list";
  const ready = name.trim().length >= 3 && accepted && (exam.access !== "password" || password.length > 0);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { token } = await api<JoinResult>(`/exam/${exam.code}/join`, {
        body: {
          name: name.trim(),
          ...(className.trim() && !fromRoster && { className: className.trim() }),
          ...(exam.access === "password" && { password }),
        },
      });
      onJoined(token);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4 p-6 sm:p-8">
        <h2 className="font-display text-h3 text-ink">Kim jesteś?</h2>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
          <TextField
            label="Imię i nazwisko"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={120}
            required
            className={fromRoster ? "sm:col-span-2" : undefined}
            hint={fromRoster ? "Tak jak na liście klasy." : undefined}
          />
          {!fromRoster && (
            <TextField
              label="Klasa (opcjonalnie)"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              maxLength={20}
            />
          )}
        </div>
        {exam.access === "password" && (
          <TextField
            label="Hasło do testu"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            maxLength={120}
          />
        )}
        <p className="text-[13px] text-ink-2">Wpisz prawdziwe dane – tak nauczyciel rozpozna twoje rozwiązanie.</p>
      </Card>

      <Card className="flex flex-col gap-5 p-6 sm:p-8">
        <h2 className="font-display text-h3 text-ink">Zasady testu</h2>
        <ul className="flex flex-col gap-4">
          {exam.fullscreen && (
            <Rule icon={<Maximize />} title="Pełny ekran">
              Test działa tylko w trybie pełnoekranowym. Każde wyjście jest zapisywane (limit: {exam.fullscreenExits}).
            </Rule>
          )}
          {exam.blockPaste && (
            <Rule icon={<Clipboard />} title="Blokada wklejania">
              Nie wkleisz tekstu spoza edytora. Kopiowanie w obrębie własnego kodu działa.
            </Rule>
          )}
          <Rule icon={<Clock />} title="Zapis przebiegu pracy">
            Nauczyciel zobaczy, jak powstawał twój kod. Nie nagrywamy ekranu ani dźwięku.
          </Rule>
        </ul>
        <div className="rounded-input bg-subtle p-3">
          <Checkbox
            label="Zapoznałem się z zasadami testu."
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
        </div>
      </Card>

      {error && <Banner tone="danger">{error}</Banner>}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-2">Czas zacznie płynąć po sprawdzeniu sprzętu.</p>
        <Button type="submit" size="lg" disabled={!ready} loading={busy}>
          Rozpocznij test
        </Button>
      </div>
    </form>
  );
}

function Countdown({ startsAt }: { startsAt: string }) {
  const now = useNow();
  const secondsLeft = Math.max(0, (Date.parse(startsAt) - now) / SECOND_MS);
  return (
    <Card className="flex flex-col items-center gap-2 p-8 text-center">
      <span className="text-body text-ink-2">Start za</span>
      <span className="font-mono text-display font-semibold tabular-nums text-ink" role="timer">
        {now ? formatClock(secondsLeft) : "—"}
      </span>
      <span className="text-body text-ink-2">
        {formatDay(startsAt)} o {formatTime(startsAt)}
      </span>
      <p className="mt-3 max-w-sm text-body text-ink-2">
        Strona odświeży się sama, gdy test się zacznie. Nie musisz niczego klikać.
      </p>
    </Card>
  );
}

function Closed({ exam }: { exam: ExamIntro }) {
  const ended = Date.parse(exam.endsAt) <= Date.parse(exam.serverNow);
  return (
    <Card className="flex flex-col gap-3 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-input bg-subtle text-ink-2">
          <Lock className="size-4" aria-hidden />
        </span>
        <h2 className="font-display text-h3 text-ink">Test jest zamknięty</h2>
      </div>
      <p className="text-body text-ink-2">
        {ended
          ? `Test zakończył się ${formatDay(exam.endsAt)} o ${formatTime(exam.endsAt)}. Nie można już do niego dołączyć.`
          : `Dołączanie było możliwe do ${formatTime(exam.joinUntil)}.`}
      </p>
      <p className="text-body text-ink-2">
        Jeśli nie zdążyłeś wejść z ważnego powodu, napisz do nauczyciela ({exam.teacher}).
      </p>
    </Card>
  );
}
