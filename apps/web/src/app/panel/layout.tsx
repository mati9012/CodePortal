import { AppShell } from "@/components/panel/app-shell";

export default function PanelLayout({ children }: LayoutProps<"/panel">) {
  return <AppShell>{children}</AppShell>;
}
