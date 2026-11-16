"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Banner } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/field";
import { authClient, authErrorMessage } from "@/lib/auth-client";

// TODO(B3): drugi krok — profil z wyborem roli i szkoły, gdy będą organizacje.
export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    setLoading(true);
    setError(null);
    setExists(false);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim(),
      email,
      password: String(form.get("password")),
      callbackURL: `${window.location.origin}/weryfikacja`,
    });
    setLoading(false);
    if (error) {
      setExists(error.code?.startsWith("USER_ALREADY_EXISTS") ?? false);
      setError(authErrorMessage(error));
      return;
    }
    router.push(`/sprawdz-skrzynke?email=${encodeURIComponent(email)}`);
  }

  return (
    <>
      <AuthHeading title="Załóż konto nauczyciela">
        Masz już konto?{" "}
        <Link href="/logowanie" className="font-medium text-accent-ink underline underline-offset-4">
          Zaloguj się
        </Link>
      </AuthHeading>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && (
          <Banner
            tone="danger"
            action={exists && <Link href="/logowanie" className="underline underline-offset-4">Zaloguj się</Link>}
          >
            {error}
          </Banner>
        )}
        <TextField
          label="Imię i nazwisko"
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          autoFocus
          inputClassName="h-11"
        />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          hint="Najlepiej szkolny — wyślemy na niego link potwierdzający."
          inputClassName="h-11"
        />
        <TextField
          label="Hasło"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          hint="Co najmniej 8 znaków."
          inputClassName="h-11"
        />
        <Checkbox
          name="terms"
          required
          label={
            <>
              Akceptuję{" "}
              <Link href="/regulamin" className="text-accent-ink underline underline-offset-4">
                regulamin
              </Link>{" "}
              i{" "}
              <Link href="/prywatnosc" className="text-accent-ink underline underline-offset-4">
                politykę prywatności
              </Link>
              .
            </>
          }
        />
        <Button type="submit" size="lg" loading={loading} loadingText="Zakładanie konta…" className="mt-2">
          Załóż konto
        </Button>
      </form>
    </>
  );
}
