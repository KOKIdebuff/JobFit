import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Target,
  FileText,
  Network,
  Video,
  Frown,
  Building2,
  GraduationCap,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { RadarChart } from "@/components/site/RadarChart";
import { ADVANTAGE_SCORES, TECH_STACK } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireLink AI — AI 人才服务智能体平台" },
      {
        name: "description",
        content:
          "岗位精准匹配、定制简历生成、职业人脉地图与数字人虚拟面试，让求职从海投等待变成精准连接与智能筛选。",
      },
      { property: "og:title", content: "HireLink AI — AI 人才服务智能体平台" },
      {
        property: "og:description",
        content: "岗位匹配 + 简历定制 + 人脉内推 + 数字人面试，AI 驱动的求职闭环。",
      },
    ],
  }),
  component: Index,
});

const PAINS = [
  {
    icon: Frown,
    title: "学生海投低效",
    desc: "广撒网式投递，回复率低、反馈慢，难以判断岗位是否真正匹配。",
  },
  {
    icon: Building2,
    title: "企业筛选成本高",
    desc: "简历同质化严重，HR 人工初筛耗时，优质候选人容易被淹没。",
  },
  {
    icon: GraduationCap,
    title: "高校就业辅导难",
    desc: "辅导资源有限，难以为每位学生提供个性化、可量化的就业指导。",
  },
];

const SOLUTIONS = [
  { label: "岗位匹配", icon: Target },
  { label: "简历定制", icon: FileText },
  { label: "人脉内推", icon: Network },
  { label: "数字人面试", icon: Video },
];

const FEATURES = [
  {
    to: "/match",
    n: "01",
    icon: Target,
    title: "AI 岗位精准匹配",
    desc: "基于向量语义召回，输入求职意向即可获得带匹配度评分与匹配理由的岗位推荐。",
  },
  {
    to: "/resume",
    n: "02",
    icon: FileText,
    title: "AI 定制简历生成",
    desc: "针对目标岗位智能改写，关键词对齐、结构优化，一键生成排版精美的定制简历。",
  },
  {
    to: "/network",
    n: "03",
    icon: Network,
    title: "AI 职业人脉地图",
    desc: "可视化校友、同行与内推人关系，自动识别最短内推路径，让连接更有温度。",
  },
  {
    to: "/interview",
    n: "04",
    icon: Video,
    title: "AI 数字人虚拟面试",
    desc: "数字人面试官实时提问，多维度评分模型生成结构化面试反馈报告。",
  },
];

const FLOW_STEPS = ["投递意向", "岗位匹配", "简历定制", "人脉内推", "数字人面试", "反馈优化"];

const BIZ = [
  {
    title: "学生会员",
    price: "C 端订阅",
    points: ["无限次岗位匹配", "定制简历与模拟面试", "人脉内推路径解锁"],
  },
  {
    title: "高校采购",
    price: "B2G 合作",
    points: ["就业大盘数据看板", "批量学生能力画像", "个性化辅导建议"],
  },
  {
    title: "企业 SaaS",
    price: "B 端订阅",
    points: ["精准候选人推荐", "AI 初筛与评分", "数字人面试降本"],
  },
];

function Index() {
  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-4xl bg-rainbow opacity-[0.10] blur-[90px]" />
        <div className="mx-auto max-w-5xl px-5 pb-20 pt-20 text-center sm:px-8 sm:pt-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            AI 人才服务智能体平台
          </div>
          <h1 className="mx-auto max-w-4xl text-4xl font-semibold leading-[1.1] sm:text-6xl">
            让求职从<span className="text-gradient">「海投等待」</span>
            <br className="hidden sm:block" />
            变成<span className="text-gradient">「精准连接 + 智能筛选」</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            岗位精准匹配 · 定制简历生成 · 职业人脉地图 · 数字人虚拟面试，
            一站式打通学生、企业与高校的求职闭环。
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/match"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              开始体验 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/flow"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary"
            >
              查看产品流程
            </Link>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <Section title="痛点分析" kicker="为什么需要 HireLink AI">
        <div className="grid gap-5 md:grid-cols-3">
          {PAINS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-border bg-card p-7 shadow-soft">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <p.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Solution */}
      <Section title="解决方案" kicker="四位一体的智能求职引擎">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {SOLUTIONS.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-7 text-center shadow-soft"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rainbow text-white">
                <s.icon className="h-6 w-6" />
              </div>
              <span className="font-medium">{s.label}</span>
              <span className="text-xs text-muted-foreground">步骤 {i + 1}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section title="四大核心功能" kicker="点击进入交互演示">
        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group relative flex flex-col rounded-3xl border border-border bg-card p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <f.icon className="h-6 w-6" />
                </div>
                <span className="font-display text-2xl font-semibold text-muted-foreground/40">
                  {f.n}
                </span>
              </div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                进入体验
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* Flow */}
      <Section title="产品流程闭环" kicker="完整的求职服务链路">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {FLOW_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium">
                  {s}
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/flow"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary"
            >
              <GitBranch className="h-4 w-4" /> 查看完整流程图
            </Link>
          </div>
        </div>
      </Section>

      {/* Tech */}
      <Section title="技术实现" kicker="可落地的技术底座">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TECH_STACK.map((t) => (
            <div key={t.name} className="grad-border rounded-2xl bg-card p-6 shadow-soft">
              <h3 className="font-semibold">{t.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Business model */}
      <Section title="商业模式" kicker="三端协同的可持续营收">
        <div className="grid gap-5 md:grid-cols-3">
          {BIZ.map((b) => (
            <div key={b.title} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {b.price}
              </div>
              <h3 className="mt-2 text-xl font-semibold">{b.title}</h3>
              <ul className="mt-5 space-y-2.5">
                {b.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rainbow" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* Advantages */}
      <Section title="评分优势" kicker="对标五大评审维度">
        <div className="grid items-center gap-10 rounded-3xl border border-border bg-card p-8 shadow-soft md:grid-cols-2">
          <div className="flex justify-center text-foreground">
            <RadarChart data={ADVANTAGE_SCORES} />
          </div>
          <div className="space-y-4">
            {ADVANTAGE_SCORES.map((d) => (
              <div key={d.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{d.label}</span>
                  <span className="text-muted-foreground">{d.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-rainbow"
                    style={{ width: `${d.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA / summary */}
      <section className="px-5 pb-24 pt-6 sm:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-border bg-card p-10 text-center shadow-lift sm:p-16">
          <div className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-48 max-w-2xl bg-rainbow opacity-[0.12] blur-[80px]" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl">
            让每一次求职，都是一次<span className="text-gradient">精准连接</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
            HireLink AI 用智能体重构求职体验——更高效的匹配、更懂你的简历、更有温度的内推。
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/match"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              立即开始 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Section({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-14 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 text-center">
          <div className="text-sm font-medium text-muted-foreground">{kicker}</div>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}
