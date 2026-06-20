import type {
  AgentRoleStatus,
  AgentRoleViewModel,
  AgentRunEntity,
  AgentRunStatus,
  AgentRunViewModel,
  AgentStepStatus,
  AgentTimelineViewModel,
} from "./types";

const runLabels: Record<AgentRunStatus, { label: string; tone: AgentRunViewModel["statusTone"] }> =
  {
    pending: { label: "待处理", tone: "neutral" },
    running: { label: "运行中", tone: "blue" },
    review_required: { label: "需人工复核", tone: "violet" },
    completed: { label: "已完成", tone: "green" },
    failed: { label: "失败", tone: "red" },
    retrying: { label: "重试中", tone: "blue" },
    fallback: { label: "待 HR 介入", tone: "amber" },
  };

const roleLabels: Record<
  AgentRoleStatus,
  { label: string; tone: AgentRunViewModel["statusTone"] }
> = {
  pending: { label: "待处理", tone: "neutral" },
  running: { label: "处理中", tone: "blue" },
  completed: { label: "已完成", tone: "green" },
  review_required: { label: "需人工确认", tone: "violet" },
  failed: { label: "失败", tone: "red" },
  fallback: { label: "HR 介入", tone: "amber" },
};

const stepLabels: Record<
  AgentStepStatus,
  { label: string; tone: AgentRunViewModel["statusTone"] }
> = {
  pending: { label: "待处理", tone: "neutral" },
  running: { label: "阶段处理中", tone: "blue" },
  completed: { label: "已完成", tone: "green" },
  review_required: { label: "等待人工复核", tone: "violet" },
  failed: { label: "失败", tone: "red" },
};

export function toAgentRunViewModel(entity: AgentRunEntity): AgentRunViewModel {
  const status = runLabels[entity.status];
  return {
    id: entity.id,
    applicationId: entity.applicationId,
    processName: entity.processName,
    candidateName: entity.candidateName,
    jobTitle: entity.jobTitle,
    status: entity.status,
    statusLabel: status.label,
    statusTone: status.tone,
    progress: entity.progress,
    startedAt: entity.startedAt,
    completedAt: entity.completedAt,
    updatedAt: entity.updatedAt,
    needsHrReview: entity.needsHrReview,
    preservedData: entity.preservedData,
    nextActions: entity.nextActions,
    failureSummary: entity.failureSummary,
    fallbackSummary: entity.fallbackSummary,
    hrReview: entity.hrReview,
    agents: entity.agents.map(toAgentRoleViewModel),
    timeline: entity.timeline.map(toTimelineViewModel),
  };
}

export function toAgentRunViewModels(entities: AgentRunEntity[]) {
  return entities.map(toAgentRunViewModel);
}

function toAgentRoleViewModel(entity: AgentRunEntity["agents"][number]): AgentRoleViewModel {
  const status = roleLabels[entity.status];
  return {
    ...entity,
    statusLabel: status.label,
    statusTone: status.tone,
  };
}

function toTimelineViewModel(entity: AgentRunEntity["timeline"][number]): AgentTimelineViewModel {
  const status = stepLabels[entity.status];
  return {
    ...entity,
    statusLabel: status.label,
    statusTone: status.tone,
  };
}
