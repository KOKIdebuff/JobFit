import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCandidateHumanInterviews, useHrHumanInterview } from "@/hooks/use-human-interviews";
import {
  bookingStatusLabel,
  bookingTone,
  formatDateTime,
  reportStatusLabel,
  StatusBadge,
} from "./HumanInterviewCommon";

export function HrHumanInterviewReportReference({ applicationId }: { applicationId: string }) {
  const { workspace, loading } = useHrHumanInterview(applicationId);
  const booking = workspace?.bookings[0];
  const report = booking
    ? workspace?.reports.find((item) => item.bookingId === booking.id)
    : undefined;

  if (loading || !workspace) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">真人面试报告引用</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            真人面试报告作为独立记录维护。AI 证据链报告仅展示引用状态，不合并真人报告正文。
          </p>
        </div>
        <Button variant="outline" className="rounded-full" asChild>
          <a href={`/hr/applications/${applicationId}/human-interview`}>
            管理真人预约 <ExternalLink />
          </a>
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ReferenceCell
          label="预约状态"
          value={booking ? bookingStatusLabel(booking.status) : "未预约"}
          tone={booking ? bookingTone(booking.status) : "neutral"}
        />
        <ReferenceCell
          label="面试时间"
          value={booking ? formatDateTime(booking.startAt) : "待确认"}
        />
        <ReferenceCell
          label="报告状态"
          value={reportStatusLabel(report?.status)}
          tone={report?.status === "published" ? "positive" : "neutral"}
        />
      </div>
    </section>
  );
}

export function CandidateHumanInterviewReportReference({
  applicationId,
}: {
  applicationId: string;
}) {
  const { data, loading } = useCandidateHumanInterviews();
  const booking = data?.bookings.find((item) => item.applicationId === applicationId);
  const report = booking
    ? data?.reports.find((item) => item.bookingId === booking.id && item.status === "published")
    : undefined;

  if (loading || !data || !booking) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">企业真人面试摘要</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {report?.candidateSummary ?? "真人面试报告发布后，这里会显示求职者可见摘要。"}
          </p>
        </div>
        <Button variant="outline" className="rounded-full" asChild>
          <a href="/candidate/interviews">
            查看我的预约 <ExternalLink />
          </a>
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ReferenceCell
          label="预约状态"
          value={bookingStatusLabel(booking.status)}
          tone={bookingTone(booking.status)}
        />
        <ReferenceCell label="面试时间" value={formatDateTime(booking.startAt)} />
        <ReferenceCell
          label="报告状态"
          value={reportStatusLabel(report?.status)}
          tone={report ? "positive" : "neutral"}
        />
      </div>
    </section>
  );
}

function ReferenceCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "danger" | "info";
}) {
  return (
    <div className="rounded-2xl bg-secondary/45 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2">
        <StatusBadge tone={tone}>{value}</StatusBadge>
      </div>
    </div>
  );
}
