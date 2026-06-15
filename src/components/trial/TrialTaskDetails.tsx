import { CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import type { TrialDemoState } from "@/lib/trial-demo";
import { formatDemoDate } from "@/lib/trial-demo";
import { TrialCriteriaList } from "./TrialCriteriaList";

export function TrialTaskDetails({ task }: { task: TrialDemoState["trial_task"] }) {
  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">岗位任务</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{task.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-3 py-1.5">
              预计 {task.estimatedMinutes} 分钟
            </span>
            <span className="rounded-full bg-secondary px-3 py-1.5">
              截止 {formatDemoDate(task.deadline)}
            </span>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-secondary/50 p-5">
          <h3 className="text-sm font-semibold">任务背景</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{task.background}</p>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">任务要求</h3>
          </div>
          <ol className="mt-4 space-y-3">
            {task.requirements.map((requirement, index) => (
              <li key={requirement} className="flex gap-3 text-sm text-muted-foreground">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium text-foreground">
                  {index + 1}
                </span>
                <span className="pt-0.5">{requirement}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">交付物</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {task.deliverables.map((deliverable) => (
              <li
                key={deliverable}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                {deliverable}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-500/5 p-3 text-xs text-amber-800">
            <Clock3 className="h-4 w-4 shrink-0" />
            请在截止时间前提交，默认只能提交一次。
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">评分标准</h3>
          <span className="text-xs text-muted-foreground">发布前公开 · 总分 100</span>
        </div>
        <TrialCriteriaList criteria={task.criteria} />
      </section>
    </div>
  );
}
