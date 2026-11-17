import type { Metadata } from "next";
import { emptyProblemDetail } from "@/lib/mock/problem-detail";
import { ProblemEditor } from "../_editor/problem-editor";

export const metadata: Metadata = { title: "Nowe zadanie · CodePortal" };

export default function NewProblemPage() {
  return <ProblemEditor initial={emptyProblemDetail()} isNew />;
}
