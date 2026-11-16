import { ComingSoon } from "@/components/panel/coming-soon";

export default function Placeholder() {
  return <ComingSoon title="Edytor zadania jeszcze powstaje" description="Treść, testy, ustawienia i rozwiązanie wzorcowe — w kolejnym kroku." back={{ href: "/panel/zadania", label: "Wróć do banku zadań" }} />;
}
