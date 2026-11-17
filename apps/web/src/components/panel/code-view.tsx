import { cn } from "@/lib/cn";

export function CodeView({ code, highlight, className }: { code: string; highlight?: { from: number; to: number }; className?: string }) {
  return (
    <pre
      data-theme="dark"
      className={cn("overflow-x-auto rounded-input bg-canvas py-3 font-mono text-code text-ink", className)}
    >
      {code.split("\n").map((line, i) => {
        const n = i + 1;
        const marked = highlight && n >= highlight.from && n <= highlight.to;
        return (
          <div key={n} className={cn("flex pr-4", marked && "bg-accent/20")}>
            <span className="w-10 shrink-0 select-none pr-3 text-right text-ink-3">{n}</span>
            <span className="whitespace-pre">{line || " "}</span>
          </div>
        );
      })}
    </pre>
  );
}
