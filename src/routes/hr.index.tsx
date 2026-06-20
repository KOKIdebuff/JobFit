import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleUserRound,
  Clock3,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { PageShell } from "@/components/site/PageShell";
import { RecruitmentDecisionStatusBadge } from "@/components/recruitment-decision/RecruitmentDecisionStatusBadge";
import { Button } from "@/components/ui/button";
import { useRecruitmentDecisionCollection } from "@/hooks/use-recruitment-decision";
import { CANDIDATE_APPLICATION_IDS, DEMO_IDS } from "@/lib/candidate-detail-demo";

export const Route = createFileRoute("/hr/")({
  head: () => ({
    meta: [
      { title: "HR 工作台 — HireLink AI" },
      {
        name: "description",
        content: "查看当前招聘岗位、候选人进度和待处理的能力验证事项。",
      },
    ],
  }),
  component: HrWorkspacePage,
});

function HrWorkspacePage() {
  const { decisions, loading, error, retry } =
    useRecruitmentDecisionCollection(CANDIDATE_APPLICATION_IDS);
  const decisionValues = Object.values(decisions);
  const count = (outcome: "advance_to_human_interview" | "hold" | "reject") =>
    decisionValues.filter((decision) => decision.outcome === outcome).length;
  const pendingCount =
    CANDIDATE_APPLICATION_IDS.length -
    decisionValues.filter((decision) => decision.status === "submitted").length;
  const metricValue = (value: number) => (loading ? "—" : String(value));

  return (
    <PageShell>
      <section className="relative overflow-hidden px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-medium text-muted-foreground">HR 工作台</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">招聘能力验证概览</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            聚焦当前岗位的候选人匹配、能力验证和报告复核，不替代 HR 最终决策。
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <WorkspaceMetric icon={<BriefcaseBusiness />} label="招聘中岗位" value="1" />
          <WorkspaceMetric icon={<UsersRound />} label="当前候选人" value="4" />
          <WorkspaceMetric icon={<Clock3 />} label="待最终决策" value={metricValue(pendingCount)} />
        </div>

        {error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void retry()}
            >
              重试
            </Button>
          </div>
        )}

        <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">AI 产品经理（校招）</h2>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
                  已发布
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">星河智能 · 招聘负责人：陈经理</p>
            </div>
            <Button className="rounded-full" asChild>
              <a href={`/hr/jobs/${DEMO_IDS.job}/candidates`}>
                查看候选人 <ArrowRight />
              </a>
            </Button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StageCard label="待决策" value={`${metricValue(pendingCount)} 人`} />
            <StageCard
              label="进入真人面试"
              value={`${metricValue(count("advance_to_human_interview"))} 人`}
              tone="positive"
            />
            <StageCard label="暂缓推进" value={`${metricValue(count("hold"))} 人`} tone="warning" />
            <StageCard
              label="暂不推进"
              value={`${metricValue(count("reject"))} 人`}
              tone="danger"
            />
          </div>
          <div className="mt-5 rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
                  李
                </div>
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    李同学
                    <RecruitmentDecisionStatusBadge decision={decisions[DEMO_IDS.application]} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    匹配分 86 · 申请于 2026-06-12
                  </p>
                </div>
              </div>
              <Button variant="outline" className="rounded-full" asChild>
                <a href={`/hr/jobs/${DEMO_IDS.job}/candidates/${DEMO_IDS.application}?fail=false`}>
                  <CircleUserRound /> 查看详情
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function WorkspaceMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

function StageCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  return (
    <div
      className={
        tone === "positive"
          ? "rounded-2xl bg-emerald-500/5 p-4 text-emerald-800"
          : tone === "warning"
            ? "rounded-2xl bg-amber-500/5 p-4 text-amber-800"
            : tone === "danger"
              ? "rounded-2xl bg-rose-500/5 p-4 text-rose-800"
              : "rounded-2xl bg-secondary/50 p-4"
      }
    >
      <div className="flex items-center gap-2 text-sm">
        {tone === "positive" && <CheckCircle2 className="h-4 w-4" />}
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
