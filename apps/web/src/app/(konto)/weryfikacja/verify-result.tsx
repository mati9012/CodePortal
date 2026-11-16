"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-heading";
import { Bit } from "@/components/brand/bit";
import { buttonClasses } from "@/components/ui/button";
import { Banner } from "@/components/ui/feedback";

/**
 * B5: tu przekierowuje link z e-maila (API weryfikuje token i od razu loguje).
 * Przy błędzie API dokleja `?error=TOKEN_EXPIRED` albo `INVALID_TOKEN`.
 */
export function VerifyResult() {
  const error = useSearchParams().get("error");

  if (error) {
    const expired = error === "TOKEN_EXPIRED";
    return (
      <>
        <AuthHeading title={expired ? "Link wygasł" : "Nieprawidłowy link"} />
        <Banner tone="warning" className="mb-6">
          {expired
            ? "Link potwierdzający działa przez godzinę."
            : "Ten link jest niepełny albo został już użyty."}{" "}
          Zaloguj się — jeśli adres nie jest potwierdzony, od razu wyślemy nowy link.
        </Banner>
        <Link href="/logowanie" className={buttonClasses({ size: "lg" })}>
          Przejdź do logowania
        </Link>
      </>
    );
  }

  return (
    <>
      <Bit size="l" className="mb-6 lg:hidden" />
      <AuthHeading title="Adres potwierdzony!">
        Konto jest gotowe. Utwórz pierwszy test albo zajrzyj do banku zadań.
      </AuthHeading>
      <Link href="/panel" className={buttonClasses({ size: "lg" })}>
        Przejdź do panelu
      </Link>
    </>
  );
}
