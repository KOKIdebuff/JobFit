import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  FileText,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { evaluationReportService } from "@/lib/evaluation-report/service";
import { getCoverageEvidenceIds } from "@/lib/evaluation-report/adapter";
import type { EvaluationReport, EvidenceSourceKey } from "@/lib/evaluation-report/types";
import { findEvidence, formatReportDate } from "@/lib/evaluation-report/ui";
import { cn } from "@/lib/utils";
import { RecruitmentDecisionPanel } from "@/components/recruitment-decision/RecruitmentDecisionPanel";
import { EvidenceDetails, EvidenceQuoteList, ReportStatusBadge, StatusDot } from "./ReportCommon";
import { CandidateEvidenceFeedback } from "./CandidateEvidenceFeedback";

const sourceOptions: Array<{ id: EvidenceSourceKey | "all"; label: string }> = [
  { id: "all", label: "全部证据" },
  { id: "resume", label: "简历" },
  { id: "match", label: "匹配" },
  { id: "interview", label: "面试" },
  { id: "trial", label: "岗位任务" },
];

export function HrEvidenceReport({
  report,
  onBackDetail,
  onBackList,
  onViewAgentRun,
}: {
  report: EvaluationReport;
  onBackDetail: () => void;
  onBackList: () => void;
  onViewAgentRun: () => void;
}) {
  const [source, setSource] = useState<EvidenceSourceKey | "all">("all");
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [note, setNote] = useState(report.hrReview.note);
  const selectedEvidence = useMemo(() => findEvidence(report, evidenceIds), [report, evidenceIds]);
  const locked = report.status === "confirmed";

  const saveNote = () => {
    evaluationReportService.saveHrNote(note);
    setNoteOpen(false);
    toast.success("HR 备注已保存");
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">完整证据链报告</p>
                <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
                  {report.summary.candidateName} · {report.summary.jobTitle}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  生成时间：{formatReportDate(report.generatedAt)}
                </p>
              </div>
              <ReportStatusBadge status={report.status} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-full" onClick={onBackDetail}>
                <ArrowLeft /> 返回候选人详情
              </Button>
              <Button variant="outline" className="rounded-full" onClick={onBackList}>
                返回候选人列表
              </Button>
              <Button variant="ghost" className="rounded-full" onClick={onViewAgentRun}>
                <FileText /> 查看 Agent 运行详情
              </Button>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
              <div>
                <h2 className="font-semibold">决策摘要</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {report.summary.overallConclusion}
                </p>
                <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-900">
                  {report.summary.decisionBoundary}
                </div>
              </div>
              <div className="rounded-3xl bg-rainbow p-5 text-white">
                <div className="text-sm text-white/80">证据完整度</div>
                <div className="mt-2 font-display text-5xl font-bold">
                  {report.summary.evidenceCompleteness}%
                </div>
                <Progress
                  value={report.summary.evidenceCompleteness}
                  className="mt-4 bg-white/20 [&>div]:bg-white"
                />
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <DecisionList
                title="核心优势"
                items={report.strengths}
                tone="green"
                report={report}
              />
              <DecisionList title="能力缺口" items={report.gaps} tone="amber" report={report} />
              <DecisionList title="风险提示" items={report.risks} tone="red" report={report} />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">能力证据覆盖矩阵</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  点击单元格查看该来源的原始证据。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {sourceOptions.map((option) => (
                  <Button
                    key={option.id}
                    size="sm"
                    variant={source === option.id ? "secondary" : "outline"}
                    className="rounded-full"
                    onClick={() => setSource(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>能力</TableHead>
                    <TableHead>简历证据</TableHead>
                    <TableHead>匹配证据</TableHead>
                    <TableHead>面试证据</TableHead>
                    <TableHead>任务证据</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.coverageMatrix.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.capability}</TableCell>
                      <CoverageCell
                        ids={row.resumeEvidenceIds}
                        source={source}
                        own="resume"
                        onOpen={setEvidenceIds}
                      />
                      <CoverageCell
                        ids={row.matchEvidenceIds}
                        source={source}
                        own="match"
                        onOpen={setEvidenceIds}
                      />
                      <CoverageCell
                        ids={row.interviewEvidenceIds}
                        source={source}
                        own="interview"
                        onOpen={setEvidenceIds}
                      />
                      <CoverageCell
                        ids={row.trialEvidenceIds}
                        source={source}
                        own="trial"
                        onOpen={setEvidenceIds}
                      />
                      <TableCell>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            row.status === "sufficient"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : row.status === "partial"
                                ? "bg-amber-500/10 text-amber-800"
                                : "bg-red-500/10 text-red-700",
                          )}
                        >
                          {row.status === "sufficient"
                            ? "证据充分"
                            : row.status === "partial"
                              ? "部分证明"
                              : "仍需验证"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {report.coverageMatrix.map((row) => {
                const ids = getCoverageEvidenceIds(row, source);
                if (!ids.length) return null;
                return (
                  <EvidenceDetails
                    key={`${row.id}-${source}`}
                    title={`${row.capability} · ${sourceOptions.find((item) => item.id === source)?.label}`}
                    evidence={findEvidence(report, ids)}
                  />
                );
              })}
            </div>
          </section>

          <Tabs
            defaultValue="match"
            className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7"
          >
            <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
              <TabsTrigger value="match">匹配依据</TabsTrigger>
              <TabsTrigger value="interview">面试证据</TabsTrigger>
              <TabsTrigger value="trial">岗位任务</TabsTrigger>
              <TabsTrigger value="chain">完整证据链</TabsTrigger>
            </TabsList>
            <TabsContent value="match" className="mt-5">
              <MatchBasis report={report} />
            </TabsContent>
            <TabsContent value="interview" className="mt-5">
              <InterviewEvidence report={report} />
            </TabsContent>
            <TabsContent value="trial" className="mt-5">
              <TrialEvidence report={report} />
            </TabsContent>
            <TabsContent value="chain" className="mt-5">
              <EvidenceTimeline report={report} />
            </TabsContent>
          </Tabs>

          <RecruitmentDecisionPanel
            applicationId={report.applicationId}
            reportConfirmed={report.status === "confirmed"}
          />
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-semibold">HR 复核栏</h2>
            <div className="mt-4 space-y-3 text-sm">
              <ReviewRow label="复核状态" value={report.hrReview.reviewed ? "已复核" : "待复核"} />
              <ReviewRow
                label="报告确认"
                value={
                  locked
                    ? `已确认 · ${formatReportDate(report.confirmedAt)}`
                    : "确认前不可进入最终决策"
                }
              />
              <ReviewRow
                label="候选人查看"
                value={
                  report.hrReview.candidateReadAt
                    ? `已查看 · ${formatReportDate(report.hrReview.candidateReadAt)}`
                    : "尚未查看"
                }
              />
              <ReviewRow label="内部备注" value={report.hrReview.note || "尚未添加"} />
            </div>
            <div className="mt-5 space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start rounded-full"
                onClick={() => setNoteOpen(true)}
              >
                <MessageSquareText /> {report.hrReview.note ? "编辑内部备注" : "添加内部备注"}
              </Button>
              <Button
                variant={report.hrReview.reviewed ? "secondary" : "outline"}
                className="w-full justify-start rounded-full"
                onClick={() => {
                  evaluationReportService.markReviewed();
                  toast.success("已标记为复核完成");
                }}
              >
                <CheckCircle2 /> 标记已复核
              </Button>
              <Button
                variant={report.hrReview.priority ? "secondary" : "outline"}
                className="w-full justify-start rounded-full"
                onClick={() => {
                  evaluationReportService.togglePriority();
                  toast.success(report.hrReview.priority ? "已取消重点关注" : "已标记重点关注");
                }}
              >
                <Star className={cn(report.hrReview.priority && "fill-current")} /> 标记重点关注
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start rounded-full"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye /> 候选人脱敏预览
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start rounded-full"
                onClick={() => evaluationReportService.retry()}
              >
                <RefreshCw /> {report.status === "stale" ? "重新生成新版本" : "请求重新生成"}
              </Button>
              <Button
                className="w-full rounded-full"
                disabled={locked || report.status === "generating"}
                onClick={() => setConfirmOpen(true)}
              >
                <ShieldCheck /> {locked ? "报告已确认" : "确认报告"}
              </Button>
            </div>
          </section>

          <Button
            variant="ghost"
            className="w-full rounded-full text-muted-foreground"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw /> 重置本次报告
          </Button>
        </aside>
      </div>

      <Dialog
        open={Boolean(selectedEvidence.length)}
        onOpenChange={(open) => !open && setEvidenceIds([])}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>原始证据</DialogTitle>
            <DialogDescription>来自同一报告实体的可追溯片段。</DialogDescription>
          </DialogHeader>
          <EvidenceQuoteList evidence={selectedEvidence} />
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>HR 内部备注</DialogTitle>
            <DialogDescription>备注只进入 HR 复核信息，不会进入候选人反馈。</DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              取消
            </Button>
            <Button onClick={saveNote}>保存备注</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>确认发布报告？</DialogTitle>
            <DialogDescription>
              确认后候选人反馈页将解锁；后续上游变化需要重新生成报告。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">
            候选人：{report.summary.candidateName}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                evaluationReportService.confirm();
                setConfirmOpen(false);
                toast.success("报告已确认，候选人反馈已开放");
              }}
            >
              确认报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>候选人脱敏预览</DialogTitle>
            <DialogDescription>该视图来自同一报告实体的候选人投影。</DialogDescription>
          </DialogHeader>
          <CandidateEvidenceFeedback report={report} embedded />
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>确认重置报告？</DialogTitle>
            <DialogDescription>
              只清除当前浏览器会话中的报告版本，不会清除简历、匹配、面试和任务数据。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                evaluationReportService.resetDemo();
                setResetOpen(false);
                toast.success("报告状态已重置");
              }}
            >
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CoverageCell({
  ids,
  source,
  own,
  onOpen,
}: {
  ids: string[];
  source: EvidenceSourceKey | "all";
  own: EvidenceSourceKey;
  onOpen: (ids: string[]) => void;
}) {
  const muted = source !== "all" && source !== own;
  return (
    <TableCell>
      <button
        type="button"
        disabled={!ids.length}
        onClick={() => onOpen(ids)}
        className={cn(
          "rounded-full px-2.5 py-1 text-xs transition-colors",
          ids.length ? "bg-secondary hover:bg-accent" : "bg-background text-muted-foreground",
          muted && "opacity-30",
        )}
      >
        {ids.length ? `${ids.length} 条` : "无"}
      </button>
    </TableCell>
  );
}

function DecisionList({
  title,
  items,
  tone,
  report,
}: {
  title: string;
  items: Array<{ id: string; title: string; summary: string; evidence_ids: string[] }>;
  tone: "green" | "amber" | "red";
  report: EvaluationReport;
}) {
  return (
    <div className="rounded-2xl bg-secondary/40 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <details key={item.id} className="group">
            <summary className="flex cursor-pointer list-none gap-2 text-sm">
              <StatusDot tone={tone} />
              <span className="font-medium">{item.title}</span>
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.summary}</p>
            <EvidenceQuoteList evidence={findEvidence(report, item.evidence_ids)} />
          </details>
        ))}
      </div>
    </div>
  );
}

function MatchBasis({ report }: { report: EvaluationReport }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="text-sm opacity-70">匹配总分</div>
          <div className="mt-1 font-display text-5xl font-bold">{report.matchBasis.total}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {report.matchBasis.dimensions.map((dimension) => (
            <EvidenceDetails
              key={dimension.id}
              title={`${dimension.label} · ${dimension.score} 分`}
              evidence={findEvidence(report, dimension.evidence_ids)}
            >
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <InfoList title="岗位要求" items={dimension.jobRequirements} />
                <InfoList title="命中项" items={dimension.hits} />
                <InfoList title="未命中项" items={dimension.misses} />
                <InfoList title="简历证据" items={dimension.resumeEvidence} />
              </div>
            </EvidenceDetails>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-secondary/40 p-4 text-xs text-muted-foreground">
        匹配依据：{report.matchBasis.sources.join("、")}
      </div>
    </div>
  );
}

function InterviewEvidence({ report }: { report: EvaluationReport }) {
  return (
    <div className="space-y-3">
      {report.interviewEvidence.map((item, index) => (
        <EvidenceDetails
          key={item.id}
          title={`Q${index + 1} · ${item.capability} · ${item.answered ? "已回答" : "未回答"}`}
          evidence={findEvidence(report, item.evidence_ids)}
        >
          <div className="mt-3 rounded-xl bg-secondary/45 p-4 text-sm">
            <div className="font-medium">{item.question}</div>
            <p className="mt-2 text-muted-foreground">回答摘要：{item.answerSummary}</p>
            <p className="mt-2 text-muted-foreground">
              证据质量：{qualityLabel(item.evidenceQuality)}
            </p>
            <p className="mt-2 text-muted-foreground">追问结果：{item.followUpResult}</p>
          </div>
        </EvidenceDetails>
      ))}
    </div>
  );
}

function TrialEvidence({ report }: { report: EvaluationReport }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-secondary/45 p-5">
        <h3 className="font-semibold">{report.trialEvidence.taskTitle}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          候选人交付内容：{report.trialEvidence.submissionSummary}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {report.trialEvidence.dimensions.map((dimension) => (
          <EvidenceDetails
            key={dimension.id}
            title={`${dimension.label} · ${dimension.achieved}/${dimension.score}`}
            evidence={findEvidence(report, dimension.evidence_ids)}
          />
        ))}
      </div>
      <InfoList title="任务要求" items={report.trialEvidence.requirements} />
      <InfoList title="未满足项" items={report.trialEvidence.unmetItems} />
      <div className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
        AI 参考评价：{report.trialEvidence.aiReference}
      </div>
    </div>
  );
}

function EvidenceTimeline({ report }: { report: EvaluationReport }) {
  return (
    <div className="space-y-3">
      {report.evidenceRefs.map((item) => (
        <EvidenceDetails
          key={item.id}
          title={`${typeLabel(item.type)} · ${item.title}`}
          evidence={[item]}
        >
          <div className="mt-3 grid gap-2 rounded-xl bg-secondary/45 p-3 text-xs text-muted-foreground sm:grid-cols-2">
            <span>来源：{typeLabel(item.type)}</span>
            <span>采集时间：{formatReportDate(item.collectedAt)}</span>
            <span>支持能力：{item.abilities.join("、")}</span>
          </div>
        </EvidenceDetails>
      ))}
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-secondary/45 p-3">
      <div className="text-xs font-medium">{title}</div>
      <ul className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 leading-relaxed">{value}</div>
    </div>
  );
}

function qualityLabel(value: string) {
  const labels: Record<string, string> = {
    high: "高",
    medium: "中",
    low: "低",
    unanswered: "未回答",
  };
  return labels[value] || value;
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    resume: "简历证据",
    candidate_profile: "职业画像",
    match_result: "匹配依据",
    assessment_plan: "验证方案",
    interview_answer: "面试回答",
    trial_submission: "岗位任务提交",
    trial_evaluation: "岗位任务评价",
    ai_run: "AI 运行",
    hr_note: "HR 备注",
  };
  return labels[type] || type;
}
