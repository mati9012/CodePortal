"use client";

import { Maximize, Minimize, X } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { formatClock } from "@/components/exam/format";
import type { Exam } from "@/lib/mock/panel";
import { useJoinLink, useOrigin } from "@/lib/use-origin";

const MOCK_COUNTDOWN_SEC = 4 * 60 + 12;
const MOCK_REMAINING_SEC = 32 * 60 + 14;
const MOCK_JOINED_SHARE = 0.7;
const MOCK_JOIN_INTERVAL_MS = 7000;
const SECOND_MS = 1000;

export function Projector({ exam, code }: { exam: Exam; code: string }) {
  const host = useOrigin().replace(/^https?:\/\//, "");
  const link = useJoinLink(code);
  const live = exam.status === "live";
  const [countdown, setCountdown] = useState(live ? MOCK_REMAINING_SEC : MOCK_COUNTDOWN_SEC);
  const [joined, setJoined] = useState(live ? exam.participants.joined : Math.round(exam.participants.total * MOCK_JOINED_SHARE));
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setCountdown((s) => Math.max(0, s - 1)), SECOND_MS);
    const join = setInterval(
      () => setJoined((n) => Math.min(exam.participants.total, n + 1)),
      MOCK_JOIN_INTERVAL_MS,
    );
    const syncFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => {
      clearInterval(tick);
      clearInterval(join);
      document.removeEventListener("fullscreenchange", syncFullscreen);
    };
  }, [exam.participants.total]);

  const toggleFullscreen = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black text-white">
      <div className="flex justify-end gap-2 p-4">
        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex h-10 items-center gap-2 rounded-input px-3 text-[13px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {fullscreen ? <Minimize className="size-4" aria-hidden /> : <Maximize className="size-4" aria-hidden />}
          {fullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
        </button>
        <Link
          href={`/panel/testy/${exam.id}`}
          aria-label="Zamknij widok rzutnika"
          className="inline-flex size-10 items-center justify-center rounded-input text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-12 px-6 pb-12 lg:flex-row lg:justify-between lg:gap-16 lg:px-16">
        <div className="flex min-w-0 flex-col gap-6 max-lg:items-center max-lg:text-center">
          <p className="text-xl text-white/60 lg:text-2xl">
            {exam.title} · {exam.group}
          </p>
          <p className="text-xl text-white/80 lg:text-2xl">
            Wejdź na <b className="font-semibold text-white">{host}/dolacz</b> i wpisz kod
          </p>
          <p className="font-mono text-[clamp(56px,11vw,160px)] font-bold leading-none tracking-[0.06em]">{code}</p>
          <div className="mt-4 flex gap-14">
            <div>
              <p className="text-base text-white/60">{live ? "Pozostało" : "Start za"}</p>
              <p className="font-mono text-5xl font-semibold tabular-nums">{formatClock(countdown)}</p>
            </div>
            <div>
              <p className="text-base text-white/60">Dołączyło</p>
              <p className="font-mono text-5xl font-semibold tabular-nums" aria-live="polite">
                {joined} <span className="text-3xl text-white/40">/ {exam.participants.total}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-4">
          <div className="rounded-card bg-white p-5">
            <QRCodeSVG value={link} size={280} marginSize={0} fgColor="#000000" bgColor="#ffffff" title={`Kod QR: ${link}`} />
          </div>
          <p className="max-w-72 text-center text-sm text-white/60">lub zeskanuj telefonem, a potem otwórz na komputerze</p>
        </div>
      </div>
    </div>
  );
}
