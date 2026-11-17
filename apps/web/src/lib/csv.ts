export type CsvTable = { separator: string; rows: string[][] };

const SEPARATORS = [";", ",", "\t"];

function detectSeparator(firstLine: string) {
  return SEPARATORS.reduce((best, sep) => (firstLine.split(sep).length > firstLine.split(best).length ? sep : best));
}

function splitLine(line: string, separator: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"' && quoted && line[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === separator && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

export function parseCsv(text: string): CsvTable {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  const separator = detectSeparator(lines[0] ?? "");
  return { separator, rows: lines.map((l) => splitLine(l, separator)) };
}
