"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";
import { authClient, authErrorMessage } from "@/lib/auth-client";

const COOLDOWN = 60;

/** B4: po rejestracji — link wysłany, można poprosić o kolejny co minutę. */
export function CheckInbox() {
  const email = useSearchParams().get("email") ?? "";
  const [wait, setWait] = useState(COOLDOWN);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function resend() {
    setSending(true);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${window.location.origin}/weryfikacja`,
    });
    setSending(false);
    setNotice(error ? { ok: false, text: authErrorMessage(error) } : { ok: true, text: "Wysłaliśmy nowy link." });
    setWait(COOLDOWN);
  }

  return (
    <>
      <span className="mb-5 inline-flex size-12 items-center justify-center rounded-card bg-accent-soft text-accent-ink">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <AuthHeading title="Sprawdź skrzynkę">
        Wysłaliśmy link potwierdzający{email ? <> na <b className="text-ink">{email}</b></> : null}.
        Kliknij go, żeby dokończyć zakładanie konta. Link działa przez godzinę.
      </AuthHeading>
      {notice && (
        <Banner tone={notice.ok ? "success" : "danger"} className="mb-4">
          {notice.text}
        </Banner>
      )}
      <div className="flex flex-col gap-3">
        {email && (
          <Button variant="secondary" size="lg" onClick={resend} loading={sending} disabled={wait > 0}>
            {wait > 0 ? `Wyślij ponownie (${wait} s)` : "Wyślij ponownie"}
          </Button>
        )}
        <p className="text-[13px] text-ink-2">
          Nie widzisz wiadomości? Zajrzyj do spamu albo{" "}
          <Link href="/rejestracja" className="text-accent-ink underline underline-offset-4">
            popraw adres
          </Link>
          .
        </p>
      </div>
    </>
  );
}
