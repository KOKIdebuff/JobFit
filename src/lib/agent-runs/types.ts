export type AgentRunStatus =
  | "pending"
  | "running"
  | "review_required"
  | "completed"
  | "failed"
  | "retrying"
  | "fallback";

export type AgentStepStatus = "pending" | "running" | "completed" | "review_required" | "failed";

export type AgentRoleStatus =
  | "pending"
  | "running"
  | "completed"
  | "review_required"
  | "failed"
  | "fallback";

export interface AgentRunEntity {
  id: string;
  applicationId: string;
  processName: string;
  candidateName: string;
  jobTitle: string;
  status: AgentRunStatus;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  needsHrReview: boolean;
  preservedData: string[];
  nextActions: string[];
  failureSummary?: string;
  fallbackSummary?: string;
  hrReview: {
    note: string;
    reviewed: boolean;
    priority: boolean;
    confirmed: boolean;
    confirmedAt?: string;
  };
  agents: AgentRoleEntity[];
  timeline: AgentTimelineEntity[];
}

export interface AgentRoleEntity {
  id: string;
  name: string;
  responsibility: string;
  status: AgentRoleStatus;
  completedActions: string[];
  outputSummary: string;
  humanQuestions: string[];
  evidenceCount: number;
}

export interface AgentTimelineEntity {
  id: string;
  title: string;
  status: AgentStepStatus;
  businessSummary: string;
  keyOutputs: string[];
  detail: string;
}

export interface AgentRunViewModel {
  id: string;
  applicationId: string;
  processName: string;
  candidateName: string;
  jobTitle: string;
  status: AgentRunStatus;
  statusLabel: string;
  statusTone: "neutral" | "blue" | "violet" | "green" | "amber" | "red";
  progress: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  needsHrReview: boolean;
  preservedData: string[];
  nextActions: string[];
  failureSummary?: string;
  fallbackSummary?: string;
  hrReview: AgentRunEntity["hrReview"];
  agents: AgentRoleViewModel[];
  timeline: AgentTimelineViewModel[];
}

export interface AgentRoleViewModel extends Omit<AgentRoleEntity, "status"> {
  status: AgentRoleStatus;
  statusLabel: string;
  statusTone: AgentRunViewModel["statusTone"];
}

export interface AgentTimelineViewModel extends Omit<AgentTimelineEntity, "status"> {
  status: AgentStepStatus;
  statusLabel: string;
  statusTone: AgentRunViewModel["statusTone"];
}

export interface AgentRunState {
  hydrated: boolean;
  loading: boolean;
  access: "allowed" | "forbidden";
  runs: AgentRunViewModel[];
  selectedRunId?: string;
  selectedRun: AgentRunViewModel | null;
  notFound: boolean;
}

export interface AgentRunRepository {
  list(): Promise<AgentRunEntity[]>;
  saveAll(runs: AgentRunEntity[]): Promise<void>;
  clear(): Promise<void>;
}
