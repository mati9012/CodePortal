import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { ProblemEditorView } from "../_editor/problem-editor";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Zadanie · CodePortal" };

export default function ProblemPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProblemContent params={params} />
    </Suspense>
  );
}

async function ProblemContent({ params }: Params) {
  return <ProblemEditorView id={(await params).id} />;
}
