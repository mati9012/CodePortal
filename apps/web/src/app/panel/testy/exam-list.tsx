"use client";

import type { Created, ExamStatus, ExamSummary, GroupSummary } from "@codeportal/contracts";
import { Copy, Search, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ScoreChip } from "@/components/exam/score";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { ActionMenu } from "@/components/panel/action-menu";
import { formatWhen } from "@/components/panel/format";
import { QueryView } from "@/components/panel/query-view";
import { useToast } from "@/components/panel/use-toast";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { Card, Tag } from "@/components/ui/surface";
import { SegmentedControl, Tabs } from "@/components/ui/tabs";
import { api, errorMessage, useApi } from "@/lib/api";
import { groupLabel } from "@/lib/panel-labels";
import { pluralPl } from "@/lib/plural";

const TABS: { value: "all" | ExamStatus; label: string }[] = [
  { value: "all", label: "Wszystkie" },
  { value: "live", label: "Trwające" },
  { value: "scheduled", label: "Zaplanowane" },
  { value: "review", label: "Do sprawdzenia" },
  { value: "finished", label: "Zakończone" },
  { value: "draft", label: "Szkice" },
];

export function ExamList() {
  const query = useApi<ExamSummary[]>("/panel/exams");
  return <QueryView query={query}>{(exams) => <ExamTable exams={exams} />}</QueryView>;
}

function ExamTable({ exams }: { exams: ExamSummary[] }) {
  const router = useRouter();
  const { data: groups = [] } = useApi<GroupSummary[]>("/panel/groups");
  const { show, toast } = useToast();
  const [tab, setTab] = useState<string>("all");
  const [mode, setMode] = useState("all");
  const [group, setGroup] = useState("");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      exams.filter(
        (e) =>
          (tab === "all" || e.status === tab) &&
          (mode === "all" || e.mode === mode) &&
          (!group || e.groupId === group) &&
          e.title.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [exams, tab, mode, group, query],
  );

  const duplicate = async (exam: ExamSummary) => {
    try {
      const { id } = await api<Created>(`/panel/exams/${exam.id}/duplicate`, { method: "POST" });
      router.push(`/panel/testy/nowy?id=${id}`);
    } catch (err) {
      show("Nie udało się zduplikować testu", errorMessage(err), "warning");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        aria-label="Status testu"
        value={tab}
        onChange={setTab}
        options={TABS.map((t) => ({
          value: t.value,
          label: t.label,
          count: t.value === "all" ? exams.length : exams.filter((e) => e.status === t.value).length,
        }))}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Szukaj testu</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Szukaj po nazwie…" className="pl-9" />
        </label>
        <Select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Klasa lub grupa" className="sm:w-48">
          <option value="">Wszystkie klasy</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <SegmentedControl
          aria-label="Rodzaj"
          value={mode}
          onChange={setMode}
          size="sm"
          className="sm:ml-auto"
          options={[
            { value: "all", label: "Wszystko" },
            { value: "test", label: "Sprawdziany" },
            { value: "contest", label: "Konkursy" },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title="Brak testów w tym widoku"
            description="Zmień filtry albo utwórz nowy test z zadań w banku."
            action={
              <Link href="/panel/testy/nowy" className={buttonClasses()}>
                Nowy test
              </Link>
            }
          />
        ) : (
          <table className="w-full text-left text-body">
            <thead className="border-b border-line bg-subtle/60 text-xs text-ink-2 max-md:hidden">
              <tr>
                <th className="px-5 py-2.5 font-medium">Test</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Termin</th>
                <th className="px-3 py-2.5 font-medium">Uczniowie</th>
                <th className="px-3 py-2.5 font-medium">Średnia</th>
                <th className="px-3 py-2.5 font-medium">Kod</th>
                <th className="w-12 px-3 py-2.5">
                  <span className="sr-only">Akcje</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((e) => (
                <tr key={e.id} className="group transition-colors hover:bg-subtle/50 max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-1.5 max-md:px-4 max-md:py-3">
                  <td className="px-5 py-3 max-md:w-full max-md:p-0">
                    <Link href={`/panel/testy/${e.id}`} className="font-semibold text-ink hover:text-accent-ink">
                      {e.title || "Bez nazwy"}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-[13px] text-ink-2">
                      {e.mode === "contest" && (
                        <Tag tone="mint" className="h-5 px-1.5 text-[11px]">
                          <Trophy className="size-3" aria-hidden /> Konkurs
                        </Tag>
                      )}
                      {groupLabel(e.group)} · {e.problems} {pluralPl(e.problems, "zadanie", "zadania", "zadań")} · {e.durationMin} min
                    </div>
                  </td>
                  <td className="px-3 py-3 max-md:p-0">
                    <ExamStatusTag status={e.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[13px] text-ink-2 max-md:p-0">
                    {e.status === "draft" ? "—" : formatWhen(e.startsAt)}
                  </td>
                  <td className="px-3 py-3 font-mono text-[13px] tabular-nums text-ink-2 max-md:hidden">
                    {e.status === "scheduled" || e.status === "draft" ? e.participants.total : `${e.participants.joined}/${e.participants.total}`}
                  </td>
                  <td className="px-3 py-3 max-md:p-0">
                    {e.average !== undefined ? (
                      <span className="flex items-center gap-2">
                        <ScoreChip score={e.average} max={100} unit="%" />
                        {!!e.toReview && <span className="text-xs text-warning-ink">{e.toReview} do sprawdzenia</span>}
                      </span>
                    ) : (
                      <span className="text-ink-3 max-md:hidden">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 max-md:hidden">
                    {e.code ? (
                      <button
                        type="button"
                        title="Kopiuj kod"
                        onClick={() => navigator.clipboard?.writeText(e.code!)}
                        className="inline-flex items-center gap-1.5 rounded-tag px-1.5 py-0.5 font-mono text-[13px] font-semibold text-ink hover:bg-subtle"
                      >
                        {e.code}
                        <Copy className="size-3.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                      </button>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right max-md:ml-auto max-md:p-0">
                    <ActionMenu
                      label={`Więcej akcji: ${e.title}`}
                      actions={[
                        { label: "Edytuj", hidden: e.status !== "draft" && e.status !== "scheduled", onSelect: () => router.push(`/panel/testy/nowy?id=${e.id}`) },
                        { label: "Panel na żywo", hidden: e.status !== "live", onSelect: () => router.push(`/panel/testy/${e.id}/na-zywo`) },
                        { label: "Wyniki", hidden: e.status !== "review" && e.status !== "finished", onSelect: () => router.push(`/panel/testy/${e.id}/wyniki`) },
                        { label: "Duplikuj jako szkic", onSelect: () => duplicate(e) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {toast}
    </div>
  );
}
