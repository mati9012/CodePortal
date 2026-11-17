import type { Metadata } from "next";
import { TestWizard } from "./wizard";

export const metadata: Metadata = { title: "Nowy test · CodePortal" };

export default function NewTestPage() {
  return <TestWizard />;
}
