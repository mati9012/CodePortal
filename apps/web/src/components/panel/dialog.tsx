"use client";

import { useEffect, type ComponentProps } from "react";
import { ModalBackdrop, ModalPanel } from "@/components/ui/feedback";

type DialogProps = ComponentProps<typeof ModalPanel> & { open: boolean; onClose: () => void };

export function Dialog({ open, onClose, ...panel }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <ModalBackdrop onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <ModalPanel {...panel} />
    </ModalBackdrop>
  );
}
