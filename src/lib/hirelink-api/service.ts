import { apiRequest } from "@/lib/api/client";
import type { CandidateDetailDemoState } from "@/lib/candidate-detail-demo";
import type { TrialDemoState } from "@/lib/trial-demo";
import type { EvaluationReportState } from "@/lib/evaluation-report/types";
import type {
  RecruitmentDecision,
  SubmitRecruitmentDecisionInput,
} from "@/lib/recruitment-decision/types";

export interface HrCandidateSummary {
  application_id: string;
  name: string;
  title: string;
  score: number;
  tags: string[];
  location: string;
  note: string;
  detail: CandidateDetailDemoState;
  decision: RecruitmentDecision;
}

export interface HrCandidatesResponse {
  job: Record<string, unknown>;
  candidates: HrCandidateSummary[];
}

export interface CandidateApplicationSummary {
  application_id: string;
  job_id: string;
  job_title: string;
  company: string;
  status: string;
  trial_url: string;
  report_url: string;
}

function reportStateFromResponse(response: {
  report: unknown;
  access: "allowed";
}): EvaluationReportState {
  return {
    loading: false,
    hydrated: true,
    access: response.access,
    report: response.report as EvaluationReportState["report"],
  };
}

function trialStateFromDetail(detail: CandidateDetailDemoState & { trial_state?: TrialDemoState }) {
  return detail.trial_state ?? null;
}

export const hirelinkApi = {
  listJobs() {
    return apiRequest<{ jobs: Array<Record<string, unknown>> }>("/api/v1/jobs");
  },

  hrCandidates(jobId: string) {
    return apiRequest<HrCandidatesResponse>(`/api/v1/hr/jobs/${jobId}/candidates`);
  },

  applicationDetail(applicationId: string) {
    return apiRequest<
      CandidateDetailDemoState & { trial_state?: TrialDemoState; decision?: RecruitmentDecision }
    >(`/api/v1/applications/${applicationId}`);
  },

  async trialState(applicationId: string) {
    const detail = await this.applicationDetail(applicationId);
    return trialStateFromDetail(detail);
  },

  updateTrialTask(applicationId: string, payload: Record<string, unknown>) {
    return apiRequest<TrialDemoState>(`/api/v1/applications/${applicationId}/trial-task`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateTrialSubmission(applicationId: string, payload: Record<string, unknown>) {
    return apiRequest<TrialDemoState>(`/api/v1/applications/${applicationId}/trial-submission`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getReport(applicationId: string) {
    const response = await apiRequest<{ report: unknown; access: "allowed" }>(
      `/api/v1/applications/${applicationId}/report`,
    );
    return reportStateFromResponse(response);
  },

  async generateReport(applicationId: string) {
    const response = await apiRequest<{ report: unknown; access: "allowed" }>(
      `/api/v1/applications/${applicationId}/report/generate`,
      { method: "POST" },
    );
    return reportStateFromResponse(response);
  },

  async confirmReport(applicationId: string) {
    const response = await apiRequest<{ report: unknown; access: "allowed" }>(
      `/api/v1/applications/${applicationId}/report/confirm`,
      { method: "POST" },
    );
    return reportStateFromResponse(response);
  },

  submitDecision(input: SubmitRecruitmentDecisionInput) {
    return apiRequest<RecruitmentDecision>(`/api/v1/applications/${input.applicationId}/decision`, {
      method: "POST",
      body: JSON.stringify({
        outcome: input.outcome,
        reason: input.reason,
        internal_note: input.internalNote,
      }),
    });
  },

  candidateApplications() {
    return apiRequest<{ applications: CandidateApplicationSummary[] }>(
      "/api/v1/candidate/applications",
    );
  },

  async listAgentRuns() {
    const response = await apiRequest<{ runs: Array<Record<string, unknown>> }>("/api/v1/ai-runs");
    return response.runs;
  },
};
