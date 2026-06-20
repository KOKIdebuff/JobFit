import { hirelinkApi } from "@/lib/hirelink-api/service";

export const DEMO_IDS = {
  job: "job_ai_pm_campus_001",
  candidate: "candidate_li_001",
  application: "application_ai_pm_li_001",
  resume: "resume_li_ai_pm_v2",
  candidateProfile: "candidate_profile_li_001",
  matchResult: "match_result_li_ai_pm_001",
} as const;

export const CANDIDATE_APPLICATION_IDS = [
  DEMO_IDS.application,
  "application_ai_pm_wang_002",
  "application_ai_pm_chen_003",
  "application_ai_pm_zhao_004",
] as const;

export type CandidateApplicationId = (typeof CANDIDATE_APPLICATION_IDS)[number];

const STORAGE_KEY_PREFIX = "hirelink:candidate-detail-demo:v1";
const STORAGE_VERSION = 1;
const AI_RUN_DURATION = 1500;

export type CandidatePageState =
  | "ready"
  | "loading"
  | "not-found"
  | "profile-empty"
  | "match-input-missing"
  | "match-generating"
  | "match-failed"
  | "match-empty"
  | "match-stale"
  | "assessment-empty"
  | "assessment-generating"
  | "assessment-failed"
  | "assessment-fallback"
  | "assessment-ready"
  | "candidate-completed"
  | "report-review"
  | "decision-completed";

export type AssessmentPlanStatus =
  | "ungenerated"
  | "generating"
  | "failed"
  | "fallback"
  | "draft"
  | "sent";

type DataSource = "demo";
type AiRunStatus = "idle" | "running" | "failed" | "completed" | "fallback";

interface RecordMeta {
  status: string;
  data_source: DataSource;
  created_at: string;
  updated_at: string;
}

export interface EvidenceItem extends RecordMeta {
  id: string;
  job_id: string;
  candidate_id: string;
  application_id: string;
  resume_id: string;
  type: string;
  title: string;
  excerpt: string;
  abilities: string[];
}

export interface MatchDimension {
  id: string;
  label: string;
  score: number;
  max: number;
  reason: string;
  hits: string[];
  misses: string[];
  resumeEvidence: string[];
  jobRequirements: string[];
  evidence_ids: string[];
}

export interface CandidateDetailDemoState {
  page_status: "loading" | "ready" | "empty" | "error";
  candidate: RecordMeta & {
    id: string;
    candidate_id: string;
    name: string;
    school: string;
    major: string;
    education: string;
    graduationYear: number;
    gpa: string;
    email_masked: string;
    phone_masked: string;
  };
  resume: RecordMeta & {
    id: string;
    resume_id: string;
    candidate_id: string;
    version: string;
    rawText: string;
  };
  candidate_profile: RecordMeta & {
    id: string;
    candidate_profile_id: string;
    candidate_id: string;
    resume_id: string;
    targetRole: string;
    summary: string;
    skills: string[];
    categories: Array<{
      id: string;
      label: string;
      conclusion: string;
      evidence_ids: string[];
      tone: "neutral" | "positive" | "warning";
    }>;
    strengths: string[];
    projectHighlights: string[];
    verificationNeeds: string[];
    evidence: Array<{ conclusion: string; excerpt: string }>;
  };
  application: RecordMeta & {
    id: string;
    application_id: string;
    job_id: string;
    candidate_id: string;
    resume_id: string;
    appliedAt: string;
    favorite: boolean;
    priority: boolean;
    stage: string;
  };
  job: RecordMeta & {
    id: string;
    job_id: string;
    title: string;
    company: string;
    owner: string;
  };
  job_profile: {
    mustHave: string[];
    niceToHave: string[];
  };
  match_result: RecordMeta & {
    id: string;
    match_result_id: string;
    job_id: string;
    candidate_id: string;
    application_id: string;
    candidate_profile_id: string;
    total: number;
    ruleVersion: string;
    deterministicNotice: string;
    aiNotice: string;
    sources: string[];
    reasons: string[];
    gaps: string[];
    risks: string[];
    dimensions: MatchDimension[];
    evidence: EvidenceItem[];
    generatedAt: string;
  };
  evidence_items: EvidenceItem[];
  validation_recommendations: Array<
    RecordMeta & {
      id: string;
      job_id: string;
      candidate_id: string;
      application_id: string;
      title: string;
      method: string;
      source: string;
    }
  >;
  hr_note: RecordMeta & {
    id: string;
    application_id: string;
    content: string;
    updatedAt?: string;
  };
  ai_run: RecordMeta & {
    id: string;
    application_id: string;
    status: AiRunStatus;
    activeStep: number;
    error?: string;
    runId?: string;
    started_at?: string;
    fail_requested?: boolean;
  };
  assessment_plan: {
    status: AssessmentPlanStatus;
    source: "ai" | "fallback";
    focus: string[];
    estimatedMinutes: string;
    interviewQuestions: Array<{
      id: string;
      question: string;
      purpose: string;
      evidence: string;
    }>;
    task: {
      title: string;
      background: string;
      deliverables: string[];
      estimatedMinutes: number;
    };
    generatedAt?: string;
  };
}

export const ASSESSMENT_GENERATION_STEPS = [
  "读取岗位画像",
  "分析匹配缺口",
  "生成个性化问题",
  "生成岗位任务",
  "等待 HR 确认",
] as const;

const createdAt = "2026-06-10T09:00:00+08:00";
const updatedAt = "2026-06-16T10:30:00+08:00";

function meta(status = "active"): RecordMeta {
  return { status, data_source: "demo", created_at: createdAt, updated_at: updatedAt };
}

const assessmentTask = {
  title: "AI 内容助手需求评审任务",
  background: "候选人需要基于给定业务目标，拆解一个面向校招用户的 AI 内容助手 MVP。",
  deliverables: ["核心用户路径", "关键指标", "风险与人工兜底方案"],
  estimatedMinutes: 45,
};

interface CandidateOverride {
  candidateId: string;
  resumeId: string;
  profileId: string;
  matchResultId: string;
  name: string;
  school: string;
  major: string;
  education: string;
  graduationYear: number;
  gpa: string;
  email: string;
  phone: string;
  score: number;
  dimensionScores: number[];
  skills: string[];
  summary: string;
  strengths: string[];
  projectHighlights: string[];
  verificationNeeds: string[];
  appliedAt: string;
}

const candidateOverrides: Record<CandidateApplicationId, CandidateOverride> = {
  application_ai_pm_li_001: {
    candidateId: DEMO_IDS.candidate,
    resumeId: DEMO_IDS.resume,
    profileId: DEMO_IDS.candidateProfile,
    matchResultId: DEMO_IDS.matchResult,
    name: "李同学",
    school: "浙江大学",
    major: "信息管理与信息系统",
    education: "本科",
    graduationYear: 2026,
    gpa: "3.8/4.0",
    email: "l***@example.com",
    phone: "138****0626",
    score: 86,
    dimensionScores: [88, 84, 86, 82],
    skills: ["AI 产品设计", "SQL", "用户研究", "指标分析", "原型设计"],
    summary: "具备 AI 产品原型、增长分析和用户研究经验，适合进入结构化面试与岗位任务验证。",
    strengths: ["AI 产品理解", "数据分析", "快速原型"],
    projectHighlights: ["大模型内容助手", "校园增长实验平台"],
    verificationNeeds: ["需求优先级判断", "跨团队协作", "商业目标拆解"],
    appliedAt: "2026-06-12T10:20:00+08:00",
  },
  application_ai_pm_wang_002: {
    candidateId: "candidate_wang_002",
    resumeId: "resume_wang_ai_pm_v1",
    profileId: "candidate_profile_wang_002",
    matchResultId: "match_result_wang_ai_pm_002",
    name: "王同学",
    school: "上海交通大学",
    major: "计算机科学与技术",
    education: "硕士",
    graduationYear: 2025,
    gpa: "3.7/4.0",
    email: "w***@example.com",
    phone: "136****1102",
    score: 82,
    dimensionScores: [86, 78, 80, 84],
    skills: ["机器学习", "Python", "数据分析", "产品实验", "A/B 测试"],
    summary: "技术理解扎实，能够和算法团队沟通，但产品取舍与用户洞察需要继续验证。",
    strengths: ["技术理解", "实验设计", "数据分析"],
    projectHighlights: ["智能推荐实验", "模型效果评估平台"],
    verificationNeeds: ["产品取舍", "用户洞察", "业务落地表达"],
    appliedAt: "2026-06-11T14:05:00+08:00",
  },
  application_ai_pm_chen_003: {
    candidateId: "candidate_chen_003",
    resumeId: "resume_chen_ai_pm_v1",
    profileId: "candidate_profile_chen_003",
    matchResultId: "match_result_chen_ai_pm_003",
    name: "陈同学",
    school: "复旦大学",
    major: "数据科学",
    education: "本科",
    graduationYear: 2026,
    gpa: "3.9/4.0",
    email: "c***@example.com",
    phone: "139****2481",
    score: 89,
    dimensionScores: [90, 88, 86, 88],
    skills: ["用户增长", "SQL", "实验分析", "AI 应用调研", "竞品分析"],
    summary: "增长分析和 AI 应用调研能力突出，适合继续验证复杂场景下的需求拆解能力。",
    strengths: ["增长分析", "AI 应用调研", "结构化表达"],
    projectHighlights: ["智能学习助手", "增长漏斗分析"],
    verificationNeeds: ["复杂需求拆解", "技术边界意识", "冲突场景沟通"],
    appliedAt: "2026-06-10T09:45:00+08:00",
  },
  application_ai_pm_zhao_004: {
    candidateId: "candidate_zhao_004",
    resumeId: "resume_zhao_ai_pm_v1",
    profileId: "candidate_profile_zhao_004",
    matchResultId: "match_result_zhao_ai_pm_004",
    name: "赵同学",
    school: "南方科技大学",
    major: "工商管理",
    education: "本科",
    graduationYear: 2023,
    gpa: "3.5/4.0",
    email: "z***@example.com",
    phone: "135****0823",
    score: 78,
    dimensionScores: [74, 84, 72, 82],
    skills: ["B 端产品", "SQL", "需求分析", "项目协作", "用户研究"],
    summary: "B 端产品和需求协作基础扎实，AI 功能方案设计经验仍需重点验证。",
    strengths: ["B 端需求分析", "用户研究", "协作推进"],
    projectHighlights: ["企业客户管理平台", "运营数据看板"],
    verificationNeeds: ["AI 技术理解", "AI 功能方案设计", "模型风险意识"],
    appliedAt: "2026-06-09T16:10:00+08:00",
  },
};

export function isCandidateApplicationId(value: string): value is CandidateApplicationId {
  return CANDIDATE_APPLICATION_IDS.includes(value as CandidateApplicationId);
}

function createEvidence(
  candidate: CandidateOverride,
  applicationId: CandidateApplicationId,
): EvidenceItem[] {
  return [0, 1, 2, 3].map((index) => ({
    ...meta(),
    id: `evidence_${applicationId}_${index + 1}`,
    job_id: DEMO_IDS.job,
    candidate_id: candidate.candidateId,
    application_id: applicationId,
    resume_id: candidate.resumeId,
    type: index % 2 === 0 ? "project" : "skill",
    title: candidate.projectHighlights[index % candidate.projectHighlights.length],
    excerpt: `${candidate.name}在${candidate.projectHighlights[index % candidate.projectHighlights.length]}中体现了${candidate.strengths[index % candidate.strengths.length]}能力，与岗位要求存在直接关联。`,
    abilities: [
      candidate.strengths[index % candidate.strengths.length],
      candidate.skills[index % candidate.skills.length],
    ],
  }));
}

function createDimensions(
  candidate: CandidateOverride,
  evidence: EvidenceItem[],
): MatchDimension[] {
  const labels = ["AI 产品理解", "数据与指标", "用户与场景", "协作推进"];
  return labels.map((label, index) => ({
    id: `dimension_${index + 1}`,
    label,
    score: candidate.dimensionScores[index] ?? candidate.score,
    max: 100,
    reason: `${label}得分为 ${candidate.dimensionScores[index] ?? candidate.score}，主要依据候选人的${candidate.strengths[index % candidate.strengths.length]}证据。`,
    hits: [
      candidate.skills[index % candidate.skills.length],
      candidate.strengths[index % candidate.strengths.length],
    ],
    misses: [candidate.verificationNeeds[index % candidate.verificationNeeds.length]],
    resumeEvidence: [evidence[index % evidence.length].excerpt],
    jobRequirements: ["能拆解 AI 产品需求", "能用数据解释产品判断"],
    evidence_ids: [evidence[index % evidence.length].id],
  }));
}

export function createCandidateDetail(
  applicationId: CandidateApplicationId,
): CandidateDetailDemoState {
  const candidate = candidateOverrides[applicationId];
  const evidence = createEvidence(candidate, applicationId);
  const dimensions = createDimensions(candidate, evidence);
  return {
    page_status: "ready",
    candidate: {
      ...meta("active"),
      id: candidate.candidateId,
      candidate_id: candidate.candidateId,
      name: candidate.name,
      school: candidate.school,
      major: candidate.major,
      education: candidate.education,
      graduationYear: candidate.graduationYear,
      gpa: candidate.gpa,
      email_masked: candidate.email,
      phone_masked: candidate.phone,
    },
    resume: {
      ...meta("parsed"),
      id: candidate.resumeId,
      resume_id: candidate.resumeId,
      candidate_id: candidate.candidateId,
      version: `${candidate.name} - AI 产品经理求职简历`,
      rawText: `${candidate.school}，${candidate.major}${candidate.education}，GPA ${candidate.gpa}。\n\n核心技能：${candidate.skills.join("、")}。\n\n项目经历：${candidate.projectHighlights.join("；")}。\n\n职业摘要：${candidate.summary}`,
    },
    candidate_profile: {
      ...meta("ready"),
      id: candidate.profileId,
      candidate_profile_id: candidate.profileId,
      candidate_id: candidate.candidateId,
      resume_id: candidate.resumeId,
      targetRole: "AI 产品经理",
      summary: candidate.summary,
      skills: candidate.skills,
      categories: [
        {
          id: "profile_core_skills",
          label: "核心技能",
          conclusion: `${candidate.skills.slice(0, 4).join("、")}与岗位核心要求匹配。`,
          evidence_ids: [evidence[0].id],
          tone: "positive",
        },
        {
          id: "profile_project_highlight",
          label: "项目亮点",
          conclusion: `${candidate.projectHighlights.join("、")}体现了候选人的主要项目经验。`,
          evidence_ids: [evidence[1].id],
          tone: "positive",
        },
        {
          id: "profile_role_intent",
          label: "岗位意向",
          conclusion: `目标方向与 AI 产品经理岗位一致，当前匹配分为 ${candidate.score}。`,
          evidence_ids: [evidence[2].id],
          tone: "neutral",
        },
        {
          id: "profile_to_verify",
          label: "待验证项",
          conclusion: `${candidate.verificationNeeds.join("、")}仍需通过面试与岗位任务确认。`,
          evidence_ids: [evidence[3].id],
          tone: "warning",
        },
      ],
      strengths: candidate.strengths,
      projectHighlights: candidate.projectHighlights,
      verificationNeeds: candidate.verificationNeeds,
      evidence: evidence.map((item) => ({ conclusion: item.title, excerpt: item.excerpt })),
    },
    application: {
      ...meta("待生成验证方案"),
      id: applicationId,
      application_id: applicationId,
      job_id: DEMO_IDS.job,
      candidate_id: candidate.candidateId,
      resume_id: candidate.resumeId,
      appliedAt: candidate.appliedAt,
      favorite: false,
      priority: applicationId === DEMO_IDS.application,
      stage: "候选人匹配与验证方案",
    },
    job: {
      ...meta("open"),
      id: DEMO_IDS.job,
      job_id: DEMO_IDS.job,
      title: "AI 产品经理（校招）",
      company: "HireLink",
      owner: "Campus Hiring Team",
    },
    job_profile: {
      mustHave: ["AI 产品理解", "结构化需求拆解", "数据分析能力"],
      niceToHave: ["大模型应用经验", "跨团队协作经验"],
    },
    match_result: {
      ...meta("ready"),
      id: candidate.matchResultId,
      match_result_id: candidate.matchResultId,
      job_id: DEMO_IDS.job,
      candidate_id: candidate.candidateId,
      application_id: applicationId,
      candidate_profile_id: candidate.profileId,
      total: candidate.score,
      ruleVersion: "campus-ai-pm-v1",
      deterministicNotice: "规则评分已完成",
      aiNotice: "AI 解释已生成",
      sources: ["简历", "候选人画像", "岗位画像"],
      reasons: [
        `${candidate.skills.slice(0, 3).join("、")}与岗位关键能力匹配。`,
        `${candidate.projectHighlights[0]}提供了直接项目证据。`,
        `${candidate.strengths.join("、")}能够支持岗位核心工作。`,
      ],
      gaps: candidate.verificationNeeds.map((item) => `${item}的直接证据仍需补充。`),
      risks: [
        `候选人在${candidate.verificationNeeds[0]}方面需要通过结构化问题核实。`,
        `建议通过岗位任务验证${candidate.verificationNeeds.at(-1)}。`,
      ],
      dimensions,
      evidence,
      generatedAt: updatedAt,
    },
    evidence_items: evidence,
    validation_recommendations: candidate.verificationNeeds.map((item, index) => ({
      ...meta("active"),
      id: `validation_${applicationId}_${index + 1}`,
      job_id: DEMO_IDS.job,
      candidate_id: candidate.candidateId,
      application_id: applicationId,
      title: `建议重点验证「${item}」`,
      method: index === 0 ? "结构化面试" : "岗位任务",
      source: "匹配缺口",
    })),
    hr_note: {
      ...meta("empty"),
      id: `hr_note_${applicationId}`,
      application_id: applicationId,
      content: "",
    },
    ai_run: {
      ...meta("idle"),
      id: `ai_run_${applicationId}`,
      application_id: applicationId,
      status: "idle",
      activeStep: 0,
    },
    assessment_plan: {
      status: "ungenerated",
      source: "ai",
      focus: candidate.verificationNeeds,
      estimatedMinutes: "60 分钟",
      interviewQuestions: candidate.verificationNeeds.map((item, index) => ({
        id: `question_${index + 1}`,
        question: `请举例说明你如何处理${item}相关问题。`,
        purpose: `验证${item}`,
        evidence: evidence[index % evidence.length].title,
      })),
      task: assessmentTask,
    },
  };
}

interface PersistedState {
  version: number;
  state: CandidateDetailDemoState;
}

let activeApplicationId: CandidateApplicationId = DEMO_IDS.application;
let state: CandidateDetailDemoState = {
  ...createCandidateDetail(activeApplicationId),
  page_status: "loading",
};
const serverSnapshot: CandidateDetailDemoState = {
  ...createCandidateDetail(DEMO_IDS.application),
  page_status: "loading",
};
const listeners = new Set<() => void>();
const timers = new Set<ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((listener) => listener());
}

function nowIso() {
  return new Date().toISOString();
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function persist() {
  if (!canUseStorage()) return;
  const persisted: PersistedState = {
    version: STORAGE_VERSION,
    state: { ...state, page_status: "ready" },
  };
  window.localStorage.setItem(
    `${STORAGE_KEY_PREFIX}:${state.application.id}`,
    JSON.stringify(persisted),
  );
}

function readPersistedState(applicationId: CandidateApplicationId) {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY_PREFIX}:${applicationId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    return parsed.version === STORAGE_VERSION ? parsed.state : null;
  } catch {
    return null;
  }
}

function update(
  updater: (current: CandidateDetailDemoState) => CandidateDetailDemoState,
  options: { persist?: boolean } = {},
) {
  state = updater(state);
  if (options.persist !== false) persist();
  emit();
}

function clearTimers() {
  timers.forEach((timer) => clearTimeout(timer));
  timers.clear();
}

function later(callback: () => void, delay: number) {
  const timer = setTimeout(() => {
    timers.delete(timer);
    callback();
  }, delay);
  timers.add(timer);
}

function completeGeneration(failed: boolean) {
  update((current) => {
    const timestamp = nowIso();
    if (failed) {
      return {
        ...current,
        application: {
          ...current.application,
          status: "待生成验证方案",
          stage: "待生成验证方案",
          updated_at: timestamp,
        },
        assessment_plan: { ...current.assessment_plan, status: "failed" },
        ai_run: {
          ...current.ai_run,
          status: "failed",
          activeStep: 2,
          error: "生成失败，请重试或使用预设方案。",
          updated_at: timestamp,
        },
      };
    }
    return {
      ...current,
      application: {
        ...current.application,
        status: "验证方案待确认",
        stage: "验证方案待 HR 确认",
        updated_at: timestamp,
      },
      assessment_plan: {
        ...current.assessment_plan,
        status: "draft",
        source: "ai",
        generatedAt: timestamp,
      },
      ai_run: {
        ...current.ai_run,
        status: "completed",
        activeStep: ASSESSMENT_GENERATION_STEPS.length,
        error: undefined,
        updated_at: timestamp,
      },
    };
  });
}

function resumeGeneration() {
  if (state.ai_run.status !== "running" || !state.ai_run.started_at) return;
  clearTimers();
  const elapsed = Date.now() - new Date(state.ai_run.started_at).getTime();
  if (elapsed >= AI_RUN_DURATION) {
    completeGeneration(Boolean(state.ai_run.fail_requested));
    return;
  }
  const stepDuration = AI_RUN_DURATION / ASSESSMENT_GENERATION_STEPS.length;
  const activeStep = Math.min(
    ASSESSMENT_GENERATION_STEPS.length - 1,
    Math.floor(elapsed / stepDuration),
  );
  update((current) => ({ ...current, ai_run: { ...current.ai_run, activeStep } }), {
    persist: false,
  });
  for (let index = activeStep + 1; index < ASSESSMENT_GENERATION_STEPS.length; index += 1) {
    const delay = Math.max(0, index * stepDuration - elapsed);
    later(
      () => update((current) => ({ ...current, ai_run: { ...current.ai_run, activeStep: index } })),
      delay,
    );
  }
  later(
    () => completeGeneration(Boolean(state.ai_run.fail_requested)),
    Math.max(0, AI_RUN_DURATION - elapsed),
  );
}

export const candidateDetailDemoStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },
  getServerSnapshot() {
    return serverSnapshot;
  },
};

export const candidateDetailDemoService = {
  async getCandidateDetail(applicationId: string = DEMO_IDS.application) {
    if (!isCandidateApplicationId(applicationId)) return null;
    activeApplicationId = applicationId;
    state = { ...createCandidateDetail(applicationId), page_status: "loading" };
    emit();
    try {
      const detail = await hirelinkApi.applicationDetail(applicationId);
      state = { ...detail, page_status: "ready" };
      emit();
      return state;
    } catch {
      const persisted = readPersistedState(applicationId);
      state = persisted
        ? { ...persisted, page_status: "ready" }
        : { ...createCandidateDetail(applicationId), page_status: "ready" };
      emit();
      resumeGeneration();
      return state;
    }
  },

  loadDemoData(applicationId: CandidateApplicationId = activeApplicationId) {
    clearTimers();
    activeApplicationId = applicationId;
    state = createCandidateDetail(applicationId);
    persist();
    emit();
  },

  reset() {
    this.loadDemoData();
  },

  saveHrNote(content: string) {
    const timestamp = nowIso();
    update((current) => ({
      ...current,
      hr_note: {
        ...current.hr_note,
        content: content.trim(),
        status: content.trim() ? "saved" : "empty",
        updatedAt: timestamp,
        updated_at: timestamp,
      },
    }));
  },

  saveNote(content: string) {
    this.saveHrNote(content);
  },

  togglePriority() {
    const timestamp = nowIso();
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        priority: !current.application.priority,
        updated_at: timestamp,
      },
    }));
  },

  toggleFavorite() {
    const timestamp = nowIso();
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        favorite: !current.application.favorite,
        updated_at: timestamp,
      },
    }));
  },

  pauseApplication() {
    const timestamp = nowIso();
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        status: "暂不推进",
        stage: "HR 暂不推进",
        updated_at: timestamp,
      },
    }));
  },

  generateAssessmentPlan(options: { fail?: boolean; interviewOnly?: boolean } = {}) {
    clearTimers();
    const timestamp = nowIso();
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        status: "AI 正在生成验证方案",
        stage: "AI 正在生成验证方案",
        updated_at: timestamp,
      },
      assessment_plan: {
        ...current.assessment_plan,
        status: "generating",
        source: "ai",
        task: options.interviewOnly
          ? { ...assessmentTask, deliverables: [], estimatedMinutes: 0 }
          : assessmentTask,
      },
      ai_run: {
        ...current.ai_run,
        status: "running",
        activeStep: 0,
        error: undefined,
        runId: `assessment-run-${Date.now()}`,
        started_at: timestamp,
        fail_requested: Boolean(options.fail),
        updated_at: timestamp,
      },
    }));
    void hirelinkApi
      .updateTrialTask(state.application.id, { action: "generate", fail: Boolean(options.fail) })
      .then(() => hirelinkApi.applicationDetail(state.application.id))
      .then((detail) => {
        state = { ...detail, page_status: "ready" };
        emit();
      })
      .catch(() => completeGeneration(Boolean(options.fail)));
  },

  usePresetAssessmentPlan() {
    clearTimers();
    const timestamp = nowIso();
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        status: "验证方案待确认",
        stage: "验证方案待 HR 确认",
        updated_at: timestamp,
      },
      assessment_plan: {
        ...current.assessment_plan,
        status: "fallback",
        source: "fallback",
        generatedAt: timestamp,
        task: assessmentTask,
      },
      ai_run: {
        ...current.ai_run,
        status: "fallback",
        activeStep: ASSESSMENT_GENERATION_STEPS.length,
        error: undefined,
        runId: `assessment-preset-${Date.now()}`,
        updated_at: timestamp,
      },
    }));
  },

  useFallbackPlan() {
    this.usePresetAssessmentPlan();
  },

  confirmAndSend() {
    if (!["draft", "fallback"].includes(state.assessment_plan.status)) return;
    void hirelinkApi
      .updateTrialTask(state.application.id, { action: "publish" })
      .then(() => hirelinkApi.applicationDetail(state.application.id))
      .then((detail) => {
        state = { ...detail, page_status: "ready" };
        emit();
      })
      .catch(() => {
        const timestamp = nowIso();
        update((current) => ({
          ...current,
          application: {
            ...current.application,
            status: "等待候选人完成",
            stage: "等待候选人完成能力验证",
            updated_at: timestamp,
          },
          assessment_plan: { ...current.assessment_plan, status: "sent" },
        }));
      });
  },
};

export function formatCandidateDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
