"use client";

import type { LiveCode, LiveParticipant } from "@codeportal/contracts";
import { Clock, Code2, MessageSquare, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { CodeView } from "@/components/panel/code-view";
import { Dialog } from "@/components/panel/dialog";
import { formatTime } from "@/components/panel/format";
import { Button } from "@/components/ui/button";
import { Input, Select, TextField, TextareaField } from "@/components/ui/field";
import { SegmentedControl } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api";

const MINUTE_PRESETS = [5, 10, 15];
const DEFAULT_EXTRA_MIN = 10;
const MAX_EXTRA_MIN = 120;
const END_CONFIRMATION = "ZAKOŃCZ";
const CODE_REFRESH_MS = 5000;

export function AddTimeDialog({
  open,
  preselected,
  participants,
  endsAt,
  onClose,
  onConfirm,
}: {
  open: boolean;
  preselected: string[];
  participants: LiveParticipant[];
  endsAt: Date;
  onClose: () => void;
  onConfirm: (ids: string[] | "all", minutes: number, reason: string) => void;
}) {
  if (!open) return null;
  return (
    <AddTimeForm
      preselected={preselected}
      participants={participants}
      endsAt={endsAt}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function AddTimeForm({
  preselected,
  participants,
  endsAt,
  onClose,
  onConfirm,
}: Omit<Parameters<typeof AddTimeDialog>[0], "open">) {
  const [scope, setScope] = useState<"all" | "selected">(preselected.length ? "selected" : "all");
  const [selected, setSelected] = useState(preselected);
  const [minutes, setMinutes] = useState(DEFAULT_EXTRA_MIN);
  const [reason, setReason] = useState("");

  const chosen = participants.filter((p) => selected.includes(p.id));
  const available = participants.filter((p) => !selected.includes(p.id));
  const newEnd = new Date(endsAt.getTime() + minutes * 60_000);
  const valid = minutes > 0 && minutes <= MAX_EXTRA_MIN && (scope === "all" || chosen.length > 0);

  return (
    <Dialog
      open
      onClose={onClose}
      title="Dodaj czas"
      icon={<Clock />}
      iconTone="info"
      className="max-w-lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button disabled={!valid} onClick={() => onConfirm(scope === "all" ? "all" : selected, minutes, reason.trim())}>
            Dodaj {minutes} min
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          aria-label="Komu dodać czas"
          value={scope}
          onChange={(v) => setScope(v as "all" | "selected")}
          options={[
            { value: "all", label: "Wszystkim", count: participants.length },
            { value: "selected", label: "Wybranym", count: chosen.length },
          ]}
        />

        {scope === "selected" && (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-ink">Uczniowie</span>
            {chosen.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {chosen.map((p) => (
                  <li key={p.id} className="inline-flex h-7 items-center gap-1 rounded-full bg-accent-soft pl-3 pr-1 text-[13px] font-medium text-accent-ink">
                    {p.name}
                    <button
                      type="button"
                      aria-label={`Usuń: ${p.name}`}
                      onClick={() => setSelected((ids) => ids.filter((id) => id !== p.id))}
                      className="inline-flex size-5 items-center justify-center rounded-full hover:bg-accent/15"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Select
              aria-label="Dodaj ucznia"
              value=""
              onChange={(e) => e.target.value && setSelected((ids) => [...ids, e.target.value])}
            >
              <option value="">Dodaj ucznia…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink">Ile minut</span>
          <div className="flex flex-wrap items-center gap-2">
            {MINUTE_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                className={cn(
                  "h-9 rounded-input border px-3 text-[13px] font-medium tabular-nums transition-colors",
                  minutes === m ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-ink-2 hover:text-ink",
                )}
              >
                +{m}
              </button>
            ))}
            <div className="w-28">
              <Input
                type="number"
                min={1}
                max={MAX_EXTRA_MIN}
                value={minutes || ""}
                onChange={(e) => setMinutes(Number(e.target.value))}
                suffix="min"
                aria-label="Liczba minut"
              />
            </div>
          </div>
        </div>

        <TextField
          label="Powód"
          hint="Widoczny w dzienniku zdarzeń."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="np. dostosowanie wymagań – opinia PPP"
        />

        <p className="text-[13px] text-ink-2">
          Nowy koniec {scope === "all" ? "dla wszystkich" : "dla wybranych"}: <b className="text-ink">{formatTime(newEnd)}</b>. Uczniowie
          zobaczą powiadomienie.
        </p>
      </div>
    </Dialog>
  );
}

export function EndExamDialog({
  open,
  title,
  activeCount,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  activeCount: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const close = () => {
    setTyped("");
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      icon={<TriangleAlert />}
      iconTone="danger"
      title={`Zakończyć „${title}”?`}
      description={`${activeCount} uczniów jest w trakcie. Ich ostatnie wersje kodu zostaną zgłoszone automatycznie. Tej operacji nie można cofnąć.`}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Anuluj
          </Button>
          <Button
            variant="danger"
            disabled={typed.trim().toUpperCase() !== END_CONFIRMATION}
            onClick={() => {
              setTyped("");
              onConfirm();
            }}
          >
            Zakończ test dla wszystkich
          </Button>
        </>
      }
    >
      <TextField
        label={
          <>
            Wpisz <span className="font-mono">{END_CONFIRMATION}</span>, aby potwierdzić
          </>
        }
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        autoFocus
      />
    </Dialog>
  );
}

export function EndSessionDialog({
  participant,
  onClose,
  onConfirm,
}: {
  participant: LiveParticipant;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open
      onClose={onClose}
      icon={<TriangleAlert />}
      iconTone="danger"
      title={`Zakończyć sesję: ${participant.name}?`}
      description="Ostatnia wersja kodu zostanie zgłoszona, a uczeń nie będzie mógł już nic zmienić."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Zakończ sesję
          </Button>
        </>
      }
    />
  );
}

export function MessageDialog({
  participant,
  onClose,
  onSend,
}: {
  participant: LiveParticipant;
  onClose: () => void;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <Dialog
      open
      onClose={onClose}
      icon={<MessageSquare />}
      iconTone="info"
      title={`Wiadomość do: ${participant.name}`}
      description="Uczeń zobaczy ją jako powiadomienie nad edytorem."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button disabled={!text.trim()} onClick={() => onSend(text.trim())}>
            Wyślij
          </Button>
        </>
      }
    >
      <TextareaField label="Treść" value={text} onChange={(e) => setText(e.target.value)} maxLength={280} autoFocus />
    </Dialog>
  );
}

export function LiveCodeDialog({
  examId,
  participant,
  onClose,
}: {
  examId: string;
  participant: LiveParticipant;
  onClose: () => void;
}) {
  const { data, error } = useApi<LiveCode>(`/panel/exams/${examId}/sessions/${participant.sessionId}/code`, {
    refreshInterval: CODE_REFRESH_MS,
  });
  const problem = data?.problemNumber ?? participant.activeProblem;
  return (
    <Dialog
      open
      onClose={onClose}
      icon={<Code2 />}
      iconTone="info"
      className="max-w-2xl"
      title={participant.name}
      description={`${problem ? `Zadanie ${problem} · ` : ""}podgląd tylko do odczytu, odświeża się co kilka sekund.`}
      footer={<Button onClick={onClose}>Zamknij</Button>}
    >
      {error ? (
        <p className="text-body text-danger-ink">{error.message}</p>
      ) : !data ? (
        <p className="text-body text-ink-2">Wczytywanie kodu…</p>
      ) : data.code ? (
        <CodeView code={data.code} />
      ) : (
        <p className="text-body text-ink-2">Uczeń nie napisał jeszcze żadnego kodu.</p>
      )}
    </Dialog>
  );
}
