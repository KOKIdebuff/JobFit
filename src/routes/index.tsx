import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, FileSearch, MessageSquareText, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: HomePage });
function HomePage() {
  const cards = [
    [FileSearch, "简历与岗位画像", "把经历和岗位要求整理为结构化胜任力上下文。"],
    [MessageSquareText, "动态追问", "每轮分析回答，再决定澄清、挑战、场景或难度变化。"],
    [BrainCircuit, "RAG 与记忆", "检索专业 Rubric，并用三层记忆控制长对话上下文。"],
    [ShieldCheck, "证据驱动报告", "评分由能力边界、权重和 Evidence 计算，不让模型随意打分。"],
  ] as const;
  return (
    <PageShell>
      <main className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="max-w-4xl">
          <div className="text-sm font-semibold text-primary">JobFit · 岗位胜任力评估智能体</div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
            用真实对话，识别候选人的能力边界
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
            读取简历和目标岗位，通过专业、自然的多轮追问持续提取证据，以岗位胜任力模型生成可解释的能力雷达、岗位匹配度和个性化提升建议。
          </p>
          <Button asChild size="lg" className="mt-8 rounded-full">
            <Link to="/assessment">
              开始岗位评估 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <section className="mt-20 grid gap-4 md:grid-cols-4">
          {cards.map(([Icon, title, description]) => (
            <article key={title} className="rounded-3xl border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h2 className="mt-5 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
