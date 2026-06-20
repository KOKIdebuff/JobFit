import { DEMO_IDS as CANDIDATE_DEMO_IDS, createCandidateDetail } from "@/lib/candidate-detail-demo";
import {
  PRESET_EVALUATION,
  PRESET_SUBMISSION,
  PRESET_TASK,
  trialDemoStore,
} from "@/lib/trial-demo";
import {
  REPORT_DEMO_IDS,
  type CapabilityCoverageRow,
  type CapabilityEvaluation,
  type CandidateFeedback,
  type EvaluationReport,
  type EvidenceRef,
  type EvidenceSourceKey,
  type InterviewEvidenceItem,
  type TrialEvidenceSummary,
} from "./types";

const PROMPT_VERSION = "evaluation_report_prompt_v1";
const REPORT_RULE_VERSION = "evaluation_report_rule_v1";

function nowIso() {
  return new Date().toISOString();
}

function normalizeApplicationId(applicationId?: string) {
  return applicationId === REPORT_DEMO_IDS.legacyApplication ||
    applicationId === REPORT_DEMO_IDS.application
    ? REPORT_DEMO_IDS.application
    : applicationId || REPORT_DEMO_IDS.application;
}

export function isReportApplicationId(applicationId?: string) {
  return normalizeApplicationId(applicationId) === REPORT_DEMO_IDS.application;
}

export function getReportInputDataVersion() {
  const trial = trialDemoStore.getSnapshot();
  return [
    "job_profile_v1",
    CANDIDATE_DEMO_IDS.resume,
    CANDIDATE_DEMO_IDS.matchResult,
    trial.trial_submission.submittedAt || "submission-preset",
    trial.trial_evaluation?.total.toString() || PRESET_EVALUATION.total.toString(),
  ].join(":");
}

function evidence(
  item: Omit<EvidenceRef, "collectedAt" | "dataVersion" | "relatedConclusionIds"> &
    Partial<Pick<EvidenceRef, "collectedAt" | "dataVersion" | "relatedConclusionIds">>,
): EvidenceRef {
  return {
    collectedAt: item.collectedAt || "2026-06-17T16:20:00+08:00",
    dataVersion: item.dataVersion || getReportInputDataVersion(),
    relatedConclusionIds: item.relatedConclusionIds || [],
    ...item,
  };
}

function sourceIds(row: CapabilityCoverageRow, source: EvidenceSourceKey) {
  if (source === "resume") return row.resumeEvidenceIds;
  if (source === "match") return row.matchEvidenceIds;
  if (source === "interview") return row.interviewEvidenceIds;
  return row.trialEvidenceIds;
}

export function getCoverageEvidenceIds(
  row: CapabilityCoverageRow,
  source: EvidenceSourceKey | "all",
) {
  return source === "all"
    ? [
        ...row.resumeEvidenceIds,
        ...row.matchEvidenceIds,
        ...row.interviewEvidenceIds,
        ...row.trialEvidenceIds,
      ]
    : sourceIds(row, source);
}

function createEvidenceRefs(): EvidenceRef[] {
  const detail = createCandidateDetail(REPORT_DEMO_IDS.application);
  const trial = trialDemoStore.getSnapshot();
  const submission = trial.trial_submission.submittedAt
    ? trial.trial_submission
    : { ...trial.trial_submission, ...PRESET_SUBMISSION };
  const evaluation = trial.trial_evaluation || PRESET_EVALUATION;
  const firstEvidence = detail.evidence_items[0];
  return [
    evidence({
      id: "resume_1",
      type: "resume",
      title: firstEvidence.title,
      summary: firstEvidence.excerpt,
      sourceObject: `resume:${CANDIDATE_DEMO_IDS.resume}`,
      abilities: firstEvidence.abilities,
      originalText: firstEvidence.excerpt,
    }),
    evidence({
      id: "profile_1",
      type: "candidate_profile",
      title: "候选人画像",
      summary: detail.candidate_profile.summary,
      sourceObject: `candidate_profile:${CANDIDATE_DEMO_IDS.candidateProfile}`,
      abilities: detail.candidate_profile.skills.slice(0, 3),
    }),
    evidence({
      id: "match_1",
      type: "match_result",
      title: "人岗匹配结果",
      summary: detail.match_result.reasons.join(" "),
      sourceObject: `match_result:${CANDIDATE_DEMO_IDS.matchResult}`,
      abilities: detail.job_profile.mustHave,
    }),
    evidence({
      id: "interview_1",
      type: "interview_answer",
      title: "结构化面试回答",
      summary: "候选人能够解释 AI 产品边界、人工确认和指标判断。",
      sourceObject: "interview_answer:structured-001",
      abilities: ["AI 风险意识", "产品判断"],
    }),
    evidence({
      id: "trial_submission",
      type: "trial_submission",
      title: "岗位任务提交正文",
      summary: submission.body.slice(0, 120),
      originalText: submission.body,
      sourceObject: `trial_submission:${REPORT_DEMO_IDS.application}`,
      abilities: ["MVP 范围控制", "风险意识"],
    }),
    ...evaluation.dimensions.slice(0, 3).map((dimension) =>
      evidence({
        id: `trial_eval_${dimension.id}`,
        type: "trial_evaluation",
        title: `岗位任务评价：${dimension.label}`,
        summary: dimension.evidence,
        originalText: dimension.evidence,
        sourceObject: `trial_evaluation:${dimension.id}`,
        abilities: [dimension.label],
      }),
    ),
  ];
}

function createCoverageRows(): CapabilityCoverageRow[] {
  return [
    {
      id: "ai_product",
      capability: "AI 产品理解",
      status: "sufficient",
      resumeEvidenceIds: ["resume_1"],
      matchEvidenceIds: ["match_1"],
      interviewEvidenceIds: ["interview_1"],
      trialEvidenceIds: ["trial_eval_understanding"],
    },
    {
      id: "requirement_priority",
      capability: "需求优先级判断",
      status: "partial",
      resumeEvidenceIds: ["profile_1"],
      matchEvidenceIds: ["match_1"],
      interviewEvidenceIds: [],
      trialEvidenceIds: ["trial_eval_scope"],
    },
    {
      id: "delivery",
      capability: "复杂项目推进",
      status: "needs_verification",
      resumeEvidenceIds: ["resume_1"],
      matchEvidenceIds: [],
      interviewEvidenceIds: ["interview_1"],
      trialEvidenceIds: [],
    },
  ];
}

function createCapabilityEvaluations(rows: CapabilityCoverageRow[]): CapabilityEvaluation[] {
  const scoreByStatus = { sufficient: 88, partial: 76, needs_verification: 64 };
  return rows.map((row) => ({
    id: row.id,
    name: row.capability,
    score: scoreByStatus[row.status],
    status: row.status,
    conclusion:
      row.status === "sufficient"
        ? `${row.capability}已有多来源证据支持。`
        : row.status === "partial"
          ? `${row.capability}已有部分证据，仍需真人面试确认。`
          : `${row.capability}证据不足，建议后续重点追问。`,
    evidence_ids: getCoverageEvidenceIds(row, "all"),
    candidateFeedback: {
      currentPerformance:
        row.status === "sufficient"
          ? "表现稳定"
          : row.status === "partial"
            ? "已有基础表现"
            : "仍需补充证明",
      demonstratedBehavior: "能够结合项目或任务说明自己的判断过程。",
      improvement:
        row.status === "needs_verification"
          ? "补充真实协作场景和结果复盘。"
          : "继续量化指标、补充取舍依据和结果复盘。",
      practice: `围绕${row.capability}准备一个 STAR 案例，并补充指标或决策依据。`,
      evidenceSummary: `${getCoverageEvidenceIds(row, "all").length} 条证据支持该维度。`,
    },
  }));
}

function createInterviewEvidence(): InterviewEvidenceItem[] {
  return [
    {
      id: "interview_question_1",
      question: "你会如何划定 AI 产品首版 MVP 范围？",
      answerSummary: "候选人能够先确认目标用户和必须解决的问题，再控制首版范围。",
      transcript: "候选人强调先做信息提取、差距解释和人工确认，不做自动录用和复杂推荐。",
      capability: "需求优先级判断",
      evidenceQuality: "high",
      followUpResult: "建议真人面试继续追问真实项目中的取舍边界。",
      answered: true,
      evidence_ids: ["interview_1"],
    },
  ];
}

function createTrialEvidence(): TrialEvidenceSummary {
  const trial = trialDemoStore.getSnapshot();
  const task = trial.trial_task.status === "ungenerated" ? PRESET_TASK : trial.trial_task;
  const evaluation = trial.trial_evaluation || PRESET_EVALUATION;
  const submission = trial.trial_submission.submittedAt
    ? trial.trial_submission
    : { ...trial.trial_submission, ...PRESET_SUBMISSION };
  return {
    taskTitle: task.title,
    requirements: task.requirements,
    submissionSummary: submission.body.slice(0, 120),
    dimensions: evaluation.dimensions.slice(0, 3).map((dimension) => ({
      id: dimension.id,
      label: dimension.label,
      score: dimension.score,
      achieved: dimension.achieved,
      evidence_ids: [`trial_eval_${dimension.id}`],
    })),
    unmetItems: [evaluation.gap, evaluation.risk],
    aiReference: `${evaluation.highlight} ${evaluation.gap}`,
    evidence_ids: [
      "trial_submission",
      ...evaluation.dimensions.slice(0, 3).map((dimension) => `trial_eval_${dimension.id}`),
    ],
  };
}

function createCandidateFeedback(
  capabilityEvaluations: CapabilityEvaluation[],
  trialEvidence: TrialEvidenceSummary,
): CandidateFeedback {
  return {
    overview:
      "本次验证显示候选人具备 AI 产品实践、需求分析和数据判断基础，后续需要继续补强复杂协作和指标闭环表达。",
    strengths: [
      {
        id: "candidate_strength_ai",
        title: "AI 产品实践清晰",
        summary: "能够说明 AI 与规则程序的边界，并关注人工确认。",
        evidence_ids: ["interview_1", "trial_eval_understanding"],
      },
      {
        id: "candidate_strength_scope",
        title: "MVP 范围控制较好",
        summary: "能主动控制首版范围，避免自动化决策越界。",
        evidence_ids: ["trial_eval_scope"],
      },
    ],
    growthDirections: capabilityEvaluations
      .filter((item) => item.status !== "sufficient")
      .map((item) => ({
        id: `growth_${item.id}`,
        title: item.name,
        summary: item.candidateFeedback.improvement,
        evidence_ids: item.evidence_ids.slice(0, 2),
      })),
    recommendedActions: [
      "准备一个 MVP 取舍案例。",
      "补充跨团队协作中的冲突处理。",
      "把任务方案中的指标补充统计窗口和目标阈值。",
    ],
    interviewFeedback: {
      completedCount: 1,
      strengths: ["回答能围绕用户价值和实现边界展开", "能主动提到人工确认和风险控制"],
      improvements: ["部分回答还缺少量化结果", "复杂协作案例可继续补充"],
      structureSuggestion: "建议使用背景、目标、取舍、结果、复盘的顺序组织回答。",
    },
    trialFeedback: {
      completion: "已完成岗位任务正文、原型链接和附件提交。",
      positives: ["MVP 范围控制清晰", "AI 风险意识较强", "表达结构清楚"],
      improvements: ["核心指标需要补充目标阈值", "错误字段修正率需要给出基线"],
      nextPractice: "用 30 分钟把方案改写成一页 PRD，并补充指标表。",
      originalSubmission: trialEvidence.submissionSummary,
    },
  };
}

export function createEvaluationReport(
  options: {
    status?: "pending_review" | "fallback";
    version?: number;
    previous?: EvaluationReport | null;
    applicationId?: string;
  } = {},
): EvaluationReport {
  const detail = createCandidateDetail(REPORT_DEMO_IDS.application);
  const evidenceRefs = createEvidenceRefs();
  const coverageMatrix = createCoverageRows();
  const capabilityEvaluations = createCapabilityEvaluations(coverageMatrix);
  const interviewEvidence = createInterviewEvidence();
  const trialEvidence = createTrialEvidence();
  const generatedAt = nowIso();
  const version = options.version ?? (options.previous?.version || 0) + 1;

  return {
    id: `evaluation_report_${REPORT_DEMO_IDS.application}_v${version}`,
    applicationId: normalizeApplicationId(options.applicationId),
    jobId: REPORT_DEMO_IDS.job,
    candidateId: REPORT_DEMO_IDS.candidate,
    version,
    status: options.status || "pending_review",
    generatedAt,
    inputDataVersion: getReportInputDataVersion(),
    ruleVersion: REPORT_RULE_VERSION,
    promptVersion: PROMPT_VERSION,
    agentRunId: `report-agent-run-${Date.now()}`,
    generationActiveStep: 7,
    fallbackReason: options.status === "fallback" ? "已使用预设报告结构继续流程。" : undefined,
    summary: {
      candidateName: detail.candidate.name,
      jobTitle: detail.job.title,
      applicationDisplayId: REPORT_DEMO_IDS.application,
      overallConclusion:
        "候选人与 AI 产品经理校招岗位整体匹配度较高，AI 产品理解和数据意识已有证据支持；复杂项目推进仍需真人面试继续确认。",
      evidenceCompleteness: 86,
      decisionBoundary: "报告只提供证据化辅助判断，不得据此自动淘汰候选人。",
      evidence_ids: ["resume_1", "match_1", "trial_eval_understanding"],
    },
    strengths: [
      {
        id: "strength_ai_product",
        title: "AI 产品实践与岗位相关",
        summary: "简历、匹配解释和岗位任务均显示候选人理解 AI 产品的边界与验证方式。",
        evidence_ids: ["resume_1", "match_1", "trial_eval_understanding"],
      },
      {
        id: "strength_risk",
        title: "具备基础 AI 风险意识",
        summary: "候选人主动提到来源证据、人工确认和错误修正能力。",
        evidence_ids: ["interview_1", "trial_eval_risk"],
      },
    ],
    gaps: [
      {
        id: "gap_delivery",
        title: "复杂项目推进证据不足",
        summary: "现有材料主要来自校园项目和岗位任务，仍缺少多方冲突和业务推进案例。",
        evidence_ids: ["resume_1", "interview_1"],
      },
      {
        id: "gap_metrics",
        title: "指标定义需要更细",
        summary: "能提出指标方向，但统计周期、目标阈值和失败边界仍需补充。",
        evidence_ids: ["trial_eval_clarity"],
      },
    ],
    risks: [
      {
        id: "risk_project_boundary",
        title: "项目负责边界需复核",
        summary: "简历体现主导经历，但真实决策权和协作深度仍需追问。",
        evidence_ids: ["resume_1", "interview_1"],
      },
      {
        id: "risk_auto_decision",
        title: "不得直接用于自动决策",
        summary: "部分能力仍处于待验证状态，应进入 HR 人工复核。",
        evidence_ids: ["match_1", "trial_eval_clarity"],
      },
    ],
    capabilityEvaluations,
    coverageMatrix,
    matchBasis: {
      total: detail.match_result.total,
      ruleVersion: detail.match_result.ruleVersion,
      sources: detail.match_result.sources,
      dimensions: detail.match_result.dimensions.map((dimension) => ({
        ...dimension,
        evidence_ids: ["match_1", ...dimension.evidence_ids],
      })),
    },
    interviewEvidence,
    trialEvidence,
    evidenceRefs,
    candidateFeedback: createCandidateFeedback(capabilityEvaluations, trialEvidence),
    hrReview: options.previous?.hrReview || {
      note: "",
      reviewed: false,
      priority: false,
      growthActions: [
        { id: "practice_mvp", label: "加入 MVP 取舍练习", done: false },
        { id: "practice_metrics", label: "补充指标定义练习", done: false },
      ],
    },
  };
}

export function createEmptyReportState() {
  return { hydrated: false, loading: false, access: "allowed" as const, report: null };
}
