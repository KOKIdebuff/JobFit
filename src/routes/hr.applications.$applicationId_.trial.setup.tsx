import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Pencil,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { TrialContextBar } from "@/components/trial/TrialContextBar";
import { TrialTaskDetails } from "@/components/trial/TrialTaskDetails";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTrialDemo } from "@/hooks/use-trial-demo";
import { trialDemoService, type TrialCriterion } from "@/lib/trial-demo";

export const Route = createFileRoute("/hr/applications/$applicationId_/trial/setup")({
  head: () => ({
    meta: [
      { title: "确认岗位能力试炼 — HireLink AI" },
      {
        name: "description",
        content: "HR 查看、修改并发布由岗位画像和候选人能力缺口生成的岗位能力试炼。",
      },
    ],
  }),
  component: TrialSetupPage,
});

function TrialSetupPage() {
  const state = useTrialDemo();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const publish = () => {
    trialDemoService.publishTask();
    setPublishOpen(false);
    toast.success("岗位能力试炼已发布", {
      description: "候选人现在可以查看并开始任务。",
    });
  };

  return (
    <PageShell>
      <TrialContextBar role="HR" />
      <section className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-7xl">
          <Link
            to="/hr/applications/$applicationId"
            params={{ applicationId: state.application.id }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回候选人详情
          </Link>
          <div className="mt-5">
            <div>
              <p className="text-sm font-medium text-muted-foreground">岗位能力试炼 · HR 确认</p>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">确认任务内容后发布</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                AI 根据已确认岗位画像、候选人匹配缺口和待验证能力生成轻量任务，发布前可由 HR 修改。
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-32 sm:px-8">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <BasisCard title="岗位画像" values={["AI 产品经理（校招）", "两周完成首版验证"]} />
          <BasisCard title="候选人匹配缺口" values={state.candidate.gaps} />
          <BasisCard title="主要优势" values={state.candidate.strengths} />
        </div>

        {state.trial_task.status === "ungenerated" && (
          <EmptyGeneration onGenerate={() => trialDemoService.generateTask()} />
        )}
        {state.trial_task.status === "generating" && <GeneratingState />}
        {state.trial_task.status === "failed" && (
          <GenerationFailed
            onRetry={() => trialDemoService.generateTask()}
            onFallback={() => trialDemoService.usePresetTask()}
          />
        )}
        {["draft", "published", "in_progress", "submitted", "evaluated", "expired"].includes(
          state.trial_task.status,
        ) && (
          <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
            <TrialTaskDetails task={state.trial_task} />
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <h2 className="font-semibold">AI 生成说明</h2>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
                    来源：岗位画像、匹配缺口、待验证能力
                  </p>
                  <p className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                    {state.trial_task.source === "fallback"
                      ? "当前使用明确标记的预置任务"
                      : "当前使用 AI 模拟生成结果"}
                  </p>
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    最终招聘判断仍由 HR 作出
                  </p>
                </div>
                <div className="mt-5 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                    onClick={() => setEditOpen(true)}
                    disabled={state.trial_task.status !== "draft"}
                  >
                    <Pencil /> 编辑任务
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                    onClick={() => trialDemoService.generateTask()}
                    disabled={state.trial_task.status !== "draft"}
                  >
                    <RefreshCw /> 重新生成
                  </Button>
                  <Button
                    className="w-full rounded-full"
                    onClick={() => setPublishOpen(true)}
                    disabled={state.trial_task.status !== "draft"}
                  >
                    确认并发布 <ArrowRight />
                  </Button>
                </div>
              </section>
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
                to="/hr/applications/$applicationId"
                params={{ applicationId: state.application.id }}
              >
                上一步
              </Link>
            </Button>
            <Button
              className="rounded-full"
              disabled={
                state.trial_task.status === "ungenerated" ||
                state.trial_task.status === "generating"
              }
              onClick={() => {
                if (state.trial_task.status === "draft") {
                  setPublishOpen(true);
                  return;
                }
                navigate({
                  to: "/candidate/applications/$applicationId/trial",
                  params: { applicationId: state.application.id },
                });
              }}
            >
              下一步 <ArrowRight />
            </Button>
          </div>
        </div>
      </div>

      <TaskEditDialog open={editOpen} onOpenChange={setEditOpen} />
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认发布岗位能力试炼</DialogTitle>
            <DialogDescription>
              发布后任务内容保持不变，候选人将看到任务要求、截止时间和评分标准。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">
            <div className="font-medium">{state.trial_task.title}</div>
            <div className="mt-1 text-muted-foreground">默认只能提交一次，AI 评分仅供参考。</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              取消
            </Button>
            <Button onClick={publish}>确认并发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function BasisCard({ title, values }: { title: string; values: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyGeneration({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rainbow text-white">
        <Sparkles className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">尚未生成岗位能力试炼</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
        将根据岗位画像和李同学的待验证能力生成一项 45 分钟内可完成的真实岗位任务。
      </p>
      <Button onClick={onGenerate} className="mt-6 rounded-full px-6">
        <Sparkles /> 生成岗位能力试炼
      </Button>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      {["读取岗位画像与匹配缺口", "设计轻量任务范围", "生成评分标准"].map((label, index) => (
        <div
          key={label}
          className="flex animate-pulse items-center gap-3 rounded-2xl border border-border bg-card p-5"
        >
          <div className="h-9 w-9 rounded-full bg-secondary" />
          <div className="flex-1">
            <div className="text-sm font-medium">{label}</div>
            <div className="mt-2 h-2 w-2/3 rounded-full bg-secondary" />
          </div>
          {index === 0 && <Sparkles className="h-4 w-4 animate-pulse text-blue-600" />}
        </div>
      ))}
    </div>
  );
}

function GenerationFailed({
  onRetry,
  onFallback,
}: {
  onRetry: () => void;
  onFallback: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-red-500/30 bg-red-500/5 p-10 text-center">
      <TriangleAlert className="mx-auto h-10 w-10 text-red-600" />
      <h2 className="mt-4 text-xl font-semibold">岗位任务生成失败</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        可以重新生成，或显式使用预置任务继续演示。预置结果不会伪装成本次 AI 生成。
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button className="rounded-full" onClick={onRetry}>
          <RefreshCw /> 重新生成
        </Button>
        <Button variant="outline" className="rounded-full" onClick={onFallback}>
          <FileText /> 使用预置结果
        </Button>
      </div>
    </div>
  );
}

function TaskEditDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const state = useTrialDemo();
  const [title, setTitle] = useState(state.trial_task.title);
  const [background, setBackground] = useState(state.trial_task.background);
  const [requirements, setRequirements] = useState(state.trial_task.requirements.join("\n"));
  const [deliverables, setDeliverables] = useState(state.trial_task.deliverables.join("\n"));
  const [deadline, setDeadline] = useState(state.trial_task.deadline);
  const [criteria, setCriteria] = useState<TrialCriterion[]>(state.trial_task.criteria);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(state.trial_task.title);
    setBackground(state.trial_task.background);
    setRequirements(state.trial_task.requirements.join("\n"));
    setDeliverables(state.trial_task.deliverables.join("\n"));
    setDeadline(state.trial_task.deadline);
    setCriteria(state.trial_task.criteria);
    setError("");
  }, [open, state.trial_task]);

  const save = () => {
    const nextRequirements = requirements
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const nextDeliverables = deliverables
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    const total = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
    if (
      !title.trim() ||
      !background.trim() ||
      !nextRequirements.length ||
      !nextDeliverables.length
    ) {
      setError("请完整填写任务标题、背景、要求和交付物。");
      return;
    }
    if (!deadline) {
      setError("请设置截止时间。");
      return;
    }
    if (total !== 100) {
      setError(`评分标准总分必须为 100，当前为 ${total}。`);
      return;
    }
    trialDemoService.updateTask({
      title: title.trim(),
      background: background.trim(),
      requirements: nextRequirements,
      deliverables: nextDeliverables,
      deadline,
      criteria,
    });
    onOpenChange(false);
    toast.success("任务草稿已更新");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>编辑岗位能力试炼</DialogTitle>
          <DialogDescription>发布前修改会覆盖当前草稿，不保存历史版本。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="任务标题">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="任务背景">
            <Textarea
              value={background}
              onChange={(event) => setBackground(event.target.value)}
              className="min-h-24"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="任务要求（每行一项）">
              <Textarea
                value={requirements}
                onChange={(event) => setRequirements(event.target.value)}
                className="min-h-36"
              />
            </Field>
            <Field label="交付物（每行一项）">
              <Textarea
                value={deliverables}
                onChange={(event) => setDeliverables(event.target.value)}
                className="min-h-36"
              />
            </Field>
          </div>
          <Field label="截止时间">
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </Field>
          <Field label="评分标准">
            <div className="grid gap-3 sm:grid-cols-2">
              {criteria.map((criterion, index) => (
                <div key={criterion.id} className="flex items-center gap-2">
                  <Input
                    value={criterion.label}
                    onChange={(event) =>
                      setCriteria((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={criterion.score}
                    className="w-24"
                    onChange={(event) =>
                      setCriteria((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, score: Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={save}>保存修改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
