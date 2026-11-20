import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EntryShell } from "@/components/exam/entry-shell";
import { CodeBoxes } from "./code-boxes";

export const metadata: Metadata = { title: "Dołącz do testu · CodePortal" };

export default function JoinPage() {
  return (
    <EntryShell
      aside={
        <Link href="/logowanie" className="inline-flex items-center gap-1 hover:text-ink">
          Jestem nauczycielem <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      <CodeBoxes />
    </EntryShell>
  );
}
