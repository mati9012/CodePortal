import type { TeacherNotice } from "@codeportal/contracts";
import { Clock, Hourglass, Lock, Maximize, MessageSquare, PlusCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { formatTime } from "@/components/panel/format";
import { Button } from "@/components/ui/button";
import { ModalBackdrop, ModalPanel } from "@/components/ui/feedback";

function BlockingModal(props: ComponentProps<typeof ModalPanel>) {
  return (
    <ModalBackdrop>
      <ModalPanel {...props} />
    </ModalBackdrop>
  );
}

export function FullscreenExitModal({ used, limit, onReturn }: { used: number; limit: number; onReturn: () => void }) {
  return (
    <BlockingModal
      icon={<Maximize />}
      title="Wyszedłeś z pełnego ekranu"
      description={
        used > 0 ? (
          <>
            Zdarzenie zapisane. <strong className="text-ink">Wyjście nr {used}</strong> z dozwolonych {limit}. Czas testu
            nadal płynie.
          </>
        ) : (
          "Test działa tylko w trybie pełnoekranowym. Czas testu płynie."
        )
      }
      footer={<Button onClick={onReturn}>Wróć do pełnego ekranu</Button>}
    />
  );
}

export function WaitingModal() {
  return (
    <BlockingModal
      icon={<Hourglass />}
      iconTone="danger"
      title="Czekasz na decyzję nauczyciela"
      description="Przekroczyłeś limit wyjść z pełnego ekranu. Nauczyciel zobaczył to w panelu i zdecyduje, czy wpuścić cię ponownie. Czas testu nadal płynie."
    />
  );
}

export function NoticeModal({
  notice,
  deadlineAt,
  onClose,
}: {
  notice: TeacherNotice;
  deadlineAt: string | null;
  onClose: () => void;
}) {
  if (notice.kind === "time")
    return (
      <BlockingModal
        icon={<PlusCircle />}
        iconTone="success"
        title={`Masz ${notice.minutes} min więcej`}
        description={
          <>
            Nauczyciel wydłużył twój czas.
            {deadlineAt && (
              <>
                {" "}
                Nowy koniec testu: <strong className="font-mono text-ink">{formatTime(deadlineAt)}</strong>.
              </>
            )}
          </>
        }
        footer={<Button onClick={onClose}>OK, kontynuuję</Button>}
      />
    );
  return (
    <BlockingModal
      icon={<MessageSquare />}
      iconTone="info"
      title="Wiadomość od nauczyciela"
      description={notice.text}
      footer={<Button onClick={onClose}>OK</Button>}
    />
  );
}

export function TeacherEndedModal({ onContinue }: { onContinue: () => void }) {
  return (
    <BlockingModal
      icon={<Lock />}
      iconTone="info"
      title="Nauczyciel zakończył test"
      description="Ostatnie wersje kodu zostały zgłoszone automatycznie. Edytor jest zablokowany."
      footer={<Button onClick={onContinue}>Przejdź do podsumowania</Button>}
    />
  );
}

export function TimeUpModal({ onContinue }: { onContinue: () => void }) {
  return (
    <BlockingModal
      icon={<Clock />}
      iconTone="info"
      title="Czas minął"
      description="Ostatnie wersje kodu zostały zgłoszone automatycznie i czekają na ocenę."
      footer={<Button onClick={onContinue}>Zobacz podsumowanie</Button>}
    />
  );
}
