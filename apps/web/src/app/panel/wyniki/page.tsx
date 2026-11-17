import type { Metadata } from "next";
import { ResultsOverview } from "./results-overview";

export const metadata: Metadata = { title: "Wyniki · CodePortal" };

export default function ResultsPage() {
  return <ResultsOverview />;
}
