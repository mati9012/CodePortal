import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { examById } from "@/lib/mock/exam-session";
import { EXAMS } from "@/lib/mock/panel";
import { LivePanel } from "./live-panel";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return EXAMS.filter((e) => e.status === "live").map((e) => ({ id: e.id }));
}

export const metadata: Metadata = { title: "Panel na żywo · CodePortal" };

export default function LivePage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LiveContent params={params} />
    </Suspense>
  );
}

async function LiveContent({ params }: Params) {
  const exam = examById((await params).id);
  if (!exam || exam.status !== "live") notFound();
  return <LivePanel exam={exam} />;
}
