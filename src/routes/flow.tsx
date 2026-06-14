import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, FileText, Bot, Video, ClipboardCheck, RefreshCw, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/flow")({
  head: () => ({
    meta: [
      { title: "产品流程图 — HireLink AI" },
      {
        name: "description",
        content:
          "HireLink P0 流程：简历解析、岗位理解、规则匹配、面试与任务、结构化报告、HR 确认与反馈。",
      },
      { property: "og:title", content: "产品流程图 — HireLink AI" },
      { property: "og:description", content: "固定 Agent 工作流驱动的招聘能力验证闭环。" },
    ],
  }),
  component: FlowPage,
});

const STEPS = [
  {
    icon: FileText,
    title: "简历解析",
    desc: "提取结构化简历字段并生成带证据的职业画像。",
    to: "/resume",
    color: "#4285f4",
  },
  {
    icon: Bot,
    title: "岗位理解",
    desc: "固定 Agent 节点解析 JD，HR 确认后才进入下游流程。",
    to: undefined,
    color: "#9b72f9",
  },
  {
    icon: Target,
    title: "规则匹配",
    desc: "确定性规则负责评分，AI 只解释理由、缺口和证据。",
    to: "/match",
    color: "#ea4c89",
  },
  {
    icon: Video,
    title: "轻量面试与任务",
    desc: "逐题回答、浏览器实时转写与岗位任务共同形成能力证据。",
    to: "/interview",
    color: "#f9ab00",
  },
  {
    icon: ClipboardCheck,
    title: "结构化报告",
    desc: "一个报告实体按权限提供 HR 版和求职者版两个视图。",
    to: undefined,
    color: "#34a853",
  },
  {
    icon: RefreshCw,
    title: "HR 确认与反馈",
    desc: "HR 确认报告后，求职者才能查看成长反馈。",
    to: undefined,
    color: "#4285f4",
  },
] as const;

function FlowPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden px-5 pb-8 pt-14 text-center sm:px-8 sm:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="font-display text-sm font-semibold text-muted-foreground/60">
            产品流程图
          </div>
          <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">完整的智能求职闭环</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            六个环节首尾相连，数据持续回流，让每一轮求职都比上一轮更精准。
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => {
            const Card = (
              <div className="group relative h-full rounded-3xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                    style={{ background: s.color }}
                  >
                    <s.icon className="h-6 w-6" />
                  </div>
                  <span className="font-display text-2xl font-semibold text-muted-foreground/30">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                {s.to && (
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
                    进入体验{" "}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </div>
            );
            return s.to ? (
              <Link key={s.title} to={s.to} className="block h-full">
                {Card}
              </Link>
            ) : (
              <div key={s.title} className="h-full">
                {Card}
              </div>
            );
          })}
        </div>

        {/* Loop indicator */}
        <div className="mt-10 flex items-center justify-center gap-3 rounded-full border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-soft">
          <RefreshCw className="h-4 w-4" />
          P0 使用固定 Agent 工作流；RAG、向量数据库、WebRTC 和数字人仅作为后续规划。
        </div>
      </div>
    </PageShell>
  );
}
