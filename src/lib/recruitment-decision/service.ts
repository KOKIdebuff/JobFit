import { hirelinkApi } from "@/lib/hirelink-api/service";
import { CANDIDATE_APPLICATION_IDS } from "@/lib/candidate-detail-demo";
import {
  RecruitmentDecisionError,
  type RecruitmentDecision,
  type RecruitmentDecisionHistoryItem,
  type RecruitmentDecisionService,
  type SubmitRecruitmentDecisionInput,
} from "./types";

const DECISION_KEY_PREFIX = "hirelink:recruitment-decision:v1";
const HISTORY_KEY_PREFIX = "hirelink:recruitment-decision-history:v1";
const REQUEST_DELAY = 120;
const INITIAL_UPDATED_AT = "2026-06-17T08:00:00.000Z";
const OPERATOR = { id: "hr_chen_001", name: "陈经理" } as const;
const knownApplicationIds = new Set<string>(CANDIDATE_APPLICATION_IDS);
const listeners = new Map<string, Set<() => void>>();

function delay() {
  return new Promise<void>((resolve) => setTimeout(resolve, REQUEST_DELAY));
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function assertKnownApplication(applicationId: string) {
  if (!knownApplicationIds.has(applicationId)) {
    throw new RecruitmentDecisionError("not_found", "未找到该候选人申请的决策记录。");
  }
}

function decisionKey(applicationId: string) {
  return `${DECISION_KEY_PREFIX}:${applicationId}`;
}

function historyKey(applicationId: string) {
  return `${HISTORY_KEY_PREFIX}:${applicationId}`;
}

function createPendingDecision(applicationId: string): RecruitmentDecision {
  return {
    id: `recruitment_decision_${applicationId}`,
    applicationId,
    status: "pending",
    updatedAt: INITIAL_UPDATED_AT,
    version: 0,
  };
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    throw new RecruitmentDecisionError("storage_error", "本地决策数据读取失败，请重试。");
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new RecruitmentDecisionError("storage_error", "决策数据保存失败，请检查浏览器存储空间。");
  }
}

function readDecision(applicationId: string) {
  return (
    readJson<RecruitmentDecision>(decisionKey(applicationId)) ??
    createPendingDecision(applicationId)
  );
}

function readHistory(applicationId: string) {
  return readJson<RecruitmentDecisionHistoryItem[]>(historyKey(applicationId)) ?? [];
}

function emit(applicationId: string) {
  listeners.get(applicationId)?.forEach((listener) => listener());
}

function normalizeInput(input: SubmitRecruitmentDecisionInput) {
  const reason = input.reason.trim();
  const internalNote = input.internalNote?.trim() || undefined;
  if (!reason) throw new RecruitmentDecisionError("validation_error", "请填写决策说明。");
  if (input.outcome === "reject" && !internalNote) {
    throw new RecruitmentDecisionError(
      "validation_error",
      "暂不推进时必须填写候选人不可见的内部原因。",
    );
  }
  return { ...input, reason, internalNote: input.outcome === "reject" ? internalNote : undefined };
}

function isSameDecision(current: RecruitmentDecision, input: ReturnType<typeof normalizeInput>) {
  return (
    current.status === "submitted" &&
    current.outcome === input.outcome &&
    current.reason === input.reason &&
    (current.internalNote ?? undefined) === (input.internalNote ?? undefined)
  );
}

export const recruitmentDecisionService: RecruitmentDecisionService = {
  async get(applicationId) {
    try {
      const detail = await hirelinkApi.applicationDetail(applicationId);
      if (detail.decision) return detail.decision;
    } catch {
      // Use the local compatibility store when the backend is unavailable.
    }
    await delay();
    assertKnownApplication(applicationId);
    return readDecision(applicationId);
  },

  async submit(rawInput) {
    try {
      const next = await hirelinkApi.submitDecision(rawInput);
      emit(rawInput.applicationId);
      return next;
    } catch (error) {
      if (!(error instanceof Error)) throw error;
    }
    await delay();
    assertKnownApplication(rawInput.applicationId);
    const input = normalizeInput(rawInput);
    const current = readDecision(input.applicationId);
    if (isSameDecision(current, input)) return current;
    if (current.version !== input.expectedVersion) {
      throw new RecruitmentDecisionError(
        "version_conflict",
        "该决策已在其他页面更新，请刷新最新状态后再提交。",
      );
    }
    const now = new Date().toISOString();
    const next: RecruitmentDecision = {
      id: current.id,
      applicationId: input.applicationId,
      status: "submitted",
      outcome: input.outcome,
      reason: input.reason,
      internalNote: input.internalNote,
      decidedBy: OPERATOR,
      decidedAt: now,
      updatedAt: now,
      version: current.version + 1,
    };
    const historyItem: RecruitmentDecisionHistoryItem = {
      id: `decision_history_${input.applicationId}_v${next.version}`,
      applicationId: input.applicationId,
      previousOutcome: current.outcome,
      nextOutcome: input.outcome,
      reason: input.reason,
      operatorName: OPERATOR.name,
      createdAt: now,
    };
    writeJson(decisionKey(input.applicationId), next);
    writeJson(historyKey(input.applicationId), [historyItem, ...readHistory(input.applicationId)]);
    emit(input.applicationId);
    return next;
  },

  async getHistory(applicationId) {
    await delay();
    assertKnownApplication(applicationId);
    return readHistory(applicationId);
  },

  subscribe(applicationId, listener) {
    const applicationListeners = listeners.get(applicationId) ?? new Set<() => void>();
    applicationListeners.add(listener);
    listeners.set(applicationId, applicationListeners);
    const onStorage = (event: StorageEvent) => {
      if (event.key === decisionKey(applicationId) || event.key === historyKey(applicationId))
        listener();
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      applicationListeners.delete(listener);
      if (applicationListeners.size === 0) listeners.delete(applicationId);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  },
};

export function resetDecisionMock(applicationId: string) {
  assertKnownApplication(applicationId);
  if (!canUseStorage()) return;
  window.localStorage.removeItem(decisionKey(applicationId));
  window.localStorage.removeItem(historyKey(applicationId));
  emit(applicationId);
}
