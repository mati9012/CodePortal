import type { ReactNode } from "react";
import { Card } from "@/components/ui/surface";

export function WizardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-h3 text-ink">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-ink-2">{description}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  );
}
