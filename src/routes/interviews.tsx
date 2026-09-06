import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { jobFitApi } from "@/lib/jobfit/service";
import type { InterviewSession } from "@/lib/jobfit/types";

export const Route = createFileRoute("/interviews")({ component: InterviewsPage });

function InterviewsPage() {
  const [rows, setRows] = useState<InterviewSession[]>([]);
  useEffect(() => {
    void jobFitApi.interviews().then((result) => setRows(result.interviews));
  }, []);
  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <h1 className="text-3xl font-bold">面试记录</h1>
        <div className="mt-8 space-y-3">
          {rows.map((row) => (
            <article
              key={row.id}
              className="flex items-center justify-between rounded-2xl border bg-card p-5"
            >
              <div>
                <div className="font-medium">{row.current_competency_id ?? "岗位胜任力面试"}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {row.status} · 已完成 {row.turn_count} 轮 · 当前 L{row.current_difficulty}
                </div>
              </div>
              <Button asChild>
                <Link to="/interviews/$sessionId" params={{ sessionId: row.id }}>
                  {row.status === "COMPLETED" ? "查看" : "继续"}
                </Link>
              </Button>
            </article>
          ))}
          {!rows.length && (
            <p className="rounded-2xl border p-8 text-center text-muted-foreground">
              暂无面试记录，请先创建岗位评估。
            </p>
          )}
        </div>
      </main>
    </PageShell>
  );
}
