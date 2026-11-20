import useSWR, { type SWRConfiguration } from "swr";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const NETWORK_ERROR = "Nie możemy połączyć się z serwerem. Spróbuj za chwilę.";
const FALLBACK_ERROR = "Coś poszło nie tak. Spróbuj ponownie.";
const NO_CONTENT = 204;

function messageOf(body: unknown) {
  const message = (body as { message?: unknown } | null)?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  return FALLBACK_ERROR;
}

type ApiInit = { method?: string; body?: unknown; token?: string; keepalive?: boolean };

function headersFor(init?: ApiInit) {
  const headers: Record<string, string> = {};
  if (init?.body !== undefined) headers["Content-Type"] = "application/json";
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  return headers;
}

export async function api<T = void>(path: string, init?: ApiInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? (init?.body === undefined ? "GET" : "POST"),
      credentials: "include",
      keepalive: init?.keepalive,
      headers: headersFor(init),
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  }
  if (response.status === NO_CONTENT) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, response.status >= 500 ? NETWORK_ERROR : messageOf(body));
  return body as T;
}

export const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : FALLBACK_ERROR);

export function useApi<T>(path: string | null, config?: SWRConfiguration<T, ApiError>) {
  return useSWR<T, ApiError>(path, (p: string) => api<T>(p), config);
}
