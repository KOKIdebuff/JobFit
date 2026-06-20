import { AlertCircle, ArrowRight, Clock3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecruitmentDecision } from "@/hooks/use-recruitment-decision";
import { recruitmentDecisionOutcomeLabel } from "@/lib/recruitment-decision/types";
import { RecruitmentDecisionStatusBadge } from "./RecruitmentDecisionStatusBadge";
import { formatDecisionDate } from "./utils";

export function RecruitmentDecisionSummary({
  applicationId,
  onViewReport,
}: {
  applicationId: string;
  onViewReport: () => void;
}) {
  const { decision, history, loading, error, retry } = useRecruitmentDecision(applicationId);

  if (loading) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-24 w-full rounded-2xl" />
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">HR 最终决策</h2>
          <p className="mt-1 text-sm text-muted-foreground">最终处理在证据链报告确认后提交。</p>
        </div>
        <RecruitmentDecisionStatusBadge decision={decision} />
      </div>

      {!decision ? (
        <div className="mt-5 rounded-2xl bg-amber-500/5 p-4 text-sm text-amber-800">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" /> 决策数据加载失败
          </div>
          <p className="mt-1">{error || "未找到该候选人申请。"}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 rounded-full"
            onClick={() => void retry()}
          >
            重试
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 rounded-2xl bg-secondary/40 p-4 text-sm">
            {decision.status === "submitted" ? (
              <>
                <div className="font-medium">
                  {recruitmentDecisionOutcomeLabel(decision.outcome)}
                </div>
                <p className="mt-2 leading-relaxed text-muted-foreground">{decision.reason}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {decision.decidedBy?.name} · {formatDecisionDate(decision.decidedAt)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">尚未提交最终处理决定。</p>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock3 className="h-4 w-4 text-muted-foreground" /> 决策时间线
            </div>
            {history.length ? (
              <div className="mt-3 space-y-3 border-l border-border pl-4">
                {history.map((item) => (
                  <div key={item.id} className="text-sm">
                    <div className="font-medium">
                      {item.previousOutcome
                        ? `${recruitmentDecisionOutcomeLabel(item.previousOutcome)} → `
                        : "首次提交："}
                      {recruitmentDecisionOutcomeLabel(item.nextOutcome)}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.operatorName} · {formatDecisionDate(item.createdAt)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">暂无决策记录。</p>
            )}
          </div>

          <Button className="mt-5 rounded-full" onClick={onViewReport}>
            <FileText />{" "}
            {decision.status === "submitted" ? "查看报告并修改决策" : "查看报告并作出决策"}
            <ArrowRight />
          </Button>
        </>
      )}
    </section>
  );
}
