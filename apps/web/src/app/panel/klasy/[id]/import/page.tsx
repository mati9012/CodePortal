import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { groupById } from "@/lib/mock/class-roster";
import { GROUPS } from "@/lib/mock/panel";
import { CsvImport } from "./csv-import";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return GROUPS.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: `Import uczniów · ${groupById((await params).id)?.name ?? "Klasa"} · CodePortal` };
}

export default function ClassImportPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClassImportContent params={params} />
    </Suspense>
  );
}

async function ClassImportContent({ params }: Params) {
  const group = groupById((await params).id);
  if (!group) notFound();
  return <CsvImport group={group} />;
}
