import { BriefcaseBusiness, CircleUserRound, GitBranch, UserRoundCog } from "lucide-react";
import { useTrialDemo } from "@/hooks/use-trial-demo";
import { TrialStatusBadge } from "./TrialStatusBadge";

export function TrialContextBar({ role }: { role: "HR" | "候选人" }) {
  const state = useTrialDemo();

  return (
    <section className="border-b border-border bg-card/40 px-5 py-5 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <UserRoundCog className="h-4 w-4 text-muted-foreground" /> 当前角色：{role}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <BriefcaseBusiness className="h-4 w-4" />
            {state.job.title} · {state.job.company}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CircleUserRound className="h-4 w-4" />
            {state.candidate.name}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            {state.application.stage}
          </span>
        </div>
        <TrialStatusBadge status={state.trial_task.status} />
      </div>
    </section>
  );
}
