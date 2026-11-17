import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { examById } from "@/lib/mock/exam-session";
import { EXAMS } from "@/lib/mock/panel";
import { Projector } from "./projector";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return EXAMS.filter((e) => e.code).map((e) => ({ id: e.id }));
}

export const metadata: Metadata = { title: "Widok rzutnika · CodePortal" };

export default function ProjectorPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProjectorContent params={params} />
    </Suspense>
  );
}

async function ProjectorContent({ params }: Params) {
  const exam = examById((await params).id);
  if (!exam?.code) notFound();
  return <Projector exam={exam} code={exam.code} />;
}
