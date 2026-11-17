import type { ExamProblem, ResultRow } from "@codeportal/contracts";
import { REVIEW_STATUS_LABEL } from "@/lib/panel-labels";

export type GradedRow = ResultRow & { total: number; percent: number; grade: number };

const SEPARATOR = ";";
const BOM = "﻿";

const csvCell = (value: string | number) => {
  const text = String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function resultsCsv(problems: ExamProblem[], rows: GradedRow[]) {
  const header = ["Uczeń", ...problems.map((p) => `Z${p.number} (${p.max} pkt)`), "Suma", "%", "Ocena", "Ryzyko", "Sprawdzenie"];
  const lines = rows.map((r) => [r.name, ...r.scores, r.total, r.percent, r.grade, r.risk, REVIEW_STATUS_LABEL[r.review]]);
  return [header, ...lines].map((line) => line.map(csvCell).join(SEPARATOR)).join("\n");
}

export function gradebookText(rows: GradedRow[]) {
  return [...rows]
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
    .map((r) => `${r.name}\t${r.grade}`)
    .join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([BOM + csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
