import {
  createEmptyReportState,
  createEvaluationReport,
  getReportInputDataVersion,
  isReportApplicationId,
} from "./adapter";
import {
  REPORT_DEMO_IDS,
  REPORT_GENERATION_STEPS,
  type EvaluationReport,
  type EvaluationReportState,
} from "./types";

const STORAGE_KEY = "hirelink:evaluation-report:v1";
const STORAGE_VERSION = 1;
const GENERATION_DURATION = 2800;

interface PersistedState {
  version: number;
  state: EvaluationReportState;
}

let state: EvaluationReportState = createEmptyReportState();
const serverSnapshot: EvaluationReportState = createEmptyReportState();
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
    state: { ...state, loading: false, hydrated: true },
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

function readPersistedState() {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    return parsed.version === STORAGE_VERSION ? parsed.state : null;
  } catch {
    return null;
  }
}

function update(
  updater: (current: EvaluationReportState) => EvaluationReportState,
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

function completeGeneration(failed: boolean, fallback = false) {
  update((current) => {
    if (failed) {
      return {
        ...current,
        report: current.report
          ? {
              ...current.report,
              status: "failed",
              generationError: "证据链报告生成失败，上游简历、匹配、面试和岗位任务数据均已保留。",
              generationActiveStep: Math.max(2, current.report.generationActiveStep),
            }
          : createFailedReport(),
      };
    }
    return {
      ...current,
      report: createEvaluationReport({
        status: fallback ? "fallback" : "pending_review",
        previous: current.report,
      }),
    };
  });
}

function createFailedReport(): EvaluationReport {
  const report = createEvaluationReport({ status: "fallback", previous: state.report });
  return {
    ...report,
    status: "failed",
    generationError: "证据链报告生成失败，上游简历、匹配、面试和岗位任务数据均已保留。",
    generationActiveStep: 2,
  };
}

function resumeGeneration() {
  const report = state.report;
  if (!report || report.status !== "generating" || !report.generationStartedAt) return;
  clearTimers();
  const elapsed = Date.now() - new Date(report.generationStartedAt).getTime();
  if (elapsed >= GENERATION_DURATION) {
    completeGeneration(false);
    return;
  }
  const stepDuration = GENERATION_DURATION / REPORT_GENERATION_STEPS.length;
  const activeStep = Math.min(
    REPORT_GENERATION_STEPS.length - 1,
    Math.floor(elapsed / stepDuration),
  );
  update(
    (current) => ({
      ...current,
      report: current.report
        ? { ...current.report, generationActiveStep: activeStep }
        : current.report,
    }),
    { persist: false },
  );
  for (let index = activeStep + 1; index < REPORT_GENERATION_STEPS.length; index += 1) {
    later(
      () => {
        update((current) => ({
          ...current,
          report: current.report
            ? { ...current.report, generationActiveStep: index }
            : current.report,
        }));
      },
      Math.max(0, index * stepDuration - elapsed),
    );
  }
  later(() => completeGeneration(false), Math.max(0, GENERATION_DURATION - elapsed));
}

function beginGeneration(options: { fail?: boolean; fallback?: boolean } = {}) {
  clearTimers();
  const previous = state.report;
  const startedAt = nowIso();
  const placeholder = createEvaluationReport({
    status: previous?.status === "stale" ? "pending_review" : "pending_review",
    previous,
  });
  update((current) => ({
    ...current,
    report: {
      ...placeholder,
      status: "generating",
      generationStartedAt: startedAt,
      generationActiveStep: 0,
      generationError: undefined,
      generatedAt: previous?.generatedAt,
      version: previous?.version || 0,
      id: previous?.id || `evaluation_report_${REPORT_DEMO_IDS.application}_draft`,
    },
  }));

  const stepDuration = GENERATION_DURATION / REPORT_GENERATION_STEPS.length;
  REPORT_GENERATION_STEPS.forEach((_, index) => {
    later(() => {
      update((current) => ({
        ...current,
        report: current.report
          ? { ...current.report, generationActiveStep: index }
          : current.report,
      }));
    }, index * stepDuration);
  });
  later(
    () => completeGeneration(Boolean(options.fail), Boolean(options.fallback)),
    GENERATION_DURATION,
  );
}

export const evaluationReportStore = {
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

export const evaluationReportService = {
  async load(applicationId: string = REPORT_DEMO_IDS.application) {
    if (!isReportApplicationId(applicationId)) {
      state = { ...createEmptyReportState(), hydrated: true, loading: false, access: "forbidden" };
      emit();
      return state;
    }
    if (state.hydrated) {
      this.syncStale();
      return state;
    }
    state = { ...state, loading: true };
    emit();
    await new Promise((resolve) => setTimeout(resolve, 220));
    const persisted = readPersistedState();
    state = persisted
      ? { ...persisted, hydrated: true, loading: false, access: "allowed" }
      : { ...createEmptyReportState(), hydrated: true, loading: false, access: "allowed" };
    emit();
    this.syncStale();
    resumeGeneration();
    return state;
  },

  generate(options: { fail?: boolean } = {}) {
    beginGeneration(options);
  },

  retry(options: { fail?: boolean } = {}) {
    beginGeneration(options);
  },

  useFallback() {
    clearTimers();
    completeGeneration(false, true);
  },

  confirm(confirmedBy = "陈经理") {
    update((current) => {
      if (
        !current.report ||
        !["pending_review", "fallback", "stale"].includes(current.report.status)
      ) {
        return current;
      }
      const confirmedAt = nowIso();
      return {
        ...current,
        report: {
          ...current.report,
          status: "confirmed",
          confirmedAt,
          confirmedBy,
          hrReview: {
            ...current.report.hrReview,
            reviewed: true,
            confirmedAt,
            confirmedBy,
          },
        },
      };
    });
  },

  markStale(reason = "上游匹配、面试或任务数据发生变化，当前报告需要重新生成。") {
    update((current) => {
      if (!current.report || current.report.status === "generating") return current;
      return {
        ...current,
        report: {
          ...current.report,
          status: "stale",
          staleReason: reason,
        },
      };
    });
  },

  syncStale() {
    const report = state.report;
    if (!report || ["generating", "failed", "not_generated"].includes(report.status)) return;
    const currentVersion = getReportInputDataVersion();
    if (report.inputDataVersion !== currentVersion && report.status !== "stale") {
      this.markStale("上游匹配、面试或任务数据已经更新，旧报告版本仍保留。");
    }
  },

  saveHrNote(note: string) {
    update((current) =>
      current.report
        ? {
            ...current,
            report: {
              ...current.report,
              hrReview: { ...current.report.hrReview, note: note.trim() },
            },
          }
        : current,
    );
  },

  markReviewed() {
    update((current) =>
      current.report
        ? {
            ...current,
            report: {
              ...current.report,
              hrReview: { ...current.report.hrReview, reviewed: true },
            },
          }
        : current,
    );
  },

  togglePriority() {
    update((current) =>
      current.report
        ? {
            ...current,
            report: {
              ...current.report,
              hrReview: { ...current.report.hrReview, priority: !current.report.hrReview.priority },
            },
          }
        : current,
    );
  },

  markCandidateRead() {
    update((current) =>
      current.report
        ? {
            ...current,
            report: {
              ...current.report,
              hrReview: { ...current.report.hrReview, candidateReadAt: nowIso() },
            },
          }
        : current,
    );
  },

  addGrowthAction(actionId: string) {
    update((current) => {
      if (!current.report) return current;
      return {
        ...current,
        report: {
          ...current.report,
          hrReview: {
            ...current.report.hrReview,
            growthActions: current.report.hrReview.growthActions.map((action) =>
              action.id === actionId ? { ...action, done: true, updatedAt: nowIso() } : action,
            ),
          },
        },
      };
    });
  },

  resetDemo() {
    clearTimers();
    if (canUseStorage()) window.localStorage.removeItem(STORAGE_KEY);
    state = { ...createEmptyReportState(), hydrated: true, access: "allowed" };
    emit();
  },
};
