import { ArrowLeft, CheckCircle2, ClipboardCopy, FileText, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { EvaluationReport } from "@/lib/evaluation-report/types";
import { evaluationReportService } from "@/lib/evaluation-report/service";
import { findEvidence, formatReportDate } from "@/lib/evaluation-report/ui";
import { EvidenceDetails, ReportStatusBadge } from "./ReportCommon";

export function CandidateEvidenceFeedback({
  report,
  embedded = false,
  onBack,
}: {
  report: EvaluationReport;
  embedded?: boolean;
  onBack?: () => void;
}) {
  const feedback = report.candidateFeedback;
  const joinAction = (id: string) => {
    evaluationReportService.addGrowthAction(id);
    toast.success("已加入成长计划");
  };

  return (
    <div className={embedded ? "space-y-6" : "mx-auto max-w-7xl space-y-6 px-5 pb-28 sm:px-8"}>
      {!embedded && (
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">候选人能力反馈</p>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
                {report.summary.candidateName} · {report.summary.jobTitle}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                完成时间：{formatReportDate(report.generatedAt)} · 报告确认时间：
                {formatReportDate(report.confirmedAt)}
              </p>
            </div>
            <ReportStatusBadge status={report.status} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-full" onClick={onBack}>
              <ArrowLeft /> 返回候选人工作台
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                evaluationReportService.markCandidateRead();
                toast.success("已标记为已阅读");
              }}
            >
              <CheckCircle2 /> 标记为已阅读
            </Button>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">综合反馈</h2>
        </div>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{feedback.overview}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <FeedbackList title="已验证优势" items={feedback.strengths.map((item) => item.title)} />
          <FeedbackList
            title="能力成长方向"
            items={feedback.growthDirections.map((item) => item.title)}
          />
          <FeedbackList title="推荐行动" items={feedback.recommendedActions} />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <h2 className="font-semibold">能力反馈</h2>
        <p className="mt-1 text-sm text-muted-foreground">以下只展示与你相关的友好摘要。</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {report.capabilityEvaluations.map((item) => (
            <EvidenceDetails
              key={item.id}
              title={`${item.name} · ${item.candidateFeedback.currentPerformance}`}
              evidence={findEvidence(report, item.evidence_ids.slice(0, 2))}
            >
              <div className="mt-3 space-y-2 rounded-xl bg-secondary/45 p-4 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">已体现的行为：</span>
                  {item.candidateFeedback.demonstratedBehavior}
                </p>
                <p>
                  <span className="font-medium text-foreground">可以提升：</span>
                  {item.candidateFeedback.improvement}
                </p>
                <p>
                  <span className="font-medium text-foreground">推荐练习：</span>
                  {item.candidateFeedback.practice}
                </p>
                <p>
                  <span className="font-medium text-foreground">证据摘要：</span>
                  {item.candidateFeedback.evidenceSummary}
                </p>
              </div>
            </EvidenceDetails>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <h2 className="font-semibold">面试反馈</h2>
          <div className="mt-4 rounded-2xl bg-secondary/45 p-4 text-sm">
            已完成题目数量：{feedback.interviewFeedback.completedCount}
          </div>
          <FeedbackList title="回答中的优势" items={feedback.interviewFeedback.strengths} />
          <FeedbackList title="可改进表达" items={feedback.interviewFeedback.improvements} />
          <div className="mt-4 rounded-2xl border border-border p-4 text-sm text-muted-foreground">
            建议回答结构：{feedback.interviewFeedback.structureSuggestion}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <h2 className="font-semibold">岗位任务反馈</h2>
          <p className="mt-3 text-sm text-muted-foreground">{feedback.trialFeedback.completion}</p>
          <FeedbackList title="做得较好的部分" items={feedback.trialFeedback.positives} />
          <FeedbackList title="待改进部分" items={feedback.trialFeedback.improvements} />
          <div className="mt-4 rounded-2xl border border-border p-4 text-sm text-muted-foreground">
            推荐下一步练习：{feedback.trialFeedback.nextPractice}
          </div>
          <details className="group mt-4 rounded-2xl bg-secondary/45 p-4 text-sm">
            <summary className="cursor-pointer list-none font-medium">
              查看自己的原始提交内容
            </summary>
            <p className="mt-3 leading-7 text-muted-foreground">
              {report.candidateFeedback.trialFeedback.originalSubmission}
            </p>
          </details>
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">成长行动计划</h2>
            <p className="mt-1 text-sm text-muted-foreground">可以把建议加入自己的后续练习清单。</p>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={async () => {
              const text = feedback.recommendedActions.join("\n");
              try {
                await navigator.clipboard.writeText(text);
                toast.success("改进建议已复制");
              } catch {
                toast.error("复制失败", { description: "浏览器未允许剪贴板访问。" });
              }
            }}
          >
            <ClipboardCopy /> 复制改进建议
          </Button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {report.hrReview.growthActions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => joinAction(action.id)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4 text-left text-sm transition-colors hover:bg-secondary/40"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {action.label}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                {action.done ? "已加入" : "加入成长计划"}
              </span>
            </button>
          ))}
        </div>
        {!embedded && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className="rounded-full" onClick={() => joinAction("practice_mvp")}>
              加入成长计划
            </Button>
            <Button variant="outline" className="rounded-full" onClick={onBack}>
              返回候选人工作台
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => toast.success("本次验证记录已展示在当前页面")}
            >
              查看本次验证记录
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4 rounded-2xl bg-secondary/45 p-4">
      <div className="text-sm font-medium">{title}</div>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
