import { hirelinkApi } from "@/lib/hirelink-api/service";
import { toAgentRunViewModels } from "./adapter";
import { AGENT_RUN_FIXTURES } from "./fixtures";
import type { AgentRunEntity, AgentRunRepository, AgentRunState } from "./types";

const STORAGE_KEY = "hirelink:agent-runs:v1";
const STORAGE_VERSION = 1;
const RETRY_DURATION = 900;

interface PersistedAgentRuns {
  version: number;
  runs: AgentRunEntity[];
}

function nowIso() {
  return new Date().toISOString();
}

function cloneFixtures() {
  return structuredClone(AGENT_RUN_FIXTURES);
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function backendRunToEntity(run: Record<string, unknown>): AgentRunEntity {
  const status =
    run.status === "completed" ? "completed" : run.status === "failed" ? "failed" : "running";
  const id = String(run.public_id ?? run.id ?? `ai-run-${Date.now()}`);
  return {
    id,
    applicationId: String(run.application_public_id ?? "application_ai_pm_li_001"),
    processName: String(run.operation ?? "AI 协作流程"),
    candidateName: "李同学",
    jobTitle: "AI 产品经理（校招）",
    status,
    progress: status === "completed" ? 100 : status === "failed" ? 48 : 42,
    startedAt: typeof run.started_at === "string" ? run.started_at : undefined,
    completedAt: typeof run.completed_at === "string" ? run.completed_at : undefined,
    updatedAt: typeof run.updated_at === "string" ? run.updated_at : nowIso(),
    needsHrReview: status !== "running",
    preservedData: ["岗位", "申请", "脱敏输入输出摘要"],
    nextActions: status === "failed" ? ["重试", "转人工复核"] : ["返回业务页面复核结果"],
    failureSummary: status === "failed" ? "后端 AI 运行失败，业务数据已保留。" : undefined,
    hrReview: { note: "", reviewed: false, priority: false, confirmed: false },
    agents: [
      {
        id: `${id}-agent`,
        name: "Provider",
        responsibility: "通过后端 Provider 生成结构化输出，并写入 ai_runs。",
        status: status === "completed" ? "completed" : status === "failed" ? "failed" : "running",
        completedActions: status === "completed" ? ["写入 ai_runs", "返回脱敏摘要"] : [],
        outputSummary: JSON.stringify(run.output_summary ?? {}),
        humanQuestions: status === "completed" ? ["是否确认该运行结果可用于后续业务判断？"] : [],
        evidenceCount: 1,
      },
    ],
    timeline: [
      {
        id: `${id}-timeline`,
        title: String(run.operation ?? "AI 协作流程"),
        status: status === "completed" ? "completed" : status === "failed" ? "failed" : "running",
        businessSummary: `后端运行状态：${status}`,
        keyOutputs: [String(run.provider ?? "provider"), String(run.model ?? "model")],
        detail: JSON.stringify(run.input_summary ?? {}),
      },
    ],
  };
}

export class LocalAgentRunRepository implements AgentRunRepository {
  async list() {
    try {
      const runs = await hirelinkApi.listAgentRuns();
      return runs.map((run) => backendRunToEntity(run));
    } catch {
      if (!canUseStorage()) return cloneFixtures();
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return cloneFixtures();
        const parsed = JSON.parse(raw) as PersistedAgentRuns;
        return parsed.version === STORAGE_VERSION ? parsed.runs : cloneFixtures();
      } catch {
        return cloneFixtures();
      }
    }
  }

  async saveAll(runs: AgentRunEntity[]) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, runs }));
  }

  async clear() {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

const repository = new LocalAgentRunRepository();
let entities: AgentRunEntity[] = cloneFixtures();
let selectedRunId: string | undefined;
let hydrated = false;
let loading = false;
let access: AgentRunState["access"] = "allowed";
const listeners = new Set<() => void>();
const timers = new Set<ReturnType<typeof setTimeout>>();

function createSnapshot(): AgentRunState {
  const runs = toAgentRunViewModels(entities);
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null;
  return {
    hydrated,
    loading,
    access,
    runs,
    selectedRunId,
    selectedRun,
    notFound: Boolean(selectedRunId && !selectedRun),
  };
}

const serverSnapshot: AgentRunState = {
  hydrated: false,
  loading: false,
  access: "allowed",
  runs: [],
  selectedRun: null,
  notFound: false,
};
let snapshot = createSnapshot();

function emit() {
  snapshot = createSnapshot();
  listeners.forEach((listener) => listener());
}

async function persist() {
  await repository.saveAll(entities);
}

async function updateRun(runId: string, updater: (run: AgentRunEntity) => AgentRunEntity) {
  entities = entities.map((run) => (run.id === runId ? updater(run) : run));
  await persist();
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

function completeRetry(runId: string) {
  void updateRun(runId, (run) => ({
    ...run,
    status: "review_required",
    progress: 88,
    updatedAt: nowIso(),
    needsHrReview: true,
    failureSummary: undefined,
    nextActions: ["复核重新生成的评价摘要", "保存内部备注", "确认本次协作结果"],
    agents: run.agents.map((agent) => ({
      ...agent,
      status: agent.status === "failed" ? "completed" : agent.status,
    })),
    timeline: run.timeline.map((step) => ({
      ...step,
      status: step.status === "failed" ? "completed" : step.status,
    })),
  }));
}

export const agentRunStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return snapshot;
  },
  getServerSnapshot() {
    return serverSnapshot;
  },
};

export const agentRunService = {
  async list() {
    if (!hydrated) await this.load();
    return snapshot.runs;
  },
  async get(runId: string) {
    if (!hydrated) await this.load(runId);
    return snapshot.runs.find((run) => run.id === runId) ?? null;
  },
  async load(runId?: string, options: { forbidden?: boolean } = {}) {
    clearTimers();
    access = options.forbidden ? "forbidden" : "allowed";
    loading = true;
    selectedRunId = runId;
    emit();
    await new Promise((resolve) => setTimeout(resolve, 150));
    entities = await repository.list();
    hydrated = true;
    loading = false;
    if (!selectedRunId && entities.length) selectedRunId = entities[0].id;
    emit();
    return snapshot;
  },
  async select(runId: string) {
    selectedRunId = runId;
    emit();
    return this.get(runId);
  },
  async retry(runId: string) {
    clearTimers();
    await updateRun(runId, (run) => ({
      ...run,
      status: "retrying",
      progress: 36,
      updatedAt: nowIso(),
    }));
    later(() => completeRetry(runId), RETRY_DURATION);
  },
  async useFallback(runId: string) {
    await updateRun(runId, (run) => ({
      ...run,
      status: "fallback",
      progress: 100,
      fallbackSummary: "已转为 HR 介入处理，原始业务数据已保留。",
      updatedAt: nowIso(),
      needsHrReview: true,
    }));
  },
  async markReviewed(runId: string) {
    await updateRun(runId, (run) => ({ ...run, hrReview: { ...run.hrReview, reviewed: true } }));
  },
  async togglePriority(runId: string) {
    await updateRun(runId, (run) => ({
      ...run,
      hrReview: { ...run.hrReview, priority: !run.hrReview.priority },
    }));
  },
  async saveHrNote(runId: string, note: string) {
    await updateRun(runId, (run) => ({ ...run, hrReview: { ...run.hrReview, note } }));
  },
  async confirm(runId: string) {
    const timestamp = nowIso();
    await updateRun(runId, (run) => ({
      ...run,
      status: "completed",
      progress: 100,
      completedAt: timestamp,
      updatedAt: timestamp,
      needsHrReview: false,
      hrReview: { ...run.hrReview, confirmed: true, reviewed: true, confirmedAt: timestamp },
    }));
  },
  async resetDemo() {
    clearTimers();
    await repository.clear();
    entities = cloneFixtures();
    selectedRunId = entities[0]?.id;
    hydrated = true;
    loading = false;
    access = "allowed";
    emit();
  },
};
