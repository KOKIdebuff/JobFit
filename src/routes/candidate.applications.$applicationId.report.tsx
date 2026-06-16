import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PageShell } from "@/components/site/PageShell";
import { CandidateEvidenceFeedback } from "@/components/evaluation-report/CandidateEvidenceFeedback";
import { ReportSkeleton, ReportStatePanel } from "@/components/evaluation-report/ReportCommon";
import { useEvaluationReport } from "@/hooks/use-evaluation-report";
import { evaluationReportService } from "@/lib/evaluation-report/service";

interface CandidateReportSearch {
  state?: "forbidden";
}

export const Route = createFileRoute("/candidate/applications/$applicationId/report")({
  validateSearch: (search: Record<string, unknown>): CandidateReportSearch => ({
    state: search.state === "forbidden" ? "forbidden" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "候选人能力反馈 — HireLink AI" },
      {
        name: "description",
        content: "候选人查看经 HR 确认后的脱敏能力反馈、面试反馈和成长行动建议。",
      },
    ],
  }),
  component: CandidateReportPage,
});

function CandidateReportPage() {
  const { applicationId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const state = useEvaluationReport(applicationId);

  useEffect(() => {
    if (state.report?.status === "confirmed") {
      evaluationReportService.markCandidateRead();
    }
  }, [state.report?.status]);

  const back = () =>
    navigate({
      to: "/candidate/applications/$applicationId/trial",
      params: { applicationId },
    });

  if (state.loading || !state.hydrated) {
    return (
      <PageShell>
        <ReportSkeleton />
      </PageShell>
    );
  }

  if (state.access === "forbidden" || search.state === "forbidden") {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8">
          <ReportStatePanel
            tone="warning"
            title="无访问权限"
            description="你不能查看该申请的能力反馈。已有任务、回答和提交内容未发生变化。"
            action={{ label: "返回候选人工作台", onClick: back }}
          />
        </main>
      </PageShell>
    );
  }

  if (!state.report || state.report.status !== "confirmed") {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8">
          <ReportStatePanel
            tone="neutral"
            title="HR 正在复核本次能力验证结果，报告确认后可查看。"
            description="面试回答、岗位任务提交和验证记录均已保留。确认后这里会展示综合反馈、能力反馈和成长行动建议。"
            action={{ label: "返回候选人工作台", onClick: back }}
          />
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="relative overflow-hidden px-5 pb-8 pt-10 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-48 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
      </section>
      <CandidateEvidenceFeedback report={state.report} onBack={back} />
    </PageShell>
  );
}
