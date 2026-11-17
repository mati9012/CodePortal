import type { ReviewStatus } from "@codeportal/contracts";
import { Tag, type TagTone } from "@/components/ui/surface";
import { REVIEW_STATUS_LABEL } from "@/lib/panel-labels";

const TONE: Record<ReviewStatus, TagTone> = { approved: "success", flagged: "danger", pending: "warning" };

export function ReviewStatusTag({ status }: { status: ReviewStatus }) {
  return (
    <Tag tone={TONE[status]} pill>
      {REVIEW_STATUS_LABEL[status]}
    </Tag>
  );
}
