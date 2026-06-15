import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CandidateDetailSkeleton,
  CandidateIdentitySidebar,
  CandidateProfileSection,
  CandidateStatePanel,
  CandidateSummary,
  HrActionSidebar,
  MatchExplanation,
  RecruitmentPipeline,
  ValidationRecommendations,
} from "@/components/candidate-detail/CandidateDetailSections";
import { PageShell } from "@/components/site/PageShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCandidateDetailDemo } from "@/hooks/use-candidate-detail-demo";
import {
  candidateDetailDemoService,
  DEMO_IDS,
  type CandidatePageState,
} from "@/lib/candidate-detail-demo";

interface CandidateDetailSearch {
  state?: CandidatePageState;
  fail?: boolean;
}

export const Route = createFileRoute("/hr/jobs/$jobId/candidates_/$applicationId")({
  validateSearch: (search: Record<string, unknown>): CandidateDetailSearch => ({
    state: typeof search.state === "string" ? (search.state as CandidatePageState) : undefined,
    fail: search.fail === true || search.fail === "true",
  }),
  head: () => ({
    meta: [
      { title: "李同学 · 候选人详情 — HireLink AI" },
      {
        name: "description",
        content: "查看候选人的职业画像、可解释匹配、能力证据与下一步验证建议。",
      },
    ],
  }),
  component: CandidateDetailPage,
});

function CandidateDetailPage() {
  const { jobId, applicationId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const state = useCandidateDetailDemo();
  const [resumeOpen, setResumeOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [note, setNote] = useState("");

  const listPath = () =>
    navigate({
      to: "/hr/jobs/$jobId/candidates",
      params: { jobId: DEMO_IDS.job },
    });

  const planPath = () =>
    navigate({
      to: "/hr/jobs/$jobId/candidates/$applicationId/assessment-plan",
      params: { jobId: state.job.id, applicationId: state.application.id },
    });

  const clearDemoSearch = async () => {
    if (!search.state && !search.fail) return;
    await navigate({
      to: "/hr/jobs/$jobId/candidates/$applicationId",
      params: { jobId: DEMO_IDS.job, applicationId: DEMO_IDS.application },
      search: {},
      replace: true,
    });
  };

  const loadDemoData = async () => {
    candidateDetailDemoService.loadDemoData();
    await clearDemoSearch();
    toast.success("已载入演示数据");
  };

  const generate = async () => {
    const shouldFail = Boolean(search.fail);
    await clearDemoSearch();
    candidateDetailDemoService.generateAssessmentPlan({ fail: shouldFail });
  };

  const openNote = () => {
    setNote(state.hr_note.content);
    setNoteOpen(true);
  };

  if (state.page_status === "loading") {
    return (
      <PageShell>
        <CandidateDetailSkeleton />
      </PageShell>
    );
  }

  const validIds = jobId === DEMO_IDS.job && applicationId === DEMO_IDS.application;
  const simulatedState = search.state;

  if (!validIds || simulatedState === "not-found") {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <CandidateStatePanel state="not-found" onPrimary={listPath} />
        </main>
      </PageShell>
    );
  }

  if (
    state.page_status === "empty" ||
    simulatedState === "profile-empty" ||
    simulatedState === "match-empty"
  ) {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <CandidateStatePanel
            state={simulatedState === "match-empty" ? "match-empty" : "profile-empty"}
            onPrimary={loadDemoData}
            onSecondary={() => setResumeOpen(true)}
          />
        </main>
        <CandidateDialogs
          resumeOpen={resumeOpen}
          noteOpen={false}
          state={state}
          note={note}
          onResumeOpenChange={setResumeOpen}
          onNoteOpenChange={setNoteOpen}
          onNoteChange={setNote}
          onSaveNote={() => undefined}
        />
      </PageShell>
    );
  }

  if (state.page_status === "error" || simulatedState === "match-failed") {
    return (
      <PageShell>
        <main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <CandidateStatePanel state="match-failed" onPrimary={loadDemoData} />
        </main>
      </PageShell>
    );
  }

  const primaryAction = ["draft", "fallback", "sent"].includes(state.assessment_plan.status)
    ? planPath
    : generate;

  return (
    <PageShell>
      <section className="border-b border-border bg-card/40 px-5 py-3 sm:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm">
          <span className="font-medium">当前角色：HR</span>
          <span className="text-muted-foreground">当前岗位：{state.job.title}</span>
          <span className="text-muted-foreground">候选人：{state.candidate.name}</span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
            数据来源：演示数据
          </span>
        </div>
      </section>

      <section className="px-5 pb-5 pt-7 sm:px-8">
        <div className="mx-auto max-w-[1440px]">
          <Link
            to="/hr/jobs/$jobId/candidates"
            params={{ jobId: state.job.id }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> 返回候选人列表
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-[1440px] px-5 pb-28 sm:px-8 lg:pb-20">
        {simulatedState === "match-stale" && (
          <div className="mb-6">
            <CandidateStatePanel state="match-stale" onPrimary={loadDemoData} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
          <CandidateIdentitySidebar
            state={state}
            onResume={() => setResumeOpen(true)}
            onSwitchCandidate={listPath}
          />

          <div className="min-w-0 space-y-6">
            <RecruitmentPipeline state={state} />
            <CandidateSummary state={state} />
            <CandidateProfileSection state={state} />
            <MatchExplanation state={state} />
            <ValidationRecommendations state={state} />
          </div>

          <HrActionSidebar
            state={state}
            onGenerate={generate}
            onViewPlan={planPath}
            onRetry={() => candidateDetailDemoService.generateAssessmentPlan()}
            onFallback={() => {
              candidateDetailDemoService.usePresetAssessmentPlan();
              toast.success("已使用预置验证方案");
            }}
            onNote={openNote}
            onPriority={() => {
              candidateDetailDemoService.togglePriority();
              toast.success(state.application.priority ? "已取消重点关注" : "已标记重点关注");
            }}
            onFavorite={() => {
              candidateDetailDemoService.toggleFavorite();
              toast.success(state.application.favorite ? "已取消收藏" : "已收藏候选人");
            }}
            onPause={() => setPauseOpen(true)}
            onBack={listPath}
          />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-5 py-3 backdrop-blur-xl lg:hidden">
        <Button
          className="w-full rounded-full"
          disabled={state.assessment_plan.status === "generating"}
          onClick={primaryAction}
        >
          {["draft", "fallback", "sent"].includes(state.assessment_plan.status)
            ? "查看并确认验证方案"
            : state.assessment_plan.status === "generating"
              ? "AI 正在生成验证方案"
              : "生成候选人验证方案"}
          <ArrowRight />
        </Button>
      </div>

      <CandidateDialogs
        resumeOpen={resumeOpen}
        noteOpen={noteOpen}
        state={state}
        note={note}
        onResumeOpenChange={setResumeOpen}
        onNoteOpenChange={setNoteOpen}
        onNoteChange={setNote}
        onSaveNote={() => {
          candidateDetailDemoService.saveHrNote(note);
          setNoteOpen(false);
          toast.success("HR 备注已保存");
        }}
      />

      <AlertDialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <AlertDialogContent className="sm:rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认暂不推进该候选人？</AlertDialogTitle>
            <AlertDialogDescription>
              候选人资料、匹配结果和 HR 备注会继续保留，后续仍可恢复处理。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">取消</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                candidateDetailDemoService.pauseApplication();
                toast.success("已标记为暂不推进");
              }}
            >
              确认暂不推进
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function CandidateDialogs({
  resumeOpen,
  noteOpen,
  state,
  note,
  onResumeOpenChange,
  onNoteOpenChange,
  onNoteChange,
  onSaveNote,
}: {
  resumeOpen: boolean;
  noteOpen: boolean;
  state: ReturnType<typeof useCandidateDetailDemo>;
  note: string;
  onResumeOpenChange: (open: boolean) => void;
  onNoteOpenChange: (open: boolean) => void;
  onNoteChange: (value: string) => void;
  onSaveNote: () => void;
}) {
  return (
    <>
      <Dialog open={resumeOpen} onOpenChange={onResumeOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>{state.resume.version}</DialogTitle>
            <DialogDescription>候选人本次申请使用的原始简历内容。</DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap rounded-2xl bg-secondary/50 p-5 font-sans text-sm leading-7">
            {state.resume.rawText}
          </pre>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={onNoteOpenChange}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>{state.hr_note.content ? "编辑 HR 备注" : "添加 HR 备注"}</DialogTitle>
            <DialogDescription>备注仅用于当前招聘流程，刷新页面后仍会保留。</DialogDescription>
          </DialogHeader>
          <Textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="记录后续需要核实的信息…"
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => onNoteOpenChange(false)}>
              取消
            </Button>
            <Button onClick={onSaveNote}>保存备注</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
