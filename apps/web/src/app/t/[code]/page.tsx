import type { Metadata } from "next";
import { Suspense } from "react";
import { ExamGate } from "./exam-gate";

type Params = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "Test · CodePortal" };

export default function ExamEntryPage({ params }: Params) {
  return (
    <Suspense>
      <ExamEntry params={params} />
    </Suspense>
  );
}

async function ExamEntry({ params }: Params) {
  return <ExamGate code={decodeURIComponent((await params).code).toUpperCase()} />;
}
