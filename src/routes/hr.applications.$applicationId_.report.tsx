import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { TrialContextBar } from "@/components/trial/TrialContextBar";
import { EvidencePanel } from "@/components/trial/EvidencePanel";
import { Button } from "@/components/ui/button";
import { useTrialDemo } from "@/hooks/use-trial-demo";
import { trialDemoService } from "@/lib/trial-demo";

export const Route = createFileRoute("/hr/applications/$applicationId_/report")({
  head: () => ({
    meta: [
      { title: "AI 面试证据链报告 — HireLink AI" },
      {
        name: "description",
        content: "演示岗位任务交付物和 AI 参考评价写入同一证据链报告。",
      },
    ],
  }),
  component: EvidenceReportPage,
});

function EvidenceReportPage() {
  const state = useTrialDemo();
  const evaluation = state.trial_evaluation;

  return (
    <PageShell>
      <TrialContextBar role="HR" />
      <section className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/hr/applications/$applicationId/trial/result"
            params={{ applicationId: state.application.id }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回任务评价
          </Link>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">AI 面试证据链报告</p>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">任务证据已写入报告</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                当前为闭环演示页，展示岗位任务如何与匹配、面试回答共同形成可追溯证据。
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> 已纳入报告
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-5 pb-32 sm:px-8">
        {!evaluation ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
            <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">尚未生成任务评价</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              请先完成候选人任务提交和 AI 参考评价，再将证据写入报告。
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-full"
              onClick={() => {
                trialDemoService.prepareSubmittedTask();
                trialDemoService.includeInReport();
              }}
            >
              载入报告演示数据
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-muted-foreground" />
                  <h2 className="font-semibold">岗位任务证据</h2>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <ReportMetric label="AI 参考总分" value={`${evaluation.total}`} />
                  <ReportMetric label="证据引用" value={`${evaluation.dimensions.length} 条`} />
                  <ReportMetric label="任务状态" value="已评价" />
                </div>
                <div className="mt-5 rounded-2xl bg-secondary/50 p-5">
                  <div className="text-sm font-medium">{state.trial_task.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {evaluation.highlight}；待进一步验证：{evaluation.gap}。
                  </p>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                <h2 className="font-semibold">已纳入的任务证据</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  报告中的评价仍保留来源片段，便于 HR 复核。
                </p>
                <div className="mt-5">
                  <EvidencePanel dimensions={evaluation.dimensions} />
                </div>
              </section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="font-semibold">证据链组成</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <EvidenceSource label="岗位与匹配依据" status="已关联" />
                  <EvidenceSource label="面试回答证据" status="演示占位" />
                  <EvidenceSource label="岗位任务交付物" status="已关联" />
                  <EvidenceSource label="AI 参考评价" status="已关联" />
                </div>
              </section>
              <section className="rounded-2xl border border-border bg-card p-5 text-sm shadow-soft">
                <h3 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" /> 报告边界
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  本页只演示任务证据写入报告，不冒充完整报告实现。AI 内容不代表最终招聘决定。
                </p>
              </section>
              <section className="rounded-2xl border border-dashed border-border bg-secondary/20 p-5 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <Link2 className="h-4 w-4" /> 后续完整报告
                </div>
                <p className="mt-2 text-muted-foreground">
                  将继续汇总面试回答、匹配依据、风险提示和 HR 人工确认结果。
                </p>
              </section>
            </aside>
          </div>
        )}
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
              <Link
                to="/hr/applications/$applicationId/trial/result"
                params={{ applicationId: state.application.id }}
              >
                上一步
              </Link>
            </Button>
            <Button className="rounded-full" asChild>
              <Link to="/hr/jobs/$jobId/candidates" params={{ jobId: state.job.id }}>
                下一步 <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function EvidenceSource({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 p-3">
      <span>{label}</span>
      <span className="text-xs text-muted-foreground">{status}</span>
    </div>
  );
}
