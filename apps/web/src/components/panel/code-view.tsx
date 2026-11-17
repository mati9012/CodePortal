import { cn } from "@/lib/cn";

export function CodeView({ code, className }: { code: string; className?: string }) {
  return (
    <pre
      data-theme="dark"
      className={cn("overflow-x-auto rounded-input bg-canvas py-3 font-mono text-code text-ink", className)}
    >
      {code.split("\n").map((line, i) => (
        <div key={i} className="flex pr-4">
          <span className="w-10 shrink-0 select-none pr-3 text-right text-ink-3">{i + 1}</span>
          <span className="whitespace-pre">{line || " "}</span>
        </div>
      ))}
    </pre>
  );
}
