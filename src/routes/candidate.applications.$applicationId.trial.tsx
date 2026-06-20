import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/candidate/applications/$applicationId/trial")({
  component: CandidateTrialPage,
});

function CandidateTrialPage() {
  const { applicationId } = Route.useParams();
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">候选人岗位任务</p>
          <h1 className="mt-2 text-3xl font-semibold">AI 产品经理岗位能力验证</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            当前申请 {applicationId} 的岗位任务入口已恢复。候选人可以查看任务要求、提交材料，并等待
            HR 后续评估。
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["任务状态", "等待候选人处理"],
              ["预计耗时", "45 分钟"],
              ["交付物", "方案说明、流程图、可选原型"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-secondary/45 p-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button className="rounded-full" asChild>
              <a href="/candidate/interviews">查看我的面试</a>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href="/candidate/applications/application_ai_pm_li_001/report">查看求职者报告</a>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
