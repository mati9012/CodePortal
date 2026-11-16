import type { ReactNode } from "react";

export function AuthHeading({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-h2 font-bold text-ink">{title}</h1>
      {children && <p className="mt-2 text-body text-ink-2">{children}</p>}
    </div>
  );
}
