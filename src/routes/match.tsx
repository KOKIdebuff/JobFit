import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Sparkles, MapPin, Briefcase, CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { ResumeUpload } from "@/components/site/ResumeUpload";
import { ScoreBreakdown } from "@/components/site/ScoreBreakdown";
import { SuggestionList } from "@/components/site/SuggestionList";
import { useStoredResume, buildResumeSuggestions, type ScoreItem } from "@/lib/resume-parser";
import { JOB_MATCHES, type JobMatch } from "@/lib/mock-data";

type RankedJob = JobMatch & { breakdown: ScoreItem[] };

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "AI 岗位精准匹配 — HireLink AI" },
      {
        name: "description",
        content: "输入求职意向，基于向量语义匹配获得带匹配度评分与匹配理由的岗位推荐。",
      },
      { property: "og:title", content: "AI 岗位精准匹配 — HireLink AI" },
      { property: "og:description", content: "向量语义召回 + 评分模型，让岗位推荐更精准。" },
    ],
  }),
  component: MatchPage,
});

const ROLES = ["AI 产品经理", "算法工程师", "前端工程师", "数据分析师"];
const CITIES = ["北京", "上海", "深圳", "杭州", "不限"];

function MatchPage() {
  const [role, setRole] = useState("AI 产品经理");
  const [city, setCity] = useState("不限");
  const [stage, setStage] = useState<"idle" | "loading" | "done">("idle");
  const [results, setResults] = useState<RankedJob[]>([]);
  const resume = useStoredResume();

  const run = () => {
    setStage("loading");
    setResults([]);
    setTimeout(() => {
      const skills = resume?.skills ?? [];
      const adjusted: RankedJob[] = JOB_MATCHES.map((j) => {
        const hits = j.tags.filter((t) =>
          skills.some(
            (s) =>
              t.toLowerCase().includes(s.toLowerCase()) ||
              s.toLowerCase().includes(t.toLowerCase()),
          ),
        );
        // 简历命中的技能越多，匹配度越高（前端模拟向量加权）
        const skillBoost = resume ? Math.min(6, hits.length * 2) : 0;
        const completeBoost = resume && resume.completeness >= 70 ? 2 : 0;
        const boost = skillBoost + completeBoost;
        const reasons = [...j.reasons];
        if (resume && hits.length) {
          reasons.unshift(`简历技能命中岗位标签：${hits.join("、")}`);
        }
        if (resume?.education.length) {
          reasons.push(`已解析教育背景：${resume.education[0]}`);
        }
        const finalScore = Math.min(99, j.score + boost);
        const breakdown: ScoreItem[] = [
          {
            label: "基础语义匹配",
            score: j.score,
            max: 99,
            detail: "岗位描述与求职意向的向量语义相似度",
          },
          {
            label: "命中技能加权",
            score: skillBoost,
            max: 6,
            detail: resume
              ? hits.length
                ? `简历技能命中 ${hits.length} 个岗位标签（每个 +2，上限 6）`
                : "简历技能未命中该岗位标签"
              : "上传简历后按命中技能加权",
            hits,
          },
          {
            label: "简历完整度加成",
            score: completeBoost,
            max: 2,
            detail: resume
              ? resume.completeness >= 70
                ? `完整度 ${resume.completeness}% ≥ 70%，+2`
                : `完整度 ${resume.completeness}% < 70%，暂无加成`
              : "上传简历后按完整度加成",
          },
        ];
        return { ...j, score: finalScore, reasons, breakdown };
      }).sort((a, b) => b.score - a.score);
      setResults(adjusted);
      setStage("done");
    }, 1400);
  };

  return (
    <PageShell>
      <FeatureHeader
        n="01"
        title="AI 岗位精准匹配"
        desc="上传简历并选择求职意向，AI 将解析你的技能与经历，基于向量语义召回与评分模型排序最匹配的岗位。"
      />
      <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="mb-6">
          <ResumeUpload />
        </div>

        <div className="rounded-3xl border border-border bg-card p-7 shadow-soft">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="求职意向">
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <Chip key={r} active={role === r} onClick={() => setRole(r)}>
                    {r}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="期望城市">
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <Chip key={c} active={city === c} onClick={() => setCity(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </Field>
          </div>
          <button
            onClick={run}
            disabled={stage === "loading"}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60 sm:w-auto"
          >
            {stage === "loading" ? (
              <>
                <Sparkles className="h-4 w-4 animate-pulse" /> 正在匹配…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> 开始匹配
              </>
            )}
          </button>
        </div>

        {stage === "loading" && (
          <div className="mt-6 space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-border bg-secondary/40"
              />
            ))}
          </div>
        )}

        {stage === "done" && (
          <div className="mt-8 space-y-4">
            <div className="text-sm text-muted-foreground">
              为「{role} · {city}」找到 {results.length} 个高匹配岗位
            </div>
            {results.map((j, idx) => (
              <div
                key={j.id}
                className="animate-float-up rounded-2xl border border-border bg-card p-6 shadow-soft"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{j.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {j.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {j.location}
                      </span>
                      <span className="font-medium text-foreground">{j.salary}</span>
                    </div>
                  </div>
                  <ScoreBadge score={j.score} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {j.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5 border-t border-border pt-4">
                  {j.reasons.map((r) => (
                    <div key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                      {r}
                    </div>
                  ))}
                </div>
                <details className="mt-4 border-t border-border pt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gradient">
                    查看匹配度计算依据
                  </summary>
                  <div className="mt-3 space-y-3">
                    <ScoreBreakdown
                      title="匹配度评分依据"
                      total={j.score}
                      totalLabel="匹配度"
                      items={j.breakdown}
                      summary="匹配度 = 基础语义匹配 + 命中技能加权(每个+2，上限6) + 简历完整度加成(≥70% +2)，上限 99。"
                    />
                    {resume && (
                      <SuggestionList
                        title="针对此岗位的提升建议"
                        items={buildResumeSuggestions(resume, j.tags)}
                        emptyHint="你的简历已较好匹配该岗位，暂无关键补齐项 🎉"
                      />
                    )}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex shrink-0 flex-col items-center rounded-2xl bg-rainbow px-4 py-2 text-white">
      <span className="font-display text-2xl font-bold leading-none">{score}</span>
      <span className="text-[10px] opacity-90">匹配度</span>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-4 py-2 text-sm transition-colors " +
        (active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-secondary")
      }
    >
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 text-sm font-medium">{label}</div>
      {children}
    </div>
  );
}

export function FeatureHeader({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <section className="relative overflow-hidden px-5 pb-10 pt-14 sm:px-8 sm:pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-56 max-w-2xl bg-rainbow opacity-[0.08] blur-[80px]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="font-display text-sm font-semibold text-muted-foreground/60">
          核心功能 {n}
        </div>
        <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">{desc}</p>
      </div>
    </section>
  );
}
