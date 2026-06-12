import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Video, Send, RotateCcw, Sparkles } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { FeatureHeader } from "./match";
import { RadarChart } from "@/components/site/RadarChart";
import { INTERVIEW_QUESTIONS, INTERVIEW_SCORES } from "@/lib/mock-data";
import avatarImg from "@/assets/digital-interviewer.jpg";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "AI 数字人虚拟面试 — HireLink AI" },
      {
        name: "description",
        content: "数字人面试官实时提问，多维度评分模型生成结构化面试反馈报告。",
      },
      { property: "og:title", content: "AI 数字人虚拟面试 — HireLink AI" },
      { property: "og:description", content: "数字人 + WebRTC + 评分模型的智能模拟面试。" },
    ],
  }),
  component: InterviewPage,
});

function InterviewPage() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [finished, setFinished] = useState(false);

  const total = INTERVIEW_QUESTIONS.length;
  const current = INTERVIEW_QUESTIONS[step];

  const submit = () => {
    const next = [...answers, input.trim() || "（已作答）"];
    setAnswers(next);
    setInput("");
    if (step + 1 < total) setStep(step + 1);
    else setFinished(true);
  };

  const reset = () => {
    setStarted(false);
    setStep(0);
    setAnswers([]);
    setInput("");
    setFinished(false);
  };

  const overall = Math.round(
    INTERVIEW_SCORES.reduce((s, d) => s + d.value, 0) / INTERVIEW_SCORES.length,
  );

  return (
    <PageShell>
      <FeatureHeader
        n="04"
        title="AI 数字人虚拟面试"
        desc="数字人面试官将逐题提问，作答完成后由评分模型生成多维度面试反馈报告。"
      />
      <div className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Digital human */}
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[3/4]">
              <img
                src={avatarImg}
                alt="AI 数字人面试官"
                width={768}
                height={1024}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> 实时面试中
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-semibold">AI 面试官 · 小铭</h3>
              <p className="mt-1 text-sm text-muted-foreground">数字人 · WebRTC 实时驱动</p>
            </div>
          </div>

          {/* Interaction */}
          <div className="rounded-3xl border border-border bg-card p-7 shadow-soft sm:p-8">
            {!started && !finished && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rainbow text-white">
                  <Video className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-xl font-semibold">准备好开始模拟面试了吗？</h2>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  共 {total} 道问题，数字人将逐题提问，结束后生成你的面试评分报告。
                </p>
                <button
                  onClick={() => setStarted(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  <Sparkles className="h-4 w-4" /> 开始面试
                </button>
              </div>
            )}

            {started && !finished && (
              <div className="flex min-h-[360px] flex-col">
                <div className="mb-5 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    问题 {step + 1} / {total}
                  </span>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-rainbow transition-all"
                      style={{ width: `${(step / total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-5">
                  <div className="text-xs text-muted-foreground">面试官提问</div>
                  <p className="mt-1.5 text-lg font-medium leading-relaxed">{current.question}</p>
                  <p className="mt-2 text-xs text-muted-foreground">提示：{current.hint}</p>
                </div>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入你的回答…"
                  className="mt-4 min-h-[120px] flex-1 resize-none rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
                <button
                  onClick={submit}
                  className="mt-4 inline-flex items-center justify-center gap-2 self-end rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  {step + 1 < total ? (
                    <>
                      提交并下一题 <Send className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      提交并查看报告 <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {finished && (
              <div className="animate-float-up">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">面试综合评分</div>
                  <div className="mt-1 font-display text-5xl font-bold text-gradient">
                    {overall}
                  </div>
                </div>
                <div className="mt-6 grid items-center gap-6 sm:grid-cols-2">
                  <div className="flex justify-center text-foreground">
                    <RadarChart data={INTERVIEW_SCORES} size={240} />
                  </div>
                  <div className="space-y-3">
                    {INTERVIEW_SCORES.map((d) => (
                      <div key={d.label}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{d.label}</span>
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
                <div className="mt-6 rounded-2xl bg-secondary/50 p-5 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">改进建议：</span>
                  回答整体逻辑清晰、岗位匹配度高，建议在项目描述中补充更多可量化的结果数据，
                  并加强对行业风险与边界问题的辩证分析，以提升专业深度与应变表现。
                </div>
                <button
                  onClick={reset}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  <RotateCcw className="h-4 w-4" /> 重新面试
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
