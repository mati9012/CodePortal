import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { TestWizardEntry } from "./wizard";

export const metadata: Metadata = { title: "Nowy test · CodePortal" };

export default function NewTestPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TestWizardEntry />
    </Suspense>
  );
}
