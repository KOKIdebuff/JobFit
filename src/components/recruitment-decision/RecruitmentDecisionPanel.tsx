import { AlertCircle, CheckCircle2, Clock3, Loader2, Pencil, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRecruitmentDecision } from "@/hooks/use-recruitment-decision";
import {
  RECRUITMENT_DECISION_OUTCOMES,
  recruitmentDecisionOutcomeLabel,
  type RecruitmentDecisionOutcome,
} from "@/lib/recruitment-decision/types";
import { cn } from "@/lib/utils";
import { RecruitmentDecisionStatusBadge } from "./RecruitmentDecisionStatusBadge";
import { formatDecisionDate } from "./utils";

export function RecruitmentDecisionPanel({
  applicationId,
  reportConfirmed,
}: {
  applicationId: string;
  reportConfirmed: boolean;
}) {
  const { decision, history, loading, submitting, error, submit, retry } =
    useRecruitmentDecision(applicationId);
  const [editing, setEditing] = useState(false);
  const [outcome, setOutcome] = useState<RecruitmentDecisionOutcome | "">("");
  const [reason, setReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!decision) return;
    setOutcome(decision.outcome ?? "");
    setReason(decision.reason ?? "");
    setInternalNote(decision.internalNote ?? "");
    setEditing(decision.status === "pending");
  }, [decision]);

  const requestSubmit = () => {
    if (!reportConfirmed) {
      setFormError("请先确认本版证据链报告，再提交最终决策。");
      return;
    }
    if (!outcome) {
      setFormError("请选择最终处理结果。");
      return;
    }
    if (!reason.trim()) {
      setFormError("请填写决策说明。");
      return;
    }
    if (outcome === "reject" && !internalNote.trim()) {
      setFormError("暂不推进时必须填写候选人不可见的内部原因。");
      return;
    }
    setFormError(null);
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    if (!decision || !outcome) return;
    setConfirmOpen(false);
    try {
      await submit({
        outcome,
        reason,
        internalNote: outcome === "reject" ? internalNote : undefined,
        expectedVersion: decision.version,
      });
      setEditing(false);
      toast.success(decision.status === "submitted" ? "最终决策已更新" : "最终决策已提交");
    } catch {
      // Hook exposes a user-facing error and keeps the current report state unchanged.
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-20 w-full rounded-2xl" />
        <Skeleton className="mt-3 h-28 w-full rounded-2xl" />
      </section>
    );
  }

  if (!decision) {
    return (
      <section className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-6 text-center sm:p-7">
        <AlertCircle className="mx-auto h-7 w-7 text-amber-700" />
        <h2 className="mt-3 font-semibold">无法读取最终决策</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error || "未找到该候选人申请。"}</p>
        <Button variant="outline" className="mt-4 rounded-full" onClick={() => void retry()}>
          重新加载
        </Button>
      </section>
    );
  }

  const showForm = decision.status === "pending" || editing;

  return (
    <>
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">HR 最终处理</p>
            <h2 className="mt-1 text-xl font-semibold">最终决策</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              基于完整证据链作出人工判断。AI 报告仅提供辅助信息，不替代 HR 的最终责任。
            </p>
          </div>
          <RecruitmentDecisionStatusBadge decision={decision} />
        </div>

        {!reportConfirmed && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-medium">报告确认后才能提交最终决策</div>
              <p className="mt-1 text-amber-800/80">请先完成当前报告的 HR 复核与确认。</p>
            </div>
          </div>
        )}

        {showForm ? (
          <div className="mt-6 space-y-5">
            <RadioGroup
              value={outcome}
              onValueChange={(value) => {
                setOutcome(value as RecruitmentDecisionOutcome);
                setFormError(null);
              }}
              className="grid gap-3 md:grid-cols-3"
              disabled={!reportConfirmed || submitting}
            >
              {RECRUITMENT_DECISION_OUTCOMES.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={`decision-${option.value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:bg-secondary/40",
                    outcome === option.value && "border-primary bg-secondary/45",
                    (!reportConfirmed || submitting) && "cursor-not-allowed opacity-60",
                  )}
                >
                  <RadioGroupItem
                    id={`decision-${option.value}`}
                    value={option.value}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="decision-reason">决策说明</Label>
              <Textarea
                id="decision-reason"
                value={reason}
                disabled={!reportConfirmed || submitting}
                onChange={(event) => {
                  setReason(event.target.value);
                  setFormError(null);
                }}
                placeholder="说明本次处理决定的主要依据…"
                className="min-h-28"
              />
            </div>

            {outcome === "reject" && (
              <div className="space-y-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                <Label htmlFor="decision-internal-note">内部原因（候选人不可见）</Label>
                <Textarea
                  id="decision-internal-note"
                  value={internalNote}
                  disabled={!reportConfirmed || submitting}
                  onChange={(event) => {
                    setInternalNote(event.target.value);
                    setFormError(null);
                  }}
                  placeholder="记录仅供招聘团队查看的淘汰原因…"
                  className="min-h-24 bg-background"
                />
              </div>
            )}

            {(formError || error) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-500/5 p-4 text-sm text-red-700">
                <span className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError || error}</span>
                </span>
                {error && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => void retry()}
                  >
                    刷新最新状态
                  </Button>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              {decision.status === "submitted" && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  disabled={submitting}
                  onClick={() => setEditing(false)}
                >
                  取消修改
                </Button>
              )}
              <Button
                className="rounded-full"
                disabled={!reportConfirmed || submitting}
                onClick={requestSubmit}
              >
                {submitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                {submitting
                  ? "提交处理中"
                  : decision.status === "submitted"
                    ? "提交修改"
                    : "提交最终决策"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-secondary/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                {recruitmentDecisionOutcomeLabel(decision.outcome)}
              </div>
              <Button variant="outline" className="rounded-full" onClick={() => setEditing(true)}>
                <Pencil /> 修改决策
              </Button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{decision.reason}</p>
            {decision.internalNote && (
              <div className="mt-4 rounded-xl border border-rose-500/15 bg-background p-4 text-sm">
                <div className="font-medium text-rose-700">内部原因（候选人不可见）</div>
                <p className="mt-1 text-muted-foreground">{decision.internalNote}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span>{decision.decidedBy?.name}</span>
              <span>{formatDecisionDate(decision.decidedAt)}</span>
              <span>版本 v{decision.version}</span>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">决策记录</h3>
          </div>
          {history.length ? (
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {item.previousOutcome
                        ? `${recruitmentDecisionOutcomeLabel(item.previousOutcome)} → `
                        : "首次提交："}
                      {recruitmentDecisionOutcomeLabel(item.nextOutcome)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.operatorName} · {formatDecisionDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">提交后将在这里保留操作记录。</p>
          )}
        </div>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {decision.status === "submitted" ? "确认修改最终决策？" : "确认提交最终决策？"}
            </DialogTitle>
            <DialogDescription>
              AI 报告仅作为辅助证据，最终决定由 HR 独立作出。提交后会记录操作人、时间和变更历史。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">
            <div className="font-medium">
              {recruitmentDecisionOutcomeLabel(outcome || undefined)}
            </div>
            <p className="mt-2 text-muted-foreground">{reason.trim()}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button disabled={submitting} onClick={() => void confirmSubmit()}>
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
