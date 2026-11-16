import { Tag, type TagTone } from "@/components/ui/surface";
import { cn } from "@/lib/cn";
import { EXAM_STATUS_LABEL, type ExamStatus } from "@/lib/mock/panel";

const TONE: Record<ExamStatus, TagTone> = {
  live: "success",
  scheduled: "accent",
  review: "warning",
  finished: "neutral",
  draft: "neutral",
};

export function ExamStatusTag({ status, className }: { status: ExamStatus; className?: string }) {
  return (
    <Tag tone={TONE[status]} pill className={cn(status === "draft" && "border border-dashed border-line bg-transparent", className)}>
      {status === "live" && (
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
      )}
      {EXAM_STATUS_LABEL[status]}
    </Tag>
  );
}
