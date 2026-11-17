import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
  fetchOptions: { credentials: "include" },
});

type AuthError = { code?: string; status: number; message?: string };

export function authErrorMessage(error: AuthError): string {
  if (error.status === 429) return "Za dużo prób. Odczekaj chwilę i spróbuj ponownie.";
  const code = error.code ?? "";
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "Nieprawidłowy e-mail lub hasło.";
  if (code === "EMAIL_NOT_VERIFIED") return "Najpierw potwierdź adres e-mail.";
  if (code.startsWith("USER_ALREADY_EXISTS")) return "Konto z tym adresem już istnieje.";
  if (code === "PASSWORD_TOO_SHORT") return "Hasło musi mieć co najmniej 8 znaków.";
  if (code === "PASSWORD_TOO_LONG") return "Hasło jest za długie (maks. 128 znaków).";
  if (code === "INVALID_EMAIL") return "To nie wygląda na adres e-mail.";
  if (code === "INVALID_TOKEN") return "Link jest nieprawidłowy albo został już użyty.";
  if (error.status === 0 || error.status >= 500)
    return "Nie możemy połączyć się z serwerem. Spróbuj za chwilę.";
  return "Coś poszło nie tak. Spróbuj ponownie.";
}

export function safeNext(next: string | null, fallback = "/panel") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
