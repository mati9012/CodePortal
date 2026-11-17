import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { ClassDetailView } from "./class-detail";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Klasa · CodePortal" };

export default function ClassPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClassContent params={params} />
    </Suspense>
  );
}

async function ClassContent({ params }: Params) {
  return <ClassDetailView id={(await params).id} />;
}
