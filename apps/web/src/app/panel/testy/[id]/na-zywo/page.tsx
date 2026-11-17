import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { LivePanel } from "./live-panel";

type Params = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Panel na żywo · CodePortal" };

export default function LivePage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LiveContent params={params} />
    </Suspense>
  );
}

async function LiveContent({ params }: Params) {
  return <LivePanel id={(await params).id} />;
}
