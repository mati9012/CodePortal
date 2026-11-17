"use client";

import type { ExamDetail } from "@codeportal/contracts";
import { Maximize, Minimize, X } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { formatClock } from "@/components/exam/format";
import { QueryView } from "@/components/panel/query-view";
import { useApi } from "@/lib/api";
import { groupLabel } from "@/lib/panel-labels";
import { useJoinLink, useOrigin } from "@/lib/use-origin";
import { useNow } from "@/lib/use-now";

const REFRESH_MS = 5000;
const SECOND_MS = 1000;

export function Projector({ id }: { id: string }) {
  const query = useApi<ExamDetail>(`/panel/exams/${id}`, { refreshInterval: REFRESH_MS });
  return (
    <QueryView query={query}>
      {(detail) =>
        detail.exam.code ? (
          <ProjectorScreen detail={detail} code={detail.exam.code} />
        ) : (
          <p className="py-10 text-center text-body text-ink-2">Opublikuj test, żeby pokazać kod na rzutniku.</p>
        )
      }
    </QueryView>
  );
}

function ProjectorScreen({ detail, code }: { detail: ExamDetail; code: string }) {
  const { exam, timing } = detail;
  const host = useOrigin().replace(/^https?:\/\//, "");
  const link = useJoinLink(code);
  const now = useNow();
  const live = exam.status === "live";
  const target = new Date(live ? timing.endsAt : timing.startsAt).getTime();
  const countdown = now ? Math.max(0, Math.floor((target - now) / SECOND_MS)) : 0;
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

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
            {exam.title} · {groupLabel(exam.group)}
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
                {exam.participants.joined} <span className="text-3xl text-white/40">/ {exam.participants.total}</span>
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
