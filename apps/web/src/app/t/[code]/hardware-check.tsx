"use client";

import { Check, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Card, Eyebrow, Tag, type TagTone } from "@/components/ui/surface";
import { api, errorMessage } from "@/lib/api";
import { sessionCall, type LiveSession } from "@/lib/exam-session";
import { cn } from "@/lib/cn";
import { pluralPl } from "@/lib/plural";
import { enterFullscreen, useIsFullscreen } from "./fullscreen";
import { StudentShell } from "./student-shell";

const SLOW_CONNECTION_MS = 500;
const MINUTE_MS = 60_000;

type StepState = "ok" | "warning" | "error" | "pending";
type Connection = { state: "checking" } | { state: "ok" | "slow"; ms: number } | { state: "offline" };

const STEP_ICON: Record<StepState, { icon: ReactNode; className: string }> = {
  ok: { icon: <Check />, className: "bg-success-soft text-success-ink" },
  warning: { icon: <TriangleAlert />, className: "bg-warning-soft text-warning-ink" },
  error: { icon: <X />, className: "bg-danger-soft text-danger-ink" },
  pending: { icon: <LoaderCircle className="animate-spin" />, className: "bg-subtle text-ink-2" },
};

function Step({
  state,
  title,
  badge,
  badgeTone,
  children,
}: {
  state: StepState;
  title: string;
  badge?: string;
  badgeTone?: TagTone;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-4",
          STEP_ICON[state].className,
        )}
        aria-hidden
      >
        {STEP_ICON[state].icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-ink">{title}</span>
          {badge && (
            <Tag tone={badgeTone} pill className="font-mono">
              {badge}
            </Tag>
          )}
        </div>
        <div className="text-body text-ink-2">{children}</div>
      </div>
    </li>
  );
}

function useConnectionCheck(code: string) {
  const [connection, setConnection] = useState<Connection>({ state: "checking" });
  const check = useCallback(async () => {
    setConnection({ state: "checking" });
    const startedAt = performance.now();
    try {
      await api(`/exam/${code}`);
      const ms = Math.round(performance.now() - startedAt);
      setConnection({ state: ms > SLOW_CONNECTION_MS ? "slow" : "ok", ms });
    } catch {
      setConnection({ state: "offline" });
    }
  }, [code]);
  useEffect(() => {
    void Promise.resolve().then(check);
  }, [check]);
  return { connection, check };
}

export function HardwareCheck({
  session,
  token,
  onStarted,
}: {
  session: LiveSession;
  token: string;
  onStarted: () => void;
}) {
  const { exam } = session;
  const fullscreen = useIsFullscreen();
  const { connection, check } = useConnectionCheck(exam.code);
  const [fullscreenDenied, setFullscreenDenied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fullscreenOk = !exam.fullscreen || fullscreen;
  const canStart = fullscreenOk && connection.state !== "offline" && connection.state !== "checking";
  const minutesLeft = Math.min(
    exam.durationMin,
    Math.max(0, Math.round((Date.parse(exam.endsAt) - Date.parse(exam.serverNow)) / MINUTE_MS)),
  );

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      await sessionCall(token, "/start", undefined, "POST");
      onStarted();
    } catch (err) {
      setError(errorMessage(err));
      setStarting(false);
    }
  };

  return (
    <StudentShell title={exam.title} subtitle={session.name} aside="Czas nie płynie, dopóki nie klikniesz Start">
      <Card className="w-full max-w-xl p-6 sm:p-8">
        <Eyebrow>Przed startem</Eyebrow>
        <h1 className="mt-1 font-display text-h2 text-ink">Sprawdźmy sprzęt</h1>
        <p className="mt-1 text-body text-ink-2">To zajmie mniej niż minutę.</p>

        <ol className="mt-6 flex flex-col gap-5">
          {exam.fullscreen && (
            <Step state={fullscreen ? "ok" : "pending"} title="Pełny ekran" badge={fullscreen ? "OK" : undefined} badgeTone="success">
              {fullscreen ? (
                "Tryb pełnoekranowy włączony."
              ) : (
                <div className="flex flex-col items-start gap-2">
                  <span>
                    {fullscreenDenied
                      ? "Przeglądarka nie pozwoliła włączyć pełnego ekranu. Otwórz test w aktualnym Chrome, Edge, Firefox lub Safari na komputerze."
                      : "Test działa tylko w trybie pełnoekranowym."}
                  </span>
                  <Button size="sm" onClick={async () => setFullscreenDenied(!(await enterFullscreen()))}>
                    Włącz pełny ekran
                  </Button>
                </div>
              )}
            </Step>
          )}
          <ConnectionStep connection={connection} onRetry={() => void check()} />
          <Step state={canStart ? "ok" : "pending"} title="Gotowe">
            {exam.problems} {pluralPl(exam.problems, "zadanie", "zadania", "zadań")}, {minutesLeft} min. Po kliknięciu
            Start czas zaczyna płynąć i nie da się go zatrzymać.
          </Step>
        </ol>

        {error && (
          <Banner tone="danger" className="mt-5">
            {error}
          </Banner>
        )}
        <Button size="lg" className="mt-6 w-full" disabled={!canStart} loading={starting} onClick={start}>
          Start – czas zaczyna płynąć
        </Button>
      </Card>
    </StudentShell>
  );
}

function ConnectionStep({ connection, onRetry }: { connection: Connection; onRetry: () => void }) {
  if (connection.state === "checking")
    return (
      <Step state="pending" title="Połączenie">
        Sprawdzamy połączenie z serwerem testu…
      </Step>
    );
  if (connection.state === "offline")
    return (
      <Step state="error" title="Połączenie">
        <div className="flex flex-col items-start gap-2">
          <span>Brak połączenia z serwerem testu. Sprawdź Wi-Fi – start będzie możliwy po połączeniu.</span>
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Spróbuj ponownie
          </Button>
        </div>
      </Step>
    );
  if (connection.state === "slow")
    return (
      <Step state="warning" title="Połączenie" badge={`słabe · ${connection.ms} ms`} badgeTone="warning">
        Możesz zacząć – kod zapisuje się automatycznie. Jeśli możesz, podejdź bliżej routera.
      </Step>
    );
  return (
    <Step state="ok" title="Połączenie" badge={`OK · ${connection.ms} ms`} badgeTone="success">
      Połączenie stabilne. Autozapis co 2 sekundy.
    </Step>
  );
}
