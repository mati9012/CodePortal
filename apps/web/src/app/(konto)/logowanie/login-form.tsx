"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/field";
import { authClient, authErrorMessage, safeNext } from "@/lib/auth-client";

type Notice = { tone: "danger" | "warning"; text: string } | null;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    setLoading(true);
    setNotice(null);
    const { error } = await authClient.signIn.email({
      email,
      password: String(form.get("password")),
    });
    setLoading(false);
    if (!error) {
      router.replace(safeNext(params.get("next")));
      return;
    }
    if (error.code === "EMAIL_NOT_VERIFIED") {
      setNotice({
        tone: "warning",
        text: `Najpierw potwierdź adres. Wysłaliśmy nowy link na ${email}.`,
      });
    } else {
      setNotice({ tone: "danger", text: authErrorMessage(error) });
    }
  }

  return (
    <>
      <AuthHeading title="Zaloguj się">
        Nie masz konta?{" "}
        <Link href="/rejestracja" className="font-medium text-accent-ink underline underline-offset-4">
          Załóż je za darmo
        </Link>
      </AuthHeading>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {notice && <Banner tone={notice.tone}>{notice.text}</Banner>}
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          inputClassName="h-11"
        />
        <TextField
          label="Hasło"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          inputClassName="h-11"
          aside={
            <Link href="/reset-hasla" className="text-accent-ink underline-offset-4 hover:underline">
              Nie pamiętasz hasła?
            </Link>
          }
        />
        <Button type="submit" size="lg" loading={loading} loadingText="Logowanie…" className="mt-2">
          Zaloguj się
        </Button>
      </form>
      <p className="mt-8 rounded-input border border-line bg-subtle px-4 py-3 text-[13px] text-ink-2">
        Jesteś uczniem? Nie potrzebujesz konta —{" "}
        <Link href="/" className="font-medium text-accent-ink underline underline-offset-4">
          wpisz kod testu
        </Link>{" "}
        od nauczyciela.
      </p>
    </>
  );
}
