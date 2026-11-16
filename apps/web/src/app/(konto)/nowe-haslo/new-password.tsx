"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Button, buttonClasses } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/field";
import { authClient, authErrorMessage } from "@/lib/auth-client";

/** B8: tu przekierowuje link z e-maila resetu (`?token=…` albo `?error=INVALID_TOKEN`). */
export function NewPassword() {
  const params = useSearchParams();
  const token = params.get("token");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  if (!token || params.get("error")) {
    return (
      <>
        <AuthHeading title="Link wygasł albo jest nieprawidłowy">
          Link do zmiany hasła działa przez godzinę i tylko raz.
        </AuthHeading>
        <Link href="/reset-hasla" className={buttonClasses({ size: "lg" })}>
          Wyślij nowy link
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <AuthHeading title="Hasło zmienione">
          Wylogowaliśmy cię ze wszystkich urządzeń. Zaloguj się nowym hasłem.
        </AuthHeading>
        <Link href="/logowanie" className={buttonClasses({ size: "lg" })}>
          Zaloguj się
        </Link>
      </>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== form.get("repeat")) {
      setMismatch(true);
      return;
    }
    setMismatch(false);
    setLoading(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    setLoading(false);
    if (error) setError(authErrorMessage(error));
    else setDone(true);
  }

  return (
    <>
      <AuthHeading title="Ustaw nowe hasło" />
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <Banner tone="danger">{error}</Banner>}
        <TextField
          label="Nowe hasło"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          hint="Co najmniej 8 znaków."
          autoFocus
          inputClassName="h-11"
        />
        <TextField
          label="Powtórz hasło"
          name="repeat"
          type="password"
          autoComplete="new-password"
          required
          error={mismatch ? "Hasła nie są takie same." : undefined}
          inputClassName="h-11"
        />
        <Button type="submit" size="lg" loading={loading} loadingText="Zapisywanie…" className="mt-2">
          Zapisz hasło
        </Button>
      </form>
    </>
  );
}
