"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/field";
import { authClient, authErrorMessage } from "@/lib/auth-client";

/** B6–B7: prośba o link. Zawsze ta sama odpowiedź — nie zdradzamy, czy konto istnieje. */
export function ResetRequest() {
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setLoading(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/nowe-haslo`,
    });
    setLoading(false);
    if (error) setError(authErrorMessage(error));
    else setSentTo(email);
  }

  if (sentTo) {
    return (
      <>
        <AuthHeading title="Sprawdź skrzynkę">
          Jeśli konto <b className="text-ink">{sentTo}</b> istnieje, wysłaliśmy na nie link do
          ustawienia nowego hasła. Link działa przez godzinę.
        </AuthHeading>
        <Link href="/logowanie" className="text-body font-medium text-accent-ink underline underline-offset-4">
          Wróć do logowania
        </Link>
      </>
    );
  }

  return (
    <>
      <AuthHeading title="Nie pamiętasz hasła?">
        Podaj e-mail konta — wyślemy link do ustawienia nowego.
      </AuthHeading>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <Banner tone="danger">{error}</Banner>}
        <TextField label="E-mail" name="email" type="email" autoComplete="email" required autoFocus inputClassName="h-11" />
        <Button type="submit" size="lg" loading={loading} loadingText="Wysyłanie…" className="mt-2">
          Wyślij link
        </Button>
        <Link href="/logowanie" className="text-center text-[13px] text-ink-2 underline underline-offset-4 hover:text-ink">
          Wróć do logowania
        </Link>
      </form>
    </>
  );
}
