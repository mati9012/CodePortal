"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const COPIED_FEEDBACK_MS = 1500;

export function CopyButton({ value, label, children }: { value: string; label: string; children?: string }) {
  const [copied, setCopied] = useState(false);
  const icon = copied ? <Check className="text-success-ink" /> : <Copy />;
  return (
    <Button
      variant="secondary"
      size={children ? "md" : "sm"}
      aria-label={children ? undefined : label}
      title={label}
      icon={children ? icon : undefined}
      className={children ? "shrink-0" : "w-8 shrink-0 px-0"}
      onClick={async () => {
        await navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
      }}
    >
      {children ? (copied ? "Skopiowano" : children) : icon}
    </Button>
  );
}
