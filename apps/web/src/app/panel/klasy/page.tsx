import type { Metadata } from "next";
import { GroupList } from "./group-list";

export const metadata: Metadata = { title: "Klasy i grupy · CodePortal" };

export default function GroupsPage() {
  return <GroupList />;
}
