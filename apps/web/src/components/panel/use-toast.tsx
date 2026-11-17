"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Toast, type FeedbackTone } from "@/components/ui/feedback";

const TOAST_VISIBLE_MS = 4000;

type ToastMessage = { id: number; title: ReactNode; body?: ReactNode; tone?: FeedbackTone };

export function useToast() {
  const [message, setMessage] = useState<ToastMessage | null>(null);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), TOAST_VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [message]);

  const show = useCallback((title: ReactNode, body?: ReactNode, tone?: FeedbackTone) => {
    setMessage({ id: Date.now(), title, body, tone });
  }, []);

  const toast = message && (
    <div className="fixed inset-x-4 bottom-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6">
      <Toast key={message.id} tone={message.tone} title={message.title} onClose={() => setMessage(null)}>
        {message.body}
      </Toast>
    </div>
  );

  return { show, toast };
}
