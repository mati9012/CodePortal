import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { ExamDetailView } from "./exam-detail";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Test · CodePortal" };

export default function ExamPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExamContent params={params} />
    </Suspense>
  );
}

async function ExamContent({ params }: Params) {
  return <ExamDetailView id={(await params).id} />;
}
