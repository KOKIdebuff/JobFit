import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/hr/applications/$applicationId")({
  component: HrApplicationPage,
});

function HrApplicationPage() {
  const { applicationId } = Route.useParams();
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">HR 候选人详情</p>
          <h1 className="mt-2 text-3xl font-semibold">李同学 · AI 产品经理（校招）</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            当前申请 {applicationId}{" "}
            的详情入口已恢复，可继续进入验证方案、证据链报告或真人面试预约。
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["匹配分", "86"],
              ["当前阶段", "候选人匹配与验证"],
              ["关注项", "复杂项目推进"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-secondary/45 p-4">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-sm font-medium">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button className="rounded-full" asChild>
              <a href={`/hr/applications/${applicationId}/human-interview`}>真人面试预约</a>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={`/hr/applications/${applicationId}/report`}>证据链报告</a>
            </Button>
            <Button variant="outline" className="rounded-full" asChild>
              <a href={`/hr/applications/${applicationId}/trial/setup`}>岗位任务设置</a>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
