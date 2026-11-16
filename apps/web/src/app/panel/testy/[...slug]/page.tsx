import { ComingSoon } from "@/components/panel/coming-soon";

export default function Placeholder() {
  return <ComingSoon title="Ten widok jeszcze powstaje" description="Kreator testu, szczegóły i panel na żywo dojdą w kolejnych krokach." back={{ href: "/panel/testy", label: "Wróć do testów" }} />;
}
