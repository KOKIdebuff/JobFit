export const REPORT_DEMO_IDS = {
  job: "demo-ai-pm",
  candidate: "demo-candidate-001",
  application: "demo-application-001",
  legacyApplication: "application_ai_pm_li_001",
} as const;

export type ReportStatus =
  | "not_generated"
  | "generating"
  | "failed"
  | "fallback"
  | "pending_review"
  | "confirmed"
  | "stale";

export type EvidenceType =
  | "resume"
  | "candidate_profile"
  | "match_result"
  | "assessment_plan"
  | "interview_answer"
  | "trial_submission"
  | "trial_evaluation"
  | "ai_run"
  | "hr_note";

export type EvidenceCoverage = "sufficient" | "partial" | "needs_verification";
export type EvidenceSourceKey = "resume" | "match" | "interview" | "trial";

export interface EvidenceRef {
  id: string;
  type: EvidenceType;
  title: string;
  summary: string;
  sourceObject: string;
  abilities: string[];
  collectedAt: string;
  dataVersion: string;
  relatedConclusionIds: string[];
  originalText?: string;
  private?: boolean;
}

export interface EvidenceLinkedText {
  id: string;
  title: string;
  summary: string;
  evidence_ids: string[];
}

export interface CapabilityEvaluation {
  id: string;
  name: string;
  score: number;
  status: EvidenceCoverage;
  conclusion: string;
  evidence_ids: string[];
  candidateFeedback: {
    currentPerformance: string;
    demonstratedBehavior: string;
    improvement: string;
    practice: string;
    evidenceSummary: string;
  };
}

export interface CapabilityCoverageRow {
  id: string;
  capability: string;
  status: EvidenceCoverage;
  resumeEvidenceIds: string[];
  matchEvidenceIds: string[];
  interviewEvidenceIds: string[];
  trialEvidenceIds: string[];
}

export interface MatchBasis {
  total: number;
  ruleVersion: string;
  dimensions: Array<{
    id: string;
    label: string;
    score: number;
    jobRequirements: string[];
    hits: string[];
    misses: string[];
    resumeEvidence: string[];
    evidence_ids: string[];
  }>;
  sources: string[];
}

export interface InterviewEvidenceItem {
  id: string;
  question: string;
  answerSummary: string;
  transcript: string;
  capability: string;
  evidenceQuality: "high" | "medium" | "low" | "unanswered";
  followUpResult: string;
  answered: boolean;
  evidence_ids: string[];
}

export interface TrialEvidenceSummary {
  taskTitle: string;
  requirements: string[];
  submissionSummary: string;
  dimensions: Array<{
    id: string;
    label: string;
    score: number;
    achieved: number;
    evidence_ids: string[];
  }>;
  unmetItems: string[];
  aiReference: string;
  evidence_ids: string[];
}

export interface CandidateFeedback {
  overview: string;
  strengths: EvidenceLinkedText[];
  growthDirections: EvidenceLinkedText[];
  recommendedActions: string[];
  interviewFeedback: {
    completedCount: number;
    strengths: string[];
    improvements: string[];
    structureSuggestion: string;
  };
  trialFeedback: {
    completion: string;
    positives: string[];
    improvements: string[];
    nextPractice: string;
    originalSubmission: string;
  };
}

export interface HrReviewInfo {
  note: string;
  reviewed: boolean;
  priority: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  candidateReadAt?: string;
  growthActions: Array<{ id: string; label: string; done: boolean; updatedAt?: string }>;
}

export interface EvaluationReport {
  id: string;
  applicationId: string;
  jobId: string;
  candidateId: string;
  version: number;
  status: ReportStatus;
  generatedAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  inputDataVersion: string;
  ruleVersion: string;
  promptVersion: string;
  agentRunId: string;
  generationStartedAt?: string;
  generationActiveStep: number;
  generationError?: string;
  fallbackReason?: string;
  staleReason?: string;
  summary: {
    candidateName: string;
    jobTitle: string;
    applicationDisplayId: string;
    overallConclusion: string;
    evidenceCompleteness: number;
    decisionBoundary: string;
    evidence_ids: string[];
  };
  strengths: EvidenceLinkedText[];
  gaps: EvidenceLinkedText[];
  risks: EvidenceLinkedText[];
  capabilityEvaluations: CapabilityEvaluation[];
  coverageMatrix: CapabilityCoverageRow[];
  matchBasis: MatchBasis;
  interviewEvidence: InterviewEvidenceItem[];
  trialEvidence: TrialEvidenceSummary;
  evidenceRefs: EvidenceRef[];
  candidateFeedback: CandidateFeedback;
  hrReview: HrReviewInfo;
}

export interface EvaluationReportState {
  hydrated: boolean;
  loading: boolean;
  access: "allowed" | "forbidden";
  report: EvaluationReport | null;
}

export const REPORT_GENERATION_STEPS = [
  "校验岗位与候选人数据",
  "读取职业画像和匹配结果",
  "聚合面试回答",
  "聚合岗位任务交付物",
  "建立结论与证据引用",
  "生成 HR 和候选人视图",
  "完成结构校验",
] as const;
