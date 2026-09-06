import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { jobFitApi } from "@/lib/jobfit/service";
import type { AssessmentReport } from "@/lib/jobfit/types";

export const Route = createFileRoute("/reports")({ component: ReportsPage });
function ReportsPage() {
  const [rows, setRows] = useState<AssessmentReport[]>([]);
  useEffect(() => {
    void jobFitApi.reports().then((result) => setRows(result.reports));
  }, []);
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-bold">评估报告</h1>
        <div className="mt-8 space-y-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className="flex items-center justify-between rounded-2xl border bg-card p-5"
            >
              <div>
                <div className="font-medium">{row.target_job}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  岗位匹配度 {row.fit_score} · {row.level}
                </p>
              </div>
              <Button asChild>
                <Link to="/reports/$reportId" params={{ reportId: row.id }}>
                  查看报告
                </Link>
              </Button>
            </article>
          ))}
          {!rows.length && (
            <p className="rounded-2xl border p-8 text-center text-muted-foreground">
              完成面试后将在这里生成报告。
            </p>
          )}
        </div>
      </main>
    </PageShell>
  );
}
