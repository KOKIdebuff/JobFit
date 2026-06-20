import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { CANDIDATE_APPLICATION_IDS, DEMO_IDS } from "@/lib/candidate-detail-demo";

export const Route = createFileRoute("/hr/jobs/$jobId/candidates")({
  component: JobCandidatesPage,
});

const candidates = [
  { applicationId: DEMO_IDS.application, name: "李同学", score: 86, stage: "待验证" },
  { applicationId: CANDIDATE_APPLICATION_IDS[1], name: "王同学", score: 82, stage: "待验证" },
  { applicationId: CANDIDATE_APPLICATION_IDS[2], name: "陈同学", score: 89, stage: "待验证" },
  { applicationId: CANDIDATE_APPLICATION_IDS[3], name: "赵同学", score: 78, stage: "待验证" },
];

function JobCandidatesPage() {
  const { jobId } = Route.useParams();
  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">岗位候选人</p>
          <h1 className="mt-2 text-3xl font-semibold">AI 产品经理（校招）</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            岗位 {jobId} 的候选人列表入口已恢复。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {candidates.map((candidate) => (
            <article
              key={candidate.applicationId}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{candidate.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{candidate.stage}</p>
                </div>
                <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-700">
                  {candidate.score}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" className="rounded-full" asChild>
                  <a href={`/hr/applications/${candidate.applicationId}`}>查看详情</a>
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" asChild>
                  <a href={`/hr/applications/${candidate.applicationId}/human-interview`}>约面试</a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
