"use client";

import { ChevronDown, CircleAlert } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-input border border-line bg-surface text-body text-ink placeholder:text-ink-3 " +
  "transition-[border-color,box-shadow] duration-150 " +
  "hover:border-ink-3/60 focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20 " +
  "disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-3 " +
  "aria-invalid:border-danger aria-invalid:focus:ring-danger/20";

// ── Kontrolki ───────────────────────────────────────────────────────────────

type InputProps = ComponentProps<"input"> & {
  /** Jednostka po prawej stronie pola, np. „min”. */
  suffix?: ReactNode;
  invalid?: boolean;
};

export function Input({ className, suffix, invalid, ...props }: InputProps) {
  const input = (
    <input
      aria-invalid={invalid || undefined}
      className={cn(control, "h-9 px-3", suffix && "min-w-0 rounded-r-none", className)}
      {...props}
    />
  );
  if (!suffix) return input;
  return (
    <div className="flex">
      {input}
      <span className="inline-flex items-center rounded-r-input border border-l-0 border-line bg-subtle px-3 text-[13px] text-ink-2">
        {suffix}
      </span>
    </div>
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(control, "min-h-20 resize-y px-3 py-2", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(control, "h-9 appearance-none pl-3 pr-9", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-2"
        aria-hidden
      />
    </div>
  );
}

// ── Układ pola ──────────────────────────────────────────────────────────────

type FieldMeta = {
  label?: ReactNode;
  /** Podpowiedź pod polem („Widoczna dla uczniów na ekranie wejścia.”). */
  hint?: ReactNode;
  /** Komunikat błędu — zastępuje podpowiedź i oznacza pole jako niepoprawne. */
  error?: ReactNode;
  /** Prawa strona nagłówka pola, np. licznik znaków. */
  aside?: ReactNode;
};

/**
 * Etykieta + kontrolka + podpowiedź/błąd. `id` musi być równe `id` kontrolki;
 * komunikat ma identyfikator `${id}-msg` (podaj go w aria-describedby kontrolki).
 * Zwykle wygodniej użyć TextField / SelectField / TextareaField.
 */
export function Field({
  id,
  label,
  hint,
  error,
  aside,
  className,
  children,
}: FieldMeta & { id: string; className?: string; children: ReactNode }) {
  const message = error ?? hint;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || aside) && (
        <div className="flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={id} className="text-[13px] font-semibold text-ink">
              {label}
            </label>
          )}
          {aside && <span className="text-xs tabular-nums text-ink-2">{aside}</span>}
        </div>
      )}
      {children}
      {message && (
        <p
          id={`${id}-msg`}
          className={cn("flex gap-1.5 text-xs", error ? "text-danger-ink" : "text-ink-2")}
        >
          {error && <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}

function useFieldIds(meta: FieldMeta, ownId?: string) {
  const generated = useId();
  const id = ownId ?? generated;
  return {
    id,
    describedBy: meta.error || meta.hint ? `${id}-msg` : undefined,
    invalid: Boolean(meta.error),
  };
}

/** `className` stylizuje cały blok pola, `inputClassName` — samo pole. */
export function TextField({
  label,
  hint,
  error,
  className,
  inputClassName,
  id: ownId,
  ...props
}: FieldMeta & Omit<InputProps, "invalid"> & { inputClassName?: string }) {
  const { id, describedBy, invalid } = useFieldIds({ hint, error }, ownId);
  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      <Input
        id={id}
        aria-describedby={describedBy}
        invalid={invalid}
        className={inputClassName}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  className,
  id: ownId,
  ...props
}: FieldMeta & Omit<ComponentProps<"select">, "id"> & { id?: string }) {
  const { id, describedBy, invalid } = useFieldIds({ hint, error }, ownId);
  return (
    <Field id={id} label={label} hint={hint} error={error} className={className}>
      <Select id={id} aria-describedby={describedBy} invalid={invalid} {...props} />
    </Field>
  );
}

/** Textarea z licznikiem znaków w nagłówku pola („48 / 280”). */
export function TextareaField({
  label,
  hint,
  error,
  className,
  maxLength,
  defaultValue = "",
  onChange,
  id: ownId,
  ...props
}: FieldMeta &
  Omit<ComponentProps<"textarea">, "defaultValue"> & { maxLength: number; defaultValue?: string }) {
  const { id, describedBy, invalid } = useFieldIds({ hint, error }, ownId);
  const [length, setLength] = useState(defaultValue.length);
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      aside={`${length} / ${maxLength}`}
      className={className}
    >
      <Textarea
        id={id}
        aria-describedby={describedBy}
        invalid={invalid}
        maxLength={maxLength}
        defaultValue={defaultValue}
        onChange={(e) => {
          setLength(e.target.value.length);
          onChange?.(e);
        }}
        {...props}
      />
    </Field>
  );
}
