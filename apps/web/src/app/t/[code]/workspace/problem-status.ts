import type { StudentProblem } from "@codeportal/contracts";
import type { ProblemTile } from "@/components/exam/score";

export type ProblemProgress = "submitted" | "changed" | "unsubmitted";

export const latestPoints = (problem: StudentProblem) =>
  problem.submissions.find((s) => s.points !== null)?.points ?? undefined;

export const problemTiles = (problems: StudentProblem[]): ProblemTile[] =>
  problems.map((p) => ({ number: p.number, max: p.max, score: latestPoints(p) }));

export function progressOf(problem: StudentProblem, lastEditAt: string | undefined): ProblemProgress {
  const lastSubmission = problem.submissions[0]?.submittedAt;
  if (!lastSubmission) return "unsubmitted";
  return lastEditAt && lastEditAt > lastSubmission ? "changed" : "submitted";
}
