import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { StudentReportView } from "./student-report";

type Params = { params: Promise<{ id: string; student: string }> };

export const metadata: Metadata = { title: "Raport ucznia · CodePortal" };

export default function StudentReportPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StudentReportContent params={params} />
    </Suspense>
  );
}

async function StudentReportContent({ params }: Params) {
  const { id, student } = await params;
  return <StudentReportView examId={id} sessionId={student} />;
}
