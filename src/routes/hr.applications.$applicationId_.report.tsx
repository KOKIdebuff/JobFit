import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileText, RefreshCw, Sparkles } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import {
  GenerationProgress,
  ReportSkeleton,
  ReportStatePanel,
} from "@/components/evaluation-report/ReportCommon";
import { HrEvidenceReport } from "@/components/evaluation-report/HrEvidenceReport";
import { useEvaluationReport } from "@/hooks/use-evaluation-report";
import { evaluationReportService } from "@/lib/evaluation-report/service";
import { DEMO_IDS as CANDIDATE_DEMO_IDS } from "@/lib/candidate-detail-demo";

interface ReportSearch {
  state?: "input-missing" | "forbidden";
  fail?: boolean;
}

export const Route = createFileRoute("/hr/applications/$applicationId_/report")({
  validateSearch: (search: Record<string, unknown>): ReportSearch => ({
    state:
      search.state === "input-missing" || search.state === "forbidden" ? search.state : undefined,
    fail: search.fail === true || search.fail === "true",
  }),
  head: () => ({
    meta: [
      { title: "完整证据链报告 — HireLink AI" },
      {
        name: "description",
        content: "HR 查看候选人的完整能力证据链、证据引用、任务表现和复核状态。",
      },
    ],
  }),
  component: EvidenceReportPage,
});

function EvidenceReportPage() {
  const { applicationId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const state = useEvaluationReport(applicationId);

  const backDetail = () =>
    navigate({
      to: "/hr/jobs/$jobId/candidates/$applicationId",
      params: {
        jobId: CANDIDATE_DEMO_IDS.job,
        applicationId: CANDIDATE_DEMO_IDS.application,
      },
    });
  const backList = () =>
    navigate({
      to: "/hr/jobs/$jobId/candidates",
      params: { jobId: CANDIDATE_DEMO_IDS.job },
    });
  const generate = () => evaluationReportService.generate({ fail: Boolean(search.fail) });

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
            description="你不能查看该申请的证据链报告。候选人、简历、匹配和任务数据未发生变化。"
            action={{ label: "返回候选人列表", onClick: backList }}
          />
        </main>
      </PageShell>
    );
  }

  if (search.state === "input-missing") {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8">
          <ReportStatePanel
            tone="warning"
            title="输入数据缺失"
            description="岗位画像、候选人画像、匹配、面试或岗位任务至少有一项尚未就绪。已完成的数据均已保留，可返回候选人详情继续补齐。"
            action={{ label: "返回候选人详情", onClick: backDetail }}
            secondaryAction={{
              label: "使用已校验兜底报告",
              onClick: () => evaluationReportService.useFallback(),
              icon: <FileText />,
            }}
          />
        </main>
      </PageShell>
    );
  }

  if (!state.report) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8">
          <ReportStatePanel
            title="尚未生成完整证据链报告"
            description="系统将聚合岗位、画像、简历、申请、匹配、验证方案、面试回答、岗位任务和 AI 运行记录，生成待 HR 复核的报告。"
            action={{ label: "生成证据链报告", onClick: generate, icon: <Sparkles /> }}
            secondaryAction={{ label: "返回候选人详情", onClick: backDetail }}
          />
        </main>
      </PageShell>
    );
  }

  if (state.report.status === "generating") {
    return (
      <PageShell>
        <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <GenerationProgress report={state.report} />
        </main>
      </PageShell>
    );
  }

  if (state.report.status === "failed") {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8">
          <ReportStatePanel
            tone="error"
            title="证据链报告生成失败"
            description={
              state.report.generationError ||
              "证据链报告生成失败，上游简历、匹配、面试和岗位任务数据均已保留。"
            }
            action={{
              label: "重新生成",
              onClick: () => evaluationReportService.retry(),
              icon: <RefreshCw />,
            }}
            secondaryAction={{
              label: "使用预置兜底",
              onClick: () => evaluationReportService.useFallback(),
              icon: <FileText />,
            }}
          />
          <div className="mt-4 text-center">
            <Button variant="ghost" className="rounded-full" onClick={backDetail}>
              返回候选人详情
            </Button>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1440px] px-5 py-8 pb-28 sm:px-8">
        <HrEvidenceReport report={state.report} onBackDetail={backDetail} onBackList={backList} />
      </main>
    </PageShell>
  );
}
