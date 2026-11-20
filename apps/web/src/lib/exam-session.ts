import type { StudentSession } from "@codeportal/contracts";
import { useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";
import { api, type ApiError } from "./api";

const TOKEN_PREFIX = "cp-exam-";
const TOKEN_CHANGED = "cp-exam-token";
const ACTIVE_REFRESH_MS = 5000;
const IDLE_REFRESH_MS = 30_000;

export type LiveSession = StudentSession & { clockOffsetMs: number };

function readToken(code: string) {
  try {
    return localStorage.getItem(TOKEN_PREFIX + code);
  } catch {
    return null;
  }
}

function writeToken(code: string, token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_PREFIX + code, token);
    else localStorage.removeItem(TOKEN_PREFIX + code);
  } catch {}
  window.dispatchEvent(new Event(TOKEN_CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(TOKEN_CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(TOKEN_CHANGED, onChange);
  };
}

export function useExamToken(code: string) {
  const token = useSyncExternalStore(
    subscribe,
    () => readToken(code),
    () => null,
  );
  const setToken = useCallback((next: string | null) => writeToken(code, next), [code]);
  return [token, setToken] as const;
}

async function fetchSession([path, token]: [string, string]): Promise<LiveSession> {
  const session = await api<StudentSession>(path, { token });
  return { ...session, clockOffsetMs: Date.parse(session.exam.serverNow) - Date.now() };
}

export function useExamSession(token: string | null) {
  return useSWR<LiveSession, ApiError, [string, string] | null>(
    token ? ["/exam-session", token] : null,
    fetchSession,
    {
      refreshInterval: (data) => (data?.phase === "finished" ? IDLE_REFRESH_MS : ACTIVE_REFRESH_MS),
      revalidateOnFocus: true,
    },
  );
}

export const sessionCall = <T = void>(token: string, path: string, body?: unknown, method?: string) =>
  api<T>(`/exam-session${path}`, { token, body, method });
