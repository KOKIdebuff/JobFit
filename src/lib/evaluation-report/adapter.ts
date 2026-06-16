import {
  DEMO_IDS as CANDIDATE_DEMO_IDS,
  mockCandidateDetail,
  type CandidateDetailDemoState,
} from "@/lib/candidate-detail-demo";
import {
  PRESET_EVALUATION,
  PRESET_SUBMISSION,
  PRESET_TASK,
  trialDemoStore,
  type TrialDemoState,
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
  type MatchBasis,
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
  const submissionVersion = trial.trial_submission.submittedAt || "submission-preset";
  const evaluationVersion =
    trial.trial_evaluation?.total.toString() || PRESET_EVALUATION.total.toString();
  return [
    "job_profile_v1",
    CANDIDATE_DEMO_IDS.resume,
    CANDIDATE_DEMO_IDS.matchResult,
    submissionVersion,
    evaluationVersion,
  ].join(":");
}

function getCandidateDetail() {
  return structuredClone(mockCandidateDetail);
}

function getTrialState(): TrialDemoState {
  const current = trialDemoStore.getSnapshot();
  return {
    ...current,
    trial_task:
      current.trial_task.status === "ungenerated" || current.trial_task.status === "failed"
        ? { ...PRESET_TASK, status: "evaluated", source: "ai", generatedAt: nowIso() }
        : current.trial_task,
    trial_submission: current.trial_submission.submittedAt
      ? current.trial_submission
      : {
          ...current.trial_submission,
          ...PRESET_SUBMISSION,
          status: "submitted",
          submitCount: Math.max(1, current.trial_submission.submitCount),
        },
    trial_evaluation: current.trial_evaluation || PRESET_EVALUATION,
    ai_run:
      current.ai_run.status === "idle" || current.ai_run.status === "failed"
        ? { status: "completed", activeStep: 5, failNext: false }
        : current.ai_run,
  };
}

function evidence(
  item: Omit<EvidenceRef, "collectedAt" | "dataVersion" | "relatedConclusionIds"> & {
    collectedAt?: string;
    dataVersion?: string;
    relatedConclusionIds?: string[];
  },
): EvidenceRef {
  return {
    collectedAt: item.collectedAt || "2026-06-17T16:20:00+08:00",
    dataVersion: item.dataVersion || getReportInputDataVersion(),
    relatedConclusionIds: item.relatedConclusionIds || [],
    ...item,
  };
}

function buildResumeEvidence(detail: CandidateDetailDemoState): EvidenceRef[] {
  return detail.evidence_items.map((item) =>
    evidence({
      id: item.id,
      type: "resume",
      title: item.title,
      summary: item.excerpt,
      originalText: item.excerpt,
      sourceObject: `resume:${CANDIDATE_DEMO_IDS.resume}`,
      abilities: item.abilities,
      collectedAt: detail.resume.updated_at,
    }),
  );
}

function buildProfileEvidence(detail: CandidateDetailDemoState): EvidenceRef[] {
  return detail.candidate_profile.categories.map((category) =>
    evidence({
      id: `profile_${category.id}`,
      type: "candidate_profile",
      title: category.label,
      summary: category.conclusion,
      originalText: category.conclusion,
      sourceObject: `candidate_profile:${CANDIDATE_DEMO_IDS.candidateProfile}`,
      abilities: [category.label],
      collectedAt: detail.candidate_profile.updated_at,
      relatedConclusionIds: [category.id],
    }),
  );
}

function buildMatchEvidence(detail: CandidateDetailDemoState): EvidenceRef[] {
  return detail.match_result.dimensions.map((dimension) =>
    evidence({
      id: `match_${dimension.id}`,
      type: "match_result",
      title: `${dimension.label} ${dimension.score} 分`,
      summary: dimension.reason,
      originalText: [
        `命中：${dimension.hits.join("、")}`,
        `未命中：${dimension.misses.join("、")}`,
        `简历证据：${dimension.resumeEvidence.join("、")}`,
      ].join("\n"),
      sourceObject: `match_result:${CANDIDATE_DEMO_IDS.matchResult}`,
      abilities: dimension.jobRequirements,
      collectedAt: detail.match_result.generatedAt,
      relatedConclusionIds: [`capability_${dimension.id}`],
    }),
  );
}

function buildInterviewEvidence(detail: CandidateDetailDemoState): {
  refs: EvidenceRef[];
  items: InterviewEvidenceItem[];
} {
  const answerTexts = [
    "我会先确认目标用户和必须解决的问题，把两周内能验证的信息提取、差距解释和人工确认放进首版，暂不做自动录用、复杂推荐和跨平台同步。",
    "如果算法、工程和业务判断不一致，我会把争议拆成用户价值、实现成本和风险三类，先用最小实验验证关键假设，再让业务负责人确认取舍。",
    "AI 匹配解释可能误读项目负责边界、夸大技能熟练度或忽略候选人确认。我会展示来源证据、置信提示和人工修正入口，避免系统直接做淘汰判断。",
    "除了累计用户数，我会看完成分析并确认结果的比例、字段修改率、岗位差距解释采纳率和后续投递转化，判断功能是否真的帮助求职者。",
    "",
  ];
  const capabilities = [
    "需求优先级判断",
    "复杂项目推进",
    "AI 风险意识",
    "数据指标判断",
    "AI 功能方案设计",
  ];

  const items = detail.assessment_plan.interviewQuestions.map((question, index) => {
    const answered = Boolean(answerTexts[index]);
    const refId = `interview_answer_${index + 1}`;
    return {
      id: question.id,
      question: question.question,
      answerSummary: answered
        ? answerTexts[index].slice(0, 64)
        : "候选人未完成该题回答，仍需后续补充验证。",
      transcript: answered ? answerTexts[index] : "未回答",
      capability: capabilities[index] || question.purpose,
      evidenceQuality: answered ? (index === 1 ? "medium" : "high") : "unanswered",
      followUpResult: answered
        ? "已能说明方法，但仍建议真人面试继续追问真实项目中的边界。"
        : "未形成可复核回答。",
      answered,
      evidence_ids: answered ? [refId] : [],
    } satisfies InterviewEvidenceItem;
  });

  const refs = items
    .filter((item) => item.answered)
    .map((item, index) =>
      evidence({
        id: item.evidence_ids[0],
        type: "interview_answer",
        title: `面试回答：${item.capability}`,
        summary: item.answerSummary,
        originalText: item.transcript,
        sourceObject: `interview_answer:${item.id}`,
        abilities: [item.capability],
        relatedConclusionIds: [`interview_${index + 1}`],
      }),
    );

  return { refs, items };
}

function buildTrialEvidence(trial: TrialDemoState): {
  refs: EvidenceRef[];
  summary: TrialEvidenceSummary;
} {
  const evaluation = trial.trial_evaluation || PRESET_EVALUATION;
  const submission = trial.trial_submission.submittedAt
    ? trial.trial_submission
    : {
        ...trial.trial_submission,
        ...PRESET_SUBMISSION,
      };
  const task = trial.trial_task.status === "ungenerated" ? PRESET_TASK : trial.trial_task;
  const submissionId = "trial_submission_body";
  const dimensionRefs = evaluation.dimensions.map((dimension) =>
    evidence({
      id: `trial_eval_${dimension.id}`,
      type: "trial_evaluation",
      title: `岗位任务评价：${dimension.label}`,
      summary: dimension.evidence,
      originalText: dimension.evidence,
      sourceObject: `trial_evaluation:${dimension.id}`,
      abilities: [dimension.label],
      collectedAt: submission.submittedAt || PRESET_SUBMISSION.submittedAt,
      relatedConclusionIds: [`trial_${dimension.id}`],
    }),
  );
  const refs = [
    evidence({
      id: submissionId,
      type: "trial_submission",
      title: "岗位任务提交正文",
      summary: submission.body.slice(0, 90),
      originalText: submission.body,
      sourceObject: `trial_submission:${REPORT_DEMO_IDS.application}`,
      abilities: ["MVP 范围控制", "AI 风险意识", "表达清晰度"],
      collectedAt: submission.submittedAt || PRESET_SUBMISSION.submittedAt,
      relatedConclusionIds: ["trial_summary"],
    }),
    ...dimensionRefs,
  ];

  return {
    refs,
    summary: {
      taskTitle: task.title,
      requirements: task.requirements,
      submissionSummary: submission.body.slice(0, 110),
      dimensions: evaluation.dimensions.map((dimension) => ({
        id: dimension.id,
        label: dimension.label,
        score: dimension.score,
        achieved: dimension.achieved,
        evidence_ids: [`trial_eval_${dimension.id}`],
      })),
      unmetItems: [evaluation.gap, evaluation.risk],
      aiReference: `${evaluation.highlight}；${evaluation.gap}`,
      evidence_ids: [submissionId, ...dimensionRefs.map((item) => item.id)],
    },
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

function buildCoverageRows(detail: CandidateDetailDemoState): CapabilityCoverageRow[] {
  const rows: CapabilityCoverageRow[] = [
    {
      id: "ai_product",
      capability: "AI 产品理解",
      status: "sufficient",
      resumeEvidenceIds: ["evidence_project_ownership"],
      matchEvidenceIds: ["match_projects", "match_skills"],
      interviewEvidenceIds: ["interview_answer_3"],
      trialEvidenceIds: ["trial_eval_risk", "trial_eval_understanding"],
    },
    {
      id: "requirement_priority",
      capability: "需求优先级判断",
      status: "partial",
      resumeEvidenceIds: ["evidence_project_ownership"],
      matchEvidenceIds: ["match_experience"],
      interviewEvidenceIds: ["interview_answer_1"],
      trialEvidenceIds: ["trial_eval_scope"],
    },
    {
      id: "data_judgement",
      capability: "数据分析与指标判断",
      status: "sufficient",
      resumeEvidenceIds: ["evidence_data_result"],
      matchEvidenceIds: ["match_skills", "match_projects"],
      interviewEvidenceIds: ["interview_answer_4"],
      trialEvidenceIds: ["trial_eval_clarity"],
    },
    {
      id: "delivery",
      capability: "复杂项目推进",
      status: "needs_verification",
      resumeEvidenceIds: ["evidence_project_ownership"],
      matchEvidenceIds: ["match_experience"],
      interviewEvidenceIds: ["interview_answer_2"],
      trialEvidenceIds: [],
    },
  ];
  return rows.map((row) => ({
    ...row,
    resumeEvidenceIds: row.resumeEvidenceIds.filter((id) =>
      detail.evidence_items.some((item) => item.id === id),
    ),
  }));
}

function buildCapabilityEvaluations(rows: CapabilityCoverageRow[]): CapabilityEvaluation[] {
  const scoreByStatus = {
    sufficient: 88,
    partial: 76,
    needs_verification: 64,
  };
  return rows.map((row) => ({
    id: row.id,
    name: row.capability,
    score: scoreByStatus[row.status],
    status: row.status,
    conclusion:
      row.status === "sufficient"
        ? `${row.capability}已有多来源证据支持。`
        : row.status === "partial"
          ? `${row.capability}已有部分证据，但仍需真人面试确认真实边界。`
          : `${row.capability}证据仍不足，建议后续重点追问。`,
    evidence_ids: getCoverageEvidenceIds(row, "all"),
    candidateFeedback: {
      currentPerformance:
        row.status === "sufficient"
          ? "表现较稳定"
          : row.status === "partial"
            ? "已有基础表现"
            : "仍需补充证明",
      demonstratedBehavior: "能结合具体项目或任务说明自己的判断过程。",
      improvement:
        row.status === "needs_verification"
          ? "建议补充真实协作场景、冲突处理过程和最终结果。"
          : "建议继续量化指标、补充取舍依据和结果复盘。",
      practice: `围绕${row.capability}准备一个 STAR 案例，并补充指标或决策依据。`,
      evidenceSummary: `${row.resumeEvidenceIds.length + row.interviewEvidenceIds.length + row.trialEvidenceIds.length} 类证据支持该维度。`,
    },
  }));
}

function buildMatchBasis(detail: CandidateDetailDemoState): MatchBasis {
  return {
    total: detail.match_result.total,
    ruleVersion: detail.match_result.ruleVersion,
    sources: detail.match_result.sources,
    dimensions: detail.match_result.dimensions.map((dimension) => ({
      id: dimension.id,
      label: dimension.label,
      score: dimension.score,
      jobRequirements: dimension.jobRequirements,
      hits: dimension.hits,
      misses: dimension.misses,
      resumeEvidence: dimension.resumeEvidence,
      evidence_ids: [`match_${dimension.id}`, ...dimension.evidence_ids],
    })),
  };
}

function buildCandidateFeedback(
  detail: CandidateDetailDemoState,
  capabilityEvaluations: CapabilityEvaluation[],
  interviewEvidence: InterviewEvidenceItem[],
  trialEvidence: TrialEvidenceSummary,
): CandidateFeedback {
  return {
    overview:
      "本次验证显示你具备 AI 产品实践、需求分析和数据判断基础；后续需要继续补强复杂协作、指标闭环和真实业务取舍表达。",
    strengths: [
      {
        id: "candidate_strength_ai",
        title: "AI 产品实践清晰",
        summary: "能够说明 AI 与规则程序的边界，并关注人工确认。",
        evidence_ids: ["interview_answer_3", "trial_eval_understanding"],
      },
      {
        id: "candidate_strength_data",
        title: "有数据意识",
        summary: "能从完成率、修改率和采纳率理解产品效果。",
        evidence_ids: ["evidence_data_result", "interview_answer_4"],
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
      "整理一个两周 MVP 取舍案例，写清楚为什么不做某些功能。",
      "准备一个跨团队协作案例，补充冲突、选择和结果。",
      "把任务方案中的指标补充成统计口径、目标阈值和复盘周期。",
    ],
    interviewFeedback: {
      completedCount: interviewEvidence.filter((item) => item.answered).length,
      strengths: ["回答能围绕用户价值和实现边界展开", "能主动提到人工确认和风险控制"],
      improvements: ["部分回答还缺少量化结果", "复杂协作案例可以补充真实冲突背景"],
      structureSuggestion: "建议使用“背景-目标-取舍-结果-复盘”的顺序组织回答。",
    },
    trialFeedback: {
      completion: "已完成岗位任务正文、原型链接和附件提交。",
      positives: ["MVP 范围控制清晰", "AI 风险意识较强", "能区分系统规则与生成式 AI 职责"],
      improvements: ["核心指标还可以补充统计窗口", "错误字段修改率需要给出基线和阈值"],
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
  const detail = getCandidateDetail();
  const trial = getTrialState();
  const resumeRefs = buildResumeEvidence(detail);
  const profileRefs = buildProfileEvidence(detail);
  const matchRefs = buildMatchEvidence(detail);
  const { refs: interviewRefs, items: interviewEvidence } = buildInterviewEvidence(detail);
  const { refs: trialRefs, summary: trialEvidence } = buildTrialEvidence(trial);
  const coverageMatrix = buildCoverageRows(detail);
  const capabilityEvaluations = buildCapabilityEvaluations(coverageMatrix);
  const evidenceRefs = [
    ...resumeRefs,
    ...profileRefs,
    ...matchRefs,
    ...interviewRefs,
    ...trialRefs,
  ];
  const generatedAt = nowIso();
  const version = options.version ?? (options.previous?.version || 0) + 1;
  const report: EvaluationReport = {
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
    fallbackReason:
      options.status === "fallback" ? "使用已校验的报告兜底结构继续演示流程。" : undefined,
    summary: {
      candidateName: "李同学",
      jobTitle: "AI 产品经理（校招）",
      applicationDisplayId: REPORT_DEMO_IDS.application,
      overallConclusion:
        "候选人与 AI 产品经理校招岗位整体匹配度较高，AI 产品理解和数据意识已有证据支持；复杂项目推进仍需真人面试继续确认。",
      evidenceCompleteness: 86,
      decisionBoundary: "AI 报告只提供证据化辅助判断，不允许根据 AI 结果自动淘汰候选人。",
      evidence_ids: ["match_projects", "interview_answer_3", "trial_eval_understanding"],
    },
    strengths: [
      {
        id: "strength_ai_product",
        title: "AI 产品实践与岗位高度相关",
        summary: "简历、匹配解释和岗位任务均显示候选人理解 AI 产品的边界与验证方式。",
        evidence_ids: ["evidence_project_ownership", "match_projects", "trial_eval_understanding"],
      },
      {
        id: "strength_risk",
        title: "具备基础 AI 风险意识",
        summary: "能主动提到来源证据、人工确认、敏感属性边界和错误修正机制。",
        evidence_ids: ["interview_answer_3", "trial_eval_risk"],
      },
    ],
    gaps: [
      {
        id: "gap_delivery",
        title: "复杂项目推进证据不足",
        summary: "目前主要来自校园项目和任务方案，仍缺少真实多人冲突和业务推进案例。",
        evidence_ids: ["match_experience", "interview_answer_2"],
      },
      {
        id: "gap_metrics",
        title: "指标定义需要更细",
        summary: "能提出指标方向，但统计周期、目标阈值和失败边界仍需补充。",
        evidence_ids: ["interview_answer_4", "trial_eval_clarity"],
      },
    ],
    risks: [
      {
        id: "risk_project_boundary",
        title: "项目负责边界需复核",
        summary: "简历体现主导经历，但真实决策权和跨团队推进深度仍需追问。",
        evidence_ids: ["evidence_project_ownership", "match_experience"],
      },
      {
        id: "risk_auto_decision",
        title: "不得将报告结论直接作为淘汰依据",
        summary: "部分能力仍处于部分证明或待验证状态，应进入 HR 人工复核。",
        evidence_ids: ["gap_delivery", "trial_eval_clarity"].filter((id) =>
          evidenceRefs.some((ref) => ref.id === id),
        ),
      },
    ].map((risk) =>
      risk.evidence_ids.length
        ? risk
        : { ...risk, evidence_ids: ["match_experience", "trial_eval_clarity"] },
    ),
    capabilityEvaluations,
    coverageMatrix,
    matchBasis: buildMatchBasis(detail),
    interviewEvidence,
    trialEvidence,
    evidenceRefs,
    candidateFeedback: buildCandidateFeedback(
      detail,
      capabilityEvaluations,
      interviewEvidence,
      trialEvidence,
    ),
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

  assertEvidenceIntegrity(report);
  return report;
}

function assertEvidenceIntegrity(report: EvaluationReport) {
  const evidenceIds = new Set(report.evidenceRefs.map((item) => item.id));
  const conclusionRefs = [
    report.summary,
    ...report.strengths,
    ...report.gaps,
    ...report.risks,
    ...report.capabilityEvaluations,
  ];
  for (const item of conclusionRefs) {
    const label = "id" in item ? item.id : "summary";
    if (!item.evidence_ids.length) {
      throw new Error(`结论 ${label} 缺少证据引用`);
    }
    const missing = item.evidence_ids.filter((id) => !evidenceIds.has(id));
    if (missing.length) {
      throw new Error(`结论 ${label} 引用了不存在的证据：${missing.join(",")}`);
    }
  }
}

export function createEmptyReportState() {
  return {
    hydrated: false,
    loading: false,
    access: "allowed" as const,
    report: null,
  };
}
