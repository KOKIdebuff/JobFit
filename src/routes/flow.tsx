import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, FileText, Network, Video, Send, RefreshCw, ArrowRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";

export const Route = createFileRoute("/flow")({
  head: () => ({
    meta: [
      { title: "产品流程图 — HireLink AI" },
      {
        name: "description",
        content:
          "HireLink AI 完整求职服务闭环：投递意向、岗位匹配、简历定制、人脉内推、数字人面试、反馈优化。",
      },
      { property: "og:title", content: "产品流程图 — HireLink AI" },
      { property: "og:description", content: "从投递意向到反馈优化的完整智能求职闭环。" },
    ],
  }),
  component: FlowPage,
});

const STEPS = [
  {
    icon: Send,
    title: "投递意向",
    desc: "学生填写求职意向、技能与期望，构建个人能力画像。",
    to: undefined,
    color: "#4285f4",
  },
  {
    icon: Target,
    title: "岗位匹配",
    desc: "向量语义召回 + 评分模型，输出带匹配度的岗位推荐。",
    to: "/match",
    color: "#9b72f9",
  },
  {
    icon: FileText,
    title: "简历定制",
    desc: "LLM + RAG 针对岗位智能改写，生成定制化简历。",
    to: "/resume",
    color: "#ea4c89",
  },
  {
    icon: Network,
    title: "人脉内推",
    desc: "关系图谱识别最短内推路径，发起精准内推请求。",
    to: "/network",
    color: "#f9ab00",
  },
  {
    icon: Video,
    title: "数字人面试",
    desc: "数字人面试官实时提问，评分模型生成反馈报告。",
    to: "/interview",
    color: "#34a853",
  },
  {
    icon: RefreshCw,
    title: "反馈优化",
    desc: "汇总匹配与面试数据，迭代画像并回到岗位匹配。",
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
          反馈优化的结果回流至「投递意向」与「岗位匹配」，形成持续进化的求职闭环。
        </div>
      </div>
    </PageShell>
  );
}
