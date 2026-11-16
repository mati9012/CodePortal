import { ComingSoon } from "@/components/panel/coming-soon";

export default function Placeholder() {
  return <ComingSoon title="Szczegóły klasy jeszcze powstają" description="Lista uczniów, import CSV i historia testów — w kolejnym kroku." back={{ href: "/panel/klasy", label: "Wróć do klas" }} />;
}
