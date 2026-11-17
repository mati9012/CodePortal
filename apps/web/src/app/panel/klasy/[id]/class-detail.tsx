"use client";

import type { AccountState, ExamSummary, GroupDetail, Student, StudentInput } from "@codeportal/contracts";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ActionMenu } from "@/components/panel/action-menu";
import { Dialog } from "@/components/panel/dialog";
import { ExamStatusTag } from "@/components/panel/exam-status";
import { formatDay } from "@/components/panel/format";
import { PageHeader } from "@/components/panel/page-header";
import { QueryView } from "@/components/panel/query-view";
import { useToast } from "@/components/panel/use-toast";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TextField } from "@/components/ui/field";
import { Avatar, Card, Tag, type TagTone } from "@/components/ui/surface";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { api, errorMessage, useApi } from "@/lib/api";
import { isValidEmail } from "@/lib/email";
import { ACCOUNT_LABEL } from "@/lib/panel-labels";
import { pluralPl } from "@/lib/plural";

const ACCOUNT_TONE: Record<AccountState, TagTone> = { linked: "success", invited: "accent", none: "neutral" };
const GOOD_AVERAGE = 70;
const PASSING_AVERAGE = 50;

type Tab = "students" | "exams" | "averages";

export function ClassDetailView({ id }: { id: string }) {
  const query = useApi<GroupDetail>(`/panel/groups/${id}`);
  return <QueryView query={query}>{(detail) => <ClassDetail detail={detail} reload={() => query.mutate()} />}</QueryView>;
}

function ClassDetail({ detail, reload }: { detail: GroupDetail; reload: () => Promise<unknown> }) {
  const { group, students, exams } = detail;
  const [tab, setTab] = useState<Tab>("students");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Student | null>(null);
  const { show, toast } = useToast();
  const studentsPath = `/panel/groups/${group.id}/students`;

  const run = async (action: () => Promise<unknown>, success: [string, string?], failure: string) => {
    try {
      await action();
      await reload();
      show(...success);
      return true;
    } catch (err) {
      show(failure, errorMessage(err), "warning");
      return false;
    }
  };

  const invite = (s: Student) =>
    run(() => api(`${studentsPath}/${s.id}/invite`, { method: "POST" }), ["Wysłano zaproszenie", s.email ?? undefined], "Nie wysłano zaproszenia");

  const add = async (input: StudentInput) => {
    const added = await run(
      () => api<Student>(studentsPath, { body: input }),
      [`Dodano: ${input.firstName} ${input.lastName}`, input.email ? "Zaproszenie wysłane na e-mail." : undefined],
      "Nie dodano ucznia",
    );
    if (added) setAdding(false);
  };

  const remove = async (s: Student) => {
    setRemoving(null);
    await run(() => api(`${studentsPath}/${s.id}`, { method: "DELETE" }), [`Usunięto z klasy: ${s.firstName} ${s.lastName}`], "Nie usunięto ucznia");
  };

  return (
    <>
      <PageHeader
        title={group.name}
        description={`${group.kind === "class" ? "Klasa" : "Grupa"} · rok szkolny ${group.year} · ${students.length} ${pluralPl(students.length, "uczeń", "uczniów", "uczniów")}`}
        crumbs={[{ href: "/panel/klasy", label: "Klasy i grupy" }]}
        actions={
          <>
            <Link href={`/panel/klasy/${group.id}/import`} className={buttonClasses({ variant: "secondary" })}>
              <Upload className="size-4" aria-hidden /> Importuj CSV
            </Link>
            <Button variant="secondary" icon={<Plus />} onClick={() => setAdding(true)}>
              Dodaj ucznia
            </Button>
            <Link href={`/panel/testy/nowy?group=${group.id}`} className={buttonClasses()}>
              Nowy test dla klasy
            </Link>
          </>
        }
      />

      <Tabs
        aria-label="Sekcje klasy"
        className="mb-6"
        value={tab}
        onChange={(v) => setTab(v as Tab)}
        options={[
          { value: "students", label: "Uczniowie", count: students.length },
          { value: "exams", label: "Testy", count: exams.length },
          { value: "averages", label: "Średnie wyniki" },
        ]}
      />

      {tab === "students" &&
        (students.length === 0 ? (
          <Card>
            <EmptyState
              title="Ta klasa nie ma jeszcze uczniów"
              description="Zaimportuj listę z dziennika w CSV albo dodaj uczniów ręcznie."
              action={
                <Link href={`/panel/klasy/${group.id}/import`} className={buttonClasses()}>
                  Importuj CSV
                </Link>
              }
            />
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-body">
              <thead className="border-b border-line bg-subtle/60 text-xs text-ink-2">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Nazwisko i imię</th>
                  <th className="px-3 py-2.5 font-medium">E-mail</th>
                  <th className="px-3 py-2.5 font-medium">Konto</th>
                  <th className="px-3 py-2.5 text-right font-medium">Średnia</th>
                  <th className="px-3 py-2.5 text-right font-medium">Testy</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
                        <span className="font-medium text-ink">
                          {s.lastName} {s.firstName}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[13px] text-ink-2">{s.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Tag tone={ACCOUNT_TONE[s.account]} pill>
                        {ACCOUNT_LABEL[s.account]}
                      </Tag>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink">{s.average === null ? "—" : `${s.average}%`}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink">{s.exams}</td>
                    <td className="px-3 py-2 text-right">
                      <ActionMenu
                        label={`Akcje: ${s.firstName} ${s.lastName}`}
                        actions={[
                          {
                            label: s.account === "invited" ? "Wyślij zaproszenie ponownie" : "Wyślij zaproszenie",
                            hidden: s.account === "linked" || !s.email,
                            onSelect: () => invite(s),
                          },
                          { label: "Usuń z klasy…", danger: true, onSelect: () => setRemoving(s) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}

      {tab === "exams" &&
        (exams.length === 0 ? (
          <Card>
            <EmptyState
              title="Brak testów dla tej klasy"
              action={
                <Link href={`/panel/testy/nowy?group=${group.id}`} className={buttonClasses()}>
                  Nowy test
                </Link>
              }
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {exams.map((e) => (
                <li key={e.id}>
                  <Link href={`/panel/testy/${e.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-subtle/50">
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{e.title}</span>
                    <span className="text-[13px] text-ink-2">{formatDay(e.startsAt)}</span>
                    <ExamStatusTag status={e.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}

      {tab === "averages" && <Averages exams={exams.filter((e) => e.average !== undefined)} />}

      {adding && (
        <AddStudentDialog
          onClose={() => setAdding(false)}
          onAdd={add}
        />
      )}
      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        iconTone="danger"
        title={`Usunąć ${removing?.firstName} ${removing?.lastName} z klasy?`}
        description="Wyniki ucznia w zakończonych testach zostaną zachowane."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoving(null)}>
              Anuluj
            </Button>
            <Button variant="danger" onClick={() => removing && remove(removing)}>
              Usuń
            </Button>
          </>
        }
      />
      {toast}
    </>
  );
}

function Averages({ exams }: { exams: ExamSummary[] }) {
  if (exams.length === 0) {
    return (
      <Card>
        <EmptyState title="Jeszcze nie ma wyników" description="Średnie pojawią się po pierwszym zakończonym teście." mascot={false} />
      </Card>
    );
  }
  return (
    <Card className="flex max-w-3xl flex-col gap-4 p-5">
      {exams.map((e) => (
        <div key={e.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-body">
            <span className="truncate text-ink">{e.title}</span>
            <span className="font-semibold tabular-nums text-ink">{e.average}%</span>
          </div>
          <span className="relative h-2 overflow-hidden rounded-full bg-line">
            <span
              className={cn("absolute inset-y-0 left-0 rounded-full", e.average! >= GOOD_AVERAGE ? "bg-success" : e.average! >= PASSING_AVERAGE ? "bg-warning" : "bg-danger")}
              style={{ width: `${e.average}%` }}
            />
          </span>
        </div>
      ))}
    </Card>
  );
}

function AddStudentDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (s: StudentInput) => Promise<void> }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const emailInvalid = email.trim() !== "" && !isValidEmail(email);
  const valid = firstName.trim() && lastName.trim() && !emailInvalid;
  return (
    <Dialog
      open
      onClose={onClose}
      title="Dodaj ucznia"
      description="E-mail jest opcjonalny — bez niego uczeń dołączy kodem testu."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            disabled={!valid || saving}
            onClick={async () => {
              setSaving(true);
              await onAdd({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() || undefined });
              setSaving(false);
            }}
          >
            Dodaj
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Imię" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
        <TextField label="Nazwisko" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <TextField
          label="E-mail"
          type="email"
          className="sm:col-span-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailInvalid ? "Sprawdź adres e-mail." : undefined}
        />
      </div>
    </Dialog>
  );
}
