import type { CodeFile, StudentProblem } from "@codeportal/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { sessionCall } from "@/lib/exam-session";

const AUTOSAVE_MS = 2000;

export type ProblemCode = { language: string; byLanguage: Record<string, CodeFile[]>; editedAt?: string };

export type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: number } | { kind: "offline" };

export const languageKeys = (problem: StudentProblem) => problem.languages.map((set) => set.join("+"));

function fromServer(problem: StudentProblem): ProblemCode {
  const language = problem.draft?.language ?? languageKeys(problem)[0]!;
  return {
    language,
    byLanguage: { ...problem.starter, ...(problem.draft && { [problem.draft.language]: problem.draft.files }) },
  };
}

export function useExamCode(token: string) {
  const [edits, setEdits] = useState<Record<string, ProblemCode>>({});
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const editsRef = useRef(edits);
  const dirty = useRef(new Set<string>());

  const codeOf = useCallback(
    (problem: StudentProblem) => edits[problem.id] ?? fromServer(problem),
    [edits],
  );

  const change = useCallback(
    (problem: StudentProblem, update: (code: ProblemCode) => ProblemCode) => {
      const current = editsRef.current[problem.id] ?? fromServer(problem);
      editsRef.current = {
        ...editsRef.current,
        [problem.id]: { ...update(current), editedAt: new Date().toISOString() },
      };
      setEdits(editsRef.current);
      dirty.current.add(problem.id);
    },
    [],
  );

  const setFile = useCallback(
    (problem: StudentProblem, path: string, content: string) =>
      change(problem, (code) => ({
        ...code,
        byLanguage: {
          ...code.byLanguage,
          [code.language]: code.byLanguage[code.language]!.map((f) => (f.path === path ? { ...f, content } : f)),
        },
      })),
    [change],
  );

  const setLanguage = useCallback(
    (problem: StudentProblem, language: string) => change(problem, (code) => ({ ...code, language })),
    [change],
  );

  const saveOne = useCallback(
    async (problemId: string) => {
      const code = editsRef.current[problemId];
      if (!code) return;
      dirty.current.delete(problemId);
      try {
        await sessionCall(token, "/code", payload(problemId, code), "PUT");
      } catch (error) {
        dirty.current.add(problemId);
        throw error;
      }
    },
    [token],
  );

  const flush = useCallback(async () => {
    const ids = [...dirty.current];
    if (ids.length === 0) return;
    setSave({ kind: "saving" });
    try {
      await Promise.all(ids.map(saveOne));
      setSave({ kind: "saved", at: Date.now() });
    } catch {
      setSave({ kind: "offline" });
    }
  }, [saveOne]);

  useEffect(() => {
    const id = setInterval(() => void flush(), AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [flush]);

  const lastEditAt = useCallback(
    (problem: StudentProblem) => edits[problem.id]?.editedAt ?? problem.draft?.savedAt,
    [edits],
  );

  return { codeOf, setFile, setLanguage, flush, save, lastEditAt };
}

export const payload = (problemId: string, code: ProblemCode) => ({
  problemId,
  language: code.language,
  files: code.byLanguage[code.language] ?? [],
});
