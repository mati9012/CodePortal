import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { ResultsView } from "./results-view";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Wyniki testu · CodePortal" };

export default function ExamResultsPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExamResultsContent params={params} />
    </Suspense>
  );
}

async function ExamResultsContent({ params }: Params) {
  return <ResultsView id={(await params).id} />;
}
