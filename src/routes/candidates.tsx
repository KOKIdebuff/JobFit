import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Briefcase } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { DemoNotice } from "@/components/site/DemoNotice";
import { JOB_MATCHES } from "@/lib/mock-data";

export const Route = createFileRoute("/candidates")({
  head: () => ({
    meta: [
      { title: "候选人排序 — HireLink AI" },
      {
        name: "description",
        content: "基于已确认的岗位画像，使用预置数据演示候选人规则评分与排序。",
      },
      { property: "og:title", content: "候选人排序 — HireLink AI" },
      { property: "og:description", content: "岗位画像确认后的候选人排序前端演示。" },
    ],
  }),
  component: CandidatesPage,
});

const CANDIDATES = [
  {
    name: "李同学",
    title: "AI 产品经理（校招）",
    score: 86,
    tags: ["LLM 产品经验", "需求分析", "数据分析"],
    location: "北京",
    note: "待验证：复杂需求拆解、AI 风险意识、MVP 范围控制",
  },
  {
    name: "王思远",
    title: "高级产品经理 · 5 年",
    score: 89,
    tags: ["数据驱动", "Agent", "跨团队"],
    location: "北京",
    note: "数据指标体系搭建经验丰富",
  },
  {
    name: "陈雨桐",
    title: "AI 产品 · 3 年",
    score: 85,
    tags: ["大模型", "Python", "增长"],
    location: "上海",
    note: "技术理解力强，可独立分析",
  },
  {
    name: "赵晗",
    title: "产品经理 · 3 年",
    score: 78,
    tags: ["B 端", "SQL", "协作"],
    location: "深圳",
    note: "B 端经验匹配，待补 AI 背景",
  },
];

function CandidatesPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden px-5 pb-8 pt-14 sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-5xl">
          <Link
            to="/job-profile"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回岗位画像
          </Link>
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> 岗位画像已确认，预置排序已载入
          </div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">候选人排序 · AI 产品经理</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            基于已确认画像的必备技能、能力维度与经验要求，展示规则评分与候选人排序。
          </p>
          <DemoNotice className="mt-5 max-w-3xl" />
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="space-y-4">
          {CANDIDATES.map((c, i) => (
            <div
              key={c.name}
              className="animate-float-up rounded-2xl border border-border bg-card p-6 shadow-soft"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                      #{i + 1}
                    </span>
                    <h3 className="truncate text-lg font-semibold">{c.name}</h3>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {c.title}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {c.location}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-center rounded-2xl bg-rainbow px-4 py-2 text-white">
                  <span className="font-display text-2xl font-bold leading-none">{c.score}</span>
                  <span className="text-[10px] opacity-90">匹配度</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                {c.note}
              </p>
              {i === 0 && (
                <div className="mt-4 flex justify-end">
                  <Link
                    to="/hr/applications/$applicationId"
                    params={{ applicationId: "demo-001" }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                  >
                    查看候选人详情 <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
