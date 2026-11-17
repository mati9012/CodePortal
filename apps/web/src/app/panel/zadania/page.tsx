import { Plus, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/panel/page-header";
import { buttonClasses } from "@/components/ui/button";
import { ProblemBank } from "./problem-bank";

export const metadata: Metadata = { title: "Bank zadań · CodePortal" };

export default function ProblemsPage() {
  return (
    <>
      <PageHeader
        title="Bank zadań"
        description="Twoje zadania z testami. Z nich składasz sprawdziany i konkursy."
        crumbs={[{ href: "/panel", label: "Pulpit" }]}
        actions={
          <>
            <button type="button" className={buttonClasses({ variant: "secondary" })}>
              <Upload className="size-4" aria-hidden /> Importuj
            </button>
            <Link href="/panel/zadania/nowe" className={buttonClasses()}>
              <Plus className="size-4" aria-hidden /> Nowe zadanie
            </Link>
          </>
        }
      />
      <ProblemBank />
    </>
  );
}
