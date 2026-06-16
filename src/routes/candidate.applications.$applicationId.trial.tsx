import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  File,
  Link2,
  Paperclip,
  Play,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import { TrialContextBar } from "@/components/trial/TrialContextBar";
import { TrialTaskDetails } from "@/components/trial/TrialTaskDetails";
import { AiRunProgress } from "@/components/trial/AiRunProgress";
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
import { formatBytes, isHttpUrl, trialDemoService, type TrialAttachment } from "@/lib/trial-demo";

export const Route = createFileRoute("/candidate/applications/$applicationId/trial")({
  head: () => ({
    meta: [
      { title: "岗位能力试炼 — HireLink AI" },
      {
        name: "description",
        content: "候选人查看岗位任务、保存草稿并提交文本、链接和限定类型附件。",
      },
    ],
  }),
  component: CandidateTrialPage,
});

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".png", ".jpg", ".jpeg"];
const ALLOWED_MIME_BY_EXTENSION: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".txt": ["text/plain"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function CandidateTrialPage() {
  const state = useTrialDemo();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [fileError, setFileError] = useState("");

  const editable =
    state.trial_task.status === "in_progress" &&
    (state.trial_submission.submitCount === 0 || state.application.resubmissionAllowed);
  const characterCount = state.trial_submission.body.trim().length;

  const updateDraft = (
    patch: Partial<Pick<typeof state.trial_submission, "body" | "prototypeUrl" | "attachments">>,
  ) => {
    trialDemoService.setSubmissionDraft({
      body: patch.body ?? state.trial_submission.body,
      prototypeUrl: patch.prototypeUrl ?? state.trial_submission.prototypeUrl,
      attachments: patch.attachments ?? state.trial_submission.attachments,
    });
  };

  const addFiles = (files: FileList | null) => {
    setFileError("");
    if (!files?.length) return;
    const next: TrialAttachment[] = [];
    for (const file of Array.from(files)) {
      const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        setFileError(`${file.name} 的类型不支持。`);
        continue;
      }
      if (file.type && !ALLOWED_MIME_BY_EXTENSION[extension]?.includes(file.type)) {
        setFileError(`${file.name} 的文件扩展名与 MIME 类型不一致。`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name} 超过 10MB。`);
        continue;
      }
      next.push({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    }
    if (next.length) updateDraft({ attachments: [...state.trial_submission.attachments, ...next] });
    if (fileInput.current) fileInput.current.value = "";
  };

  const save = async () => {
    const ok = await trialDemoService.saveDraft();
    if (ok) toast.success("草稿已保存");
    else toast.error("草稿保存失败", { description: "内容仍保留在当前页面，可重试保存。" });
  };

  const requestSubmit = () => {
    if (!state.trial_submission.body.trim()) {
      toast.error("请先填写方案正文");
      return;
    }
    if (!isHttpUrl(state.trial_submission.prototypeUrl)) {
      setUrlError("请输入以 http:// 或 https:// 开头的链接。");
      return;
    }
    setUrlError("");
    setConfirmOpen(true);
  };

  const submit = () => {
    setConfirmOpen(false);
    trialDemoService.submitTask();
    toast.success("任务已提交", { description: "AI 正在按公开评分标准整理参考评价。" });
  };

  const showTask = ["published", "in_progress", "submitted", "evaluated", "expired"].includes(
    state.trial_task.status,
  );
  const showAi =
    state.ai_run.status === "running" ||
    state.ai_run.status === "failed" ||
    state.ai_run.status === "completed" ||
    state.ai_run.status === "fallback";

  return (
    <PageShell>
      <TrialContextBar role="候选人" />
      <section className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-7xl">
          <Link
            to="/hr/applications/$applicationId/trial/setup"
            params={{ applicationId: state.application.id }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 切换回 HR 视图
          </Link>
          <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">岗位能力试炼</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            用一项轻量、真实的岗位任务补充简历和口头面试无法证明的能力，不是在线考试。
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-32 sm:px-8">
        {!showTask && <WaitingState onPrepare={() => trialDemoService.preparePublishedTask()} />}
        {showTask && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <TrialTaskDetails task={state.trial_task} />
            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              {state.trial_task.status === "published" && (
                <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
                  <Play className="mx-auto h-9 w-9 text-foreground" />
                  <h2 className="mt-3 font-semibold">准备开始任务</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    开始后可以填写正文、添加原型链接和附件，并随时保存草稿。
                  </p>
                  <Button
                    className="mt-5 w-full rounded-full"
                    onClick={() => trialDemoService.startTask()}
                  >
                    <Play /> 开始任务
                  </Button>
                </section>
              )}

              {editable && (
                <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-semibold">提交区</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => trialDemoService.fillPresetSubmission()}
                    >
                      填入演示提交
                    </Button>
                  </div>
                  <label className="mt-5 block">
                    <span className="text-sm font-medium">方案正文</span>
                    <Textarea
                      value={state.trial_submission.body}
                      onChange={(event) => updateDraft({ body: event.target.value })}
                      placeholder="请填写 500—800 字方案说明…"
                      className="mt-2 min-h-56 resize-y rounded-2xl"
                    />
                  </label>
                  <div className="mt-1 flex justify-between text-xs">
                    <span
                      className={
                        characterCount > 0 && (characterCount < 500 || characterCount > 800)
                          ? "text-amber-700"
                          : "text-muted-foreground"
                      }
                    >
                      建议 500—800 字，不作为演示提交的强制门槛
                    </span>
                    <span className="tabular-nums text-muted-foreground">{characterCount} 字</span>
                  </div>

                  <label className="mt-5 block">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <Link2 className="h-4 w-4" /> 原型链接（可选）
                    </span>
                    <Input
                      value={state.trial_submission.prototypeUrl}
                      onChange={(event) => {
                        updateDraft({ prototypeUrl: event.target.value });
                        setUrlError("");
                      }}
                      placeholder="https://example.com/prototype"
                      className="mt-2 h-11 rounded-xl"
                    />
                  </label>
                  {urlError && <p className="mt-1 text-xs text-red-600">{urlError}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    外部链接只用于展示，系统不会主动访问、抓取或执行链接内容。
                  </p>

                  <div className="mt-5">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Paperclip className="h-4 w-4" /> 附件
                    </div>
                    <input
                      ref={fileInput}
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                      className="sr-only"
                      onChange={(event) => addFiles(event.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="mt-2 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-secondary/40"
                    >
                      <Upload className="h-5 w-5" />
                      模拟上传 PDF / DOCX / TXT / PNG / JPG
                      <span className="text-xs">单个附件不超过 10MB</span>
                    </button>
                    {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
                    <div className="mt-3 space-y-2">
                      {state.trial_submission.attachments.map((attachment, index) => (
                        <div
                          key={`${attachment.name}-${index}`}
                          className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3 text-sm"
                        >
                          <File className="h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{attachment.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatBytes(attachment.size)}
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label={`删除 ${attachment.name}`}
                            onClick={() =>
                              updateDraft({
                                attachments: state.trial_submission.attachments.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                ),
                              })
                            }
                            className="rounded-full p-2 text-muted-foreground hover:bg-background hover:text-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {state.trial_submission.status === "save_failed" && (
                    <p className="mt-4 text-sm text-red-600">{state.trial_submission.saveError}</p>
                  )}
                  {state.trial_submission.status === "draft_saved" && (
                    <p className="mt-4 flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> 草稿已保存
                    </p>
                  )}
                  <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={save}
                      disabled={state.trial_submission.status === "saving"}
                    >
                      <Save /> {state.trial_submission.status === "saving" ? "保存中…" : "保存草稿"}
                    </Button>
                    <Button className="rounded-full" onClick={requestSubmit}>
                      <Send /> 提交任务
                    </Button>
                  </div>
                </section>
              )}

              {showAi && (
                <AiRunProgress
                  aiRun={state.ai_run}
                  onRetry={() => trialDemoService.runEvaluation()}
                  onFallback={() => trialDemoService.usePresetEvaluation()}
                />
              )}

              {state.trial_task.status === "expired" && (
                <section className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6">
                  <h2 className="font-semibold text-red-700">任务已过期</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    截止时间后不能首次提交或重新提交，已保存内容仅用于当前页面演示。
                  </p>
                </section>
              )}

              <section className="rounded-2xl border border-border bg-card p-5 text-sm shadow-soft">
                <h3 className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4" /> 提交与评价说明
                </h3>
                <ul className="mt-3 space-y-2 text-muted-foreground">
                  <li>默认只能提交一次</li>
                  <li>AI 评分仅供参考</li>
                  <li>最终判断由 HR 作出</li>
                </ul>
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
                to="/hr/applications/$applicationId/trial/setup"
                params={{ applicationId: state.application.id }}
              >
                上一步
              </Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() =>
                navigate({
                  to: "/candidate/applications/$applicationId/report",
                  params: { applicationId: state.application.id },
                })
              }
            >
              查看能力反馈
            </Button>
            <Button
              className="rounded-full"
              disabled={!state.trial_evaluation}
              onClick={() =>
                navigate({
                  to: "/hr/applications/$applicationId/trial/result",
                  params: { applicationId: state.application.id },
                })
              }
            >
              下一步 <ArrowRight />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认提交岗位任务</DialogTitle>
            <DialogDescription>
              默认只能提交一次。提交后将按公开评分标准生成 AI 参考评价。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-2xl bg-secondary/50 p-4 text-sm">
            <div>方案正文：{characterCount} 字</div>
            <div>原型链接：{state.trial_submission.prototypeUrl || "未填写"}</div>
            <div>附件：{state.trial_submission.attachments.length} 个</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button onClick={submit}>确认提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function WaitingState({ onPrepare }: { onPrepare: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
      <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold">任务尚未向候选人发布</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
        候选人只能查看 HR 已确认发布的任务。你可以返回 HR 视图完成发布，或载入演示发布状态。
      </p>
      <Button variant="outline" className="mt-6 rounded-full" onClick={onPrepare}>
        载入已发布演示任务
      </Button>
    </div>
  );
}
