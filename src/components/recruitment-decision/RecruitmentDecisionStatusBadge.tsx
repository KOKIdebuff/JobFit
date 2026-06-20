import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  recruitmentDecisionOutcomeLabel,
  type RecruitmentDecision,
  type RecruitmentDecisionOutcome,
} from "@/lib/recruitment-decision/types";

export function RecruitmentDecisionStatusBadge({
  decision,
  outcome,
  className,
}: {
  decision?: RecruitmentDecision | null;
  outcome?: RecruitmentDecisionOutcome;
  className?: string;
}) {
  const value = outcome ?? decision?.outcome;
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent px-3 py-1 font-medium",
        !value && "bg-secondary text-muted-foreground",
        value === "advance_to_human_interview" && "bg-emerald-500/10 text-emerald-700",
        value === "hold" && "bg-amber-500/10 text-amber-700",
        value === "reject" && "bg-rose-500/10 text-rose-700",
        className,
      )}
    >
      {recruitmentDecisionOutcomeLabel(value)}
    </Badge>
  );
}
