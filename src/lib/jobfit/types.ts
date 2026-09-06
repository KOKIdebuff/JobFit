export type InterviewStatus =
  | "PREPARING"
  | "ASKING"
  | "WAITING_FOR_ANSWER"
  | "EVALUATING"
  | "DECIDING"
  | "COMPLETED"
  | "REPORT_GENERATION"
  | "FAILED";
export type NextAction =
  | "FOLLOW_UP"
  | "CHALLENGE"
  | "REQUEST_EXAMPLE"
  | "SCENARIO"
  | "INCREASE_DIFFICULTY"
  | "DECREASE_DIFFICULTY"
  | "CLARIFY"
  | "NEXT_COMPETENCY"
  | "END_INTERVIEW";

export interface Competency {
  id: string;
  name: string;
  description: string;
  weight: number;
  rubric: Record<string, string>;
  question_strategy: string[];
  evidence_requirements: string[];
}
export interface CompetencyProfile {
  id: "ai_engineer" | "java_engineer" | "product_manager";
  name: string;
  version: string;
  competencies: Competency[];
}
export interface InterviewMessage {
  id: string;
  turn_index: number;
  role: "assistant" | "user";
  content: string;
  input_method: "text" | "speech_to_text";
  competency_id: string;
  strategy: string;
  difficulty: number;
}
export interface InterviewSession {
  id: string;
  status: InterviewStatus;
  current_competency_id: string | null;
  current_difficulty: number;
  turn_count: number;
  version: number;
  covered_competencies: string[];
  messages: InterviewMessage[];
  current_question: string | null;
  next_action?: NextAction;
}
export interface AssessmentReport {
  id: string;
  interview_id: string;
  target_job: string;
  overall_score: number;
  fit_score: number;
  level: string;
  generated_at: string;
  competency_scores: Array<{
    id: string;
    name: string;
    score: number;
    weight: number;
    evidence_ids: string[];
  }>;
  boundaries: Array<{
    competency_id: string;
    name: string;
    level: number;
    confidence: number;
    evidence_ids: string[];
  }>;
  strengths: Array<Record<string, unknown>>;
  gaps: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
  evidence_refs: Array<Record<string, unknown>>;
}
