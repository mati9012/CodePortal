import { Plus, Upload, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ScoreChip } from "@/components/exam/score";
import { PageHeader } from "@/components/panel/page-header";
import { buttonClasses } from "@/components/ui/button";
import { Card, Tag } from "@/components/ui/surface";
import { GROUPS } from "@/lib/mock/panel";

export const metadata: Metadata = { title: "Klasy i grupy · CodePortal" };

/** F11 · Klasy i grupy. */
export default function GroupsPage() {
  return (
    <>
      <PageHeader
        title="Klasy i grupy"
        description="Uczniowie z klas dostają test od razu, bez wpisywania kodu."
        crumbs={[{ href: "/panel", label: "Pulpit" }]}
        actions={
          <>
            <button type="button" className={buttonClasses({ variant: "secondary" })}>
              <Upload className="size-4" aria-hidden /> Import CSV
            </button>
            <Link href="/panel/klasy/nowa" className={buttonClasses()}>
              <Plus className="size-4" aria-hidden /> Nowa klasa
            </Link>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {GROUPS.map((g) => (
          <Link key={g.id} href={`/panel/klasy/${g.id}`} className="group block rounded-card">
            <Card className="flex h-full flex-col gap-4 p-5 transition-[border-color,box-shadow] group-hover:border-ink-3/50 group-hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-h3 text-ink group-hover:text-accent-ink">{g.name}</p>
                  <p className="text-[13px] text-ink-2">Rok szkolny {g.year}</p>
                </div>
                <Tag tone={g.kind === "class" ? "accent" : "mint"}>{g.kind === "class" ? "Klasa" : "Grupa"}</Tag>
              </div>
              <div className="flex items-center gap-2 text-body text-ink">
                <Users className="size-4 text-ink-2" aria-hidden />
                <b className="tabular-nums">{g.students}</b> uczniów
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-[13px]">
                <span className="min-w-0 truncate text-ink-2">Ostatnio: {g.lastExam}</span>
                {g.average !== undefined && <ScoreChip score={g.average} max={100} unit="%" />}
              </div>
            </Card>
          </Link>
        ))}
        <Link
          href="/panel/klasy/nowa"
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line text-body font-medium text-ink-2 transition-colors hover:border-accent hover:bg-accent-soft/40 hover:text-accent-ink"
        >
          <Plus className="size-5" aria-hidden />
          Dodaj klasę lub grupę
        </Link>
      </div>
    </>
  );
}
