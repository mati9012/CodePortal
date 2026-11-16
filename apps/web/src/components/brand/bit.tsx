import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Maskotka Bit. Rozmiary z design systemu:
 *  XL 240 — hero, logowanie, końcowe CTA
 *  L  150 — sukces, powitanie
 *  M   84 — puste stany
 *  S   56 — checklista, toasty
 *
 * Bita NIE używamy: w widoku zadania i podczas testu, przy ostrzeżeniach
 * (pełny ekran, wklejanie), w raporcie samodzielności i przy ryzyku,
 * w błędach systemowych i przy ocenach ucznia.
 */
export type BitSize = "xl" | "l" | "m" | "s";

const HEIGHT: Record<BitSize, number> = { xl: 240, l: 150, m: 84, s: 56 };
// Proporcje przyciętej grafiki (1206 × 1287).
const RATIO = 1206 / 1287;

export function Bit({
  size = "m",
  className,
  preload = false,
}: {
  size?: BitSize;
  className?: string;
  /** Tylko dla Bita widocznego od razu nad zgięciem (hero, logowanie). */
  preload?: boolean;
}) {
  const height = HEIGHT[size];
  const width = Math.round(height * RATIO);
  // Do 150 px wystarcza wersja 480 px (2× dla ekranów retina).
  const src = size === "xl" ? "/brand/bit.webp" : "/brand/bit-480.webp";
  return (
    <Image
      src={src}
      alt=""
      width={width}
      height={height}
      preload={preload}
      className={cn("select-none", className)}
      draggable={false}
    />
  );
}
