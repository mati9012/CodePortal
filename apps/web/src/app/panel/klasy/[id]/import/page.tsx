import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { CsvImportView } from "./csv-import";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Import uczniów · CodePortal" };

export default function ClassImportPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClassImportContent params={params} />
    </Suspense>
  );
}

async function ClassImportContent({ params }: Params) {
  return <CsvImportView id={(await params).id} />;
}
