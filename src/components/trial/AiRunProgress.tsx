import { AlertTriangle, Check, Circle, FileText, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AI_RUN_STEPS, type TrialDemoState } from "@/lib/trial-demo";
import { cn } from "@/lib/utils";

export function AiRunProgress({
  aiRun,
  onRetry,
  onFallback,
}: {
  aiRun: TrialDemoState["ai_run"];
  onRetry: () => void;
  onFallback: () => void;
}) {
  if (aiRun.status === "failed") {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-6 text-center sm:p-8">
        <AlertTriangle className="mx-auto h-9 w-9 text-red-600" />
        <h3 className="mt-3 font-semibold">AI 评价暂时失败，请重试。</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          候选人的提交内容已保留，不会因为本次模拟失败而丢失。
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={onRetry} className="rounded-full">
            <RefreshCw /> 重新评价
          </Button>
          <Button variant="outline" onClick={onFallback} className="rounded-full">
            <FileText /> 使用预置评价
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="flex items-center gap-2">
        {aiRun.status === "running" ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        ) : (
          <Check className="h-5 w-5 text-emerald-600" />
        )}
        <h3 className="font-semibold">
          {aiRun.status === "running" ? "AI 正在整理任务证据" : "AI 参考评价已生成"}
        </h3>
      </div>
      <div className="mt-5 space-y-3">
        {AI_RUN_STEPS.map((step, index) => {
          const done = aiRun.status !== "running" || index < aiRun.activeStep;
          const active = aiRun.status === "running" && index === aiRun.activeStep;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3.5 text-sm transition-colors",
                active ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-background",
              )}
            >
              {done ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
