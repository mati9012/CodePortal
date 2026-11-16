import type { Metadata } from "next";
import { TestWizard } from "./wizard";

export const metadata: Metadata = { title: "Nowy test · CodePortal" };

/** F3 · Kreator testu (4 kroki) → F4 opublikowano. */
export default function NewTestPage() {
  return <TestWizard />;
}
