import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { evaluationReportService } from "@/lib/evaluation-report/service";

export const Route = createFileRoute("/hr/applications/$applicationId_/trial/result")({
  component: TrialResultPage,
});

function TrialResultPage() {
  const { applicationId } = Route.useParams();
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">岗位任务结果</p>
          <h1 className="mt-2 text-3xl font-semibold">任务评估已恢复</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            当前申请 {applicationId} 的岗位任务结果入口可访问，可继续生成证据链报告或安排真人面试。
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["总分", "88"],
              ["亮点", "MVP 范围控制"],
              ["待追问", "指标阈值与复盘"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-secondary/45 p-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              className="rounded-full"
              onClick={() => evaluationReportService.generate({ applicationId })}
            >
              生成证据链报告
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={`/hr/applications/${applicationId}/human-interview`}>安排真人面试</a>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
