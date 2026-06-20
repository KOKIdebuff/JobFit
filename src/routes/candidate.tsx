import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hirelinkApi, type CandidateApplicationSummary } from "@/lib/hirelink-api/service";

export const Route = createFileRoute("/candidate")({
  head: () => ({
    meta: [
      { title: "候选人工作台 - HireLink AI" },
      { name: "description", content: "查看自己的申请、岗位试炼和已确认能力反馈。" },
    ],
  }),
  component: CandidateWorkspacePage,
});

function CandidateWorkspacePage() {
  const [applications, setApplications] = useState<CandidateApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    void hirelinkApi
      .candidateApplications()
      .then((response) => setApplications(response.applications))
      .catch((err) => setError(err instanceof Error ? err.message : "申请数据加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <PageShell>
      <section className="relative overflow-hidden px-5 pb-8 pt-12 sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-sm font-medium text-muted-foreground">候选人工作台</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">我的申请与能力反馈</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            这里只展示当前账号自己的申请。报告需要 HR 确认后才会开放脱敏反馈视图。
          </p>
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        {loading && <Skeleton className="h-40 rounded-3xl" />}
        {error && !loading && (
          <section className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-6">
            <h2 className="font-semibold text-amber-900">申请数据暂时不可用</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-4 rounded-full" variant="outline" onClick={load}>
              重试
            </Button>
          </section>
        )}
        {!loading && !error && !applications.length && (
          <section className="rounded-3xl border border-dashed border-border p-10 text-center">
            <h2 className="font-semibold">暂无申请</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              提交简历并申请岗位后，会在这里看到试炼和反馈入口。
            </p>
          </section>
        )}
        <div className="space-y-4">
          {applications.map((application) => (
            <article
              key={application.application_id}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{application.company}</p>
                  <h2 className="mt-1 text-xl font-semibold">{application.job_title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    申请状态：{application.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-full" asChild>
                    <Link
                      to="/candidate/applications/$applicationId/trial"
                      params={{ applicationId: application.application_id }}
                    >
                      <ShieldCheck /> 岗位试炼 <ArrowRight />
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-full" asChild>
                    <Link
                      to="/candidate/applications/$applicationId/report"
                      params={{ applicationId: application.application_id }}
                    >
                      <FileText /> 能力反馈
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
