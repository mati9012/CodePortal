import type { Metadata } from "next";
import { DashboardView } from "./dashboard";

export const metadata: Metadata = { title: "Pulpit · CodePortal" };

export default function DashboardPage() {
  return <DashboardView />;
}
