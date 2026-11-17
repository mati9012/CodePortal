import { ArrowUp, Check, CircleHelp, ClipboardX, Clock, Copy, Minimize2, Pause, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { SignalKind } from "@/lib/mock/exam-session";

const SIGNAL_META: Record<SignalKind, { icon: ReactNode; tone: string; label: string }> = {
  paste: { icon: <ClipboardX />, tone: "bg-danger-soft text-danger-ink", label: "Wklejenie" },
  jump: { icon: <TrendingUp />, tone: "bg-accent-soft text-accent-ink", label: "Skok kodu" },
  fullscreen: { icon: <Minimize2 />, tone: "bg-warning-soft text-warning-ink", label: "Pełny ekran" },
  similarity: { icon: <Copy />, tone: "bg-pink-soft text-pink-ink", label: "Podobieństwo" },
  idle: { icon: <Pause />, tone: "bg-subtle text-ink-2", label: "Bezczynność" },
  submit: { icon: <ArrowUp />, tone: "bg-accent-soft text-accent-ink", label: "Zgłoszenie" },
  finish: { icon: <Check />, tone: "bg-success-soft text-success-ink", label: "Zakończenie" },
  time: { icon: <Clock />, tone: "bg-accent-soft text-accent-ink", label: "Dodany czas" },
  question: { icon: <CircleHelp />, tone: "bg-subtle text-ink-2", label: "Pytanie kontrolne" },
};

export function SignalBadge({ kind, className }: { kind: SignalKind; className?: string }) {
  const meta = SIGNAL_META[kind];
  return (
    <span
      title={meta.label}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-input [&_svg]:size-4",
        meta.tone,
        className,
      )}
    >
      {meta.icon}
    </span>
  );
}
