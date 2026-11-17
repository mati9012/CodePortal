"use client";

import type { Replay, ReplayMarker } from "@codeportal/contracts";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { formatClock } from "@/components/exam/format";
import { CodeView } from "@/components/panel/code-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { SegmentedControl } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

const SPEEDS = [1, 4, 16];
const TICK_MS = 250;

const MARKER_META: Record<ReplayMarker["kind"], { label: string; color: string }> = {
  fullscreen: { label: "pełny ekran", color: "bg-orange" },
  paste: { label: "wklejenie", color: "bg-danger" },
  submit: { label: "zgłoszenie", color: "bg-accent" },
  pause: { label: "pauza", color: "bg-ink-3" },
  jump: { label: "skok kodu", color: "bg-violet" },
  idle: { label: "bezczynność", color: "bg-ink-3" },
  similarity: { label: "podobieństwo", color: "bg-pink" },
  finish: { label: "koniec", color: "bg-success" },
  time: { label: "dodany czas", color: "bg-accent" },
  question: { label: "pytanie kontrolne", color: "bg-ink-3" },
};

const LEGEND: ReplayMarker["kind"][] = ["fullscreen", "paste", "submit", "pause", "jump"];

const MARKER_CAPTION: Partial<Record<ReplayMarker["kind"], string>> = {
  jump: "duży fragment kodu pojawił się naraz",
  paste: "zablokowana próba wklejenia",
  fullscreen: "wyjście z pełnego ekranu",
  submit: "zgłoszenie rozwiązania",
  pause: "brak aktywności przez co najmniej 2 min",
};

export function WorkReplay({ problems, replay }: { problems: number[]; replay: Replay }) {
  const firstWithCode = problems.find((n) => replay.frames[n]?.length) ?? problems[0] ?? 1;
  const [problem, setProblem] = useState(String(firstWithCode));
  const [position, setPosition] = useState(replay.durationSec);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(4);
  const duration = replay.durationSec;

  const running = playing && position < duration;

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setPosition((p) => Math.min(duration, p + (speed * TICK_MS) / 1000)), TICK_MS);
    return () => clearInterval(tick);
  }, [running, speed, duration]);

  const frames = replay.frames[Number(problem)] ?? [];
  const code = [...frames].reverse().find((f) => f.at <= position)?.code ?? "";
  const progress = position / duration;
  const current = [...replay.markers].reverse().find((m) => m.at <= position);

  const togglePlay = () => {
    if (running) return setPlaying(false);
    if (position >= duration) setPosition(0);
    setPlaying(true);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="text-body font-semibold text-ink">Przebieg pracy</h2>
        <SegmentedControl
          size="sm"
          aria-label="Zadanie"
          value={problem}
          onChange={setProblem}
          options={problems.map((n) => ({ value: String(n), label: `Z${n}` }))}
        />
      </div>

      <div className="relative">
        {frames.length ? (
          <CodeView code={code || " "} className="min-h-72 rounded-none" />
        ) : (
          <p className="flex min-h-72 items-center justify-center px-4 text-body text-ink-2">Brak zapisanych wersji kodu dla tego zadania.</p>
        )}
        <span data-theme="dark" className="absolute right-3 top-3 rounded-tag bg-subtle px-2 py-0.5 font-mono text-[11px] text-ink-2">
          tylko do odczytu · {formatClock(position)}
        </span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <input
          type="range"
          min={0}
          max={duration}
          value={Math.round(position)}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-label="Pozycja odtwarzania"
          className="sr-only"
          id="replay-position"
        />
        <div
          className="relative h-5 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setPosition(((e.clientX - rect.left) / rect.width) * duration);
          }}
          aria-hidden
        >
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
          <span className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
          {replay.markers.map((m, i) => (
            <span
              key={`${m.kind}-${m.at}-${i}`}
              title={MARKER_META[m.kind].label}
              className={cn("absolute top-1/2 h-3 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[2px]", MARKER_META[m.kind].color)}
              style={{ left: `${Math.min(100, (m.at / duration) * 100)}%` }}
            />
          ))}
          <span
            className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" className="w-8 px-0" aria-label={running ? "Pauza" : "Odtwórz"} onClick={togglePlay}>
            {running ? <Pause /> : <Play />}
          </Button>
          <label htmlFor="replay-position" className="font-mono text-[13px] tabular-nums text-ink">
            {formatClock(position)} <span className="text-ink-3">/ {formatClock(duration)}</span>
          </label>
          <SegmentedControl
            size="sm"
            aria-label="Prędkość"
            value={String(speed)}
            onChange={(v) => setSpeed(Number(v))}
            options={SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }))}
          />
          <ul className="ml-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
            {LEGEND.map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span className={cn("size-2 rounded-[2px]", MARKER_META[k].color)} aria-hidden />
                {MARKER_META[k].label}
              </li>
            ))}
          </ul>
        </div>

        {current && (
          <p className="rounded-input bg-subtle px-3 py-2 text-[13px] text-ink-2">
            <b className="font-semibold text-ink">
              {MARKER_META[current.kind].label[0]!.toUpperCase() + MARKER_META[current.kind].label.slice(1)} · {formatClock(current.at)}
            </b>{" "}
            · {MARKER_CAPTION[current.kind]}
          </p>
        )}
      </div>
    </Card>
  );
}
