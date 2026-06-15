export type TrialTaskStatus =
  | "ungenerated"
  | "generating"
  | "failed"
  | "draft"
  | "published"
  | "in_progress"
  | "submitted"
  | "evaluated"
  | "expired";

export type SubmissionStatus =
  | "empty"
  | "in_progress"
  | "saving"
  | "draft_saved"
  | "save_failed"
  | "submitting"
  | "submitted";

export type AiRunStatus = "idle" | "running" | "failed" | "completed" | "fallback";

export interface TrialCriterion {
  id: string;
  label: string;
  score: number;
}

export interface TrialAttachment {
  name: string;
  size: number;
  type: string;
}

export interface TrialDemoState {
  job: {
    id: string;
    title: string;
    company: string;
    owner: string;
  };
  candidate: {
    id: string;
    name: string;
    matchScore: number;
    strengths: string[];
    gaps: string[];
  };
  application: {
    id: string;
    stage: string;
    reportIncluded: boolean;
    resubmissionAllowed: boolean;
  };
  trial_task: {
    id: string;
    status: TrialTaskStatus;
    source: "ai" | "fallback";
    title: string;
    background: string;
    requirements: string[];
    deliverables: string[];
    deadline: string;
    estimatedMinutes: number;
    criteria: TrialCriterion[];
    generatedAt?: string;
    publishedAt?: string;
  };
  trial_submission: {
    status: SubmissionStatus;
    body: string;
    prototypeUrl: string;
    attachments: TrialAttachment[];
    submittedAt?: string;
    saveError?: string;
    submitCount: number;
    saveFailNext: boolean;
  };
  trial_evaluation: {
    total: number;
    dimensions: Array<TrialCriterion & { achieved: number; evidence: string }>;
    highlight: string;
    gap: string;
    risk: string;
    disclaimer: string;
  } | null;
  ai_run: {
    status: AiRunStatus;
    activeStep: number;
    failNext: boolean;
    error?: string;
  };
}

export const AI_RUN_STEPS = [
  "校验任务提交",
  "按评分标准分析交付物",
  "提取表现证据",
  "生成能力缺口",
  "写入证据链报告",
] as const;

export const PRESET_TASK = {
  id: "trial-demo-001",
  title: "设计一套 AI 简历分析功能的 MVP 方案",
  background: "公司计划为校招平台增加 AI 简历分析功能，需要在两周内完成首版验证",
  requirements: [
    "明确目标用户和核心问题",
    "设计 MVP 功能范围",
    "描述 AI 与普通程序的职责边界",
    "给出一个核心成功指标",
    "说明隐私和错误结果风险",
  ],
  deliverables: ["500—800 字方案说明", "一张简单用户流程图", "可选原型链接"],
  deadline: "2026-06-18T18:00",
  estimatedMinutes: 45,
  criteria: [
    { id: "understanding", label: "问题理解", score: 25 },
    { id: "completeness", label: "方案完整性", score: 25 },
    { id: "scope", label: "MVP 范围控制", score: 20 },
    { id: "risk", label: "AI 风险意识", score: 20 },
    { id: "clarity", label: "表达清晰度", score: 10 },
  ],
} satisfies Omit<TrialDemoState["trial_task"], "status" | "source" | "generatedAt" | "publishedAt">;

export const PRESET_SUBMISSION = {
  body: "围绕应届生简历信息提取、岗位差距分析和人工确认设计 MVP。首版只处理候选人主动上传的简历，规则程序负责文件类型、字段完整性和确定性校验，生成式 AI 负责归纳经历、解释岗位差距并给出待确认建议。所有 AI 结果都要求用户确认后才能写入画像，系统不自动抓取外部链接，也不根据敏感属性推断候选人能力。核心流程为上传简历、结构化提取、差距分析、人工确认和生成报告。首版成功指标建议使用“完成一次分析并确认结果的用户占比”，同时观察错误字段的人工修改率。隐私方面仅保存完成服务所需的数据，提供删除入口；错误结果需要展示来源证据、置信提示和人工修正能力。两周内优先验证信息提取、差距解释和确认闭环，不建设自动录用、复杂推荐或跨平台数据同步。",
  prototypeUrl: "https://example.com/hirelink-demo",
  attachments: [
    {
      name: "AI简历分析MVP方案.pdf",
      size: 2_480_000,
      type: "application/pdf",
    },
  ],
  submittedAt: "2026-06-17T16:20:00",
};

export const PRESET_EVALUATION: NonNullable<TrialDemoState["trial_evaluation"]> = {
  total: 88,
  dimensions: [
    {
      id: "understanding",
      label: "问题理解",
      score: 25,
      achieved: 23,
      evidence: "“首版只处理候选人主动上传的简历”明确限定了目标用户场景。",
    },
    {
      id: "completeness",
      label: "方案完整性",
      score: 25,
      achieved: 22,
      evidence: "提交内容覆盖上传、提取、分析、人工确认和报告生成的完整主流程。",
    },
    {
      id: "scope",
      label: "MVP 范围控制",
      score: 20,
      achieved: 18,
      evidence: "“不建设自动录用、复杂推荐或跨平台数据同步”体现了清晰的首版边界。",
    },
    {
      id: "risk",
      label: "AI 风险意识",
      score: 20,
      achieved: 17,
      evidence: "明确提出敏感属性禁区、来源证据、置信提示和人工修正能力。",
    },
    {
      id: "clarity",
      label: "表达清晰度",
      score: 10,
      achieved: 8,
      evidence: "方案结构清楚，但核心指标仍可进一步定义统计窗口和目标阈值。",
    },
  ],
  highlight: "能够区分规则程序与生成式 AI 的职责",
  gap: "成功指标定义仍偏宽泛",
  risk: "需要进一步明确错误字段修改率的基线、统计周期和可接受阈值",
  disclaimer: "AI 参考评价，不代表最终招聘决定",
};

function createInitialState(): TrialDemoState {
  return {
    job: {
      id: "demo-ai-pm",
      title: "AI 产品经理（校招）",
      company: "星河智能",
      owner: "陈经理",
    },
    candidate: {
      id: "demo-candidate-001",
      name: "李同学",
      matchScore: 86,
      strengths: ["LLM 产品经验", "需求分析", "数据分析"],
      gaps: ["复杂需求拆解", "AI 风险意识", "MVP 范围控制"],
    },
    application: {
      id: "demo-application-001",
      stage: "待生成岗位能力试炼",
      reportIncluded: false,
      resubmissionAllowed: false,
    },
    trial_task: {
      ...PRESET_TASK,
      status: "ungenerated",
      source: "ai",
    },
    trial_submission: {
      status: "empty",
      body: "",
      prototypeUrl: "",
      attachments: [],
      submitCount: 0,
      saveFailNext: false,
    },
    trial_evaluation: null,
    ai_run: {
      status: "idle",
      activeStep: -1,
      failNext: false,
    },
  };
}

let state = createInitialState();
const listeners = new Set<() => void>();
const timers = new Set<ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((listener) => listener());
}

function update(updater: (current: TrialDemoState) => TrialDemoState) {
  state = updater(state);
  emit();
}

function later(callback: () => void, delay: number) {
  const timer = setTimeout(() => {
    timers.delete(timer);
    callback();
  }, delay);
  timers.add(timer);
  return timer;
}

function clearTimers() {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
}

function nowIso() {
  return new Date().toISOString();
}

export const trialDemoStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  getServerSnapshot() {
    return state;
  },
};

export const trialDemoService = {
  reset() {
    clearTimers();
    state = createInitialState();
    emit();
  },

  generateTask(options: { fail?: boolean } = {}) {
    clearTimers();
    update((current) => ({
      ...current,
      application: { ...current.application, stage: "AI 正在生成岗位能力试炼" },
      trial_task: { ...current.trial_task, status: "generating", source: "ai" },
    }));
    later(() => {
      update((current) =>
        options.fail
          ? {
              ...current,
              application: { ...current.application, stage: "任务生成失败" },
              trial_task: { ...current.trial_task, status: "failed" },
            }
          : {
              ...current,
              application: { ...current.application, stage: "任务草稿待 HR 确认" },
              trial_task: {
                ...PRESET_TASK,
                status: "draft",
                source: "ai",
                generatedAt: nowIso(),
              },
            },
      );
    }, 1400);
  },

  usePresetTask() {
    clearTimers();
    update((current) => ({
      ...current,
      application: { ...current.application, stage: "预置任务待 HR 确认" },
      trial_task: {
        ...PRESET_TASK,
        status: "draft",
        source: "fallback",
        generatedAt: nowIso(),
      },
    }));
  },

  updateTask(
    task: Pick<
      TrialDemoState["trial_task"],
      "title" | "background" | "requirements" | "deliverables" | "deadline" | "criteria"
    >,
  ) {
    update((current) => ({
      ...current,
      trial_task: { ...current.trial_task, ...task, status: "draft" },
    }));
  },

  publishTask() {
    update((current) => ({
      ...current,
      application: { ...current.application, stage: "岗位能力试炼已发布" },
      trial_task: { ...current.trial_task, status: "published", publishedAt: nowIso() },
    }));
  },

  startTask() {
    if (state.trial_task.status !== "published") return;
    update((current) => ({
      ...current,
      application: { ...current.application, stage: "候选人进行岗位能力试炼" },
      trial_task: { ...current.trial_task, status: "in_progress" },
      trial_submission: { ...current.trial_submission, status: "in_progress" },
    }));
  },

  setSubmissionDraft(
    draft: Pick<TrialDemoState["trial_submission"], "body" | "prototypeUrl" | "attachments">,
  ) {
    update((current) => ({
      ...current,
      trial_submission: { ...current.trial_submission, ...draft },
    }));
  },

  fillPresetSubmission() {
    update((current) => ({
      ...current,
      trial_submission: {
        ...current.trial_submission,
        ...PRESET_SUBMISSION,
        status: "in_progress",
      },
    }));
  },

  failNextSave() {
    update((current) => ({
      ...current,
      trial_submission: { ...current.trial_submission, saveFailNext: true },
    }));
  },

  saveDraft() {
    const shouldFail = state.trial_submission.saveFailNext;
    update((current) => ({
      ...current,
      trial_submission: {
        ...current.trial_submission,
        status: "saving",
        saveError: undefined,
        saveFailNext: false,
      },
    }));
    return new Promise<boolean>((resolve) => {
      later(() => {
        update((current) => ({
          ...current,
          trial_submission: {
            ...current.trial_submission,
            status: shouldFail ? "save_failed" : "draft_saved",
            saveError: shouldFail ? "草稿保存失败，请检查网络后重试。" : undefined,
          },
        }));
        resolve(!shouldFail);
      }, 650);
    });
  },

  submitTask() {
    if (state.trial_task.status !== "in_progress") return;
    if (state.trial_submission.submitCount > 0 && !state.application.resubmissionAllowed) return;
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        stage: "AI 正在评价岗位任务",
        resubmissionAllowed: false,
      },
      trial_task: { ...current.trial_task, status: "submitted" },
      trial_submission: {
        ...current.trial_submission,
        status: "submitted",
        submittedAt: nowIso(),
        submitCount: current.trial_submission.submitCount + 1,
      },
    }));
    trialDemoService.runEvaluation();
  },

  failNextEvaluation() {
    update((current) => ({
      ...current,
      ai_run: { ...current.ai_run, failNext: true },
    }));
  },

  runEvaluation() {
    clearTimers();
    const shouldFail = state.ai_run.failNext;
    update((current) => ({
      ...current,
      trial_evaluation: null,
      ai_run: {
        status: "running",
        activeStep: 0,
        failNext: false,
      },
    }));

    AI_RUN_STEPS.forEach((_, index) => {
      later(() => {
        update((current) => ({
          ...current,
          ai_run: { ...current.ai_run, activeStep: index },
        }));
      }, index * 500);
    });

    later(() => {
      update((current) =>
        shouldFail
          ? {
              ...current,
              application: { ...current.application, stage: "AI 评价失败，等待重试" },
              ai_run: {
                status: "failed",
                activeStep: 2,
                failNext: false,
                error: "AI 评价暂时失败，请重试。",
              },
            }
          : {
              ...current,
              application: { ...current.application, stage: "岗位任务评价已生成" },
              trial_task: { ...current.trial_task, status: "evaluated" },
              trial_evaluation: PRESET_EVALUATION,
              ai_run: {
                status: "completed",
                activeStep: AI_RUN_STEPS.length,
                failNext: false,
              },
            },
      );
    }, 2600);
  },

  usePresetEvaluation() {
    clearTimers();
    update((current) => ({
      ...current,
      application: { ...current.application, stage: "已载入预置 AI 评价" },
      trial_task: { ...current.trial_task, status: "evaluated" },
      trial_evaluation: PRESET_EVALUATION,
      ai_run: {
        status: "fallback",
        activeStep: AI_RUN_STEPS.length,
        failNext: false,
      },
    }));
  },

  openResubmission() {
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        stage: "HR 已开放一次重新提交",
        resubmissionAllowed: true,
      },
      trial_task: { ...current.trial_task, status: "in_progress" },
      trial_submission: { ...current.trial_submission, status: "in_progress" },
      trial_evaluation: null,
      ai_run: { status: "idle", activeStep: -1, failNext: false },
    }));
  },

  expireTask() {
    clearTimers();
    update((current) => ({
      ...current,
      application: { ...current.application, stage: "岗位能力试炼已过期" },
      trial_task: { ...current.trial_task, status: "expired" },
    }));
  },

  preparePublishedTask() {
    clearTimers();
    update((current) => ({
      ...current,
      application: { ...current.application, stage: "岗位能力试炼已发布" },
      trial_task: {
        ...PRESET_TASK,
        status: "published",
        source: "ai",
        generatedAt: nowIso(),
        publishedAt: nowIso(),
      },
    }));
  },

  prepareSubmittedTask() {
    clearTimers();
    update((current) => ({
      ...current,
      application: { ...current.application, stage: "岗位任务评价已生成" },
      trial_task: {
        ...PRESET_TASK,
        status: "evaluated",
        source: "ai",
        generatedAt: nowIso(),
        publishedAt: nowIso(),
      },
      trial_submission: {
        ...current.trial_submission,
        ...PRESET_SUBMISSION,
        status: "submitted",
        submitCount: 1,
      },
      trial_evaluation: PRESET_EVALUATION,
      ai_run: {
        status: "completed",
        activeStep: AI_RUN_STEPS.length,
        failNext: false,
      },
    }));
  },

  includeInReport() {
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        stage: "任务证据已纳入证据链报告",
        reportIncluded: true,
      },
    }));
  },
};

export function isHttpUrl(value: string) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDemoDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
