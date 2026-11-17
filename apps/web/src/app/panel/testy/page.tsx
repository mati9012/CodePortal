import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/panel/page-header";
import { buttonClasses } from "@/components/ui/button";
import { ExamList } from "./exam-list";

export const metadata: Metadata = { title: "Testy i konkursy · CodePortal" };

export default function ExamsPage() {
  return (
    <>
      <PageHeader
        title="Testy i konkursy"
        description="Sprawdziany dla klas i konkursy z rankingiem na żywo."
        crumbs={[{ href: "/panel", label: "Pulpit" }]}
        actions={
          <Link href="/panel/testy/nowy" className={buttonClasses()}>
            <Plus className="size-4" aria-hidden /> Nowy test
          </Link>
        }
      />
      <ExamList />
    </>
  );
}
