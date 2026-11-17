import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { EXAMS } from "@/lib/mock/panel";
import { examById } from "@/lib/mock/exam-session";
import { ExamDetail } from "./exam-detail";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return EXAMS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const exam = examById((await params).id);
  return { title: `${exam?.title ?? "Test"} · CodePortal` };
}

export default function ExamPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ExamContent params={params} />
    </Suspense>
  );
}

async function ExamContent({ params }: Params) {
  const exam = examById((await params).id);
  if (!exam) notFound();
  return <ExamDetail exam={exam} />;
}
