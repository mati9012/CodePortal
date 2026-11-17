"use client";

import type { GroupDetail, ImportResult, StudentInput } from "@codeportal/contracts";
import { FileSpreadsheet, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, type DragEvent } from "react";
import { Bit } from "@/components/brand/bit";
import { PageHeader } from "@/components/panel/page-header";
import { QueryView } from "@/components/panel/query-view";
import { Button, buttonClasses } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Banner } from "@/components/ui/feedback";
import { Select } from "@/components/ui/field";
import { Stepper, type StepState } from "@/components/ui/stepper";
import { Card, Tag } from "@/components/ui/surface";
import { api, errorMessage, useApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { parseCsv, type CsvTable } from "@/lib/csv";
import { isValidEmail } from "@/lib/email";
import { pluralPl } from "@/lib/plural";
import { SAMPLE_CSV, SAMPLE_CSV_NAME } from "./sample-csv";

type Field = "lastName" | "firstName" | "email" | "skip";

const FIELD_LABEL: Record<Field, string> = {
  lastName: "Nazwisko",
  firstName: "Imię",
  email: "E-mail",
  skip: "Pomiń kolumnę",
};

const HEADER_GUESS: [RegExp, Field][] = [
  [/nazwisk/i, "lastName"],
  [/imi/i, "firstName"],
  [/mail/i, "email"],
];

const STEPS = ["Plik", "Mapowanie i podgląd", "Potwierdzenie"];

type RowStatus = "ok" | "no-email" | "bad-email" | "missing-name" | "duplicate";

const ROW_STATUS: Record<RowStatus, { label: string; tone: "success" | "warning" | "danger"; imported: boolean }> = {
  ok: { label: "OK", tone: "success", imported: true },
  "no-email": { label: "OK – bez e-maila", tone: "success", imported: true },
  "bad-email": { label: "Błędny e-mail", tone: "danger", imported: false },
  "missing-name": { label: "Brak imienia lub nazwiska", tone: "danger", imported: false },
  duplicate: { label: "Duplikat", tone: "warning", imported: false },
};

type SourceFile = { name: string; table: CsvTable };

function rowStatus(lastName: string, firstName: string, email: string, existing: Set<string>): RowStatus {
  if (!lastName || !firstName) return "missing-name";
  if (existing.has(`${lastName} ${firstName}`.toLowerCase())) return "duplicate";
  if (!email) return "no-email";
  return isValidEmail(email) ? "ok" : "bad-email";
}

function guessMapping(header: string[]): Field[] {
  return header.map((h) => HEADER_GUESS.find(([pattern]) => pattern.test(h))?.[1] ?? "skip");
}

export function CsvImportView({ id }: { id: string }) {
  const query = useApi<GroupDetail>(`/panel/groups/${id}`);
  return <QueryView query={query}>{(detail) => <CsvImport detail={detail} reload={() => query.mutate()} />}</QueryView>;
}

function CsvImport({ detail, reload }: { detail: GroupDetail; reload: () => Promise<unknown> }) {
  const { group } = detail;
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<SourceFile | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<Field[]>([]);
  const [readError, setReadError] = useState<string | null>(null);
  const [imported, setImported] = useState<ImportResult>({ imported: 0, invited: 0, skipped: 0 });
  const [importError, setImportError] = useState<string | null>(null);

  const importStudents = async (students: StudentInput[]) => {
    try {
      const result = await api<ImportResult>(`/panel/groups/${group.id}/students/import`, { body: { students } });
      await reload();
      setImportError(null);
      setImported(result);
      setStep(2);
    } catch (err) {
      setImportError(errorMessage(err));
    }
  };

  const load = (name: string, text: string) => {
    const table = parseCsv(text);
    if (table.rows.length === 0) {
      setReadError("Plik jest pusty.");
      return;
    }
    setReadError(null);
    setFile({ name, table });
    setMapping(guessMapping(table.rows[0]!));
    setStep(1);
  };

  const states: StepState[] = STEPS.map((_, i) => (i < step ? "done" : i === step ? "current" : "upcoming"));

  return (
    <>
      <PageHeader
        title="Import uczniów z CSV"
        description={`Do: ${group.name}. Eksport z dziennika (np. Librus, Vulcan) albo arkusz zapisany jako CSV.`}
        crumbs={[
          { href: "/panel/klasy", label: "Klasy i grupy" },
          { href: `/panel/klasy/${group.id}`, label: group.name },
        ]}
      />
      <Stepper steps={STEPS.map((label, i) => ({ label, state: states[i]! }))} className="mb-6 max-sm:[&_li>span:last-child]:hidden" />

      {step === 0 && <FileStep error={readError} onLoad={load} onError={setReadError} />}
      {step === 1 && file && (
        <MappingStep
          detail={detail}
          error={importError}
          file={file}
          hasHeader={hasHeader}
          setHasHeader={setHasHeader}
          mapping={mapping}
          setMapping={setMapping}
          onBack={() => setStep(0)}
          onImport={importStudents}
        />
      )}
      {step === 2 && (
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <Bit size="l" />
          <h2 className="font-display text-h2 text-ink">Zaimportowano {imported.imported} {pluralPl(imported.imported, "ucznia", "uczniów", "uczniów")}</h2>
          <p className="max-w-md text-body text-ink-2">
            {imported.invited > 0
              ? `${imported.invited} z nich dostało zaproszenie e-mailem. Pozostali dołączą do testów kodem.`
              : "Uczniowie dołączą do testów kodem."}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href={`/panel/klasy/${group.id}`} className={buttonClasses()}>
              Przejdź do {group.name}
            </Link>
            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setStep(0);
              }}
            >
              Importuj kolejny plik
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

function FileStep({
  error,
  onLoad,
  onError,
}: {
  error: string | null;
  onLoad: (name: string, text: string) => void;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const read = async (f: File | undefined) => {
    if (!f) return;
    if (!/\.(csv|txt)$/i.test(f.name)) {
      onError("To nie jest plik CSV. W arkuszu wybierz „Zapisz jako → CSV”.");
      return;
    }
    onLoad(f.name, await f.text());
  };

  const drop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void read(e.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <Banner tone="danger">{error}</Banner>}
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={drop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-card border-2 border-dashed px-6 py-14 text-center transition-colors",
          over ? "border-accent bg-accent-soft/60" : "border-line bg-surface hover:border-ink-3/60",
        )}
      >
        <span className="inline-flex size-12 items-center justify-center rounded-card bg-accent-soft text-accent-ink [&_svg]:size-6">
          <Upload />
        </span>
        <span className="text-body font-semibold text-ink">Przeciągnij plik CSV albo kliknij, aby wybrać</span>
        <span className="text-[13px] text-ink-2">Kolumny: nazwisko, imię i opcjonalnie e-mail. Separator ; lub , · kodowanie UTF-8.</span>
      </button>
      <input
        ref={input}
        type="file"
        accept=".csv,.txt,text/csv"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void read(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-2">
        <FileSpreadsheet className="size-4" aria-hidden />
        Nie masz pliku pod ręką?
        <Button variant="secondary" size="sm" icon={<FileText />} onClick={() => onLoad(SAMPLE_CSV_NAME, SAMPLE_CSV)}>
          Użyj przykładowego pliku
        </Button>
      </div>
    </div>
  );
}

function MappingStep({
  detail,
  error,
  file,
  hasHeader,
  setHasHeader,
  mapping,
  setMapping,
  onBack,
  onImport,
}: {
  detail: GroupDetail;
  error: string | null;
  file: SourceFile;
  hasHeader: boolean;
  setHasHeader: (v: boolean) => void;
  mapping: Field[];
  setMapping: (m: Field[]) => void;
  onBack: () => void;
  onImport: (students: StudentInput[]) => Promise<void>;
}) {
  const [importing, setImporting] = useState(false);
  const existing = useMemo(
    () => new Set(detail.students.map((s) => `${s.lastName} ${s.firstName}`.toLowerCase())),
    [detail.students],
  );
  const dataRows = hasHeader ? file.table.rows.slice(1) : file.table.rows;
  const columns = Math.max(...file.table.rows.map((r) => r.length));
  const column = (field: Field) => mapping.indexOf(field);
  const mappedTwice = (["lastName", "firstName", "email"] as Field[]).filter((f) => mapping.filter((m) => m === f).length > 1);
  const namesMapped = column("lastName") !== -1 && column("firstName") !== -1;

  const rows = dataRows.map((cells) => {
    const lastName = cells[column("lastName")] ?? "";
    const firstName = cells[column("firstName")] ?? "";
    const email = column("email") === -1 ? "" : (cells[column("email")] ?? "");
    const status = rowStatus(lastName, firstName, email, existing);
    return { cells, status, firstName, lastName, email };
  });

  const importable = rows.filter((r) => ROW_STATUS[r.status].imported);
  const skipped = rows.filter((r) => r.status === "duplicate").length;
  const failed = rows.length - importable.length - skipped;
  const problems = rows
    .map((r, i) => ({ ...r, line: i + (hasHeader ? 2 : 1) }))
    .filter((r) => !ROW_STATUS[r.status].imported);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <span className="inline-flex size-10 items-center justify-center rounded-input bg-subtle text-ink-2 [&_svg]:size-5">
          <FileText />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{file.name}</p>
          <p className="text-xs text-ink-2">
            {file.table.rows.length} wierszy · separator „{file.table.separator === "\t" ? "tab" : file.table.separator}” · UTF-8
          </p>
        </div>
        <Checkbox label="Pierwszy wiersz to nagłówek" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} />
        <Button variant="secondary" size="sm" onClick={onBack}>
          Zmień plik
        </Button>
      </Card>

      {!namesMapped && <Banner tone="danger">Wskaż kolumny z nazwiskiem i imieniem.</Banner>}
      {mappedTwice.length > 0 && (
        <Banner tone="danger">
          Ta sama rola przypisana do dwóch kolumn: {mappedTwice.map((f) => FIELD_LABEL[f]).join(", ")}.
        </Banner>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-body">
          <thead className="border-b border-line bg-subtle/60 text-xs text-ink-2">
            <tr>
              <th className="w-10 px-3 py-2.5 font-medium">#</th>
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} className="px-2 py-2 font-medium">
                  <Select
                    aria-label={`Kolumna ${i + 1}`}
                    value={mapping[i] ?? "skip"}
                    onChange={(e) => {
                      const next = [...mapping];
                      next[i] = e.target.value as Field;
                      setMapping(next);
                    }}
                    className="h-8 text-[13px]"
                  >
                    {(Object.keys(FIELD_LABEL) as Field[]).map((f) => (
                      <option key={f} value={f}>
                        {FIELD_LABEL[f]}
                      </option>
                    ))}
                  </Select>
                </th>
              ))}
              <th className="px-3 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr
                key={i}
                className={cn(
                  r.status === "bad-email" || r.status === "missing-name" ? "bg-danger-soft/60" : r.status === "duplicate" && "bg-warning-soft/60",
                )}
              >
                <td className="px-3 py-2 tabular-nums text-ink-3">{i + 1}</td>
                {Array.from({ length: columns }, (_, c) => (
                  <td
                    key={c}
                    className={cn(
                      "px-3 py-2",
                      mapping[c] === "skip" ? "text-ink-3" : "text-ink",
                      mapping[c] === "email" && r.status === "bad-email" && "text-danger-ink",
                    )}
                  >
                    {r.cells[c] || "—"}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <Tag tone={ROW_STATUS[r.status].tone} pill>
                    {ROW_STATUS[r.status].label}
                  </Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {error && (
        <Banner tone="danger" title="Nie zaimportowano.">
          {error}
        </Banner>
      )}

      {problems.length > 0 && namesMapped && (
        <Banner tone="warning" title={`${problems.length} ${pluralPl(problems.length, "wiersz wymaga", "wiersze wymagają", "wierszy wymaga")} uwagi.`}>
          {problems.map((p) => `Wiersz ${p.line}: ${ROW_STATUS[p.status].label.toLowerCase()}`).join(". ")}. Te wiersze zostaną
          pominięte.
        </Banner>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[13px] text-ink-2">
          {importable.length} do zaimportowania · {skipped} {pluralPl(skipped, "pominięty", "pominięte", "pominiętych")} · {failed} z błędem
        </span>
        <span className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={onBack}>
            Wstecz
          </Button>
          <Button
            disabled={importing || !namesMapped || mappedTwice.length > 0 || importable.length === 0}
            onClick={async () => {
              setImporting(true);
              await onImport(importable.map((r) => ({ firstName: r.firstName, lastName: r.lastName, email: r.email || undefined })));
              setImporting(false);
            }}
          >
            Importuj {importable.length} {pluralPl(importable.length, "ucznia", "uczniów", "uczniów")}
          </Button>
        </span>
      </div>
    </div>
  );
}
