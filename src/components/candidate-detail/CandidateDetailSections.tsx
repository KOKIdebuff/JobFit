import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  FileSearch,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  Quote,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ASSESSMENT_GENERATION_STEPS,
  formatCandidateDate,
  type CandidateDetailDemoState,
  type CandidatePageState,
  type EvidenceItem,
} from "@/lib/candidate-detail-demo";
import { cn } from "@/lib/utils";

export function CandidateDetailSkeleton() {
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-6 h-28 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    </main>
  );
}

export function CandidateStatePanel({
  state,
  onPrimary,
  onSecondary,
}: {
  state: CandidatePageState;
  onPrimary?: () => void;
  onSecondary?: () => void;
}) {
  const content: Partial<
    Record<
      CandidatePageState,
      {
        title: string;
        description: string;
        action: string;
        secondary?: string;
        tone?: "neutral" | "warning" | "error";
      }
    >
  > = {
    "not-found": {
      title: "未找到该候选人申请",
      description: "链接中的岗位或申请 ID 无效，现有招聘数据未发生变化。",
      action: "返回候选人列表",
      tone: "warning",
    },
    "profile-empty": {
      title: "缺少职业画像或匹配结果",
      description: "当前申请缺少可用于解释匹配和生成验证方案的演示数据。",
      action: "载入演示数据",
      secondary: "查看原始简历",
      tone: "warning",
    },
    "match-empty": {
      title: "暂无匹配结果",
      description: "岗位画像和候选人画像已保留，但尚未产生可解释匹配结果。",
      action: "载入演示数据",
      tone: "neutral",
    },
    "match-failed": {
      title: "匹配结果加载失败",
      description: "本次读取未完成，候选人、简历和申请记录均已保留。",
      action: "重试",
      tone: "error",
    },
    "match-stale": {
      title: "当前匹配结果已过期",
      description: "岗位画像或简历版本发生变化，建议重新载入本轮演示数据。",
      action: "载入演示数据",
      tone: "warning",
    },
  };
  const item = content[state];
  if (!item) return null;

  return (
    <section
      className={cn(
        "mx-auto max-w-2xl rounded-3xl border p-8 text-center shadow-soft",
        item.tone === "error"
          ? "border-red-500/25 bg-red-500/5"
          : item.tone === "warning"
            ? "border-amber-500/25 bg-amber-500/5"
            : "border-border bg-card",
      )}
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-background">
        {item.tone === "error" ? (
          <AlertTriangle className="h-7 w-7 text-red-600" />
        ) : item.tone === "warning" ? (
          <ShieldAlert className="h-7 w-7 text-amber-700" />
        ) : (
          <FileSearch className="h-7 w-7" />
        )}
      </div>
      <h1 className="mt-5 text-xl font-semibold">{item.title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button className="rounded-full" onClick={onPrimary}>
          {item.action}
        </Button>
        {item.secondary && (
          <Button variant="outline" className="rounded-full" onClick={onSecondary}>
            {item.secondary}
          </Button>
        )}
      </div>
    </section>
  );
}

export function CandidateIdentitySidebar({
  state,
  onResume,
  onSwitchCandidate,
}: {
  state: CandidateDetailDemoState;
  onResume: () => void;
  onSwitchCandidate: () => void;
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
          李
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{state.candidate.name}</h1>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-700">
            {state.application.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {state.candidate.school}
          <br />
          {state.candidate.major}
          <br />
          {state.candidate.graduationYear} 届 · {state.candidate.education}
        </p>

        <div className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
          <InfoLine icon={<Mail />} label={state.candidate.email_masked} />
          <InfoLine icon={<Phone />} label={state.candidate.phone_masked} />
          <InfoLine icon={<FileText />} label={state.resume.version} />
          <InfoLine
            icon={<Clock3 />}
            label={`申请于 ${formatCandidateDate(state.application.appliedAt)}`}
          />
        </div>

        <div className="mt-5 space-y-2">
          <Button variant="outline" className="w-full rounded-full" onClick={onResume}>
            <FileText /> 查看原始简历
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-full text-muted-foreground"
            onClick={onSwitchCandidate}
          >
            <ArrowLeftRight /> 切换候选人
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <div className="font-medium text-foreground">演示数据</div>
        <p className="mt-1">
          本页使用固定 Mock 数据。分数由规则计算，AI 只负责解释和生成验证内容。
        </p>
      </section>
    </aside>
  );
}

function InfoLine({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-start gap-2 text-muted-foreground">
      <span className="mt-0.5 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <span className="min-w-0 break-words">{label}</span>
    </div>
  );
}

const PIPELINE = ["岗位画像", "候选人匹配", "验证方案", "面试与任务", "证据链报告"] as const;

export function RecruitmentPipeline({ state }: { state: CandidateDetailDemoState }) {
  const current = ["draft", "fallback", "sent"].includes(state.assessment_plan.status) ? 2 : 1;
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">招聘业务步骤</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            当前处于候选人匹配与验证方案生成阶段。
          </p>
        </div>
        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-700">
          {state.application.stage}
        </span>
      </div>
      <div className="mt-5 overflow-x-auto pb-1">
        <div className="flex min-w-[620px] items-start">
          {PIPELINE.map((step, index) => (
            <div key={step} className="flex flex-1 items-start">
              <div className="flex min-w-[88px] flex-col items-center text-center">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border text-xs",
                    index < current
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                      : index === current
                        ? "border-violet-500 bg-violet-500 text-white"
                        : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {index < current ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "mt-2 text-xs",
                    index === current ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </div>
              {index < PIPELINE.length - 1 && (
                <div
                  className={cn(
                    "mt-4 h-px flex-1",
                    index < current ? "bg-emerald-500/40" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CandidateSummary({ state }: { state: CandidateDetailDemoState }) {
  const items = [
    ["学校", state.candidate.school],
    ["专业", state.candidate.major],
    ["GPA", state.candidate.gpa],
    ["目标岗位", state.candidate_profile.targetRole],
  ];
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Candidate summary
          </p>
          <h2 className="mt-1 text-xl font-semibold">{state.candidate.name}</h2>
        </div>
        <div className="rounded-2xl bg-primary px-5 py-3 text-center text-primary-foreground">
          <div className="font-display text-3xl font-bold leading-none">
            {state.match_result.total}
          </div>
          <div className="mt-1 text-[11px] text-primary-foreground/70">总匹配分</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-secondary/45 p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm font-medium">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-xs text-muted-foreground">关键技能</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {state.candidate_profile.skills.map((skill) => (
            <span key={skill} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4 text-sm leading-relaxed">
        <span className="font-medium">一句话评价：</span>
        <span className="text-muted-foreground">{state.candidate_profile.summary}</span>
      </div>
    </section>
  );
}

export function CandidateProfileSection({ state }: { state: CandidateDetailDemoState }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div>
        <h2 className="font-semibold">职业画像</h2>
        <p className="mt-1 text-sm text-muted-foreground">每项结论都可展开查看对应简历依据。</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {state.candidate_profile.categories.map((category) => {
          const evidence = getEvidence(state.evidence_items, category.evidence_ids);
          return (
            <details
              key={category.id}
              className="group rounded-2xl border border-border bg-background p-4"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        category.tone === "positive"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : category.tone === "warning"
                            ? "bg-amber-500/10 text-amber-800"
                            : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {category.label}
                    </span>
                    <p className="mt-3 text-sm leading-relaxed">{category.conclusion}</p>
                  </div>
                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </div>
                <span className="mt-3 inline-flex text-xs font-medium text-violet-700">
                  查看依据
                </span>
              </summary>
              <EvidenceQuotes evidence={evidence} />
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function MatchExplanation({ state }: { state: CandidateDetailDemoState }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">人岗匹配</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            匹配规则版本：
            <span className="font-mono text-foreground">{state.match_result.ruleVersion}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-rainbow px-5 py-3 text-center text-white">
          <div className="font-display text-4xl font-bold leading-none">
            {state.match_result.total}
          </div>
          <div className="mt-1 text-[11px] text-white/80">总匹配分</div>
        </div>
      </div>

      <Tabs defaultValue={state.match_result.dimensions[0]?.id} className="mt-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          {state.match_result.dimensions.map((dimension) => (
            <TabsTrigger
              key={dimension.id}
              value={dimension.id}
              className="flex h-auto flex-col gap-1 py-2"
            >
              <span className="text-xs">{dimension.label}</span>
              <span className="font-display text-lg font-semibold">{dimension.score}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {state.match_result.dimensions.map((dimension) => (
          <TabsContent key={dimension.id} value={dimension.id} className="mt-4">
            <div className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium">{dimension.label}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {dimension.reason}
                  </p>
                </div>
                <span className="font-display text-3xl font-semibold">{dimension.score}</span>
              </div>
              <Progress value={dimension.score} className="mt-4 h-2" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DetailList title="命中的岗位要求" items={dimension.hits} tone="positive" />
                <DetailList title="能力缺口" items={dimension.misses} tone="warning" />
                <DetailList title="候选人证据" items={dimension.resumeEvidence} />
                <DetailList title="岗位要求" items={dimension.jobRequirements} />
              </div>
              <details className="group mt-4 rounded-xl bg-secondary/40 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium">
                  展开匹配评分依据
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <EvidenceQuotes
                  evidence={getEvidence(state.evidence_items, dimension.evidence_ids)}
                />
              </details>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailList title="推荐理由" items={state.match_result.reasons} tone="positive" />
        <DetailList title="风险与待验证项" items={state.match_result.risks} tone="warning" />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl bg-secondary/40 p-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {state.match_result.deterministicNotice}
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-violet-600" />
          {state.match_result.aiNotice}
        </span>
        <span>数据来源：{state.match_result.sources.join("、")}</span>
      </div>
    </section>
  );
}

function DetailList({
  title,
  items,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  tone?: "neutral" | "positive" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-3",
        tone === "positive"
          ? "bg-emerald-500/5"
          : tone === "warning"
            ? "bg-amber-500/5"
            : "bg-secondary/50",
      )}
    >
      <div className="text-xs font-medium">{title}</div>
      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ValidationRecommendations({ state }: { state: CandidateDetailDemoState }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div>
        <h2 className="font-semibold">能力验证建议</h2>
        <p className="mt-1 text-sm text-muted-foreground">根据能力缺口选择下一步验证方式。</p>
      </div>
      <div className="mt-5 space-y-3">
        {state.validation_recommendations.map((item, index) => (
          <div
            key={item.id}
            className="flex items-start gap-4 rounded-2xl border border-border bg-background p-4"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="font-medium">{item.title}</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-violet-700">
                  {item.method}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-muted-foreground">
                  来源：{item.source}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AssessmentGenerationProgress({
  state,
  onRetry,
  onFallback,
  onBack,
}: {
  state: CandidateDetailDemoState;
  onRetry: () => void;
  onFallback: () => void;
  onBack?: () => void;
}) {
  if (state.ai_run.status === "failed") {
    return (
      <section className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-6 text-center">
        <AlertTriangle className="mx-auto h-9 w-9 text-amber-700" />
        <h3 className="mt-3 font-semibold">生成失败</h3>
        <p className="mt-2 text-sm text-muted-foreground">候选人、匹配结果和 HR 备注均已保留。</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button className="rounded-full" onClick={onRetry}>
            <RefreshCw /> 重新生成
          </Button>
          <Button variant="outline" className="rounded-full" onClick={onFallback}>
            <FileText /> 使用预置验证方案
          </Button>
          {onBack && (
            <Button variant="ghost" className="rounded-full" onClick={onBack}>
              返回候选人详情
            </Button>
          )}
        </div>
      </section>
    );
  }

  const completed = state.ai_run.status === "completed" || state.ai_run.status === "fallback";
  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2">
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        )}
        <h3 className="font-semibold">{completed ? "验证方案已生成" : "AI 正在生成验证方案"}</h3>
      </div>
      <div className="mt-5 space-y-3">
        {ASSESSMENT_GENERATION_STEPS.map((step, index) => {
          const done = completed || index < state.ai_run.activeStep;
          const active = !completed && index === state.ai_run.activeStep;
          return (
            <div
              key={step}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3.5 text-sm",
                active ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-background",
              )}
            >
              {done ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
              {step}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function HrActionSidebar({
  state,
  onGenerate,
  onViewPlan,
  onRetry,
  onFallback,
  onNote,
  onViewReport,
  onPriority,
  onFavorite,
  onPause,
  onBack,
}: {
  state: CandidateDetailDemoState;
  onGenerate: () => void;
  onViewPlan: () => void;
  onRetry: () => void;
  onFallback: () => void;
  onNote: () => void;
  onViewReport?: () => void;
  onPriority: () => void;
  onFavorite: () => void;
  onPause: () => void;
  onBack: () => void;
}) {
  const generating = state.assessment_plan.status === "generating";
  const failed = state.assessment_plan.status === "failed";
  const ready = ["draft", "fallback", "sent"].includes(state.assessment_plan.status);
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">当前流程状态</h2>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-700">
            {state.application.stage}
          </span>
        </div>
        <div className="mt-4 space-y-3 text-sm">
          {["简历解析", "职业画像", "岗位匹配"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {item}
            </div>
          ))}
          {["面试题", "岗位任务", "证据链报告"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-muted-foreground">
              <Circle className="h-4 w-4" /> {item}
            </div>
          ))}
        </div>

        <div className="mt-5">
          {generating || failed ? (
            <AssessmentGenerationProgress state={state} onRetry={onRetry} onFallback={onFallback} />
          ) : (
            <Button
              className="w-full whitespace-normal rounded-full"
              onClick={ready ? onViewPlan : onGenerate}
            >
              {ready ? <FileText /> : <Sparkles />}
              {ready ? "查看并确认验证方案" : "生成候选人验证方案"}
            </Button>
          )}
          {onViewReport && (
            <Button
              variant="outline"
              className="mt-2 w-full whitespace-normal rounded-full"
              onClick={onViewReport}
            >
              <FileText /> 查看证据链报告
            </Button>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-semibold">HR 备注与关注</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {state.hr_note.content || "尚未添加内部备注。"}
        </p>
        <div className="mt-4 space-y-2">
          <Button variant="outline" className="w-full justify-start rounded-full" onClick={onNote}>
            <MessageSquareText /> {state.hr_note.content ? "编辑 HR 备注" : "添加 HR 备注"}
          </Button>
          <Button
            variant={state.application.priority ? "secondary" : "outline"}
            className="w-full justify-start rounded-full"
            onClick={onPriority}
          >
            <Star className={cn(state.application.priority && "fill-current")} />
            {state.application.priority ? "已标记重点关注" : "标记重点关注"}
          </Button>
          <Button
            variant={state.application.favorite ? "secondary" : "outline"}
            className="w-full justify-start rounded-full"
            onClick={onFavorite}
          >
            <Bookmark className={cn(state.application.favorite && "fill-current")} />
            {state.application.favorite ? "已收藏候选人" : "收藏候选人"}
          </Button>
        </div>
      </section>

      <div className="space-y-2">
        <Button variant="outline" className="w-full rounded-full" onClick={onPause}>
          暂不推进
        </Button>
        <Button variant="ghost" className="w-full rounded-full" onClick={onBack}>
          <ArrowRight className="rotate-180" /> 返回候选人列表
        </Button>
      </div>
    </aside>
  );
}

function getEvidence(items: EvidenceItem[], ids: string[]) {
  return ids
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is EvidenceItem => Boolean(item));
}

function EvidenceQuotes({ evidence }: { evidence: EvidenceItem[] }) {
  return (
    <div className="mt-3 space-y-2">
      {evidence.map((item) => (
        <blockquote
          key={item.id}
          className="flex gap-2 rounded-xl border-l-4 border-primary bg-secondary/55 p-3 text-xs leading-relaxed text-muted-foreground"
        >
          <Quote className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-medium text-foreground">{item.title}：</span>
            {item.excerpt}
          </span>
        </blockquote>
      ))}
    </div>
  );
}

export function SummaryStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span>
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="mt-0.5 block text-sm font-medium">{value}</span>
      </span>
    </div>
  );
}

export function AgentRunDetails({ state }: { state: CandidateDetailDemoState }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded-2xl bg-secondary/50 p-4">
        <div className="text-xs text-muted-foreground">运行 ID</div>
        <div className="mt-1 break-all font-mono text-xs">{state.ai_run.runId || "尚未运行"}</div>
      </div>
      <div className="rounded-2xl bg-secondary/50 p-4">
        <div className="flex items-center gap-2 font-medium">
          <Clock3 className="h-4 w-4" /> 当前状态
        </div>
        <p className="mt-2 text-muted-foreground">
          {state.ai_run.status === "fallback"
            ? "已使用预置验证方案"
            : state.ai_run.status === "completed"
              ? "验证方案生成完成，等待 HR 确认"
              : state.ai_run.status === "failed"
                ? state.ai_run.error
                : state.ai_run.status === "running"
                  ? ASSESSMENT_GENERATION_STEPS[state.ai_run.activeStep] || "准备输入"
                  : "尚未开始"}
        </p>
      </div>
      <div className="rounded-2xl border border-border p-4">
        <div className="font-medium">输入数据</div>
        <p className="mt-2 text-muted-foreground">
          已确认岗位画像、候选人职业画像、规则匹配缺口和申请上下文。
        </p>
      </div>
    </div>
  );
}

export function CandidateMetaIcon({ type }: { type: "education" | "target" }) {
  return type === "education" ? (
    <GraduationCap className="h-4 w-4" />
  ) : (
    <Target className="h-4 w-4" />
  );
}
