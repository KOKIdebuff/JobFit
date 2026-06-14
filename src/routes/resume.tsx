import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, FileText, Mail, Phone } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ResumeUpload } from "@/components/site/ResumeUpload";
import { ResumeVersions } from "@/components/site/ResumeVersions";
import { useStoredResume } from "@/lib/resume-parser";
import { FeatureHeader, Field, Chip } from "./match";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "简历解析与版本原型 — HireLink AI" },
      {
        name: "description",
        content: "简历文本解析、结构化字段和版本管理交互原型。",
      },
      { property: "og:title", content: "简历解析与版本原型 — HireLink AI" },
      { property: "og:description", content: "当前模板预览为前端原型，不代表已实现 RAG。" },
    ],
  }),
  component: ResumePage,
});

const TARGETS = ["AI 产品经理", "算法工程师", "前端工程师"];

interface ResumeBlock {
  heading: string;
  lines: string[];
}

const RESUME_BY_TARGET: Record<string, ResumeBlock[]> = {
  "AI 产品经理": [
    { heading: "求职意向", lines: ["AI 产品经理（应届）· 期望城市：北京/杭州"] },
    {
      heading: "个人优势",
      lines: [
        "具备 LLM 产品从 0 到 1 的完整经历，熟悉 RAG 与提示工程",
        "数据驱动决策，主导的功能使核心转化率提升 23%",
      ],
    },
    {
      heading: "项目经历",
      lines: [
        "智能简历助手（产品负责人）：定义需求、设计匹配评分逻辑，上线两月积累 1 万+ 用户",
        "校园招聘小程序：搭建岗位推荐流程，简历投递效率提升 40%",
      ],
    },
    { heading: "技能标签", lines: ["需求分析 · 数据分析 · 原型设计 · LLM 应用 · SQL"] },
  ],
  算法工程师: [
    { heading: "求职意向", lines: ["算法工程师 - 推荐方向 · 期望城市：杭州/上海"] },
    {
      heading: "个人优势",
      lines: [
        "扎实的机器学习与深度学习基础，熟悉向量召回与排序模型",
        "ACM 区域赛银奖，具备较强的工程与建模能力",
      ],
    },
    {
      heading: "项目经历",
      lines: [
        "岗位语义匹配系统：基于 Embedding 召回 + 重排，Top5 命中率达 92%",
        "用户行为预测模型：AUC 提升 0.06，支撑增长策略落地",
      ],
    },
    { heading: "技能标签", lines: ["Python · PyTorch · 向量检索 · 特征工程 · A/B 测试"] },
  ],
  前端工程师: [
    { heading: "求职意向", lines: ["前端工程师（大模型应用）· 期望城市：深圳"] },
    {
      heading: "个人优势",
      lines: [
        "精通 React/TypeScript，注重交互细节与性能优化",
        "活跃开源贡献者，主导多个组件库与可视化项目",
      ],
    },
    {
      heading: "项目经历",
      lines: [
        "AI 对话前端：流式渲染 + 富文本，首屏性能优化 35%",
        "数据可视化平台：自研图表组件，支撑 20+ 业务看板",
      ],
    },
    { heading: "技能标签", lines: ["React · TypeScript · 可视化 · 性能优化 · 工程化"] },
  ],
};

function ResumePage() {
  const [name, setName] = useState("李同学");
  const [target, setTarget] = useState("AI 产品经理");
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const resume = useStoredResume();

  // 将上传简历解析出的关键信息融合进固定模板，仅用于当前前端原型。
  const blocks: ResumeBlock[] = (() => {
    const base = RESUME_BY_TARGET[target].map((b) => ({ ...b, lines: [...b.lines] }));
    if (!resume) return base;
    const find = (h: string) => base.find((b) => b.heading === h);
    if (resume.education.length) {
      const intent = find("求职意向");
      if (intent) intent.lines.push(`教育背景：${resume.education[0]}`);
    }
    if (resume.experience.length) {
      const exp = find("项目经历");
      if (exp) resume.experience.slice(0, 2).forEach((e) => exp.lines.push(`简历提取：${e}`));
    }
    if (resume.skills.length) {
      const sk = find("技能标签");
      if (sk) sk.lines = [`${sk.lines[0]} · ${resume.skills.join(" · ")}`];
    }
    return base;
  })();

  const generate = () => {
    setStage("loading");
    setVisibleBlocks(0);
    setTimeout(() => {
      setStage("done");
      blocks.forEach((_, i) => {
        setTimeout(() => setVisibleBlocks((v) => Math.max(v, i + 1)), 300 * (i + 1));
      });
    }, 1000);
  };

  return (
    <PageShell>
      <FeatureHeader
        n="02"
        title="简历解析与版本原型"
        desc="展示结构化字段、版本管理和固定模板预览。当前页面不宣称已接入 RAG 或真实后端模型。"
      />
      <div className="mx-auto max-w-6xl space-y-6 px-5 pb-6 sm:px-8">
        <ResumeUpload compact />
        <ResumeVersions current={resume} />
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-24 sm:px-8 lg:grid-cols-[380px_1fr]">
        {/* Form */}
        <div className="rounded-3xl border border-border bg-card p-7 shadow-soft lg:sticky lg:top-24 lg:self-start">
          <Field label="姓名">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              placeholder="请输入姓名"
            />
          </Field>
          <div className="mt-5">
            <Field label="目标岗位">
              <div className="flex flex-wrap gap-2">
                {TARGETS.map((t) => (
                  <Chip key={t} active={target === t} onClick={() => setTarget(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Field>
          </div>

          <button
            onClick={generate}
            disabled={stage === "loading"}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {stage === "loading" ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" /> 生成中…
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" /> 生成定制简历
              </>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            固定模板预览，仅用于前端交互演示
          </p>
        </div>

        {/* Preview */}
        <div className="min-h-[520px] rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
          {stage === "idle" && (
            <div className="flex h-full min-h-[440px] flex-col items-center justify-center text-center text-muted-foreground">
              <FileText className="h-10 w-10" />
              <p className="mt-4 text-sm">
                填写信息后点击「生成定制简历」
                <br />
                即可在此实时预览
              </p>
            </div>
          )}
          {stage === "loading" && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-6 animate-pulse rounded-md bg-secondary/50"
                  style={{ width: `${90 - i * 8}%` }}
                />
              ))}
            </div>
          )}
          {stage === "done" && (
            <div>
              <div className="border-b border-border pb-6">
                <h2 className="text-3xl font-semibold">{name || "姓名"}</h2>
                <p className="mt-1 text-gradient font-medium">{target}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    li@example.com
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    138-0000-0000
                  </span>
                </div>
              </div>
              <div className="mt-6 space-y-6">
                {blocks.slice(0, visibleBlocks).map((b) => (
                  <div key={b.heading} className="animate-float-up">
                    <h3 className="text-sm font-semibold text-gradient">{b.heading}</h3>
                    <ul className="mt-2 space-y-1.5">
                      {b.lines.map((l) => (
                        <li
                          key={l}
                          className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rainbow" />
                          {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
