import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { candidateDetailDemoService } from "@/lib/candidate-detail-demo";

export const Route = createFileRoute("/hr/applications/$applicationId_/trial/setup")({
  component: TrialSetupPage,
});

function TrialSetupPage() {
  const { applicationId } = Route.useParams();
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">岗位任务设置</p>
          <h1 className="mt-2 text-3xl font-semibold">候选人验证方案</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            当前申请 {applicationId} 的任务设置入口已恢复。HR
            可生成验证方案、转到真人面试预约，或查看任务结果。
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["面试问题", "3 个重点追问"],
              ["岗位任务", "45 分钟"],
              ["验证重点", "需求优先级、风险意识"],
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
              onClick={() => candidateDetailDemoService.generateAssessmentPlan()}
            >
              生成验证方案
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={`/hr/applications/${applicationId}/trial/result`}>查看任务结果</a>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={`/hr/applications/${applicationId}/human-interview`}>真人面试预约</a>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
