import { apiRequest } from "@/lib/api/client";
import type { AssessmentReport, CompetencyProfile, InterviewSession } from "./types";

export const jobFitApi = {
  profiles: () => apiRequest<{ profiles: CompetencyProfile[] }>("/api/v1/competency-profiles"),
  uploadResume(file: File) {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<{ id: string; structured: Record<string, string[]> }>(
      "/api/v1/resumes/upload",
      { method: "POST", body: form },
    );
  },
  candidateProfile: (resumeId: string) =>
    apiRequest<Record<string, unknown>>("/api/v1/candidate-profiles", {
      method: "POST",
      body: JSON.stringify({ resume_id: resumeId }),
    }),
  jobProfile: (job_role: CompetencyProfile["id"], title: string, jd_text: string) =>
    apiRequest<Record<string, unknown>>("/api/v1/job-profiles", {
      method: "POST",
      body: JSON.stringify({ job_role, title, jd_text, difficulty: 2 }),
    }),
  assessment: (resume_id: string, candidate_profile_id: string, job_profile_id: string) =>
    apiRequest<{ id: string }>("/api/v1/assessments", {
      method: "POST",
      body: JSON.stringify({ resume_id, candidate_profile_id, job_profile_id }),
    }),
  createInterview: (assessment_id: string) =>
    apiRequest<InterviewSession>("/api/v1/interview-sessions", {
      method: "POST",
      body: JSON.stringify({ assessment_id }),
    }),
  startInterview: (id: string) =>
    apiRequest<InterviewSession>(`/api/v1/interview-sessions/${id}/start`, { method: "POST" }),
  interviews: () => apiRequest<{ interviews: InterviewSession[] }>("/api/v1/interview-sessions"),
  interview: (id: string) => apiRequest<InterviewSession>(`/api/v1/interview-sessions/${id}`),
  answer(session: InterviewSession, answer: string, input_method: "text" | "speech_to_text") {
    return apiRequest<InterviewSession>(`/api/v1/interview-sessions/${session.id}/answers`, {
      method: "POST",
      body: JSON.stringify({
        question_id: session.current_question,
        answer,
        input_method,
        client_request_id: crypto.randomUUID(),
        expected_session_version: session.version,
      }),
    });
  },
  generateReport: (id: string) =>
    apiRequest<AssessmentReport>(`/api/v1/interview-sessions/${id}/report`, { method: "POST" }),
  reports: () => apiRequest<{ reports: AssessmentReport[] }>("/api/v1/reports"),
  report: (id: string) => apiRequest<AssessmentReport>(`/api/v1/reports/${id}`),
};
