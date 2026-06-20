export type HumanInterviewType = "online" | "offline";

export type HumanInterviewInvitationStatus = "draft" | "active" | "revoked" | "expired" | "booked";

export type HumanInterviewBookingStatus =
  | "draft"
  | "pending_confirmation"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "completed"
  | "candidate_no_show"
  | "interviewer_no_show"
  | "expired";

export type AvailabilitySlotStatus = "available" | "locked" | "booked" | "released";

export type HumanInterviewReportStatus = "draft" | "pending_hr_review" | "published";

export interface HumanInterviewParticipant {
  id: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
}

export interface HumanInterviewContact {
  name: string;
  email: string;
  phone: string;
  note?: string;
}

export interface HumanInterviewInvitation {
  id: string;
  token: string;
  applicationId: string;
  candidate: HumanInterviewParticipant;
  jobTitle: string;
  company: string;
  createdByHr: HumanInterviewParticipant;
  primaryInterviewer: HumanInterviewParticipant;
  interviewType: HumanInterviewType;
  status: HumanInterviewInvitationStatus;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  bookingId?: string;
  meetingLink: string;
  locationTemplate: string;
}

export interface HumanInterviewAvailabilitySlot {
  id: string;
  interviewerId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: AvailabilitySlotStatus;
  bookingId?: string;
}

export interface HumanInterviewBooking {
  id: string;
  invitationId: string;
  applicationId: string;
  candidate: HumanInterviewParticipant;
  primaryInterviewer: HumanInterviewParticipant;
  interviewType: HumanInterviewType;
  status: HumanInterviewBookingStatus;
  slotId: string;
  startAt: string;
  endAt: string;
  timezone: string;
  meetingLink?: string;
  location?: string;
  contact: HumanInterviewContact;
  createdAt: string;
  updatedAt: string;
  cancellationReason?: string;
  rescheduledFromBookingId?: string;
  reportId?: string;
}

export interface HumanInterviewReport {
  id: string;
  bookingId: string;
  applicationId: string;
  status: HumanInterviewReportStatus;
  conclusion: string;
  abilityAssessment: string;
  keyObservations: string[];
  risksAndFollowups: string[];
  candidateSummary: string;
  internalNotes: string;
  authorInterviewer: HumanInterviewParticipant;
  reviewerHr?: HumanInterviewParticipant;
  submittedAt?: string;
  publishedAt?: string;
  revision: number;
}

export interface HumanInterviewWorkspace {
  applicationId: string;
  invitation: HumanInterviewInvitation | null;
  interviewers: HumanInterviewParticipant[];
  slots: HumanInterviewAvailabilitySlot[];
  bookings: HumanInterviewBooking[];
  reports: HumanInterviewReport[];
}

export interface HumanInterviewInvitationView extends HumanInterviewWorkspace {
  token: string;
}

export interface CandidateHumanInterviews {
  bookings: HumanInterviewBooking[];
  reports: HumanInterviewReport[];
  slots: HumanInterviewAvailabilitySlot[];
}

export interface SaveInvitationSettingsInput {
  applicationId: string;
  primaryInterviewerId: string;
  interviewType: HumanInterviewType;
  meetingLink: string;
  locationTemplate: string;
}

export interface AddAvailabilitySlotInput {
  applicationId: string;
  interviewerId: string;
  startAt: string;
  endAt: string;
  timezone: string;
}

export interface ConfirmHumanInterviewInput {
  token: string;
  slotId: string;
  contact: HumanInterviewContact;
}

export interface RescheduleHumanInterviewInput {
  bookingId: string;
  slotId: string;
  reason?: string;
}

export interface UpdateBookingStatusInput {
  bookingId: string;
  status: HumanInterviewBookingStatus;
  reason?: string;
}

export interface SaveHumanInterviewReportInput {
  bookingId: string;
  conclusion: string;
  abilityAssessment: string;
  keyObservations: string[];
  risksAndFollowups: string[];
  candidateSummary: string;
  internalNotes: string;
  submitForReview?: boolean;
}
