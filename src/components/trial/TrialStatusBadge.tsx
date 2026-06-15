import { Badge } from "@/components/ui/badge";
import type { TrialTaskStatus } from "@/lib/trial-demo";
import { cn } from "@/lib/utils";

const STATUS_META: Record<TrialTaskStatus, { label: string; className: string }> = {
  ungenerated: { label: "尚未生成", className: "bg-secondary text-muted-foreground" },
  generating: { label: "AI 生成中", className: "bg-blue-500/10 text-blue-600" },
  failed: { label: "生成失败", className: "bg-red-500/10 text-red-600" },
  draft: { label: "草稿待确认", className: "bg-violet-500/10 text-violet-600" },
  published: { label: "已发布", className: "bg-emerald-500/10 text-emerald-600" },
  in_progress: { label: "进行中", className: "bg-blue-500/10 text-blue-600" },
  submitted: { label: "已提交", className: "bg-amber-500/10 text-amber-700" },
  evaluated: { label: "已评价", className: "bg-emerald-500/10 text-emerald-600" },
  expired: { label: "已过期", className: "bg-red-500/10 text-red-600" },
};

export function TrialStatusBadge({
  status,
  className,
}: {
  status: TrialTaskStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge className={cn("border-0 shadow-none hover:bg-inherit", meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
