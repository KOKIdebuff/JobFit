import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  Loader2,
  Quote,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  REPORT_GENERATION_STEPS,
  type EvaluationReport,
  type EvidenceRef,
  type ReportStatus,
} from "@/lib/evaluation-report/types";
import { reportStatusLabel } from "@/lib/evaluation-report/ui";
import { cn } from "@/lib/utils";

export function ReportStatusBadge({ status }: { status?: ReportStatus | null }) {
  const label = reportStatusLabel(status);
  const classes =
    status === "confirmed"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "failed"
        ? "bg-red-500/10 text-red-700"
        : status === "stale" || status === "fallback"
          ? "bg-amber-500/10 text-amber-800"
          : status === "generating"
            ? "bg-blue-500/10 text-blue-700"
            : "bg-violet-500/10 text-violet-700";
  return <span className={cn("rounded-full px-3 py-1 text-xs font-medium", classes)}>{label}</span>;
}

export function ReportSkeleton() {
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    </main>
  );
}

export function ReportStatePanel({
  title,
  description,
  action,
  secondaryAction,
  tone = "neutral",
}: {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; icon?: ReactNode };
  secondaryAction?: { label: string; onClick: () => void; icon?: ReactNode };
  tone?: "neutral" | "warning" | "error" | "loading";
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
        {tone === "loading" ? (
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        ) : tone === "error" ? (
          <AlertTriangle className="h-7 w-7 text-red-600" />
        ) : tone === "warning" ? (
          <ShieldAlert className="h-7 w-7 text-amber-700" />
        ) : (
          <FileText className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      <h1 className="mt-5 text-xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {action && (
            <Button className="rounded-full" onClick={action.onClick}>
              {action.icon}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" className="rounded-full" onClick={secondaryAction.onClick}>
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

export function GenerationProgress({ report }: { report: EvaluationReport }) {
  const progress = Math.min(
    100,
    Math.round(((report.generationActiveStep + 1) / REPORT_GENERATION_STEPS.length) * 100),
  );
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <h2 className="font-semibold">正在生成完整证据链报告</h2>
        </div>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} className="mt-4 h-2" />
      <div className="mt-5 space-y-3">
        {REPORT_GENERATION_STEPS.map((step, index) => {
          const done = index < report.generationActiveStep;
          const active = index === report.generationActiveStep;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3.5 text-sm",
                active ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-background",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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
    </section>
  );
}

export function EvidenceQuoteList({ evidence }: { evidence: EvidenceRef[] }) {
  if (!evidence.length) {
    return <p className="mt-3 text-sm text-muted-foreground">暂无可展开证据。</p>;
  }
  return (
    <div className="mt-3 space-y-2">
      {evidence.map((item) => (
        <blockquote
          key={item.id}
          className="flex gap-2 rounded-xl border-l-4 border-primary bg-secondary/55 p-3 text-xs leading-relaxed text-muted-foreground"
        >
          <Quote className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">{item.title}：</span>
            {item.originalText || item.summary}
          </span>
        </blockquote>
      ))}
    </div>
  );
}

export function EvidenceDetails({
  title,
  evidence,
  children,
}: {
  title: string;
  evidence: EvidenceRef[];
  children?: ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-border bg-background p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      {children}
      <EvidenceQuoteList evidence={evidence} />
    </details>
  );
}

export function StatusDot({ tone }: { tone: "green" | "amber" | "red" | "gray" }) {
  return (
    <span
      className={cn(
        "mt-1 h-2 w-2 shrink-0 rounded-full",
        tone === "green"
          ? "bg-emerald-500"
          : tone === "amber"
            ? "bg-amber-500"
            : tone === "red"
              ? "bg-red-500"
              : "bg-muted-foreground/40",
      )}
    />
  );
}
