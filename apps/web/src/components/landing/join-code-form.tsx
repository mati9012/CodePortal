"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

function formatCode(raw: string) {
  const chars = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return chars.length > 3 ? `${chars.slice(0, 3)}-${chars.slice(3)}` : chars;
}

export function JoinCodeForm({ className }: { className?: string }) {
  const router = useRouter();
  const id = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 7) {
      setError(true);
      return;
    }
    router.push(`/t/${code}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        "rounded-card border border-line bg-surface p-3 shadow-sm sm:inline-flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:p-2 sm:pl-4",
        className,
      )}
    >
      <label htmlFor={id} className="mb-2 block text-[13px] font-semibold text-ink sm:mb-0">
        Masz kod testu?
      </label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={code}
          onChange={(e) => {
            setCode(formatCode(e.target.value));
            setError(false);
          }}
          placeholder="np. 7K2-9QX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          invalid={error}
          aria-describedby={error ? `${id}-msg` : undefined}
          className="w-full font-mono tracking-wider sm:w-36"
        />
        <Button type="submit" variant="secondary" iconRight={<ArrowRight />}>
          Dołącz
        </Button>
      </div>
      {error && (
        <p id={`${id}-msg`} role="alert" className="mt-2 w-full text-xs text-danger-ink sm:mt-0 sm:pb-1">
          Kod ma 6 znaków, np. 7K2-9QX.
        </p>
      )}
    </form>
  );
}
