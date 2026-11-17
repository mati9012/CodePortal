"use client";

import { MonitorPlay, Plus } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Bit } from "@/components/brand/bit";
import { CopyButton } from "@/components/panel/copy-button";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/surface";
import { GROUPS } from "@/lib/mock/panel";
import { useJoinLink } from "@/lib/use-origin";
import type { Draft } from "./draft";

export function Published({ draft, code, onReset }: { draft: Draft; code: string; onReset: () => void }) {
  const link = useJoinLink(code);
  const group = GROUPS.find((g) => g.id === draft.groupId);
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center py-4 text-center">
      <Bit size="l" preload />
      <h1 className="mt-4 font-display text-h1 text-ink">Test opublikowany!</h1>
      <p className="mt-2 text-body text-ink-2">
        „{draft.title}”{group ? ` dla ${group.name}` : ""} · {draft.date.split("-").reverse().join(".")}, {draft.time} ·{" "}
        {draft.duration} min
      </p>

      <Card className="mt-8 grid w-full gap-6 p-6 text-left sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <p className="text-label uppercase text-ink-2">Kod testu</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-[40px] font-bold leading-none tracking-[0.08em] text-ink">{code}</span>
              <CopyButton value={code} label="Kopiuj kod" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-label uppercase text-ink-2">Link</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="min-w-0 truncate rounded-input border border-line bg-subtle px-3 py-2 font-mono text-[13px] text-ink">{link}</span>
              <CopyButton value={link} label="Kopiuj link" />
            </div>
          </div>
        </div>
        <div className="mx-auto rounded-card border border-line bg-white p-3">
          <QRCodeSVG value={link} size={148} marginSize={0} fgColor="#0f172a" bgColor="#ffffff" title={`Kod QR: ${link}`} />
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/panel/testy/e2/rzutnik" className={buttonClasses({ size: "lg" })}>
          <MonitorPlay className="size-[18px]" aria-hidden /> Pokaż na rzutniku
        </Link>
        <Link href="/panel/testy" className={buttonClasses({ size: "lg", variant: "secondary" })}>
          Przejdź do testów
        </Link>
        <Button size="lg" variant="ghost" icon={<Plus />} onClick={onReset}>
          Utwórz kolejny
        </Button>
      </div>
    </div>
  );
}

