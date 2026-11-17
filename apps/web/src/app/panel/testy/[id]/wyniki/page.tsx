import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { examById, hasResults } from "@/lib/mock/exam-session";
import { EXAMS } from "@/lib/mock/panel";
import { ResultsView } from "./results-view";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return EXAMS.filter(hasResults).map((e) => ({ id: e.id }));
}

export const metadata: Metadata = { title: "Wyniki testu · CodePortal" };

export default function ExamResultsPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExamResultsContent params={params} />
    </Suspense>
  );
}

async function ExamResultsContent({ params }: Params) {
  const exam = examById((await params).id);
  if (!exam || !hasResults(exam)) notFound();
  return <ResultsView exam={exam} />;
}
