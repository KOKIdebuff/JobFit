import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  FileText,
  Flag,
  Home,
  Loader2,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAgentRuns } from "@/hooks/use-agent-runs";
import { agentRunService } from "@/lib/agent-runs/service";
import type { AgentRunViewModel } from "@/lib/agent-runs/types";
import { cn } from "@/lib/utils";

interface AgentRunsSearch {
  applicationId?: string;
  runId?: string;
  state?: "empty" | "forbidden";
}

export const Route = createFileRoute("/hr/agent-runs")({
  validateSearch: (search: Record<string, unknown>): AgentRunsSearch => ({
    applicationId: typeof search.applicationId === "string" ? search.applicationId : undefined,
    runId: typeof search.runId === "string" ? search.runId : undefined,
    state: search.state === "empty" || search.state === "forbidden" ? search.state : undefined,
  }),
  head: () => ({
    meta: [
      { title: "多 Agent 协作面板 - HireLink AI" },
      {
        name: "description",
        content: "HR 查看招聘流程中的 Agent 协作、证据聚合、任务评价和复核状态。",
      },
    ],
  }),
  component: AgentRunsPage,
});

function AgentRunsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const state = useAgentRuns(search.runId, { forbidden: search.state === "forbidden" });
  const selectedRun = state.selectedRun;

  const selectRun = (runId: string) =>
    navigate({
      to: "/hr/agent-runs",
      search: { applicationId: state.runs.find((run) => run.id === runId)?.applicationId, runId },
    });

  if (state.loading || !state.hydrated) {
    return (
      <PageShell>
        <AgentRunsSkeleton />
      </PageShell>
    );
  }

  if (state.access === "forbidden") {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8">
          <StateCard
            tone="warning"
            title="无访问权限"
            description="你暂时不能查看该协作记录。候选人资料、岗位信息和已完成的业务证据仍会保留，HR 可以返回工作台继续处理其他流程。"
            actions={[
              { label: "返回 HR 工作台", href: "/hr", icon: <Home /> },
              {
                label: "查看全部协作流程",
                onClick: () => void navigate({ to: "/hr/agent-runs", search: {} }),
                icon: <Bot />,
              },
            ]}
          />
        </main>
      </PageShell>
    );
  }

  if (search.state === "empty" || !state.runs.length) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8">
          <StateCard
            title="暂无协作流程"
            description="当前没有需要展示的 Agent 协作记录。候选人、岗位和报告数据没有变化，可以先返回 HR 工作台继续查看招聘进展。"
            actions={[
              { label: "返回 HR 工作台", href: "/hr", icon: <Home /> },
              {
                label: "重新加载流程",
                onClick: () => {
                  void agentRunService.resetDemo();
                  toast.success("协作流程已重新加载");
                },
                icon: <RefreshCw />,
              },
            ]}
          />
        </main>
      </PageShell>
    );
  }

  if (state.notFound) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8">
          <StateCard
            tone="warning"
            title="未找到该协作记录"
            description="链接中的协作记录无法匹配当前招聘流程。已生成的报告、候选人材料和岗位任务结果没有丢失，可以返回报告页或查看全部协作流程。"
            actions={[
              {
                label: "返回证据链报告",
                href: "/hr/applications/application_ai_pm_li_001/report",
                icon: <FileText />,
              },
              { label: "返回 HR 工作台", href: "/hr", icon: <Home /> },
              {
                label: "查看全部协作流程",
                onClick: () => void navigate({ to: "/hr/agent-runs", search: {} }),
                icon: <Bot />,
              },
            ]}
          />
        </main>
      </PageShell>
    );
  }

  if (!selectedRun) return null;

  return (
    <PageShell>
      <section className="relative overflow-hidden px-5 pb-6 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-[1440px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">HR 招聘</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">多 Agent 协作面板</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                查看候选人验证、证据聚合、岗位任务评价和证据链报告生成的协作进展，最终判断仍由 HR
                完成。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-full" asChild>
                <a href="/hr">
                  <Home /> 返回 HR 工作台
                </a>
              </Button>
              <Button variant="outline" className="rounded-full" asChild>
                <a href="/hr/applications/application_ai_pm_li_001/report">
                  <FileText /> 返回证据链报告
                </a>
              </Button>
            </div>
          </div>

          <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <SummaryItem
                label="当前流程"
                value={selectedRun.processName}
                className="xl:col-span-2"
              />
              <SummaryItem label="候选人" value={selectedRun.candidateName} />
              <SummaryItem label="岗位" value={selectedRun.jobTitle} className="xl:col-span-2" />
              <div>
                <div className="text-xs text-muted-foreground">当前状态</div>
                <StatusBadge run={selectedRun} className="mt-1" />
              </div>
              <SummaryItem label="开始时间" value={formatDate(selectedRun.startedAt)} />
              <SummaryItem label="完成时间" value={formatDate(selectedRun.completedAt)} />
            </div>
          </section>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 pb-28 sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
          <RunList runs={state.runs} selectedRun={selectedRun} onSelect={selectRun} />
          <AgentRunMain run={selectedRun} />
          <HrReviewPanel run={selectedRun} />
        </div>
      </main>
    </PageShell>
  );
}

function RunList({
  runs,
  selectedRun,
  onSelect,
}: {
  runs: AgentRunViewModel[];
  selectedRun: AgentRunViewModel;
  onSelect: (runId: string) => void;
}) {
  return (
    <aside className="min-w-0">
      <div className="xl:sticky xl:top-24">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">协作流程</h2>
          <span className="text-xs text-muted-foreground">{runs.length} 项</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 xl:block xl:space-y-3 xl:overflow-visible xl:pb-0">
          {runs.map((run) => {
            const active = run.id === selectedRun.id;
            return (
              <button
                type="button"
                key={run.id}
                onClick={() => onSelect(run.id)}
                className={cn(
                  "min-w-[260px] rounded-3xl border bg-card p-4 text-left shadow-soft transition-colors xl:min-w-0 xl:w-full",
                  active ? "border-primary" : "border-border hover:bg-secondary/35",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{run.processName}</div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {run.candidateName} · {run.jobTitle}
                    </p>
                  </div>
                  {run.needsHrReview && (
                    <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <StatusBadge run={run} />
                  <span className="text-xs text-muted-foreground">{run.progress}%</span>
                </div>
                <Progress value={run.progress} className="mt-3 h-2" />
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDate(run.updatedAt)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function AgentRunMain({ run }: { run: AgentRunViewModel }) {
  const activeAgents = run.agents.filter((agent) => agent.status === "running").length;
  const completedAgents = run.agents.filter((agent) =>
    ["completed", "fallback"].includes(agent.status),
  ).length;
  const reviewQuestions = run.agents.reduce(
    (total, agent) => total + agent.humanQuestions.length,
    0,
  );

  return (
    <div className="min-w-0 space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">协作概览</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              多个 Agent 围绕同一招聘流程协作，输出给 HR 可复核的业务摘要。
            </p>
          </div>
          <div className="rounded-3xl bg-rainbow p-5 text-white">
            <div className="text-sm text-white/80">整体进度</div>
            <div className="mt-1 font-display text-4xl font-semibold">{run.progress}%</div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricCard label="已完成 Agent" value={`${completedAgents}/${run.agents.length}`} />
          <MetricCard label="处理中 Agent" value={`${activeAgents}`} />
          <MetricCard label="待人工确认" value={`${reviewQuestions}`} />
        </div>
        {(run.failureSummary || run.fallbackSummary || run.status === "pending") && (
          <div
            className={cn(
              "mt-5 rounded-2xl border p-4 text-sm leading-relaxed",
              run.failureSummary
                ? "border-red-500/20 bg-red-500/5 text-red-800"
                : "border-amber-500/20 bg-amber-500/5 text-amber-900",
            )}
          >
            {run.failureSummary ||
              run.fallbackSummary ||
              "该协作流程尚未开始，业务数据已准备就绪。"}
          </div>
        )}
      </section>

      <Tabs
        defaultValue="agents"
        className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
          <TabsTrigger value="agents">参与 Agent</TabsTrigger>
          <TabsTrigger value="timeline">协作时间线</TabsTrigger>
        </TabsList>
        <TabsContent value="agents" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2">
            {run.agents.map((agent) => (
              <article
                key={agent.id}
                className="rounded-2xl border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      {agent.name}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {agent.responsibility}
                    </p>
                  </div>
                  <StatusPill label={agent.statusLabel} tone={agent.statusTone} />
                </div>
                <div className="mt-4 rounded-xl bg-secondary/45 p-3 text-sm">
                  <div className="font-medium">输出摘要</div>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    {agent.outputSummary}
                  </p>
                </div>
                <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                  <InfoBlock
                    title="已完成动作"
                    items={agent.completedActions}
                    emptyText="等待处理"
                  />
                  <InfoBlock title="人工确认问题" items={agent.humanQuestions} emptyText="暂无" />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>关联证据</span>
                  <span className="font-medium text-foreground">{agent.evidenceCount} 条</span>
                </div>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="timeline" className="mt-5">
          <div className="space-y-3">
            {run.timeline.map((step, index) => (
              <details
                key={step.id}
                className="group rounded-2xl border border-border bg-background p-4"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <TimelineIcon tone={step.statusTone} index={index + 1} />
                    <div>
                      <div className="font-medium">{step.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{step.businessSummary}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusPill label={step.statusLabel} tone={step.statusTone} />
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-[1fr_1.3fr]">
                  <InfoBlock title="关键输出" items={step.keyOutputs} emptyText="暂无输出" />
                  <div className="rounded-xl bg-secondary/45 p-3 leading-relaxed text-muted-foreground">
                    {step.detail}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HrReviewPanel({ run }: { run: AgentRunViewModel }) {
  const [note, setNote] = useState(run.hrReview.note);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  useEffect(() => {
    setNote(run.hrReview.note);
  }, [run.id, run.hrReview.note]);

  const saveNote = async () => {
    await agentRunService.saveHrNote(run.id, note);
    toast.success("内部备注已保存");
  };

  return (
    <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">HR 复核</h2>
          {run.hrReview.priority && (
            <Badge variant="secondary" className="rounded-full text-amber-800">
              重点关注
            </Badge>
          )}
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <ReviewRow label="复核状态" value={run.hrReview.reviewed ? "已复核" : "待复核"} />
          <ReviewRow label="结果确认" value={run.hrReview.confirmed ? "已确认" : "尚未确认"} />
          <ReviewRow label="下一步" value={run.nextActions.join("、")} />
        </div>
        <div className="mt-5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="agent-run-hr-note">
            内部备注
          </label>
          <Textarea
            id="agent-run-hr-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="记录需要后续核实的业务判断、面试追问或复核结论"
            className="mt-2 min-h-28"
          />
          <Button variant="outline" className="mt-3 w-full rounded-full" onClick={saveNote}>
            <MessageSquareText /> 保存内部备注
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          <Button
            variant={run.hrReview.reviewed ? "secondary" : "outline"}
            className="w-full justify-start rounded-full"
            onClick={() => {
              void agentRunService.markReviewed(run.id);
              toast.success("已标记为复核完成");
            }}
          >
            <CheckCircle2 /> 标记已复核
          </Button>
          <Button
            variant={run.hrReview.priority ? "secondary" : "outline"}
            className="w-full justify-start rounded-full"
            onClick={() => {
              void agentRunService.togglePriority(run.id);
              toast.success(run.hrReview.priority ? "已取消重点关注" : "已标记重点关注");
            }}
          >
            <Star className={cn(run.hrReview.priority && "fill-current")} /> 标记重点关注
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start rounded-full"
            disabled={run.status === "retrying"}
            onClick={() => {
              void agentRunService.retry(run.id);
              toast.success("已请求重新运行");
            }}
          >
            <RefreshCw className={cn(run.status === "retrying" && "animate-spin")} /> 请求重新运行
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start rounded-full"
            onClick={() => setFallbackOpen(true)}
          >
            <FileText /> HR 介入
          </Button>
          <Button
            className="w-full rounded-full"
            disabled={
              run.hrReview.confirmed || run.status === "running" || run.status === "retrying"
            }
            onClick={() => setConfirmOpen(true)}
          >
            <ShieldCheck /> {run.hrReview.confirmed ? "协作结果已确认" : "确认本次协作结果"}
          </Button>
        </div>
      </section>

      <div className="space-y-2">
        <Button variant="outline" className="w-full rounded-full" asChild>
          <a href="/hr/applications/application_ai_pm_li_001/report">
            <FileText /> 返回证据链报告
          </a>
        </Button>
        <Button variant="ghost" className="w-full rounded-full text-muted-foreground" asChild>
          <a href="/hr">
            <ArrowLeft /> 返回 HR 工作台
          </a>
        </Button>
        <Button
          variant="ghost"
          className="w-full rounded-full text-muted-foreground"
          onClick={() => {
            void agentRunService.resetDemo();
            toast.success("协作面板状态已重置");
          }}
        >
          <RotateCcw /> 重置当前面板状态
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>确认本次协作结果？</DialogTitle>
            <DialogDescription>
              确认后，本次协作会标记为已完成。候选人材料、证据摘要和 HR 备注会继续保留。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">
            {run.candidateName} · {run.processName}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                void agentRunService.confirm(run.id);
                setConfirmOpen(false);
                toast.success("协作结果已确认");
              }}
            >
              确认结果
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={fallbackOpen} onOpenChange={setFallbackOpen}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>转为 HR 介入？</DialogTitle>
            <DialogDescription>
              当前自动处理未完成。系统会保留候选人材料、岗位信息和已整理的证据。确认后，该流程将标记为“待
              HR 介入”，HR 可基于现有材料继续判断，也可以稍后重新运行。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFallbackOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                void agentRunService.useFallback(run.id);
                setFallbackOpen(false);
                toast.success("已转为 HR 介入");
              }}
            >
              HR 介入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function AgentRunsSkeleton() {
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
      <Skeleton className="h-44 rounded-3xl" />
      <div className="mt-6 grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <Skeleton className="h-96 rounded-3xl" />
        <div className="space-y-5">
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </main>
  );
}

function StateCard({
  title,
  description,
  actions,
  tone = "neutral",
}: {
  title: string;
  description: string;
  actions: Array<{ label: string; href?: string; onClick?: () => void; icon?: ReactNode }>;
  tone?: "neutral" | "warning" | "error";
}) {
  return (
    <section
      className={cn(
        "mx-auto max-w-2xl rounded-3xl border p-8 text-center shadow-soft",
        tone === "error"
          ? "border-red-500/25 bg-red-500/5"
          : tone === "warning"
            ? "border-amber-500/25 bg-amber-500/5"
            : "border-border bg-card",
      )}
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-background">
        {tone === "error" ? (
          <AlertTriangle className="h-7 w-7 text-red-600" />
        ) : tone === "warning" ? (
          <ShieldAlert className="h-7 w-7 text-amber-700" />
        ) : (
          <Bot className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      <h1 className="mt-5 text-xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {actions.map((action, index) =>
          action.href ? (
            <Button
              key={action.label}
              variant={index === 0 ? "default" : "outline"}
              className="rounded-full"
              asChild
            >
              <a href={action.href}>
                {action.icon}
                {action.label}
              </a>
            </Button>
          ) : (
            <Button
              key={action.label}
              variant={index === 0 ? "default" : "outline"}
              className="rounded-full"
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </Button>
          ),
        )}
      </div>
    </section>
  );
}

function SummaryItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/45 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function InfoBlock({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-xl bg-secondary/45 p-3">
      <div className="text-xs font-medium">{title}</div>
      {items.length ? (
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 leading-relaxed">{value}</div>
    </div>
  );
}

function StatusBadge({ run, className }: { run: AgentRunViewModel; className?: string }) {
  return <StatusPill label={run.statusLabel} tone={run.statusTone} className={className} />;
}

function StatusPill({
  label,
  tone,
  className,
}: {
  label: string;
  tone: AgentRunViewModel["statusTone"];
  className?: string;
}) {
  const classes = {
    neutral: "bg-secondary text-muted-foreground",
    blue: "bg-blue-500/10 text-blue-700",
    violet: "bg-violet-500/10 text-violet-700",
    green: "bg-emerald-500/10 text-emerald-700",
    amber: "bg-amber-500/10 text-amber-800",
    red: "bg-red-500/10 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        classes[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

function TimelineIcon({ tone, index }: { tone: AgentRunViewModel["statusTone"]; index: number }) {
  const base = "grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs";
  if (tone === "green") {
    return (
      <span className={`${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-700`}>
        <CheckCircle2 className="h-4 w-4" />
      </span>
    );
  }
  if (tone === "blue") {
    return (
      <span className={`${base} border-blue-500/30 bg-blue-500/10 text-blue-700`}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    );
  }
  if (tone === "red") {
    return (
      <span className={`${base} border-red-500/30 bg-red-500/10 text-red-700`}>
        <AlertTriangle className="h-4 w-4" />
      </span>
    );
  }
  if (tone === "violet") {
    return (
      <span className={`${base} border-violet-500/30 bg-violet-500/10 text-violet-700`}>
        <Flag className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className={`${base} border-border bg-background text-muted-foreground`}>
      {index || <Circle className="h-4 w-4" />}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return "尚未完成";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
