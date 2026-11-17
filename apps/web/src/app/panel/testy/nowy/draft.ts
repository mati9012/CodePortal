import type { ExamDraft, ExamItem, ProblemSummary, Protection } from "@codeportal/contracts";
import { useApi } from "@/lib/api";

export type Item = ExamItem;
export type Draft = ExamDraft;

export const PROTECTION_PRESET: Record<Protection, Pick<Draft, "blockPaste" | "fullscreen">> = {
  loose: { blockPaste: false, fullscreen: false },
  standard: { blockPaste: true, fullscreen: true },
  exam: { blockPaste: true, fullscreen: true },
};

const DEFAULT_TIME = "08:00";
const DAY_MS = 24 * 60 * 60 * 1000;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const initialDraft = (now: number): Draft => ({
  title: "",
  mode: "test",
  groupId: "",
  date: isoDay(now + DAY_MS),
  time: DEFAULT_TIME,
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
});

export const GRADES = [
  { grade: 2, name: "dopuszczający" },
  { grade: 3, name: "dostateczny" },
  { grade: 4, name: "dobry" },
  { grade: 5, name: "bardzo dobry" },
  { grade: 6, name: "celujący" },
] as const;

export function useProblemBank() {
  const { data = [] } = useApi<ProblemSummary[]>("/panel/problems");
  const byId = new Map(data.map((p) => [p.id, p]));
  return { problems: data, problemById: (id: string) => byId.get(id) };
}

export const totalPoints = (items: Item[]) => items.reduce((n, i) => n + i.points, 0);

export const usedProblemIds = (items: Item[]) =>
  new Set(items.flatMap((i) => (i.kind === "problem" ? [i.id] : i.ids)));
