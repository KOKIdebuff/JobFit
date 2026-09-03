import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MonitorUp,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  HumanInterviewBookingStatus,
  HumanInterviewInvitationStatus,
  HumanInterviewReportStatus,
  HumanInterviewType,
} from "@/lib/human-interviews/types";

export function formatDateTime(value?: string) {
  if (!value) return "待确认";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDate(value?: string) {
  if (!value) return "待确认";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function typeLabel(type: HumanInterviewType) {
  return type === "online" ? "线上面试" : "线下面试";
}

export function bookingStatusLabel(status: HumanInterviewBookingStatus) {
  const labels: Record<HumanInterviewBookingStatus, string> = {
    draft: "草稿",
    pending_confirmation: "待补全确认",
    confirmed: "已预约",
    rescheduled: "已改期",
    cancelled: "已取消",
    completed: "已完成",
    candidate_no_show: "候选人未到",
    interviewer_no_show: "面试官未到",
    expired: "已过期",
  };
  return labels[status];
}

export function invitationStatusLabel(status: HumanInterviewInvitationStatus) {
  const labels: Record<HumanInterviewInvitationStatus, string> = {
    draft: "草稿待发送",
    active: "已发送",
    revoked: "已撤回",
    expired: "已过期",
    booked: "已预约",
  };
  return labels[status];
}

export function reportStatusLabel(status?: HumanInterviewReportStatus) {
  if (!status) return "未填写";
  const labels: Record<HumanInterviewReportStatus, string> = {
    draft: "草稿",
    pending_hr_review: "待 HR 审核",
    published: "已发布",
  };
  return labels[status];
}

export function HumanInterviewTypeBadge({ type }: { type: HumanInterviewType }) {
  return (
    <Badge variant="secondary" className="rounded-full">
      {type === "online" ? (
        <MonitorUp className="mr-1 h-3.5 w-3.5" />
      ) : (
        <MapPin className="mr-1 h-3.5 w-3.5" />
      )}
      {typeLabel(type)}
    </Badge>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        tone === "positive"
          ? "bg-emerald-500/10 text-emerald-700"
          : tone === "warning"
            ? "bg-amber-500/10 text-amber-800"
            : tone === "danger"
              ? "bg-red-500/10 text-red-700"
              : tone === "info"
                ? "bg-blue-500/10 text-blue-700"
                : "bg-secondary text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function bookingTone(
  status: HumanInterviewBookingStatus,
): "neutral" | "positive" | "warning" | "danger" | "info" {
  if (status === "confirmed" || status === "completed") return "positive";
  if (status === "rescheduled" || status === "pending_confirmation") return "info";
  if (status === "candidate_no_show" || status === "interviewer_no_show") return "warning";
  if (status === "cancelled" || status === "expired") return "danger";
  return "neutral";
}

export function HumanInterviewSkeleton() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    </main>
  );
}

export function HumanInterviewStatePanel({
  title,
  description,
  action,
  tone = "neutral",
}: {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  tone?: "neutral" | "loading" | "error" | "success";
}) {
  return (
    <section
      className={cn(
        "mx-auto max-w-2xl rounded-3xl border p-8 text-center shadow-soft",
        tone === "error"
          ? "border-red-500/25 bg-red-500/5"
          : tone === "success"
            ? "border-emerald-500/25 bg-emerald-500/5"
            : "border-border bg-card",
      )}
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-background">
        {tone === "loading" ? (
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        ) : tone === "error" ? (
          <AlertTriangle className="h-7 w-7 text-red-600" />
        ) : tone === "success" ? (
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        ) : (
          <CalendarClock className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      <h1 className="mt-5 text-xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button className="mt-6 rounded-full" onClick={action.onClick}>
          {tone === "error" && <RefreshCw />}
          {action.label}
        </Button>
      )}
    </section>
  );
}

export function TimelineRow({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-3 last:border-0">
      <span className="mt-0.5 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        {icon ?? <Clock3 />}
      </span>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm leading-relaxed">{value}</div>
      </div>
    </div>
  );
}

export function TerminalStatusIcon({ status }: { status: HumanInterviewBookingStatus }) {
  if (status === "cancelled" || status === "expired") return <XCircle className="h-4 w-4" />;
  if (status === "completed") return <CheckCircle2 className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}
