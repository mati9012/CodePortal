import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPassword } from "./new-password";

export const metadata: Metadata = { title: "Nowe hasło · CodePortal" };

export default function NewPasswordPage() {
  return (
    <Suspense>
      <NewPassword />
    </Suspense>
  );
}
