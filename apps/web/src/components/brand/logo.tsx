import { cn } from "@/lib/cn";

/** Znak `</>` w niebieskim zaokrąglonym kwadracie. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="cp-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4C74FF" />
          <stop offset="1" stopColor="#2447E0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#cp-logo-bg)" />
      <path
        d="M12.5 11 7.5 16l5 5M19.5 11l5 5-5 5M17.6 9.5l-3.2 13"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="font-display text-[15px] font-bold tracking-tight text-ink">CodePortal</span>
    </span>
  );
}
