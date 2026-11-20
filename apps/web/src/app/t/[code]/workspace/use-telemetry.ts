import type { EventsResult, ExamEventInput, ExamEventType } from "@codeportal/contracts";
import { useCallback, useEffect, useRef } from "react";
import { ApiError } from "@/lib/api";
import { sessionCall } from "@/lib/exam-session";

const FLUSH_MS = 3000;
const MAX_BATCH = 100;
const CONFLICT = 409;

type EditSpan = { problemId: string; firstAt: number; lastAt: number; insertedLines: number; chars: number };

export function useTelemetry(token: string, onResult: (result: EventsResult) => void) {
  const queue = useRef<ExamEventInput[]>([]);
  const edits = useRef<EditSpan | null>(null);

  const closeEditSpan = useCallback(() => {
    const span = edits.current;
    edits.current = null;
    if (!span) return;
    queue.current.push({
      type: "delta",
      at: new Date(span.lastAt).toISOString(),
      payload: {
        problemId: span.problemId,
        insertedLines: span.insertedLines,
        chars: span.chars,
        durationMs: span.lastAt - span.firstAt,
      },
    });
  }, []);

  const flush = useCallback(async () => {
    closeEditSpan();
    const batch = queue.current.splice(0, MAX_BATCH);
    if (batch.length === 0) return;
    try {
      onResult(await sessionCall<EventsResult>(token, "/events", { events: batch }));
    } catch (error) {
      const sessionClosed = error instanceof ApiError && error.status === CONFLICT;
      if (!sessionClosed) queue.current.unshift(...batch);
    }
  }, [closeEditSpan, onResult, token]);

  const record = useCallback(
    (type: Exclude<ExamEventType, "delta">, payload: ExamEventInput["payload"] = {}) => {
      queue.current.push({ type, at: new Date().toISOString(), payload });
      if (type === "fullscreen_exit") void flush();
    },
    [flush],
  );

  const recordEdit = useCallback(
    (problemId: string, insertedLines: number, chars: number) => {
      if (edits.current && edits.current.problemId !== problemId) closeEditSpan();
      const now = Date.now();
      const span = (edits.current ??= { problemId, firstAt: now, lastAt: now, insertedLines: 0, chars: 0 });
      span.lastAt = now;
      span.insertedLines += insertedLines;
      span.chars += chars;
    },
    [closeEditSpan],
  );

  useEffect(() => {
    const id = setInterval(() => void flush(), FLUSH_MS);
    return () => clearInterval(id);
  }, [flush]);

  return { record, recordEdit };
}
