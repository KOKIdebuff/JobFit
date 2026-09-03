import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { useEvaluationReport } from "@/hooks/use-evaluation-report";
import { evaluationReportService } from "@/lib/evaluation-report/service";
import { reportStatusLabel } from "@/lib/evaluation-report/ui";

export const Route = createFileRoute("/hr/applications/$applicationId_/report")({
  component: HrReportPage,
});

function HrReportPage() {
  const { applicationId } = Route.useParams();
  const state = useEvaluationReport(applicationId);
  const report = state.report;
  const statusLabel = state.loading ? "加载中" : reportStatusLabel(report?.status);
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">HR 证据链报告</p>
          <h1 className="mt-2 text-3xl font-semibold">真人报告发布前复核</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            报告状态：{statusLabel}。点击“生成报告”后，系统会整理候选人的关键证据和结论摘要，
            真人面试记录会保留在预约页面，不会混进这份报告正文。
          </p>
          {report && (
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-secondary/45 p-4">
                <div className="text-xs text-muted-foreground">候选人</div>
                <div className="mt-1 text-sm font-medium">{report.summary.candidateName}</div>
              </div>
              <div className="rounded-2xl bg-secondary/45 p-4">
                <div className="text-xs text-muted-foreground">岗位</div>
                <div className="mt-1 text-sm font-medium">{report.summary.jobTitle}</div>
              </div>
              <div className="rounded-2xl bg-secondary/45 p-4">
                <div className="text-xs text-muted-foreground">证据完整度</div>
                <div className="mt-1 text-sm font-medium">
                  {report.summary.evidenceCompleteness}%
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              className="rounded-full"
              onClick={() => evaluationReportService.generate({ applicationId })}
            >
              生成报告
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => evaluationReportService.useFallback()}
            >
              使用兜底结构
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={`/human-interviews/hr/applications/${applicationId}`}>查看真人面试预约</a>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
