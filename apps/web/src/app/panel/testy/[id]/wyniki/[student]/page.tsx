import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { examById, examResults, hasResults } from "@/lib/mock/exam-session";
import { EXAMS } from "@/lib/mock/panel";
import { StudentReport } from "./student-report";

type Params = { params: Promise<{ id: string; student: string }> };

export function generateStaticParams() {
  return EXAMS.filter(hasResults).flatMap((exam) => examResults(exam).map((r) => ({ id: exam.id, student: r.id })));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id, student } = await params;
  const exam = examById(id);
  const row = exam && examResults(exam).find((r) => r.id === student);
  return { title: `${row?.name ?? "Raport ucznia"} · CodePortal` };
}

export default function StudentReportPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StudentReportContent params={params} />
    </Suspense>
  );
}

async function StudentReportContent({ params }: Params) {
  const { id, student } = await params;
  const exam = examById(id);
  if (!exam || !hasResults(exam)) notFound();
  const results = examResults(exam);
  const index = results.findIndex((r) => r.id === student);
  if (index === -1) notFound();
  return (
    <StudentReport
      exam={exam}
      row={results[index]!}
      previousId={results[index - 1]?.id}
      nextId={results[index + 1]?.id}
    />
  );
}
