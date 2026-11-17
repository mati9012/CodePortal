import Image from "next/image";
import { cn } from "@/lib/cn";

export type BitSize = "xl" | "l" | "m" | "s";

const HEIGHT: Record<BitSize, number> = { xl: 240, l: 150, m: 84, s: 56 };
const RATIO = 1206 / 1287;

export function Bit({
  size = "m",
  className,
  preload = false,
}: {
  size?: BitSize;
  className?: string;
  preload?: boolean;
}) {
  const height = HEIGHT[size];
  const width = Math.round(height * RATIO);
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
