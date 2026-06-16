import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  ArrowRight,
  Clock,
  Database,
  Loader2,
  Circle,
  ShieldAlert,
  Lightbulb,
  Check,
  X,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import {
  PARSE_STEPS,
  RAW_JD,
  MOCK_PROFILE,
  type JobProfile,
  type ProfilePhase,
  type RiskItem,
} from "@/lib/job-profile-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/job-profile")({
  head: () => ({
    meta: [
      { title: "岗位画像确认 — HireLink AI" },
      {
        name: "description",
        content: "HR 对照原始 JD 检查并确认结构化岗位画像，进入候选人匹配流程。",
      },
      { property: "og:title", content: "岗位画像确认 — HireLink AI" },
      { property: "og:description", content: "岗位画像确认与候选人排序流程。" },
    ],
  }),
  component: JobProfilePage,
});

type RiskState = Record<string, "open" | "adopted" | "ignored">;

const PHASE_META: Record<ProfilePhase, { label: string; tone: string }> = {
  idle: { label: "解析前", tone: "bg-secondary text-muted-foreground" },
  parsing: { label: "解析中", tone: "bg-blue-500/10 text-blue-600" },
  success: { label: "解析完成", tone: "bg-emerald-500/10 text-emerald-600" },
  partial: { label: "部分成功", tone: "bg-amber-500/10 text-amber-600" },
  failed: { label: "解析失败", tone: "bg-red-500/10 text-red-600" },
  review: { label: "待 HR 确认", tone: "bg-violet-500/10 text-violet-600" },
  confirmed: { label: "已确认", tone: "bg-emerald-500/10 text-emerald-600" },
};

function JobProfilePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ProfilePhase>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [profile, setProfile] = useState<JobProfile>(MOCK_PROFILE);
  const [riskState, setRiskState] = useState<RiskState>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const runParse = (outcome: "success" | "partial" | "failed" = "success") => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setPhase("parsing");
    setActiveStep(0);
    setProfile(MOCK_PROFILE);
    setRiskState({});
    const stepCount = outcome === "failed" ? 1 : PARSE_STEPS.length;
    for (let i = 1; i <= stepCount; i++) {
      timers.current.push(window.setTimeout(() => setActiveStep(i), i * 750));
    }
    timers.current.push(
      window.setTimeout(
        () => {
          if (outcome === "failed") {
            setPhase("failed");
          } else {
            setPhase("review");
            toast.success(outcome === "partial" ? "部分解析完成" : "解析完成", {
              description: "请对照原始 JD 检查结构化岗位画像后确认。",
            });
          }
        },
        (stepCount + 1) * 750,
      ),
    );
  };

  const setRisk = (id: string, s: RiskState[string]) =>
    setRiskState((prev) => ({ ...prev, [id]: s }));

  const confirmProfile = () => {
    setConfirmOpen(false);
    setPhase("confirmed");
    toast.success("岗位画像已确认", { description: "正在跳转候选人排序页…" });
    timers.current.push(window.setTimeout(() => navigate({ to: "/candidates" }), 1200));
  };

  const meta = PHASE_META[phase];
  const showProfile = phase === "review" || phase === "partial" || phase === "confirmed";

  return (
    <PageShell>
      {/* Top status bar */}
      <section className="border-b border-border bg-card/40 px-5 pt-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-semibold sm:text-3xl">
                  AI 产品经理（大模型方向）
                </h1>
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", meta.tone)}>
                  {meta.label}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5" /> 导入方式：JD 文本
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> 最近解析：
                  {phase === "idle" ? "尚未解析" : "刚刚"}
                </span>
              </div>
            </div>
          </div>

          {/* AI parse pipeline */}
          <ParsePipeline phase={phase} activeStep={activeStep} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-32 pt-6 sm:px-8">
        {phase === "idle" && <IdleState onStart={() => runParse("success")} />}
        {phase === "parsing" && <ParsingState activeStep={activeStep} />}
        {phase === "failed" && (
          <FailedState onRetry={() => runParse("success")} onPreset={() => setPhase("review")} />
        )}

        {(phase === "review" ||
          phase === "partial" ||
          phase === "confirmed" ||
          phase === "success") && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: raw JD */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">原始 JD</h2>
                <span className="ml-auto text-xs text-muted-foreground">只读 · 对照参考</span>
              </div>
              <pre className="max-h-[640px] overflow-auto whitespace-pre-wrap rounded-2xl bg-secondary/50 p-5 font-sans text-sm leading-relaxed text-foreground/90">
                {RAW_JD}
              </pre>
            </div>

            {/* Right: structured profile */}
            <div className="space-y-5">
              {phase === "partial" && (
                <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  部分字段解析置信度较低（薪资、能力维度），请人工校对。
                </div>
              )}
              <StructuredProfile
                profile={profile}
                riskState={riskState}
                onRisk={setRisk}
                editable={phase !== "confirmed"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      {showProfile && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
            <span className="text-sm text-muted-foreground">
              {phase === "confirmed"
                ? "画像已确认，正在进入候选人匹配…"
                : "确认后将用于候选人匹配、面试题与岗位任务"}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => toast.success("草稿已保存")}
                disabled={phase === "confirmed"}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> 保存草稿
              </button>
              <button
                onClick={() => runParse("success")}
                disabled={phase === "confirmed"}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" /> 重新解析
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={phase === "confirmed"}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                确认岗位画像并继续 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认岗位画像</DialogTitle>
            <DialogDescription>确认后，该结构化画像将用于：</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {["候选人规则评分与排序", "面试题生成", "岗位任务流程"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            如仍有待确认的风险项，建议先采纳或忽略后再确认。
          </p>
          <DialogFooter>
            <button
              onClick={() => setConfirmOpen(false)}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
            >
              返回检查
            </button>
            <button
              onClick={confirmProfile}
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:scale-[1.02]"
            >
              确认并继续
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function ParsePipeline({ phase, activeStep }: { phase: ProfilePhase; activeStep: number }) {
  const done =
    phase === "review" || phase === "partial" || phase === "confirmed" || phase === "success";
  return (
    <div className="my-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-background/60 p-3">
      <span className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" /> 解析流程
      </span>
      {PARSE_STEPS.map((s, i) => {
        const isDone = done || i < activeStep;
        const isActive = phase === "parsing" && i === activeStep;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
                isDone
                  ? "bg-emerald-500/10 text-emerald-600"
                  : isActive
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-secondary text-muted-foreground",
              )}
            >
              {isDone ? (
                <Check className="h-3.5 w-3.5" />
              ) : isActive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {s.label}
            </div>
            {i < PARSE_STEPS.length - 1 && <div className="h-px w-4 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function IdleState({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">原始 JD</h2>
        </div>
        <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-2xl bg-secondary/50 p-5 font-sans text-sm leading-relaxed text-foreground/90">
          {RAW_JD}
        </pre>
      </div>
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rainbow text-white">
          <Sparkles className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-lg font-semibold">尚未生成岗位画像</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          系统会整理这份招聘要求，提取岗位职责、需要的能力和需要确认的问题，方便你检查和修改。
        </p>
        <button
          onClick={onStart}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" /> 开始解析
        </button>
      </div>
    </div>
  );
}

function ParsingState({ activeStep }: { activeStep: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">原始 JD</h2>
        </div>
        <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-2xl bg-secondary/50 p-5 font-sans text-sm leading-relaxed text-foreground/90">
          {RAW_JD}
        </pre>
      </div>
      <div className="space-y-3">
        {PARSE_STEPS.map((s, i) => {
          const isDone = i < activeStep;
          const isActive = i === activeStep;
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                isActive ? "border-blue-500/40 bg-blue-500/5" : "border-border bg-card",
              )}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <Check className="h-5 w-5 text-emerald-600" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
              <div>
                <div className="font-medium">{s.label}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
            </div>
          );
        })}
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-border bg-secondary/40"
          />
        ))}
      </div>
    </div>
  );
}

function FailedState({ onRetry, onPreset }: { onRetry: () => void; onPreset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-red-500/30 bg-red-500/5 p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">解析失败</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        解析未完成。你可以重试，或使用系统结果继续流程。
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:scale-[1.02]"
        >
          <RefreshCw className="h-4 w-4" /> 重新解析
        </button>
        <button
          onClick={onPreset}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-secondary"
        >
          <FileText className="h-4 w-4" /> 使用系统结果
        </button>
      </div>
    </div>
  );
}

function StructuredProfile({
  profile,
  riskState,
  onRisk,
  editable,
}: {
  profile: JobProfile;
  riskState: RiskState;
  onRisk: (id: string, s: RiskState[string]) => void;
  editable: boolean;
}) {
  return (
    <div className="space-y-5">
      <Section title="岗位摘要">
        <p className="text-sm leading-relaxed text-muted-foreground">{profile.summary}</p>
      </Section>

      <Section title="核心职责">
        <ul className="space-y-2">
          {profile.responsibilities.map((r) => (
            <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" /> {r}
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="必备技能" hint="硬性要求">
          <div className="flex flex-wrap gap-2">
            {profile.mustSkills.map((s) => (
              <span
                key={s.name}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  s.weight === "high"
                    ? "bg-primary text-primary-foreground"
                    : "bg-foreground/10 text-foreground",
                )}
              >
                {s.name}
              </span>
            ))}
          </div>
        </Section>
        <Section title="加分技能" hint="非必需">
          <div className="flex flex-wrap gap-2">
            {profile.niceSkills.map((s) => (
              <span
                key={s.name}
                className="rounded-full border border-dashed border-border bg-background px-3 py-1.5 text-sm text-muted-foreground"
              >
                {s.name}
              </span>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="经验要求">
          <p className="text-sm text-muted-foreground">{profile.experience}</p>
        </Section>
        <Section title="学历要求">
          <p className="text-sm text-muted-foreground">{profile.education}</p>
        </Section>
      </div>

      <Section title="岗位能力维度">
        <div className="space-y-3">
          {profile.competencies.map((c) => (
            <div key={c.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground">{c.value}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-rainbow" style={{ width: `${c.value}%` }} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="风险与待确认项" hint={`${profile.risks.length} 项`}>
        <div className="space-y-3">
          {profile.risks.map((r) => (
            <RiskCard
              key={r.id}
              risk={r}
              state={riskState[r.id] ?? "open"}
              onSet={(s) => onRisk(r.id, s)}
              editable={editable}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const RISK_TONE: Record<RiskItem["level"], string> = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-amber-500/10 text-amber-600",
  low: "bg-blue-500/10 text-blue-600",
};
const RISK_LABEL: Record<RiskItem["level"], string> = { high: "高", medium: "中", low: "低" };

function RiskCard({
  risk,
  state,
  onSet,
  editable,
}: {
  risk: RiskItem;
  state: RiskState[string];
  onSet: (s: RiskState[string]) => void;
  editable: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        state === "ignored"
          ? "border-border bg-secondary/40 opacity-60"
          : "border-border bg-background",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-7 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-medium",
            RISK_TONE[risk.level],
          )}
        >
          <ShieldAlert className="h-3.5 w-3.5" /> {RISK_LABEL[risk.level]}风险
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{risk.title}</span>
            {state === "adopted" && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600">
                已采纳
              </span>
            )}
            {state === "ignored" && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                已忽略
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{risk.detail}</p>
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-secondary/60 p-2.5 text-xs text-foreground/80">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> 建议：
            {risk.suggestion}
          </div>
          {editable && state === "open" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  onSet("adopted");
                  toast.success("已采纳建议");
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:scale-[1.03]"
              >
                <Check className="h-3.5 w-3.5" /> 采纳建议
              </button>
              <button
                onClick={() => toast("已打开手动修改", { description: "可在对应字段直接编辑" })}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
              >
                <Pencil className="h-3.5 w-3.5" /> 手动修改
              </button>
              <button
                onClick={() => onSet("ignored")}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
              >
                <X className="h-3.5 w-3.5" /> 忽略
              </button>
            </div>
          )}
          {editable && state !== "open" && (
            <button
              onClick={() => onSet("open")}
              className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> 重新处理
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
