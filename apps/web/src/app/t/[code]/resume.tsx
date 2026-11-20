"use client";

import { Clock } from "lucide-react";
import { EntryShell } from "@/components/exam/entry-shell";
import { formatClock } from "@/components/exam/format";
import { ProblemTiles } from "@/components/exam/score";
import { formatTime } from "@/components/panel/format";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { Card, Eyebrow } from "@/components/ui/surface";
import type { LiveSession } from "@/lib/exam-session";
import { useNow } from "@/lib/use-now";
import { enterFullscreen } from "./fullscreen";
import { problemTiles } from "./workspace/problem-status";

const SECOND_MS = 1000;

export function Resume({ session, onResume }: { session: LiveSession; onResume: () => void }) {
  const now = useNow();
  const secondsLeft = session.deadlineAt
    ? (Date.parse(session.deadlineAt) - now - session.clockOffsetMs) / SECOND_MS
    : 0;
  const lastSave = session.problems
    .flatMap((p) => (p.draft ? [p.draft.savedAt] : []))
    .sort()
    .at(-1);

  const resume = async () => {
    if (session.exam.fullscreen) await enterFullscreen();
    onResume();
  };

  return (
    <EntryShell>
      <Card className="mx-auto flex w-full max-w-md flex-col gap-4 p-6 sm:p-8">
        <Eyebrow>{session.exam.title}</Eyebrow>
        <Banner tone="info" icon={<Clock />}>
          Masz rozpoczętą sesję. <strong>Czas nadal płynie</strong>
          {now > 0 && (
            <>
              {" "}
              – zostało <span className="font-mono">{formatClock(secondsLeft)}</span>.
            </>
          )}
        </Banner>
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-2">
          Postęp:
          <ProblemTiles problems={problemTiles(session.problems)} />
        </div>
        <Button size="lg" onClick={resume}>
          Wznów test
        </Button>
        <p className="text-[13px] text-ink-2">
          {lastSave
            ? `Twój kod zapisał się o ${formatTime(lastSave)}. Wracasz dokładnie do tej wersji.`
            : "Twój kod zapisuje się na serwerze co kilka sekund."}
        </p>
      </Card>
    </EntryShell>
  );
}
