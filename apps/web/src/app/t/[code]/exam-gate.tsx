"use client";

import { useEffect, useState } from "react";
import { EntryShell } from "@/components/exam/entry-shell";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { QueryView } from "@/components/panel/query-view";
import { useExamSession, useExamToken } from "@/lib/exam-session";
import { useOrigin } from "@/lib/use-origin";
import { HardwareCheck } from "./hardware-check";
import { Intro } from "./intro";
import { Resume } from "./resume";
import { Summary } from "./summary";
import { Workspace } from "./workspace/workspace";

const UNAUTHORIZED = 401;

type Stage = "entry" | "working" | "summary";

export function ExamGate({ code }: { code: string }) {
  const origin = useOrigin();
  const [token, setToken] = useExamToken(code);
  const session = useExamSession(token);
  const [stage, setStage] = useState<Stage>("entry");
  const tokenRejected = session.error?.status === UNAUTHORIZED;

  useEffect(() => {
    if (tokenRejected) setToken(null);
  }, [tokenRejected, setToken]);

  if (!token || tokenRejected)
    return (
      <EntryShell
        aside={
          <>
            {origin.replace(/^https?:\/\//, "")}/t/<strong className="font-mono text-ink">{code}</strong>
          </>
        }
      >
        <Intro code={code} onJoined={setToken} />
      </EntryShell>
    );

  if (!session.data)
    return (
      <EntryShell>
        <QueryView query={session}>{() => <PageSkeleton />}</QueryView>
      </EntryShell>
    );

  const current = session.data;
  if (stage === "working")
    return (
      <Workspace
        session={current}
        token={token}
        refresh={session.mutate}
        offline={Boolean(session.error)}
        onLeave={() => setStage("summary")}
      />
    );
  if (current.phase === "finished") return <Summary session={current} />;
  if (current.phase === "ready")
    return (
      <HardwareCheck
        session={current}
        token={token}
        onStarted={() => {
          setStage("working");
          void session.mutate();
        }}
      />
    );
  return <Resume session={current} onResume={() => setStage("working")} />;
}
