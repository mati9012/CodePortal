import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyResult } from "./verify-result";

export const metadata: Metadata = { title: "Potwierdzenie e-maila · CodePortal" };

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyResult />
    </Suspense>
  );
}
