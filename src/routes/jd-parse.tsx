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
  Loader2,
  Circle,
  Check,
  X,
  Plus,
  ShieldAlert,
  Lightbulb,
  Quote,
  MapPin,
  Briefcase,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/PageShell";
import {
  PARSE_STEPS,
  RAW_JD,
  MOCK_PROFILE,
  SAMPLE_JOB,
  JD_EVIDENCE,
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

export const Route = createFileRoute("/jd-parse")({
  head: () => ({
    meta: [
      { title: "JD 解析演示 — HireLink AI" },
      { name: "description", content: "使用预置结果演示 JD 结构化、人工确认与候选人匹配流程。" },
      { property: "og:title", content: "JD 解析演示 — HireLink AI" },
      { property: "og:description", content: "前端模拟 JD 解析与岗位画像确认流程。" },
    ],
  }),
  component: JdParsePage,
});

type RiskState = Record<string, "open" | "adopted" | "ignored">;

const PHASE_META: Record<ProfilePhase, { label: string; tone: string }> = {
  idle: { label: "待输入", tone: "bg-secondary text-muted-foreground" },
  parsing: { label: "模拟解析中", tone: "bg-blue-500/10 text-blue-600" },
  success: { label: "模拟解析完成", tone: "bg-emerald-500/10 text-emerald-600" },
  partial: { label: "部分成功", tone: "bg-amber-500/10 text-amber-600" },
  failed: { label: "解析失败", tone: "bg-red-500/10 text-red-600" },
  review: { label: "待 HR 确认", tone: "bg-violet-500/10 text-violet-600" },
  confirmed: { label: "已确认", tone: "bg-emerald-500/10 text-emerald-600" },
};

function JdParsePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<ProfilePhase>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("全职");
  const [jd, setJd] = useState("");
  const [profile, setProfile] = useState<JobProfile>(MOCK_PROFILE);
  const [riskState, setRiskState] = useState<RiskState>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const jobIdRef = useRef<string>("");

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  const fillSample = () => {
    setJobTitle(SAMPLE_JOB.title);
    setLocation(SAMPLE_JOB.location);
    setJobType(SAMPLE_JOB.type);
    setJd(RAW_JD);
    toast.success("已填入示例 JD");
  };

  const runParse = (outcome: "success" | "failed" = "success") => {
    if (!jd.trim()) {
      toast.error("请先输入或填入 JD 内容");
      return;
    }
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
            toast.success("模拟解析完成", { description: "请对照原文检查预置岗位画像后确认。" });
          }
        },
        (stepCount + 1) * 750,
      ),
    );
  };

  const usePreset = () => {
    setProfile(MOCK_PROFILE);
    setPhase("review");
    toast.success("已载入预置结果", { description: "请人工校对后确认。" });
  };

  const setRisk = (id: string, s: RiskState[string]) =>
    setRiskState((prev) => ({ ...prev, [id]: s }));

  const confirmProfile = () => {
    setConfirmOpen(false);
    setPhase("confirmed");
    jobIdRef.current = `job_${Date.now().toString(36)}`;
    toast.success("岗位画像已确认", { description: "正在跳转候选人匹配…" });
    timers.current.push(
      window.setTimeout(
        () => navigate({ to: "/hr/jobs/$jobId/candidates", params: { jobId: jobIdRef.current } }),
        1200,
      ),
    );
  };

  const meta = PHASE_META[phase];
  const showProfile = phase === "review" || phase === "partial" || phase === "confirmed";

  return (
    <PageShell>
      <section className="border-b border-border bg-card/40 px-5 pt-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold sm:text-3xl">JD 解析</h1>
            <span className={cn("rounded-full px-3 py-1 text-xs font-medium", meta.tone)}>
              {meta.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            输入 JD → 模拟分阶段解析 → 展示预置岗位画像 → HR 编辑确认 → 进入候选人排序演示。
          </p>
          <ParsePipeline phase={phase} activeStep={activeStep} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 pb-32 pt-6 sm:px-8">
        {phase === "idle" && (
          <JdForm
            jobTitle={jobTitle}
            setJobTitle={setJobTitle}
            location={location}
            setLocation={setLocation}
            jobType={jobType}
            setJobType={setJobType}
            jd={jd}
            setJd={setJd}
            onSample={fillSample}
            onStart={() => runParse("success")}
            onSimFail={() => runParse("failed")}
          />
        )}

        {phase === "parsing" && <ParsingState activeStep={activeStep} />}

        {phase === "failed" && (
          <FailedState onRetry={() => runParse("success")} onPreset={usePreset} />
        )}

        {showProfile && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-20 lg:self-start">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">原始 JD</h2>
                <span className="ml-auto text-xs text-muted-foreground">只读 · 对照参考</span>
              </div>
              <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                  <Briefcase className="h-3 w-3" />
                  {jobTitle || "未填写岗位"}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                  <MapPin className="h-3 w-3" />
                  {location || "未填写地点"}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">
                  <Tag className="h-3 w-3" />
                  {jobType}
                </span>
              </div>
              <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-2xl bg-secondary/50 p-5 font-sans text-sm leading-relaxed text-foreground/90">
                {jd || RAW_JD}
              </pre>
            </div>

            <div className="space-y-5">
              <StructuredProfile
                profile={profile}
                setProfile={setProfile}
                riskState={riskState}
                onRisk={setRisk}
                editable={phase !== "confirmed"}
                onEvidence={setEvidenceFor}
              />
            </div>
          </div>
        )}
      </div>

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
                onClick={() => runParse("success")}
                disabled={phase === "confirmed"}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" /> 重新解析
              </button>
              <button
                onClick={() => toast.success("草稿已保存")}
                disabled={phase === "confirmed"}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> 保存草稿
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
            <DialogDescription>确认后，该结构化画像将在本次前端演示中用于：</DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            {["候选人规则评分与排序演示", "预置面试题展示", "岗位任务流程展示"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {t}
              </li>
            ))}
          </ul>
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

      <Dialog open={!!evidenceFor} onOpenChange={(o) => !o && setEvidenceFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Quote className="h-4 w-4" /> 原文依据
            </DialogTitle>
            <DialogDescription>该预置字段对应以下 JD 原文片段：</DialogDescription>
          </DialogHeader>
          <blockquote className="rounded-2xl border-l-4 border-primary bg-secondary/50 p-4 text-sm leading-relaxed text-foreground/90">
            {evidenceFor ? JD_EVIDENCE[evidenceFor] : ""}
          </blockquote>
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
        <Sparkles className="h-3.5 w-3.5" /> 模拟解析流程
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

function JdForm({
  jobTitle,
  setJobTitle,
  location,
  setLocation,
  jobType,
  setJobType,
  jd,
  setJd,
  onSample,
  onStart,
  onSimFail,
}: {
  jobTitle: string;
  setJobTitle: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  jobType: string;
  setJobType: (v: string) => void;
  jd: string;
  setJd: (v: string) => void;
  onSample: () => void;
  onStart: () => void;
  onSimFail: () => void;
}) {
  const types = ["全职", "兼职", "实习", "外包"];
  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="岗位名称" className="sm:col-span-3">
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="如：AI 产品经理（大模型方向）"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="工作地点">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="如：北京 · 海淀"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
          />
        </Field>
        <Field label="岗位类型" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setJobType(t)}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-sm transition-colors",
                  jobType === t
                    ? "border-transparent bg-foreground text-background"
                    : "border-border hover:bg-secondary",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium">JD 内容</label>
          <button
            onClick={onSample}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" /> 填入示例 JD
          </button>
        </div>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={12}
          placeholder="粘贴完整的岗位描述（职责、任职要求、加分项…）"
          className="w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed outline-none focus:border-primary"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" /> 开始模拟解析
        </button>
        <button
          onClick={onSample}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium hover:bg-secondary"
        >
          <FileText className="h-4 w-4" /> 填入示例 JD
        </button>
        <button
          onClick={onSimFail}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        >
          模拟解析失败 →
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function ParsingState({ activeStep }: { activeStep: number }) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 pt-4">
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
          className="h-16 animate-pulse rounded-2xl border border-border bg-secondary/40"
        />
      ))}
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
        模拟解析未完成。你可以重试，或直接载入预置结果继续检查交互流程。
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
          <FileText className="h-4 w-4" /> 使用预置结果
        </button>
      </div>
    </div>
  );
}

function StructuredProfile({
  profile,
  setProfile,
  riskState,
  onRisk,
  editable,
  onEvidence,
}: {
  profile: JobProfile;
  setProfile: React.Dispatch<React.SetStateAction<JobProfile>>;
  riskState: RiskState;
  onRisk: (id: string, s: RiskState[string]) => void;
  editable: boolean;
  onEvidence: (key: string) => void;
}) {
  const addMust = (name: string) =>
    setProfile((p) => ({ ...p, mustSkills: [...p.mustSkills, { name, weight: "normal" }] }));
  const addNice = (name: string) =>
    setProfile((p) => ({ ...p, niceSkills: [...p.niceSkills, { name }] }));
  const rmMust = (name: string) =>
    setProfile((p) => ({ ...p, mustSkills: p.mustSkills.filter((s) => s.name !== name) }));
  const rmNice = (name: string) =>
    setProfile((p) => ({ ...p, niceSkills: p.niceSkills.filter((s) => s.name !== name) }));

  return (
    <div className="space-y-5">
      <Section title="岗位摘要" evidenceKey="summary" onEvidence={onEvidence}>
        <EditableText
          value={profile.summary}
          editable={editable}
          onChange={(v) => setProfile((p) => ({ ...p, summary: v }))}
          multiline
        />
      </Section>

      <Section title="核心职责" evidenceKey="responsibilities" onEvidence={onEvidence}>
        <ul className="space-y-2">
          {profile.responsibilities.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <EditableText
                value={r}
                editable={editable}
                onChange={(v) =>
                  setProfile((p) => {
                    const arr = [...p.responsibilities];
                    arr[i] = v;
                    return { ...p, responsibilities: arr };
                  })
                }
              />
              {editable && (
                <button
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      responsibilities: p.responsibilities.filter((_, j) => j !== i),
                    }))
                  }
                  className="text-muted-foreground/60 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {editable && (
          <button
            onClick={() =>
              setProfile((p) => ({ ...p, responsibilities: [...p.responsibilities, "新增职责"] }))
            }
            className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> 添加职责
          </button>
        )}
      </Section>

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="必备技能" hint="硬性要求" evidenceKey="mustSkills" onEvidence={onEvidence}>
          <TagEditor
            tags={profile.mustSkills.map((s) => s.name)}
            editable={editable}
            variant="must"
            onAdd={addMust}
            onRemove={rmMust}
          />
        </Section>
        <Section title="加分技能" hint="非必需" evidenceKey="niceSkills" onEvidence={onEvidence}>
          <TagEditor
            tags={profile.niceSkills.map((s) => s.name)}
            editable={editable}
            variant="nice"
            onAdd={addNice}
            onRemove={rmNice}
          />
        </Section>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Section title="经验要求" evidenceKey="experience" onEvidence={onEvidence}>
          <EditableText
            value={profile.experience}
            editable={editable}
            onChange={(v) => setProfile((p) => ({ ...p, experience: v }))}
            multiline
          />
        </Section>
        <Section title="学历要求" evidenceKey="education" onEvidence={onEvidence}>
          <EditableText
            value={profile.education}
            editable={editable}
            onChange={(v) => setProfile((p) => ({ ...p, education: v }))}
            multiline
          />
        </Section>
      </div>

      <Section title="能力维度" evidenceKey="competencies" onEvidence={onEvidence}>
        <div className="space-y-3">
          {profile.competencies.map((c, i) => (
            <div key={c.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.label}</span>
                <span className="text-muted-foreground">{c.value}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-rainbow" style={{ width: `${c.value}%` }} />
              </div>
              {editable && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={c.value}
                  onChange={(e) =>
                    setProfile((p) => {
                      const arr = [...p.competencies];
                      arr[i] = { ...arr[i], value: Number(e.target.value) };
                      return { ...p, competencies: arr };
                    })
                  }
                  className="mt-1.5 w-full accent-primary"
                />
              )}
              <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="风险提示" hint={`${profile.risks.length} 项`}>
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

function EditableText({
  value,
  editable,
  onChange,
  multiline,
}: {
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  if (!editable)
    return <span className="text-sm leading-relaxed text-muted-foreground">{value}</span>;
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-y rounded-lg border border-transparent bg-secondary/40 px-2.5 py-1.5 text-sm leading-relaxed text-muted-foreground outline-none focus:border-primary focus:bg-background"
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 rounded-lg border border-transparent bg-secondary/40 px-2 py-1 text-sm text-muted-foreground outline-none focus:border-primary focus:bg-background"
    />
  );
}

function TagEditor({
  tags,
  editable,
  variant,
  onAdd,
  onRemove,
}: {
  tags: string[];
  editable: boolean;
  variant: "must" | "nice";
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const v = draft.trim();
    if (v) {
      onAdd(v);
      setDraft("");
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <span
          key={t}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium",
            variant === "must"
              ? "bg-primary text-primary-foreground"
              : "rounded-full border border-dashed border-border bg-background text-muted-foreground",
          )}
        >
          {t}
          {editable && (
            <button onClick={() => onRemove(t)} className="opacity-70 hover:opacity-100">
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {editable && (
        <span className="inline-flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="添加标签"
            className="w-24 rounded-full border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
          />
          <button
            onClick={submit}
            className="grid h-7 w-7 place-items-center rounded-full border border-border hover:bg-secondary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  evidenceKey,
  onEvidence,
  children,
}: {
  title: string;
  hint?: string;
  evidenceKey?: string;
  onEvidence?: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
          {evidenceKey && onEvidence && (
            <button
              onClick={() => onEvidence(evidenceKey)}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <Quote className="h-3 w-3" /> 原文依据
            </button>
          )}
        </div>
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
