import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckInbox } from "./check-inbox";

export const metadata: Metadata = { title: "Sprawdź skrzynkę · CodePortal" };

export default function CheckInboxPage() {
  return (
    <Suspense>
      <CheckInbox />
    </Suspense>
  );
}
