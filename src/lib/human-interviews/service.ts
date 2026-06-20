import { apiRequest } from "@/lib/api/client";
import {
  createFallbackReport,
  createFallbackWorkspace,
  HUMAN_INTERVIEW_DEMO_APPLICATION_ID,
  HUMAN_INTERVIEW_DEMO_TOKEN,
  HUMAN_INTERVIEW_EVENT,
} from "./fallback";
import type {
  AddAvailabilitySlotInput,
  CandidateHumanInterviews,
  ConfirmHumanInterviewInput,
  HumanInterviewAvailabilitySlot,
  HumanInterviewBooking,
  HumanInterviewBookingStatus,
  HumanInterviewInvitation,
  HumanInterviewInvitationView,
  HumanInterviewReport,
  HumanInterviewWorkspace,
  RescheduleHumanInterviewInput,
  SaveHumanInterviewReportInput,
  SaveInvitationSettingsInput,
  UpdateBookingStatusInput,
} from "./types";

const STORAGE_KEY = "hirelink:human-interviews:v1";

type StoredState = Record<string, HumanInterviewWorkspace>;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readState(): StoredState {
  if (!canUseBrowserStorage()) {
    return { [HUMAN_INTERVIEW_DEMO_APPLICATION_ID]: createFallbackWorkspace() };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = { [HUMAN_INTERVIEW_DEMO_APPLICATION_ID]: createFallbackWorkspace() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw) as StoredState;
  } catch {
    const initial = { [HUMAN_INTERVIEW_DEMO_APPLICATION_ID]: createFallbackWorkspace() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeState(state: StoredState) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(HUMAN_INTERVIEW_EVENT));
}

function getWorkspaceFromState(applicationId: string) {
  const state = readState();
  if (!state[applicationId]) {
    state[applicationId] = createFallbackWorkspace(applicationId);
    writeState(state);
  }
  return clone(state[applicationId]);
}

function updateWorkspace(
  applicationId: string,
  updater: (workspace: HumanInterviewWorkspace) => HumanInterviewWorkspace,
) {
  const state = readState();
  const current = state[applicationId] ?? createFallbackWorkspace(applicationId);
  const next = updater(clone(current));
  state[applicationId] = next;
  writeState(state);
  return clone(next);
}

function nowIso() {
  return new Date().toISOString();
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function normalizeToken(token: string) {
  return token || HUMAN_INTERVIEW_DEMO_TOKEN;
}

async function withFallback<T>(
  request: () => Promise<T>,
  fallback: () => T | Promise<T>,
): Promise<T> {
  try {
    return await request();
  } catch {
    return fallback();
  }
}

function invitationLink(token: string) {
  if (typeof window === "undefined") return `/candidate/interview-invitations/${token}`;
  return `${window.location.origin}/candidate/interview-invitations/${token}`;
}

function findBooking(bookingId: string) {
  const state = readState();
  for (const workspace of Object.values(state)) {
    const booking = workspace.bookings.find((item) => item.id === bookingId);
    if (booking) return { workspace, booking };
  }
  return null;
}

function availableSlots(workspace: HumanInterviewWorkspace) {
  const interviewerId = workspace.invitation?.primaryInterviewer.id;
  return workspace.slots
    .filter(
      (slot) =>
        slot.status === "available" && (!interviewerId || slot.interviewerId === interviewerId),
    )
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export const humanInterviewService = {
  invitationLink,

  async getHrWorkspace(applicationId: string) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewWorkspace>(
          `/api/v1/applications/${applicationId}/human-interview`,
        ),
      () => getWorkspaceFromState(applicationId),
    );
  },

  async getInvitation(token: string): Promise<HumanInterviewInvitationView> {
    const safeToken = normalizeToken(token);
    return withFallback(
      () =>
        apiRequest<HumanInterviewInvitationView>(
          `/api/v1/candidate/interview-invitations/${safeToken}`,
        ),
      () => {
        const state = readState();
        const workspace =
          Object.values(state).find((item) => item.invitation?.token === safeToken) ??
          getWorkspaceFromState(HUMAN_INTERVIEW_DEMO_APPLICATION_ID);
        return { ...clone(workspace), token: safeToken };
      },
    );
  },

  async getCandidateInterviews(): Promise<CandidateHumanInterviews> {
    return withFallback(
      () => apiRequest<CandidateHumanInterviews>("/api/v1/candidate/human-interviews"),
      () => {
        const workspaces = Object.values(readState());
        return {
          bookings: workspaces.flatMap((workspace) => workspace.bookings),
          reports: workspaces.flatMap((workspace) => workspace.reports),
          slots: workspaces.flatMap((workspace) => availableSlots(workspace)),
        };
      },
    );
  },

  async createInvitation(applicationId: string) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewWorkspace>(
          `/api/v1/applications/${applicationId}/human-interview/invitation`,
          {
            method: "POST",
          },
        ),
      () =>
        updateWorkspace(applicationId, (workspace) => {
          const base = workspace.invitation ?? createFallbackWorkspace(applicationId).invitation;
          workspace.invitation = {
            ...(base as HumanInterviewInvitation),
            applicationId,
            status: "active",
            token: base?.token || HUMAN_INTERVIEW_DEMO_TOKEN,
            createdAt: nowIso(),
            expiresAt: addDaysIso(3),
            revokedAt: undefined,
          };
          return workspace;
        }),
    );
  },

  async revokeInvitation(applicationId: string) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewWorkspace>(
          `/api/v1/applications/${applicationId}/human-interview/invitation/revoke`,
          {
            method: "POST",
          },
        ),
      () =>
        updateWorkspace(applicationId, (workspace) => {
          if (workspace.invitation) {
            workspace.invitation.status = "revoked";
            workspace.invitation.revokedAt = nowIso();
          }
          return workspace;
        }),
    );
  },

  async saveInvitationSettings(input: SaveInvitationSettingsInput) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewWorkspace>(
          `/api/v1/applications/${input.applicationId}/human-interview/settings`,
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        ),
      () =>
        updateWorkspace(input.applicationId, (workspace) => {
          const interviewer =
            workspace.interviewers.find((item) => item.id === input.primaryInterviewerId) ??
            workspace.interviewers[0];
          if (workspace.invitation) {
            workspace.invitation.primaryInterviewer = interviewer;
            workspace.invitation.interviewType = input.interviewType;
            workspace.invitation.meetingLink = input.meetingLink;
            workspace.invitation.locationTemplate = input.locationTemplate;
          }
          return workspace;
        }),
    );
  },

  async addAvailabilitySlot(input: AddAvailabilitySlotInput) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewWorkspace>(
          `/api/v1/applications/${input.applicationId}/human-interview/slots`,
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        ),
      () =>
        updateWorkspace(input.applicationId, (workspace) => {
          const slot: HumanInterviewAvailabilitySlot = {
            id: `hi_slot_${Date.now()}`,
            interviewerId: input.interviewerId,
            startAt: input.startAt,
            endAt: input.endAt,
            timezone: input.timezone,
            status: "available",
          };
          workspace.slots = [...workspace.slots, slot].sort((a, b) =>
            a.startAt.localeCompare(b.startAt),
          );
          return workspace;
        }),
    );
  },

  async removeAvailabilitySlot(applicationId: string, slotId: string) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewWorkspace>(
          `/api/v1/applications/${applicationId}/human-interview/slots/${slotId}`,
          {
            method: "DELETE",
          },
        ),
      () =>
        updateWorkspace(applicationId, (workspace) => {
          workspace.slots = workspace.slots.filter(
            (slot) => slot.id !== slotId || slot.status !== "available",
          );
          return workspace;
        }),
    );
  },

  async confirmBooking(input: ConfirmHumanInterviewInput) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewBooking>("/api/v1/candidate/human-interviews/bookings", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      () => {
        const view = readState();
        const workspace =
          Object.values(view).find((item) => item.invitation?.token === input.token) ??
          createFallbackWorkspace();
        const applicationId = workspace.applicationId;
        const slot = workspace.slots.find((item) => item.id === input.slotId);
        if (!workspace.invitation || !slot || slot.status !== "available") {
          throw new Error("该时间段暂不可预约，请重新选择");
        }
        const booking: HumanInterviewBooking = {
          id: `hi_booking_${Date.now()}`,
          invitationId: workspace.invitation.id,
          applicationId,
          candidate: workspace.invitation.candidate,
          primaryInterviewer: workspace.invitation.primaryInterviewer,
          interviewType: workspace.invitation.interviewType,
          status: "confirmed",
          slotId: slot.id,
          startAt: slot.startAt,
          endAt: slot.endAt,
          timezone: slot.timezone,
          meetingLink:
            workspace.invitation.interviewType === "online"
              ? workspace.invitation.meetingLink
              : undefined,
          location:
            workspace.invitation.interviewType === "offline"
              ? workspace.invitation.locationTemplate
              : undefined,
          contact: input.contact,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        view[applicationId] = {
          ...workspace,
          invitation: { ...workspace.invitation, status: "booked", bookingId: booking.id },
          slots: workspace.slots.map((item) =>
            item.id === slot.id ? { ...item, status: "booked", bookingId: booking.id } : item,
          ),
          bookings: [...workspace.bookings, booking],
        };
        writeState(view);
        return clone(booking);
      },
    );
  },

  async updateBookingStatus(input: UpdateBookingStatusInput) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewBooking>(
          `/api/v1/human-interviews/bookings/${input.bookingId}/status`,
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        ),
      () => {
        const found = findBooking(input.bookingId);
        if (!found) throw new Error("未找到预约记录");
        updateWorkspace(found.workspace.applicationId, (workspace) => {
          workspace.bookings = workspace.bookings.map((booking) =>
            booking.id === input.bookingId
              ? {
                  ...booking,
                  status: input.status,
                  updatedAt: nowIso(),
                  cancellationReason: input.reason ?? booking.cancellationReason,
                }
              : booking,
          );
          if (input.status === "cancelled") {
            workspace.slots = workspace.slots.map((slot) =>
              slot.bookingId === input.bookingId ? { ...slot, status: "released" } : slot,
            );
          }
          const nextBooking = workspace.bookings.find((booking) => booking.id === input.bookingId);
          if (
            nextBooking &&
            shouldEnsureReport(input.status) &&
            !workspace.reports.some((report) => report.bookingId === input.bookingId)
          ) {
            workspace.reports.push(createFallbackReport(nextBooking));
          }
          return workspace;
        });
        return findBooking(input.bookingId)?.booking as HumanInterviewBooking;
      },
    );
  },

  async rescheduleBooking(input: RescheduleHumanInterviewInput) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewBooking>(
          `/api/v1/human-interviews/bookings/${input.bookingId}/reschedule`,
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        ),
      () => {
        const found = findBooking(input.bookingId);
        if (!found) throw new Error("未找到预约记录");
        updateWorkspace(found.workspace.applicationId, (workspace) => {
          const nextSlot = workspace.slots.find((slot) => slot.id === input.slotId);
          if (!nextSlot || nextSlot.status !== "available") throw new Error("该时间段暂不可改期");
          workspace.slots = workspace.slots.map((slot) => {
            if (slot.bookingId === input.bookingId) return { ...slot, status: "released" };
            if (slot.id === input.slotId)
              return { ...slot, status: "booked", bookingId: input.bookingId };
            return slot;
          });
          workspace.bookings = workspace.bookings.map((booking) =>
            booking.id === input.bookingId
              ? {
                  ...booking,
                  slotId: nextSlot.id,
                  startAt: nextSlot.startAt,
                  endAt: nextSlot.endAt,
                  timezone: nextSlot.timezone,
                  status: "rescheduled",
                  updatedAt: nowIso(),
                  cancellationReason: input.reason,
                }
              : booking,
          );
          return workspace;
        });
        return findBooking(input.bookingId)?.booking as HumanInterviewBooking;
      },
    );
  },

  async saveReport(input: SaveHumanInterviewReportInput) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewReport>(
          `/api/v1/human-interviews/bookings/${input.bookingId}/report`,
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        ),
      () => {
        const found = findBooking(input.bookingId);
        if (!found) throw new Error("未找到预约记录");
        updateWorkspace(found.workspace.applicationId, (workspace) => {
          const booking = workspace.bookings.find((item) => item.id === input.bookingId);
          if (!booking) return workspace;
          const current = workspace.reports.find((report) => report.bookingId === input.bookingId);
          const report: HumanInterviewReport = {
            ...(current ?? createFallbackReport(booking)),
            status: input.submitForReview ? "pending_hr_review" : (current?.status ?? "draft"),
            conclusion: input.conclusion,
            abilityAssessment: input.abilityAssessment,
            keyObservations: input.keyObservations,
            risksAndFollowups: input.risksAndFollowups,
            candidateSummary: input.candidateSummary,
            internalNotes: input.internalNotes,
            submittedAt: input.submitForReview ? nowIso() : current?.submittedAt,
            revision: (current?.revision ?? 0) + 1,
          };
          workspace.reports = current
            ? workspace.reports.map((item) => (item.id === report.id ? report : item))
            : [...workspace.reports, report];
          workspace.bookings = workspace.bookings.map((item) =>
            item.id === input.bookingId ? { ...item, reportId: report.id } : item,
          );
          return workspace;
        });
        const state = readState();
        return Object.values(state)
          .flatMap((workspace) => workspace.reports)
          .find((report) => report.bookingId === input.bookingId) as HumanInterviewReport;
      },
    );
  },

  async publishReport(bookingId: string) {
    return withFallback(
      () =>
        apiRequest<HumanInterviewReport>(
          `/api/v1/human-interviews/bookings/${bookingId}/report/publish`,
          {
            method: "POST",
          },
        ),
      () => {
        const found = findBooking(bookingId);
        if (!found) throw new Error("未找到预约记录");
        updateWorkspace(found.workspace.applicationId, (workspace) => {
          workspace.reports = workspace.reports.map((report) =>
            report.bookingId === bookingId
              ? {
                  ...report,
                  status: "published",
                  publishedAt: nowIso(),
                  reviewerHr: workspace.invitation?.createdByHr,
                }
              : report,
          );
          return workspace;
        });
        const state = readState();
        return Object.values(state)
          .flatMap((workspace) => workspace.reports)
          .find((report) => report.bookingId === bookingId) as HumanInterviewReport;
      },
    );
  },
};

function shouldEnsureReport(status: HumanInterviewBookingStatus) {
  return (
    status === "completed" || status === "candidate_no_show" || status === "interviewer_no_show"
  );
}
