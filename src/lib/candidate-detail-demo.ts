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
] as const;

const CREATED_AT = "2026-06-12T10:30:00+08:00";
const UPDATED_AT = "2026-06-12T10:36:00+08:00";

function meta(status: string): RecordMeta {
  return {
    status,
    data_source: "demo",
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
  };
}

const evidenceItems: EvidenceItem[] = [
  {
    ...meta("active"),
    id: "evidence_project_ownership",
    job_id: DEMO_IDS.job,
    candidate_id: DEMO_IDS.candidate,
    application_id: DEMO_IDS.application,
    resume_id: DEMO_IDS.resume,
    type: "项目经历",
    title: "AI 简历助手项目",
    excerpt: "主导 AI 简历助手需求定义、原型设计和匹配规则设计，协同开发完成 LLM 应用方案。",
    abilities: ["需求分析", "AI 产品理解", "跨职能协作"],
  },
  {
    ...meta("active"),
    id: "evidence_data_result",
    job_id: DEMO_IDS.job,
    candidate_id: DEMO_IDS.candidate,
    application_id: DEMO_IDS.application,
    resume_id: DEMO_IDS.resume,
    type: "项目结果",
    title: "上线结果与数据分析",
    excerpt: "产品上线两个月累计 1 万名用户，使用 SQL 和核心行为指标分析产品效果。",
    abilities: ["数据分析", "结果意识", "SQL"],
  },
  {
    ...meta("active"),
    id: "evidence_llm_rag",
    job_id: DEMO_IDS.job,
    candidate_id: DEMO_IDS.candidate,
    application_id: DEMO_IDS.application,
    resume_id: DEMO_IDS.resume,
    type: "技能与实践",
    title: "LLM 与 RAG 应用",
    excerpt: "在校园知识库项目中完成 RAG 检索方案调研，并参与提示词与召回结果评估。",
    abilities: ["LLM", "RAG", "方案评估"],
  },
  {
    ...meta("active"),
    id: "evidence_target_role",
    job_id: DEMO_IDS.job,
    candidate_id: DEMO_IDS.candidate,
    application_id: DEMO_IDS.application,
    resume_id: DEMO_IDS.resume,
    type: "求职意向",
    title: "目标岗位",
    excerpt: "求职方向：AI 产品经理；毕业时间：2026 年；可接受北京或杭州。",
    abilities: ["岗位倾向", "到岗匹配"],
  },
];

const interviewQuestions = [
  {
    id: "question_priority",
    question: "如果两周内只能上线一个最小版本，你会如何判断需求优先级并说明取舍依据？",
    purpose: "验证需求优先级判断",
    evidence: "项目结果明确，但简历中未说明首版范围和取舍过程。",
  },
  {
    id: "question_delivery",
    question: "当算法、工程和业务对方案优先级意见不一致时，你会如何推进决策？",
    purpose: "验证复杂项目推进能力",
    evidence: "简历体现协作经历，但缺少冲突处理和跨团队推进证据。",
  },
  {
    id: "question_risk",
    question: "AI 给出的候选人匹配解释可能出现哪些错误？你会设计哪些机制降低风险？",
    purpose: "验证 AI 风险与边界意识",
    evidence: "具备 LLM 应用经验，但风险治理案例较少。",
  },
  {
    id: "question_metrics",
    question: "除累计用户数之外，你会用哪些指标判断 AI 简历功能是否真正有效？",
    purpose: "验证商业化与数据判断",
    evidence: "具备 SQL 能力，但结果指标体系仍需补充。",
  },
  {
    id: "question_rag",
    question: "请说明 RAG 方案中检索质量、回答质量和产品体验之间的权衡。",
    purpose: "验证 AI 功能方案设计能力",
    evidence: "简历包含 RAG 调研经历，但缺少完整方案设计证据。",
  },
];

const assessmentTask = {
  title: "设计 AI 简历分析功能的 MVP 验证方案",
  background: "星河智能计划在两周内验证面向校招场景的 AI 简历分析能力。",
  deliverables: ["500—800 字方案说明", "一张用户流程图", "核心指标与风险清单"],
  estimatedMinutes: 35,
};

export const mockCandidateDetail: CandidateDetailDemoState = {
  page_status: "ready",
  candidate: {
    ...meta("active"),
    id: DEMO_IDS.candidate,
    candidate_id: DEMO_IDS.candidate,
    name: "李同学",
    school: "星河大学",
    major: "计算机科学与技术",
    education: "本科",
    graduationYear: 2026,
    gpa: "3.8/4.0",
    email_masked: "l***@example.com",
    phone_masked: "138****2026",
  },
  resume: {
    ...meta("active"),
    id: DEMO_IDS.resume,
    resume_id: DEMO_IDS.resume,
    candidate_id: DEMO_IDS.candidate,
    version: "AI 产品经理求职版 V2",
    rawText:
      "星河大学，计算机科学与技术本科，GPA 3.8/4.0，2026 年毕业。\n\nAI 简历助手项目：主导需求定义、原型设计和匹配规则设计，协同开发完成 LLM 应用方案。产品上线两个月累计 1 万名用户，使用 SQL 和核心行为指标分析产品效果。\n\n校园知识库项目：完成 RAG 检索方案调研，并参与提示词与召回结果评估。\n\n技能：LLM、RAG、数据分析、需求分析、SQL。",
  },
  candidate_profile: {
    ...meta("generated"),
    id: DEMO_IDS.candidateProfile,
    candidate_profile_id: DEMO_IDS.candidateProfile,
    candidate_id: DEMO_IDS.candidate,
    resume_id: DEMO_IDS.resume,
    targetRole: "AI 产品经理",
    summary: "具备较强 AI 产品实践和数据分析能力，但商业化判断与复杂项目推进能力仍需验证。",
    skills: ["LLM", "RAG", "数据分析", "需求分析", "SQL"],
    categories: [
      {
        id: "profile_core_skills",
        label: "核心技能",
        conclusion: "掌握 LLM、RAG、需求分析、数据分析与 SQL，技能组合与岗位核心要求一致。",
        evidence_ids: ["evidence_data_result", "evidence_llm_rag"],
        tone: "positive",
      },
      {
        id: "profile_project_highlight",
        label: "项目亮点",
        conclusion: "具备从需求定义到上线数据复盘的 AI 产品实践。",
        evidence_ids: ["evidence_project_ownership", "evidence_data_result"],
        tone: "positive",
      },
      {
        id: "profile_role_intent",
        label: "岗位倾向",
        conclusion: "目标岗位明确为 AI 产品经理，毕业时间与校招要求一致。",
        evidence_ids: ["evidence_target_role"],
        tone: "neutral",
      },
      {
        id: "profile_proven_strength",
        label: "已证明优势",
        conclusion: "能够把 AI 技术方案转化为产品流程，并使用数据验证效果。",
        evidence_ids: ["evidence_project_ownership", "evidence_data_result"],
        tone: "positive",
      },
      {
        id: "profile_to_verify",
        label: "待验证能力",
        conclusion: "需求优先级、复杂项目推进和商业化判断尚缺少直接证据。",
        evidence_ids: ["evidence_project_ownership", "evidence_data_result"],
        tone: "warning",
      },
      {
        id: "profile_growth",
        label: "发展方向",
        conclusion: "适合继续加强企业级 AI 产品落地、风险治理与商业闭环能力。",
        evidence_ids: ["evidence_llm_rag", "evidence_data_result"],
        tone: "neutral",
      },
    ],
    strengths: ["AI 产品实践", "数据分析", "技术沟通"],
    projectHighlights: ["AI 简历助手", "校园知识库 RAG 项目"],
    verificationNeeds: ["需求优先级判断", "复杂项目推进能力", "AI 功能方案设计能力"],
    evidence: evidenceItems.map((item) => ({
      conclusion: item.title,
      excerpt: item.excerpt,
    })),
  },
  application: {
    ...meta("待生成验证方案"),
    id: DEMO_IDS.application,
    application_id: DEMO_IDS.application,
    job_id: DEMO_IDS.job,
    candidate_id: DEMO_IDS.candidate,
    resume_id: DEMO_IDS.resume,
    appliedAt: CREATED_AT,
    favorite: false,
    priority: false,
    stage: "待生成验证方案",
  },
  job: {
    ...meta("published"),
    id: DEMO_IDS.job,
    job_id: DEMO_IDS.job,
    title: "AI 产品经理（校招）",
    company: "星河智能",
    owner: "陈经理",
  },
  job_profile: {
    mustHave: ["需求分析", "AI 产品理解", "数据分析", "项目推进"],
    niceToHave: ["RAG", "提示词工程", "校园产品实践"],
  },
  match_result: {
    ...meta("completed"),
    id: DEMO_IDS.matchResult,
    match_result_id: DEMO_IDS.matchResult,
    job_id: DEMO_IDS.job,
    candidate_id: DEMO_IDS.candidate,
    application_id: DEMO_IDS.application,
    candidate_profile_id: DEMO_IDS.candidateProfile,
    total: 86,
    ruleVersion: "match_rule_v1",
    deterministicNotice: "分数由规则计算",
    aiNotice: "AI 仅负责解释",
    sources: ["岗位画像", "候选人职业画像", "申请信息"],
    reasons: [
      "AI 产品项目与岗位核心职责高度相关",
      "技能组合覆盖岗位主要要求",
      "具备数据驱动的产品实践",
    ],
    gaps: ["商业化判断证据不足", "复杂项目推进案例不足", "企业级风险治理经验不足"],
    risks: ["校园项目的真实负责边界需要进一步确认", "RAG 实践深度仍需通过任务验证"],
    dimensions: [
      {
        id: "skills",
        label: "技能匹配",
        score: 88,
        max: 100,
        reason: "核心技能覆盖度较高，LLM、数据分析和需求分析均有直接证据。",
        hits: ["LLM", "需求分析", "数据分析", "SQL"],
        misses: ["企业级 RAG 深度实践"],
        resumeEvidence: ["技能字段与两个 AI 项目经历形成交叉证据"],
        jobRequirements: ["AI 产品理解", "需求分析", "数据分析"],
        evidence_ids: ["evidence_data_result", "evidence_llm_rag"],
      },
      {
        id: "experience",
        label: "经历匹配",
        score: 84,
        max: 100,
        reason: "具备完整校园项目实践，但复杂组织中的推进经验尚未被证明。",
        hits: ["0 到 1 产品经历", "跨技术协作", "上线复盘"],
        misses: ["企业级复杂项目推进"],
        resumeEvidence: ["主导需求定义并协同开发完成 LLM 应用方案"],
        jobRequirements: ["跨团队协作", "项目推进", "结果复盘"],
        evidence_ids: ["evidence_project_ownership", "evidence_data_result"],
      },
      {
        id: "projects",
        label: "项目匹配",
        score: 91,
        max: 100,
        reason: "AI 简历助手与招聘岗位场景高度相关，是当前最强匹配证据。",
        hits: ["招聘 AI 场景", "匹配规则设计", "上线结果数据"],
        misses: ["商业化指标与风险治理闭环"],
        resumeEvidence: ["AI 简历助手上线两个月累计 1 万名用户"],
        jobRequirements: ["AI 功能方案设计", "产品落地", "数据验证"],
        evidence_ids: ["evidence_project_ownership", "evidence_data_result"],
      },
      {
        id: "intent",
        label: "求职意向",
        score: 78,
        max: 100,
        reason: "岗位方向和毕业时间匹配，但到岗时间与长期城市意向仍需确认。",
        hits: ["目标岗位一致", "毕业年份符合"],
        misses: ["到岗时间", "长期城市意向"],
        resumeEvidence: ["目标岗位为 AI 产品经理，2026 年毕业"],
        jobRequirements: ["校招候选人", "AI 产品方向"],
        evidence_ids: ["evidence_target_role"],
      },
    ],
    evidence: evidenceItems,
    generatedAt: UPDATED_AT,
  },
  evidence_items: evidenceItems,
  validation_recommendations: [
    {
      ...meta("pending"),
      id: "recommendation_priority",
      job_id: DEMO_IDS.job,
      candidate_id: DEMO_IDS.candidate,
      application_id: DEMO_IDS.application,
      title: "建议重点验证“需求优先级判断”",
      method: "结构化面试问题",
      source: "岗位必备能力 + 候选人项目证据不足",
    },
    {
      ...meta("pending"),
      id: "recommendation_delivery",
      job_id: DEMO_IDS.job,
      candidate_id: DEMO_IDS.candidate,
      application_id: DEMO_IDS.application,
      title: "建议验证“复杂项目推进能力”",
      method: "行为面试追问",
      source: "岗位核心职责 + 缺少复杂协作案例",
    },
    {
      ...meta("pending"),
      id: "recommendation_ai_design",
      job_id: DEMO_IDS.job,
      candidate_id: DEMO_IDS.candidate,
      application_id: DEMO_IDS.application,
      title: "建议通过岗位任务验证“AI 功能方案设计能力”",
      method: "轻量岗位任务",
      source: "岗位加分能力 + RAG 项目证据深度不足",
    },
  ],
  hr_note: {
    ...meta("empty"),
    id: "hr_note_application_ai_pm_li_001",
    application_id: DEMO_IDS.application,
    content: "",
  },
  ai_run: {
    ...meta("idle"),
    id: "ai_run_application_ai_pm_li_001",
    application_id: DEMO_IDS.application,
    status: "idle",
    activeStep: -1,
  },
  assessment_plan: {
    status: "ungenerated",
    source: "ai",
    focus: ["需求优先级", "复杂项目推进", "AI 功能方案设计"],
    estimatedMinutes: "45—60 分钟",
    interviewQuestions,
    task: assessmentTask,
  },
};

const candidateOverrides: Record<
  CandidateApplicationId,
  {
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
    dimensionScores: [number, number, number, number];
    skills: string[];
    summary: string;
    strengths: string[];
    projectHighlights: string[];
    verificationNeeds: string[];
    appliedAt: string;
  }
> = {
  [DEMO_IDS.application]: {
    candidateId: DEMO_IDS.candidate,
    resumeId: DEMO_IDS.resume,
    profileId: DEMO_IDS.candidateProfile,
    matchResultId: DEMO_IDS.matchResult,
    name: "李同学",
    school: "星河大学",
    major: "计算机科学与技术",
    education: "本科",
    graduationYear: 2026,
    gpa: "3.8/4.0",
    email: "l***@example.com",
    phone: "138****2026",
    score: 86,
    dimensionScores: [88, 84, 91, 78],
    skills: ["LLM", "RAG", "数据分析", "需求分析", "SQL"],
    summary: "具备较强 AI 产品实践和数据分析能力，但商业化判断与复杂项目推进能力仍需验证。",
    strengths: ["AI 产品实践", "数据分析", "技术沟通"],
    projectHighlights: ["AI 简历助手", "校园知识库 RAG 项目"],
    verificationNeeds: ["需求优先级判断", "复杂项目推进能力", "AI 功能方案设计能力"],
    appliedAt: CREATED_AT,
  },
  application_ai_pm_wang_002: {
    candidateId: "candidate_wang_002",
    resumeId: "resume_wang_ai_pm_v3",
    profileId: "candidate_profile_wang_002",
    matchResultId: "match_result_wang_ai_pm_002",
    name: "王思远",
    school: "北辰大学",
    major: "信息管理与信息系统",
    education: "硕士",
    graduationYear: 2021,
    gpa: "3.7/4.0",
    email: "w***@example.com",
    phone: "139****0621",
    score: 89,
    dimensionScores: [90, 92, 88, 84],
    skills: ["数据产品", "Agent", "指标体系", "跨团队协作", "SQL"],
    summary:
      "具备成熟的数据产品与跨团队推进经验，岗位适配度较高，需进一步确认 AI 原生产品方法和校招岗位意向。",
    strengths: ["数据指标体系", "复杂项目推进", "跨团队协作"],
    projectHighlights: ["企业经营分析平台", "智能运营 Agent"],
    verificationNeeds: ["AI 产品方案深度", "岗位动机", "组织适应性"],
    appliedAt: "2026-06-11T14:20:00+08:00",
  },
  application_ai_pm_chen_003: {
    candidateId: "candidate_chen_003",
    resumeId: "resume_chen_ai_pm_v2",
    profileId: "candidate_profile_chen_003",
    matchResultId: "match_result_chen_ai_pm_003",
    name: "陈雨桐",
    school: "东海理工大学",
    major: "人工智能",
    education: "硕士",
    graduationYear: 2023,
    gpa: "3.6/4.0",
    email: "c***@example.com",
    phone: "136****0323",
    score: 85,
    dimensionScores: [92, 80, 87, 81],
    skills: ["大模型", "Python", "增长分析", "Prompt Engineering", "A/B 测试"],
    summary:
      "技术理解和独立分析能力突出，能够快速完成 AI 方案验证，但需求取舍与多人协作经验需要进一步验证。",
    strengths: ["技术理解", "快速原型", "增长分析"],
    projectHighlights: ["大模型内容助手", "智能增长实验平台"],
    verificationNeeds: ["需求优先级判断", "跨团队协作", "商业目标拆解"],
    appliedAt: "2026-06-10T09:45:00+08:00",
  },
  application_ai_pm_zhao_004: {
    candidateId: "candidate_zhao_004",
    resumeId: "resume_zhao_ai_pm_v1",
    profileId: "candidate_profile_zhao_004",
    matchResultId: "match_result_zhao_ai_pm_004",
    name: "赵晗",
    school: "南方科技学院",
    major: "工商管理",
    education: "本科",
    graduationYear: 2023,
    gpa: "3.5/4.0",
    email: "z***@example.com",
    phone: "135****0823",
    score: 78,
    dimensionScores: [74, 84, 72, 82],
    skills: ["B 端产品", "SQL", "需求分析", "项目协作", "用户研究"],
    summary:
      "B 端产品与需求协作基础扎实，岗位意向明确，但 AI 技术理解和 AI 功能落地经验仍需重点验证。",
    strengths: ["B 端需求分析", "用户研究", "协作推进"],
    projectHighlights: ["企业客户管理平台", "运营数据看板"],
    verificationNeeds: ["AI 技术理解", "AI 功能方案设计", "模型风险意识"],
    appliedAt: "2026-06-09T16:10:00+08:00",
  },
};

export function isCandidateApplicationId(value: string): value is CandidateApplicationId {
  return CANDIDATE_APPLICATION_IDS.includes(value as CandidateApplicationId);
}

export function createCandidateDetail(applicationId: CandidateApplicationId) {
  const detail = structuredClone(mockCandidateDetail);
  const candidate = candidateOverrides[applicationId];
  const suffix = applicationId.replace("application_ai_pm_", "");

  detail.candidate = {
    ...detail.candidate,
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
  };
  detail.resume = {
    ...detail.resume,
    id: candidate.resumeId,
    resume_id: candidate.resumeId,
    candidate_id: candidate.candidateId,
    version: `${candidate.name} · AI 产品经理求职简历`,
    rawText: `${candidate.school}，${candidate.major}${candidate.education}，GPA ${candidate.gpa}，${candidate.graduationYear} 年毕业。\n\n核心技能：${candidate.skills.join("、")}。\n\n项目经历：${candidate.projectHighlights.join("；")}。\n\n职业摘要：${candidate.summary}`,
  };
  detail.candidate_profile = {
    ...detail.candidate_profile,
    id: candidate.profileId,
    candidate_profile_id: candidate.profileId,
    candidate_id: candidate.candidateId,
    resume_id: candidate.resumeId,
    summary: candidate.summary,
    skills: candidate.skills,
    strengths: candidate.strengths,
    projectHighlights: candidate.projectHighlights,
    verificationNeeds: candidate.verificationNeeds,
  };
  detail.candidate_profile.categories = detail.candidate_profile.categories.map((category) => {
    const conclusions: Record<string, string> = {
      profile_core_skills: `${candidate.skills.slice(0, 4).join("、")}与岗位核心要求形成直接匹配。`,
      profile_project_highlight: `${candidate.projectHighlights.join("、")}体现了候选人的主要项目经验。`,
      profile_role_intent: `目标方向与 AI 产品经理岗位一致，当前匹配分为 ${candidate.score} 分。`,
      profile_proven_strength: `${candidate.strengths.join("、")}已有项目或经历证据支持。`,
      profile_to_verify: `${candidate.verificationNeeds.join("、")}仍需通过面试与岗位任务进一步确认。`,
      profile_growth: `建议围绕${candidate.verificationNeeds[0]}和${candidate.verificationNeeds[1]}继续建立完整能力证据。`,
    };
    return {
      ...category,
      conclusion: conclusions[category.id] ?? category.conclusion,
    };
  });
  detail.application = {
    ...detail.application,
    id: applicationId,
    application_id: applicationId,
    candidate_id: candidate.candidateId,
    resume_id: candidate.resumeId,
    appliedAt: candidate.appliedAt,
  };
  detail.match_result = {
    ...detail.match_result,
    id: candidate.matchResultId,
    match_result_id: candidate.matchResultId,
    candidate_id: candidate.candidateId,
    application_id: applicationId,
    candidate_profile_id: candidate.profileId,
    total: candidate.score,
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
    dimensions: detail.match_result.dimensions.map((dimension, index) => ({
      ...dimension,
      score: candidate.dimensionScores[index] ?? dimension.score,
      reason: `${dimension.label}得分为 ${candidate.dimensionScores[index] ?? dimension.score}，主要依据候选人的${candidate.strengths[index % candidate.strengths.length]}证据。`,
    })),
  };
  const evidenceIdMap = new Map(
    detail.evidence_items.map((item) => [item.id, `${item.id}_${suffix}`]),
  );
  detail.evidence_items = detail.evidence_items.map((item, index) => ({
    ...item,
    id: evidenceIdMap.get(item.id) ?? item.id,
    candidate_id: candidate.candidateId,
    application_id: applicationId,
    resume_id: candidate.resumeId,
    title: candidate.projectHighlights[index % candidate.projectHighlights.length] ?? item.title,
    excerpt: `${candidate.name}在${candidate.projectHighlights[index % candidate.projectHighlights.length]}中体现了${candidate.strengths[index % candidate.strengths.length]}能力，相关经历与目标岗位要求存在直接关联。`,
  }));
  detail.candidate_profile.categories = detail.candidate_profile.categories.map((category) => ({
    ...category,
    evidence_ids: category.evidence_ids.map((id) => evidenceIdMap.get(id) ?? id),
  }));
  detail.match_result.dimensions = detail.match_result.dimensions.map((dimension) => ({
    ...dimension,
    evidence_ids: dimension.evidence_ids.map((id) => evidenceIdMap.get(id) ?? id),
  }));
  detail.match_result.evidence = detail.evidence_items;
  detail.candidate_profile.evidence = detail.evidence_items.map((item) => ({
    conclusion: item.title,
    excerpt: item.excerpt,
  }));
  detail.validation_recommendations = detail.validation_recommendations.map(
    (recommendation, index) => ({
      ...recommendation,
      id: `${recommendation.id}_${suffix}`,
      candidate_id: candidate.candidateId,
      application_id: applicationId,
      title: `建议重点验证“${candidate.verificationNeeds[index] ?? candidate.verificationNeeds[0]}”`,
    }),
  );
  detail.hr_note = {
    ...detail.hr_note,
    id: `hr_note_${applicationId}`,
    application_id: applicationId,
    content: "",
  };
  detail.ai_run = {
    ...detail.ai_run,
    id: `ai_run_${applicationId}`,
    application_id: applicationId,
  };
  detail.assessment_plan.focus = candidate.verificationNeeds;

  return detail;
}

interface PersistedState {
  version: number;
  state: CandidateDetailDemoState;
}

let activeApplicationId: CandidateApplicationId = DEMO_IDS.application;
let state = createCandidateDetail(activeApplicationId);
state.page_status = "loading";
const serverSnapshot = createCandidateDetail(DEMO_IDS.application);
serverSnapshot.page_status = "loading";
let hydrated = false;
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
          error: "生成失败",
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
  update(
    (current) => ({
      ...current,
      ai_run: { ...current.ai_run, activeStep },
    }),
    { persist: false },
  );

  for (let index = activeStep + 1; index < ASSESSMENT_GENERATION_STEPS.length; index += 1) {
    const delay = Math.max(0, index * stepDuration - elapsed);
    later(() => {
      update((current) => ({
        ...current,
        ai_run: { ...current.ai_run, activeStep: index },
      }));
    }, delay);
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
    if (hydrated && activeApplicationId === applicationId) return state;
    activeApplicationId = applicationId;
    hydrated = true;
    state = { ...createCandidateDetail(applicationId), page_status: "loading" };
    emit();
    await new Promise((resolve) => setTimeout(resolve, 280));
    const persisted = readPersistedState(applicationId);
    state = persisted
      ? { ...persisted, page_status: "ready" }
      : { ...createCandidateDetail(applicationId), page_status: "ready" };
    emit();
    resumeGeneration();
    return state;
  },

  loadDemoData(applicationId: CandidateApplicationId = activeApplicationId) {
    clearTimers();
    activeApplicationId = applicationId;
    state = createCandidateDetail(applicationId);
    hydrated = true;
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
        status: "验证方案生成中",
        stage: "验证方案生成中",
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

    const stepDuration = AI_RUN_DURATION / ASSESSMENT_GENERATION_STEPS.length;
    ASSESSMENT_GENERATION_STEPS.forEach((_, index) => {
      later(() => {
        update((current) => ({
          ...current,
          ai_run: { ...current.ai_run, activeStep: index },
        }));
      }, index * stepDuration);
    });
    later(() => completeGeneration(Boolean(options.fail)), AI_RUN_DURATION);
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
    const timestamp = nowIso();
    update((current) => ({
      ...current,
      application: {
        ...current.application,
        status: "待候选人完成",
        stage: "待候选人完成能力验证",
        updated_at: timestamp,
      },
      assessment_plan: { ...current.assessment_plan, status: "sent" },
    }));
  },
};

export function formatCandidateDate(value?: string) {
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
