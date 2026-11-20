"use client";

import { useRouter } from "next/navigation";
import { Fragment, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Bit } from "@/components/brand/bit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { cn } from "@/lib/cn";

const CODE_LENGTH = 6;
const GROUP_LENGTH = 3;
const VALID_CHAR = /^[A-Z0-9]$/;
const SEPARATORS = /[\s-]/g;

const listPositions = (positions: number[]) => {
  const numbers = positions.map((p) => p + 1);
  return numbers.length === 1 ? `znak ${numbers[0]}` : `znaki ${numbers.slice(0, -1).join(", ")} i ${numbers.at(-1)}`;
};

export function CodeBoxes() {
  const router = useRouter();
  const [chars, setChars] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [invalid, setInvalid] = useState<number[]>([]);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const complete = chars.every(Boolean);

  const fillFrom = (start: number, text: string) => {
    const typed = text.toUpperCase().replace(SEPARATORS, "").slice(0, CODE_LENGTH - start).split("");
    if (typed.length === 0) return;
    setChars((current) => current.map((c, i) => (i >= start && i < start + typed.length ? typed[i - start] : c)));
    setInvalid([]);
    boxes.current[Math.min(start + typed.length, CODE_LENGTH - 1)]?.focus();
  };

  const onKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !chars[index] && index > 0) {
      e.preventDefault();
      setChars((current) => current.map((c, i) => (i === index - 1 ? "" : c)));
      boxes.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft") boxes.current[index - 1]?.focus();
    if (e.key === "ArrowRight") boxes.current[index + 1]?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const wrong = chars.flatMap((c, i) => (VALID_CHAR.test(c) ? [] : [i]));
    if (wrong.length) {
      setInvalid(wrong);
      return;
    }
    router.push(`/t/${chars.slice(0, GROUP_LENGTH).join("")}-${chars.slice(GROUP_LENGTH).join("")}`);
  };

  return (
    <Card className="mx-auto w-full max-w-md p-6 text-center sm:p-8">
      <Bit size="m" preload className="mx-auto" />
      <h1 className="mt-4 font-display text-h2 text-ink">Dołącz do testu</h1>
      <p className="mt-2 text-body text-ink-2">Wpisz 6-znakowy kod od nauczyciela lub z ekranu rzutnika.</p>
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2" role="group" aria-label="Kod testu">
          {chars.map((char, i) => (
            <Fragment key={i}>
              {i === GROUP_LENGTH && (
                <span className="text-ink-3" aria-hidden>
                  –
                </span>
              )}
              <input
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                value={char}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "") setChars((current) => current.map((c, j) => (j === i ? "" : c)));
                  else fillFrom(i, value.replace(char, "") || value);
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  fillFrom(i, e.clipboardData.getData("text"));
                }}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                aria-label={`Znak ${i + 1}`}
                aria-invalid={invalid.includes(i) || undefined}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus={i === 0}
                className={cn(
                  "size-11 rounded-input border border-line bg-surface text-center font-mono text-xl font-semibold text-ink sm:size-12",
                  "focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/20",
                  "aria-invalid:border-danger aria-invalid:text-danger-ink",
                )}
              />
            </Fragment>
          ))}
        </div>
        {invalid.length > 0 && (
          <p role="alert" className="text-[13px] text-danger-ink">
            Kod może zawierać tylko litery A–Z i cyfry. Sprawdź {listPositions(invalid)}.
          </p>
        )}
        <Button type="submit" size="lg" disabled={!complete}>
          Dołącz
        </Button>
      </form>
      <p className="mt-4 text-[13px] text-ink-2">Masz link? Otwórz go bezpośrednio – kod wpisze się sam.</p>
    </Card>
  );
}
