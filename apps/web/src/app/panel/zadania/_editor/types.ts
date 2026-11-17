import type { ProblemDetail } from "@codeportal/contracts";

export type EditorTabProps = {
  detail: ProblemDetail;
  update: (change: (d: ProblemDetail) => Partial<ProblemDetail>) => void;
  errors: Partial<Record<"title" | "statement" | "weights", string>>;
};
