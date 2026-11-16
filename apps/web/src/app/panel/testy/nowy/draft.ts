import { PROBLEMS, type Problem } from "@/lib/mock/panel";

/** Pozycja testu: pojedyncze zadanie albo pula („każdy uczeń losuje 1 z N”). */
export type Item =
  | { key: string; kind: "problem"; id: string; points: number }
  | { key: string; kind: "pool"; ids: string[]; points: number };

export type Protection = "loose" | "standard" | "exam";
export type Access = "code" | "list" | "password" | "sso";
export type ResultsVisibility = "immediate" | "after_end" | "after_approval";

export type Draft = {
  title: string;
  mode: "test" | "contest";
  groupId: string;
  date: string;
  time: string;
  duration: number;
  instructions: string;
  items: Item[];
  access: Access;
  password: string;
  lateJoinMin: number;
  attempts: number;
  protection: Protection;
  blockPaste: boolean;
  fullscreen: boolean;
  fullscreenExits: number;
  shuffle: boolean;
  results: ResultsVisibility;
  scoring: "best" | "last";
  /** Próg procentowy dla ocen 2…6 (rosnąco). */
  thresholds: [number, number, number, number, number];
};

export const PROTECTION_PRESET: Record<Protection, Pick<Draft, "blockPaste" | "fullscreen">> = {
  loose: { blockPaste: false, fullscreen: false },
  standard: { blockPaste: true, fullscreen: true },
  exam: { blockPaste: true, fullscreen: true },
};

export const INITIAL_DRAFT: Draft = {
  title: "",
  mode: "test",
  groupId: "",
  date: "2026-11-20",
  time: "08:55",
  duration: 45,
  instructions: "",
  items: [],
  access: "code",
  password: "",
  lateJoinMin: 10,
  attempts: 1,
  protection: "standard",
  ...PROTECTION_PRESET.standard,
  fullscreenExits: 3,
  shuffle: false,
  results: "after_approval",
  scoring: "best",
  thresholds: [30, 50, 70, 85, 95],
};

export const ACCESS_LABEL: Record<Access, string> = {
  code: "Kod lub link",
  list: "Lista uczniów klasy",
  password: "Link + hasło",
  sso: "Konto szkolne",
};

export const PROTECTION_LABEL: Record<Protection, string> = {
  loose: "Luźny",
  standard: "Standard",
  exam: "Egzamin",
};

export const GRADES = [
  { grade: 2, name: "dopuszczający" },
  { grade: 3, name: "dostateczny" },
  { grade: 4, name: "dobry" },
  { grade: 5, name: "bardzo dobry" },
  { grade: 6, name: "celujący" },
] as const;

export const problemById = (id: string): Problem => PROBLEMS.find((p) => p.id === id)!;

export const totalPoints = (items: Item[]) => items.reduce((n, i) => n + i.points, 0);

export const usedProblemIds = (items: Item[]) =>
  new Set(items.flatMap((i) => (i.kind === "problem" ? [i.id] : i.ids)));
