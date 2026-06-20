import { hirelinkApi } from "@/lib/hirelink-api/service";
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
const GENERATION_DURATION = 1400;

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
    if (parsed.version !== STORAGE_VERSION) return null;
    if (parsed.state.report?.applicationId === REPORT_DEMO_IDS.legacyApplication) {
      return {
        ...parsed.state,
        report: {
          ...parsed.state.report,
          applicationId: REPORT_DEMO_IDS.application,
          summary: {
            ...parsed.state.report.summary,
            applicationDisplayId: REPORT_DEMO_IDS.application,
          },
        },
      } satisfies EvaluationReportState;
    }
    return parsed.state;
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
  const previous = state.report;
  if (failed) {
    update((current) => ({
      ...current,
      loading: false,
      hydrated: true,
      report: previous
        ? {
            ...previous,
            status: "failed",
            generationError: "报告生成失败，请重试或使用兜底结构。",
            generationActiveStep: 2,
          }
        : {
            ...createEvaluationReport({ previous }),
            status: "failed",
            generationError: "报告生成失败，请重试或使用兜底结构。",
            generationActiveStep: 2,
          },
    }));
    return;
  }
  update((current) => ({
    ...current,
    loading: false,
    hydrated: true,
    access: "allowed",
    report: createEvaluationReport({
      status: fallback ? "fallback" : "pending_review",
      previous: current.report,
    }),
  }));
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
    (current) =>
      current.report
        ? { ...current, report: { ...current.report, generationActiveStep: activeStep } }
        : current,
    { persist: false },
  );
  for (let index = activeStep + 1; index < REPORT_GENERATION_STEPS.length; index += 1) {
    const delay = Math.max(0, index * stepDuration - elapsed);
    later(
      () =>
        update((current) =>
          current.report
            ? { ...current, report: { ...current.report, generationActiveStep: index } }
            : current,
        ),
      delay,
    );
  }
  later(() => completeGeneration(false), Math.max(0, GENERATION_DURATION - elapsed));
}

function beginGeneration(options: { fail?: boolean; applicationId?: string } = {}) {
  clearTimers();
  const previous = state.report;
  const startedAt = nowIso();
  const placeholder: EvaluationReport = {
    ...createEvaluationReport({ previous, applicationId: options.applicationId }),
    id: previous?.id || `evaluation_report_${REPORT_DEMO_IDS.application}_draft`,
    status: "generating",
    generationStartedAt: startedAt,
    generationActiveStep: 0,
    generationError: undefined,
  };
  update((current) => ({
    ...current,
    hydrated: true,
    loading: false,
    access: "allowed",
    report: placeholder,
  }));
  const stepDuration = GENERATION_DURATION / REPORT_GENERATION_STEPS.length;
  REPORT_GENERATION_STEPS.forEach((_, index) => {
    later(
      () =>
        update((current) =>
          current.report
            ? { ...current, report: { ...current.report, generationActiveStep: index } }
            : current,
        ),
      index * stepDuration,
    );
  });
  later(() => completeGeneration(Boolean(options.fail)), GENERATION_DURATION);
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
    try {
      state = { ...state, loading: true };
      emit();
      state = await hirelinkApi.getReport(applicationId);
      emit();
      return state;
    } catch {
      if (!isReportApplicationId(applicationId)) {
        state = {
          ...createEmptyReportState(),
          hydrated: true,
          loading: false,
          access: "forbidden",
        };
        emit();
        return state;
      }
      state = { ...state, loading: true };
      emit();
      await new Promise((resolve) => setTimeout(resolve, 150));
      const persisted = readPersistedState();
      state = persisted
        ? { ...persisted, hydrated: true, loading: false, access: "allowed" }
        : { ...createEmptyReportState(), hydrated: true, loading: false, access: "allowed" };
      emit();
      this.syncStale();
      resumeGeneration();
      return state;
    }
  },

  generate(options: { fail?: boolean; applicationId?: string } = {}) {
    beginGeneration(options);
    void hirelinkApi
      .generateReport(options.applicationId ?? REPORT_DEMO_IDS.application)
      .then((next) => {
        state = next;
        persist();
        emit();
      })
      .catch(() => undefined);
  },

  retry(options: { fail?: boolean; applicationId?: string } = {}) {
    this.generate(options);
  },

  useFallback() {
    clearTimers();
    completeGeneration(false, true);
  },

  confirm(confirmedBy = "陈经理", applicationId: string = REPORT_DEMO_IDS.application) {
    void hirelinkApi
      .confirmReport(applicationId)
      .then((next) => {
        state = next;
        persist();
        emit();
      })
      .catch(() => {
        const confirmedAt = nowIso();
        update((current) =>
          current.report && ["pending_review", "fallback", "stale"].includes(current.report.status)
            ? {
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
              }
            : current,
        );
      });
  },

  markStale(reason = "上游匹配、面试或任务数据发生变化，当前报告需要重新生成。") {
    update((current) =>
      current.report && current.report.status !== "generating"
        ? { ...current, report: { ...current.report, status: "stale", staleReason: reason } }
        : current,
    );
  },

  syncStale() {
    const report = state.report;
    if (!report || ["generating", "failed", "not_generated"].includes(report.status)) return;
    const currentVersion = getReportInputDataVersion();
    if (report.inputDataVersion !== currentVersion && report.status !== "stale") {
      this.markStale("上游匹配、面试或任务数据已经更新，旧报告版本仍会保留。");
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
            report: { ...current.report, hrReview: { ...current.report.hrReview, reviewed: true } },
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
