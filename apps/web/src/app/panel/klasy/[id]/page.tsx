import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/panel/page-skeleton";
import { groupById } from "@/lib/mock/class-roster";
import { GROUPS } from "@/lib/mock/panel";
import { ClassDetail } from "./class-detail";

type Params = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return GROUPS.map((g) => ({ id: g.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  return { title: `${groupById((await params).id)?.name ?? "Klasa"} · CodePortal` };
}

export default function ClassPage({ params }: Params) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ClassContent params={params} />
    </Suspense>
  );
}

async function ClassContent({ params }: Params) {
  const group = groupById((await params).id);
  if (!group) notFound();
  return <ClassDetail group={group} />;
}
