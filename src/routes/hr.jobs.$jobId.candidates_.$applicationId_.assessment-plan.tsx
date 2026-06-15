import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AgentRunDetails,
  AssessmentGenerationProgress,
} from "@/components/candidate-detail/CandidateDetailSections";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCandidateDetailDemo } from "@/hooks/use-candidate-detail-demo";
import { candidateDetailDemoService, DEMO_IDS } from "@/lib/candidate-detail-demo";

export const Route = createFileRoute("/hr/jobs/$jobId/candidates_/$applicationId_/assessment-plan")(
  {
    head: () => ({
      meta: [
        { title: "验证方案确认 — HireLink AI" },
        {
          name: "description",
          content: "查看并确认候选人的个性化面试题与岗位任务。",
        },
      ],
    }),
    component: AssessmentPlanPage,
  },
);

function AssessmentPlanPage() {
  const { jobId, applicationId } = Route.useParams();
  const state = useCandidateDetailDemo();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);

  const backToDetail = () =>
    navigate({
      to: "/hr/jobs/$jobId/candidates/$applicationId",
      params: { jobId: DEMO_IDS.job, applicationId: DEMO_IDS.application },
    });

  if (jobId !== DEMO_IDS.job || applicationId !== DEMO_IDS.application) {
    return (
      <PageShell>
        <main className="mx-auto max-w-xl px-5 py-20 text-center sm:px-8">
          <h1 className="text-2xl font-semibold">未找到该申请的验证方案</h1>
          <p className="mt-2 text-sm text-muted-foreground">候选人和岗位数据未发生变化。</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link to="/hr">返回 HR 工作台</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  const ready = ["draft", "fallback", "sent"].includes(state.assessment_plan.status);
  const isSent = state.assessment_plan.status === "sent";

  return (
    <PageShell>
      <section className="border-b border-border bg-card/40 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="font-medium">当前角色：HR</span>
          <span className="text-muted-foreground">{state.job.title}</span>
          <span className="text-muted-foreground">{state.candidate.name}</span>
          <span className="font-mono text-xs text-muted-foreground">{state.application.id}</span>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-7xl">
          <button
            type="button"
            onClick={backToDetail}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回候选人详情
          </button>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">能力验证 · HR 确认</p>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">查看并确认验证方案</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                方案围绕匹配缺口生成，发送前由 HR 检查；确认后候选人才会收到任务。
              </p>
            </div>
            <span className="rounded-full bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700">
              {isSent ? "已确认发送" : ready ? "待 HR 确认" : "尚未生成"}
            </span>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-32 sm:px-8">
        {!ready ? (
          <div className="mx-auto max-w-2xl">
            {state.assessment_plan.status === "generating" || state.ai_run.status === "failed" ? (
              <AssessmentGenerationProgress
                state={state}
                onRetry={() => candidateDetailDemoService.generateAssessmentPlan()}
                onFallback={() => candidateDetailDemoService.usePresetAssessmentPlan()}
                onBack={backToDetail}
              />
            ) : (
              <section className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
                <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-4 text-xl font-semibold">验证方案尚未生成</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                  候选人、画像和匹配数据已保留，可以返回详情生成，也可以在此直接开始。
                </p>
                <Button
                  className="mt-6 rounded-full"
                  onClick={() => candidateDetailDemoService.generateAssessmentPlan()}
                >
                  <Sparkles /> 生成面试题与岗位任务
                </Button>
              </section>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-muted-foreground" />
                      <h2 className="font-semibold">个性化面试题</h2>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      共 {state.assessment_plan.interviewQuestions.length} 道，均关联待验证能力。
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                    预计 20—25 分钟
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {state.assessment_plan.interviewQuestions.map((question, index) => (
                    <details
                      key={question.id}
                      className="group rounded-2xl border border-border bg-background p-4"
                    >
                      <summary className="cursor-pointer list-none text-sm font-medium">
                        <span className="mr-2 text-muted-foreground">Q{index + 1}</span>
                        {question.question}
                      </summary>
                      <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                        <div className="rounded-xl bg-violet-500/5 p-3 text-violet-800">
                          验证目的：{question.purpose}
                        </div>
                        <div className="rounded-xl bg-secondary/50 p-3 text-muted-foreground">
                          生成依据：{question.evidence}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              {state.assessment_plan.task.deliverables.length > 0 && (
                <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                      <h2 className="font-semibold">轻量岗位任务</h2>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {state.assessment_plan.task.estimatedMinutes} 分钟
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{state.assessment_plan.task.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {state.assessment_plan.task.background}
                  </p>
                  <div className="mt-5">
                    <div className="text-sm font-medium">交付要求</div>
                    <ul className="mt-3 space-y-2">
                      {state.assessment_plan.task.deliverables.map((item) => (
                        <li
                          key={item}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="font-semibold">方案摘要</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <PlanRow
                    label="面试题"
                    value={`${state.assessment_plan.interviewQuestions.length} 道`}
                  />
                  <PlanRow
                    label="岗位任务"
                    value={state.assessment_plan.task.deliverables.length ? "1 个" : "未包含"}
                  />
                  <PlanRow label="预计耗时" value={state.assessment_plan.estimatedMinutes} />
                  <PlanRow label="重点验证" value={state.assessment_plan.focus.join("、")} />
                </div>
              </section>
              <section className="rounded-2xl border border-border bg-card p-5 text-sm shadow-soft">
                <h3 className="font-semibold">确认边界</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  发送后候选人可以开始面试与岗位任务。AI 生成内容不代表录用或淘汰决定。
                </p>
              </section>
              <div className="space-y-2">
                <Button
                  className="w-full rounded-full"
                  disabled={isSent}
                  onClick={() => setConfirmOpen(true)}
                >
                  {isSent ? <CheckCircle2 /> : <ArrowRight />}
                  {isSent ? "验证方案已发送" : "确认并发送"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={() => setAgentOpen(true)}
                >
                  <FileText /> 查看 Agent 运行详情
                </Button>
                {isSent && (
                  <Button variant="outline" className="w-full rounded-full" asChild>
                    <Link
                      to="/candidate/applications/$applicationId/trial"
                      params={{ applicationId: state.application.id }}
                    >
                      继续演示 <ArrowRight />
                    </Link>
                  </Button>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Button variant="outline" className="hidden rounded-full sm:inline-flex" asChild>
            <Link to="/hr">返回 HR 工作台</Link>
          </Button>
          {isSent ? (
            <Button className="w-full rounded-full sm:ml-auto sm:w-auto" asChild>
              <Link
                to="/candidate/applications/$applicationId/trial"
                params={{ applicationId: state.application.id }}
              >
                继续演示 <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button
              className="w-full rounded-full sm:ml-auto sm:w-auto"
              disabled={!ready}
              onClick={() => setConfirmOpen(true)}
            >
              确认并发送 <ArrowRight />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认发送验证方案</DialogTitle>
            <DialogDescription>
              发送后候选人将可以查看 5 道面试题和 1 个岗位任务。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">
            预计候选人完成时间：{state.assessment_plan.estimatedMinutes}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                candidateDetailDemoService.confirmAndSend();
                setConfirmOpen(false);
                toast.success("验证方案已发送", { description: "候选人现在可以开始能力验证。" });
              }}
            >
              确认发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={agentOpen} onOpenChange={setAgentOpen}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>Agent 运行详情</DialogTitle>
            <DialogDescription>本次验证方案生成的状态和输入边界。</DialogDescription>
          </DialogHeader>
          <AgentRunDetails state={state} />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
