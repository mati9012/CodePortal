import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { Projector } from "./projector";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Widok rzutnika · CodePortal" };

export default function ProjectorPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProjectorContent params={params} />
    </Suspense>
  );
}

async function ProjectorContent({ params }: Params) {
  return <Projector id={(await params).id} />;
}
