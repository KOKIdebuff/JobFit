export type RecruitmentDecisionOutcome = "advance_to_human_interview" | "hold" | "reject";
export type RecruitmentDecisionStatus = "pending" | "submitted";

export interface RecruitmentDecision {
  id: string;
  applicationId: string;
  status: RecruitmentDecisionStatus;
  outcome?: RecruitmentDecisionOutcome;
  reason?: string;
  internalNote?: string;
  decidedBy?: { id: string; name: string };
  decidedAt?: string;
  updatedAt: string;
  version: number;
  history?: RecruitmentDecisionHistoryItem[];
}

export interface SubmitRecruitmentDecisionInput {
  applicationId: string;
  outcome: RecruitmentDecisionOutcome;
  reason: string;
  internalNote?: string;
  expectedVersion: number;
}

export interface RecruitmentDecisionHistoryItem {
  id: string;
  applicationId: string;
  previousOutcome?: RecruitmentDecisionOutcome;
  nextOutcome: RecruitmentDecisionOutcome;
  reason: string;
  operatorName: string;
  createdAt: string;
}

export interface RecruitmentDecisionService {
  get(applicationId: string): Promise<RecruitmentDecision>;
  submit(input: SubmitRecruitmentDecisionInput): Promise<RecruitmentDecision>;
  getHistory(applicationId: string): Promise<RecruitmentDecisionHistoryItem[]>;
  subscribe(applicationId: string, listener: () => void): () => void;
}

export type RecruitmentDecisionErrorCode =
  | "validation_error"
  | "version_conflict"
  | "not_found"
  | "storage_error";

export class RecruitmentDecisionError extends Error {
  constructor(
    public readonly code: RecruitmentDecisionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "RecruitmentDecisionError";
  }
}

export const RECRUITMENT_DECISION_OUTCOMES: Array<{
  value: RecruitmentDecisionOutcome;
  label: string;
  description: string;
}> = [
  {
    value: "advance_to_human_interview",
    label: "进入真人面试",
    description: "安排后续由业务负责人或面试官参与的真人面试。",
  },
  {
    value: "hold",
    label: "暂缓推进",
    description: "保留候选人资料，等待岗位安排或补充信息后再处理。",
  },
  {
    value: "reject",
    label: "暂不推进",
    description: "结束当前岗位的推进，内部原因仅供 HR 查看。",
  },
];

export function recruitmentDecisionOutcomeLabel(outcome?: RecruitmentDecisionOutcome) {
  if (!outcome) return "待决策";
  return RECRUITMENT_DECISION_OUTCOMES.find((item) => item.value === outcome)?.label ?? "待决策";
}
