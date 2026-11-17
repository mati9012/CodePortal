import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { PROBLEMS } from "@/lib/mock/panel";
import { problemDetail } from "@/lib/mock/problem-detail";
import { ProblemEditor } from "../_editor/problem-editor";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return PROBLEMS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const detail = problemDetail((await params).id);
  return { title: `${detail?.problem.title ?? "Zadanie"} · CodePortal` };
}

export default function ProblemPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProblemContent params={params} />
    </Suspense>
  );
}

async function ProblemContent({ params }: Params) {
  const detail = problemDetail((await params).id);
  if (!detail) notFound();
  return <ProblemEditor initial={detail} />;
}
