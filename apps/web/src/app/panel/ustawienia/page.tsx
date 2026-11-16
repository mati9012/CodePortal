import type { Metadata } from "next";
import { PageHeader } from "@/components/panel/page-header";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Ustawienia · CodePortal" };

/** G1 · Profil, wygląd i domyślne ustawienia testów. */
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Ustawienia" crumbs={[{ href: "/panel", label: "Pulpit" }]} />
      <SettingsForm />
    </>
  );
}
