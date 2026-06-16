import type { EvaluationReport, EvidenceRef, ReportStatus } from "./types";

export function formatReportDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function reportStatusLabel(status?: ReportStatus | null) {
  const labels: Record<ReportStatus, string> = {
    not_generated: "尚未生成",
    generating: "生成中",
    failed: "生成失败",
    fallback: "使用兜底",
    pending_review: "待 HR 复核",
    confirmed: "已确认",
    stale: "报告已过期",
  };
  return status ? labels[status] : labels.not_generated;
}

export function findEvidence(report: EvaluationReport, ids: string[]) {
  return ids
    .map((id) => report.evidenceRefs.find((item) => item.id === id))
    .filter((item): item is EvidenceRef => Boolean(item));
}
