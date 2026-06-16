import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleUserRound,
  Sparkles,
  Target,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { TrialContextBar } from "@/components/trial/TrialContextBar";
import { TrialStatusBadge } from "@/components/trial/TrialStatusBadge";
import { Button } from "@/components/ui/button";
import { useTrialDemo } from "@/hooks/use-trial-demo";
import { trialDemoService } from "@/lib/trial-demo";

export const Route = createFileRoute("/hr/applications/$applicationId")({
  head: () => ({
    meta: [
      { title: "候选人详情 — HireLink AI" },
      {
        name: "description",
        content: "查看候选人与岗位匹配上下文，并进入岗位能力验证流程。",
      },
    ],
  }),
  component: CandidateDetailPage,
});

function CandidateDetailPage() {
  const state = useTrialDemo();
  const navigate = useNavigate();

  const startTrial = () => {
    if (state.trial_task.status === "ungenerated" || state.trial_task.status === "failed") {
      trialDemoService.generateTask();
    }
    navigate({
      to: "/hr/applications/$applicationId/trial/setup",
      params: { applicationId: state.application.id },
    });
  };

  return (
    <PageShell>
      <TrialContextBar role="HR" />
      <section className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/hr/jobs/$jobId/candidates"
            params={{ jobId: state.job.id }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回候选人排序
          </Link>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
                李
              </div>
              <div>
                <h1 className="text-3xl font-semibold">{state.candidate.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {state.job.title} · {state.job.company}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-rainbow px-5 py-3 text-white">
              <span className="font-display text-3xl font-bold leading-none">
                {state.candidate.matchScore}
              </span>
              <span className="mt-1 text-[11px] text-white/80">当前匹配分</span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 pb-32 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <CircleUserRound className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">候选人能力概览</h2>
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <AbilityList title="主要优势" items={state.candidate.strengths} positive />
                <AbilityList title="待验证能力" items={state.candidate.gaps} />
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
                <h2 className="font-semibold">岗位上下文</h2>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Info label="岗位" value={state.job.title} />
                <Info label="公司" value={state.job.company} />
                <Info label="招聘负责人" value={state.job.owner} />
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-secondary/30 p-6">
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <h2 className="font-semibold">为什么生成岗位能力试炼</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    当前简历和匹配结果已证明候选人的 LLM
                    产品经验、需求分析和数据分析能力，但复杂需求拆解、AI 风险意识与 MVP
                    范围控制仍缺少实际交付证据。轻量任务用于补足这部分证据，不是自动筛选考试。
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">岗位能力试炼</h2>
                <TrialStatusBadge status={state.trial_task.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                根据岗位画像和待验证能力生成一项预计 45 分钟完成的真实岗位任务。
              </p>
              <Button className="mt-5 w-full rounded-full" onClick={startTrial}>
                <Sparkles />
                {state.trial_task.status === "ungenerated" || state.trial_task.status === "failed"
                  ? "生成岗位能力试炼"
                  : "查看岗位能力试炼"}
                <ArrowRight />
              </Button>
            </section>
            <section className="rounded-2xl border border-border bg-card p-5 text-sm shadow-soft">
              <h3 className="font-semibold">决策边界</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                AI 只提供任务和参考评价，最终是否进入下一招聘阶段由 HR 决定。
              </p>
            </section>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/hr/jobs/$jobId/candidates" params={{ jobId: state.job.id }}>
              返回工作台
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="rounded-full" asChild>
              <Link to="/hr/jobs/$jobId/candidates" params={{ jobId: state.job.id }}>
                上一步
              </Link>
            </Button>
            <Button className="rounded-full" onClick={startTrial}>
              下一步 <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function AbilityList({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: string[];
  positive?: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
              positive ? "bg-emerald-500/5 text-emerald-800" : "bg-amber-500/5 text-amber-800"
            }`}
          >
            <CheckCircle2 className="h-4 w-4" /> {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
