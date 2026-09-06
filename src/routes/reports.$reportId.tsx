import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { RadarChart } from "@/components/site/RadarChart";
import { jobFitApi } from "@/lib/jobfit/service";
import type { AssessmentReport } from "@/lib/jobfit/types";

export const Route = createFileRoute("/reports/$reportId")({ component: ReportPage });
function ReportPage() {
  const { reportId } = Route.useParams();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  useEffect(() => {
    void jobFitApi.report(reportId).then(setReport);
  }, [reportId]);
  if (!report)
    return (
      <PageShell>
        <main className="p-12 text-center">正在读取报告…</main>
      </PageShell>
    );
  const radar = report.competency_scores.map((item) => ({ label: item.name, value: item.score }));
  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <header className="rounded-3xl bg-primary p-8 text-primary-foreground">
          <p>岗位胜任力评估报告</p>
          <h1 className="mt-2 text-3xl font-bold">{report.target_job}</h1>
          <div className="mt-6 flex gap-8">
            <div>
              <div className="text-4xl font-bold">{report.fit_score}</div>
              <div className="text-sm opacity-75">岗位匹配度</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{report.level}</div>
              <div className="text-sm opacity-75">评估等级</div>
            </div>
          </div>
        </header>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="font-semibold">能力雷达</h2>
            <div className="mt-4 flex justify-center">
              <RadarChart data={radar} size={320} />
            </div>
          </section>
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="font-semibold">能力评分与边界</h2>
            <div className="mt-4 space-y-4">
              {report.competency_scores.map((item) => {
                const boundary = report.boundaries.find((value) => value.competency_id === item.id);
                return (
                  <div key={item.id}>
                    <div className="flex justify-between text-sm">
                      <span>
                        {item.name} · L{boundary?.level ?? 0}
                      </span>
                      <strong>{item.score}</strong>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Evidence：{item.evidence_ids.join("、") || "暂无有效证据"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        <section className="mt-6 rounded-3xl border bg-card p-6">
          <h2 className="font-semibold">P0 / P1 / P2 提升建议</h2>
          <div className="mt-4 space-y-4">
            {report.recommendations.map((value, index) => {
              const item = value as Record<string, string>;
              return (
                <article key={index} className="rounded-2xl bg-secondary/50 p-4">
                  <strong>
                    {item.priority} · {item.competency}
                  </strong>
                  <p className="mt-2 text-sm">缺口：{item.gap}</p>
                  <p className="mt-1 text-sm">怎么练：{item.practice}</p>
                  <p className="mt-1 text-sm">验证项目：{item.validation_project}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
