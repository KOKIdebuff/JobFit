import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  Paperclip,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { TrialContextBar } from "@/components/trial/TrialContextBar";
import { TrialCriteriaList } from "@/components/trial/TrialCriteriaList";
import { EvidencePanel } from "@/components/trial/EvidencePanel";
import { AiRunProgress } from "@/components/trial/AiRunProgress";
import { RadarChart } from "@/components/site/RadarChart";
import { Button } from "@/components/ui/button";
import { useTrialDemo } from "@/hooks/use-trial-demo";
import { formatBytes, formatDemoDate, trialDemoService } from "@/lib/trial-demo";
import { evaluationReportService } from "@/lib/evaluation-report/service";

export const Route = createFileRoute("/hr/applications/$applicationId_/trial/result")({
  head: () => ({
    meta: [
      { title: "岗位任务评价 — HireLink AI" },
      {
        name: "description",
        content: "HR 查看候选人岗位任务交付物、证据引用和不可编辑的 AI 参考评价。",
      },
    ],
  }),
  component: TrialResultPage,
});

function TrialResultPage() {
  const state = useTrialDemo();
  const navigate = useNavigate();
  const evaluation = state.trial_evaluation;
  const achieved = evaluation
    ? Object.fromEntries(
        evaluation.dimensions.map((dimension) => [dimension.id, dimension.achieved]),
      )
    : undefined;
  const radarData =
    evaluation?.dimensions.map((dimension) => ({
      label: dimension.label,
      value: Math.round((dimension.achieved / dimension.score) * 100),
    })) ?? [];

  const includeReport = () => {
    trialDemoService.includeInReport();
    evaluationReportService.generate();
    toast.success("任务证据已纳入证据链报告");
    navigate({
      to: "/hr/applications/$applicationId/report",
      params: { applicationId: state.application.id },
    });
  };

  return (
    <PageShell>
      <TrialContextBar role="HR" />
      <section className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-7xl">
          <Link
            to="/candidate/applications/$applicationId/trial"
            params={{ applicationId: state.application.id }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回候选人任务页
          </Link>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">岗位能力试炼 · HR 评价</p>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">查看交付物与参考评价</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                评分、亮点和能力缺口均关联候选人的实际提交证据，AI 不作录用或淘汰决定。
              </p>
            </div>
            <span className="rounded-full border border-violet-500/30 bg-violet-500/5 px-3 py-1.5 text-xs font-semibold text-violet-700">
              AI 参考评分
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-32 sm:px-8">
        {!state.trial_submission.submittedAt && state.ai_run.status === "idle" && (
          <EmptyResult onPrepare={() => trialDemoService.prepareSubmittedTask()} />
        )}

        {(state.ai_run.status === "running" || state.ai_run.status === "failed") && (
          <div className="mx-auto max-w-2xl">
            <AiRunProgress
              aiRun={state.ai_run}
              onRetry={() => trialDemoService.runEvaluation()}
              onFallback={() => trialDemoService.usePresetEvaluation()}
            />
          </div>
        )}

        {evaluation && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">候选人提交摘要</p>
                    <h2 className="mt-1 text-xl font-semibold">
                      围绕信息提取、岗位差距分析和人工确认设计 MVP
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    提交于 {formatDemoDate(state.trial_submission.submittedAt)}
                  </span>
                </div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {state.trial_submission.body}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ExternalLink className="h-4 w-4" /> 原型链接
                    </div>
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {state.trial_submission.prototypeUrl || "未提交"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      仅展示，不会由系统主动访问。
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Paperclip className="h-4 w-4" /> 附件信息
                    </div>
                    {state.trial_submission.attachments.length ? (
                      state.trial_submission.attachments.map((attachment) => (
                        <div key={attachment.name} className="mt-2 text-sm text-muted-foreground">
                          {attachment.name} · {formatBytes(attachment.size)}
                        </div>
                      ))
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">未提交附件</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">五维参考评分</h2>
                  <span className="text-xs text-muted-foreground">AI 原始评分 · 只读</span>
                </div>
                <div className="mt-5 grid items-center gap-6 sm:grid-cols-2">
                  <RadarChart data={radarData} size={280} />
                  <TrialCriteriaList criteria={state.trial_task.criteria} achieved={achieved} />
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                <h2 className="font-semibold">评价证据</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  展开查看每项评价引用的候选人提交片段。
                </p>
                <div className="mt-5">
                  <EvidencePanel dimensions={evaluation.dimensions} />
                </div>
              </section>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
                <div className="bg-rainbow p-6 text-white">
                  <p className="text-sm text-white/80">AI 参考总分</p>
                  <div className="mt-1 font-display text-5xl font-bold">{evaluation.total}</div>
                  <p className="mt-2 text-xs text-white/80">{evaluation.disclaimer}</p>
                </div>
                <div className="space-y-4 p-6 text-sm">
                  <ResultNote title="主要亮点" text={evaluation.highlight} tone="emerald" />
                  <ResultNote title="能力缺口" text={evaluation.gap} tone="amber" />
                  <ResultNote title="关注风险" text={evaluation.risk} tone="red" />
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <h3 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" /> 人工决策边界
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  HR 可以查看但不能编辑 AI
                  原始评分和评价。是否进入下一招聘阶段，需结合面试与其他业务信息独立判断。
                </p>
              </section>

              <div className="space-y-2">
                <Button className="w-full rounded-full" onClick={includeReport}>
                  纳入证据链报告 <ArrowRight />
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => trialDemoService.runEvaluation()}
                >
                  <RefreshCw /> 重新运行 AI 评价
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => {
                    trialDemoService.openResubmission();
                    toast.success("已开放一次重新提交");
                  }}
                >
                  开放一次重新提交
                </Button>
              </div>
            </aside>
          </div>
        )}
      </main>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/hr/jobs/$jobId/candidates" params={{ jobId: state.job.id }}>
              返回工作台
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="rounded-full" asChild>
              <Link
                to="/candidate/applications/$applicationId/trial"
                params={{ applicationId: state.application.id }}
              >
                上一步
              </Link>
            </Button>
            <Button className="rounded-full" disabled={!evaluation} onClick={includeReport}>
              下一步 <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function EmptyResult({ onPrepare }: { onPrepare: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
      <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold">尚无候选人提交结果</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
        完成候选人提交后，这里将展示交付物、五维评分和可追溯证据。
      </p>
      <Button variant="outline" className="mt-6 rounded-full" onClick={onPrepare}>
        载入已评价演示结果
      </Button>
    </div>
  );
}

function ResultNote({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "emerald" | "amber" | "red";
}) {
  const classes = {
    emerald: "bg-emerald-500/5 text-emerald-800",
    amber: "bg-amber-500/5 text-amber-800",
    red: "bg-red-500/5 text-red-800",
  };
  return (
    <div className={`rounded-2xl p-4 ${classes[tone]}`}>
      <div className="font-medium">{title}</div>
      <p className="mt-1 leading-relaxed opacity-80">{text}</p>
    </div>
  );
}
