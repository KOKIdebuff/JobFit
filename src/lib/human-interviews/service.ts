import { notificationService } from "@/lib/notifications/service";
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
  CompletePendingConfirmationInput,
  ConfirmHumanInterviewInput,
  HumanInterviewAvailabilitySlot,
  HumanInterviewBooking,
  HumanInterviewBookingStatus,
  HumanInterviewInvitation,
  HumanInterviewInvitationView,
  HumanInterviewMaintenanceResult,
  HumanInterviewReport,
  HumanInterviewWorkspace,
  RequestPendingConfirmationInput,
  RescheduleHumanInterviewInput,
  SaveHumanInterviewReportInput,
  SaveInvitationSettingsInput,
  SendInvitationResult,
  UpdateBookingStatusInput,
} from "./types";

const STORAGE_KEY = "hirelink:human-interviews:v2";
const REMINDER_STORAGE_KEY = "hirelink:human-interview-reminders:v1";
const PENDING_CONFIRMATION_TTL_HOURS = 6;
const REMINDER_WINDOW_HOURS = 24;

type StoredState = Record<string, HumanInterviewWorkspace>;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readState(): StoredState {
  const initial = { [HUMAN_INTERVIEW_DEMO_APPLICATION_ID]: createFallbackWorkspace() };
  if (!canUseBrowserStorage()) return initial;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(raw) as StoredState;
    return Object.keys(parsed).length ? parsed : initial;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

function writeState(state: StoredState) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(HUMAN_INTERVIEW_EVENT));
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

function getWorkspaceFromState(applicationId: string) {
  const state = readState();
  if (!state[applicationId]) {
    state[applicationId] = createFallbackWorkspace(applicationId);
    writeState(state);
  }
  return clone(state[applicationId]);
}

function nowIso() {
  return new Date().toISOString();
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function addHoursIso(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function readReminderKeys() {
  if (!canUseBrowserStorage()) return new Set<string>();
  const raw = window.localStorage.getItem(REMINDER_STORAGE_KEY);
  if (!raw) return new Set<string>();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

function writeReminderKeys(keys: Set<string>) {
  if (!canUseBrowserStorage()) return;
  window.localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify([...keys]));
}

function normalizeToken(token: string) {
  return token || HUMAN_INTERVIEW_DEMO_TOKEN;
}

function invitationLink(token: string) {
  if (typeof window === "undefined") return `/human-interviews/invitations/${token}`;
  return `${window.location.origin}/human-interviews/invitations/${token}`;
}

function findWorkspaceByToken(token: string) {
  const state = readState();
  return Object.values(state).find((item) => item.invitation?.token === token) ?? null;
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

function sendReadiness(workspace: HumanInterviewWorkspace) {
  const invitation = workspace.invitation;
  const missing: string[] = [];
  if (!invitation) missing.push("预约设置");
  if (!invitation?.primaryInterviewer?.id) missing.push("主面试官");
  if (invitation?.interviewType === "online" && !invitation.meetingLink.trim()) {
    missing.push("会议链接");
  }
  if (invitation?.interviewType === "offline" && !invitation.locationTemplate.trim()) {
    missing.push("线下面试地点");
  }
  if (!availableSlots(workspace).length) missing.push("可预约时间段");
  return missing;
}

async function createInvitationNotification(
  invitation: HumanInterviewInvitation,
  type: "human_interview_invited" | "human_interview_invitation_updated",
) {
  const href = `/human-interviews/invitations/${invitation.token}`;
  return notificationService.create({
    type,
    title: type === "human_interview_invited" ? "真人面试预约邀约" : "真人面试邀约已更新",
    body:
      type === "human_interview_invited"
        ? `${invitation.company} 邀请你选择 ${invitation.jobTitle} 的真人面试时间。`
        : `${invitation.company} 更新了 ${invitation.jobTitle} 的真人面试安排，请查看新的预约入口。`,
    href,
    entityType: "human_interview_invitation",
    entityPublicId: invitation.id,
    payload: {
      invitationId: invitation.id,
      applicationId: invitation.applicationId,
      token: invitation.token,
    },
  });
}

export const humanInterviewService = {
  invitationLink,
  sendReadiness,

  async getHrWorkspace(applicationId: string) {
    return getWorkspaceFromState(applicationId);
  },

  async getInvitation(token: string): Promise<HumanInterviewInvitationView> {
    const safeToken = normalizeToken(token);
    const workspace =
      findWorkspaceByToken(safeToken) ?? getWorkspaceFromState(HUMAN_INTERVIEW_DEMO_APPLICATION_ID);
    if (!workspace.invitation) throw new Error("该预约邀约不存在或已经失效");
    return {
      ...clone(workspace),
      token: safeToken,
      publicPreview: true,
      sensitiveHidden: true,
      requiresLoginToBook: true,
    };
  },

  async getCandidateInterviews(): Promise<CandidateHumanInterviews> {
    const workspaces = Object.values(readState());
    return {
      bookings: workspaces.flatMap((workspace) => workspace.bookings),
      reports: workspaces.flatMap((workspace) => workspace.reports),
      slots: workspaces.flatMap((workspace) => availableSlots(workspace)),
    };
  },

  async saveInvitationSettings(input: SaveInvitationSettingsInput) {
    return updateWorkspace(input.applicationId, (workspace) => {
      const interviewer =
        workspace.interviewers.find((item) => item.id === input.primaryInterviewerId) ??
        workspace.interviewers[0];
      const current =
        workspace.invitation ?? createFallbackWorkspace(input.applicationId).invitation;
      workspace.invitation = {
        ...(current as HumanInterviewInvitation),
        applicationId: input.applicationId,
        primaryInterviewer: interviewer,
        interviewType: input.interviewType,
        meetingLink: input.meetingLink,
        locationTemplate: input.locationTemplate,
        arrivalInstructions: input.arrivalInstructions,
        status:
          current?.status === "active" || current?.status === "booked" ? current.status : "draft",
        needsResend: Boolean(current?.lastSentAt),
      };
      return workspace;
    });
  },

  async createInvitation(applicationId: string) {
    return updateWorkspace(applicationId, (workspace) => {
      const base = workspace.invitation ?? createFallbackWorkspace(applicationId).invitation;
      workspace.invitation = {
        ...(base as HumanInterviewInvitation),
        applicationId,
        status: "draft",
        token: base?.token || HUMAN_INTERVIEW_DEMO_TOKEN,
        createdAt: base?.createdAt || nowIso(),
        expiresAt: base?.expiresAt || addDaysIso(3),
        revokedAt: undefined,
        needsResend: false,
      };
      return workspace;
    });
  },

  async sendInvitation(applicationId: string): Promise<SendInvitationResult> {
    const workspace = getWorkspaceFromState(applicationId);
    const missing = sendReadiness(workspace);
    if (missing.length) throw new Error(`请先补齐：${missing.join("、")}`);
    let notificationId = "";
    const next = updateWorkspace(applicationId, (draft) => {
      if (!draft.invitation) return draft;
      draft.invitation = {
        ...draft.invitation,
        status: "active",
        lastSentAt: nowIso(),
        expiresAt: draft.invitation.expiresAt || addDaysIso(3),
        revokedAt: undefined,
        needsResend: false,
      };
      return draft;
    });
    if (next.invitation) {
      const notification = await createInvitationNotification(
        next.invitation,
        "human_interview_invited",
      );
      notificationId = notification.id;
    }
    return { workspace: next, notificationId };
  },

  async resendInvitation(applicationId: string): Promise<SendInvitationResult> {
    const workspace = getWorkspaceFromState(applicationId);
    const missing = sendReadiness(workspace);
    if (missing.length) throw new Error(`请先补齐：${missing.join("、")}`);
    let notificationId = "";
    const next = updateWorkspace(applicationId, (current) => {
      if (!current.invitation) return current;
      current.invitation = {
        ...current.invitation,
        status: "active",
        lastSentAt: nowIso(),
        needsResend: false,
      };
      return current;
    });
    if (next.invitation) {
      const notification = await createInvitationNotification(
        next.invitation,
        "human_interview_invitation_updated",
      );
      notificationId = notification.id;
    }
    return { workspace: next, notificationId };
  },

  async revokeInvitation(applicationId: string) {
    return updateWorkspace(applicationId, (workspace) => {
      if (workspace.invitation) {
        workspace.invitation.status = "revoked";
        workspace.invitation.revokedAt = nowIso();
      }
      return workspace;
    });
  },

  async addAvailabilitySlot(input: AddAvailabilitySlotInput) {
    return updateWorkspace(input.applicationId, (workspace) => {
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
      if (workspace.invitation?.lastSentAt) workspace.invitation.needsResend = true;
      return workspace;
    });
  },

  async removeAvailabilitySlot(applicationId: string, slotId: string) {
    return updateWorkspace(applicationId, (workspace) => {
      workspace.slots = workspace.slots.filter(
        (slot) => slot.id !== slotId || slot.status !== "available",
      );
      if (workspace.invitation?.lastSentAt) workspace.invitation.needsResend = true;
      return workspace;
    });
  },

  async confirmBooking(input: ConfirmHumanInterviewInput) {
    const workspace = findWorkspaceByToken(input.token) ?? createFallbackWorkspace();
    const applicationId = workspace.applicationId;
    const slot = workspace.slots.find((item) => item.id === input.slotId);
    if (!workspace.invitation || workspace.invitation.status !== "active") {
      throw new Error("该预约入口尚未开放或已经失效");
    }
    if (!slot || slot.status !== "available") {
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
      arrivalInstructions: workspace.invitation.arrivalInstructions,
      contact: input.contact,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const state = readState();
    state[applicationId] = {
      ...workspace,
      invitation: { ...workspace.invitation, status: "booked", bookingId: booking.id },
      slots: workspace.slots.map((item) =>
        item.id === slot.id ? { ...item, status: "booked", bookingId: booking.id } : item,
      ),
      bookings: [...workspace.bookings, booking],
    };
    writeState(state);
    await notificationService.create({
      type: "human_interview_booking_confirmed",
      title: "真人面试时间已确认",
      body: `${workspace.invitation.company} 的真人面试时间已确认。`,
      href: "/human-interviews/candidate",
      entityType: "human_interview_booking",
      entityPublicId: booking.id,
      payload: { bookingId: booking.id, applicationId },
    });
    return clone(booking);
  },

  async requestPendingConfirmation(input: RequestPendingConfirmationInput) {
    const found = findBooking(input.bookingId);
    if (!found) throw new Error("未找到预约记录");
    if (found.booking.status !== "confirmed") {
      throw new Error("只有已预约记录可以置为待确认");
    }
    const reason = input.reason.trim();
    if (!reason) throw new Error("请填写待确认原因");
    updateWorkspace(found.workspace.applicationId, (workspace) => {
      workspace.bookings = workspace.bookings.map((booking) =>
        booking.id === input.bookingId
          ? {
              ...booking,
              status: "pending_confirmation",
              pendingConfirmationExpiresAt: addHoursIso(PENDING_CONFIRMATION_TTL_HOURS),
              pendingConfirmationReason: reason,
              updatedAt: nowIso(),
            }
          : booking,
      );
      return workspace;
    });
    return findBooking(input.bookingId)?.booking as HumanInterviewBooking;
  },

  async completePendingConfirmation(input: CompletePendingConfirmationInput) {
    const found = findBooking(input.bookingId);
    if (!found) throw new Error("未找到预约记录");
    if (found.booking.status !== "pending_confirmation") {
      throw new Error("只有待补全确认的预约可以恢复确认");
    }
    const meetingLink = input.meetingLink?.trim();
    const location = input.location?.trim();
    const arrivalInstructions = input.arrivalInstructions?.trim();
    if (found.booking.interviewType === "online" && !meetingLink) {
      throw new Error("请补齐会议链接");
    }
    if (found.booking.interviewType === "offline" && !location) {
      throw new Error("请补齐线下面试地点");
    }
    updateWorkspace(found.workspace.applicationId, (workspace) => {
      workspace.bookings = workspace.bookings.map((booking) =>
        booking.id === input.bookingId
          ? {
              ...booking,
              status: "confirmed",
              meetingLink: booking.interviewType === "online" ? meetingLink : undefined,
              location: booking.interviewType === "offline" ? location : undefined,
              arrivalInstructions,
              pendingConfirmationExpiresAt: undefined,
              pendingConfirmationReason: undefined,
              updatedAt: nowIso(),
            }
          : booking,
      );
      if (workspace.invitation?.bookingId === input.bookingId) {
        workspace.invitation = {
          ...workspace.invitation,
          meetingLink:
            workspace.invitation.interviewType === "online"
              ? (meetingLink ?? workspace.invitation.meetingLink)
              : workspace.invitation.meetingLink,
          locationTemplate:
            workspace.invitation.interviewType === "offline"
              ? (location ?? workspace.invitation.locationTemplate)
              : workspace.invitation.locationTemplate,
          arrivalInstructions,
        };
      }
      return workspace;
    });
    return findBooking(input.bookingId)?.booking as HumanInterviewBooking;
  },

  async expirePendingConfirmations(): Promise<HumanInterviewMaintenanceResult> {
    const state = readState();
    const now = Date.now();
    const bookingIds: string[] = [];
    for (const workspace of Object.values(state)) {
      const expiredIds = new Set<string>();
      workspace.bookings = workspace.bookings.map((booking) => {
        const expiresAt = booking.pendingConfirmationExpiresAt
          ? new Date(booking.pendingConfirmationExpiresAt).getTime()
          : Number.POSITIVE_INFINITY;
        if (booking.status !== "pending_confirmation" || expiresAt > now) return booking;
        bookingIds.push(booking.id);
        expiredIds.add(booking.id);
        return { ...booking, status: "expired", updatedAt: nowIso() };
      });
      if (expiredIds.size) {
        workspace.slots = workspace.slots.map((slot) =>
          slot.bookingId && expiredIds.has(slot.bookingId)
            ? { ...slot, status: "available", bookingId: undefined }
            : slot,
        );
        if (workspace.invitation?.bookingId && expiredIds.has(workspace.invitation.bookingId)) {
          workspace.invitation = {
            ...workspace.invitation,
            status: "active",
            bookingId: undefined,
          };
        }
      }
    }
    writeState(state);
    return { processedCount: bookingIds.length, bookingIds };
  },

  async createBookingReminders(): Promise<HumanInterviewMaintenanceResult> {
    const reminderKeys = readReminderKeys();
    const now = Date.now();
    const windowEnd = now + REMINDER_WINDOW_HOURS * 60 * 60 * 1000;
    const bookingIds: string[] = [];
    for (const workspace of Object.values(readState())) {
      for (const booking of workspace.bookings) {
        const startAt = new Date(booking.startAt).getTime();
        const reminderKey = `human_interview_booking_reminder:${booking.id}`;
        if (
          booking.status !== "confirmed" ||
          startAt <= now ||
          startAt > windowEnd ||
          reminderKeys.has(reminderKey)
        ) {
          continue;
        }
        reminderKeys.add(reminderKey);
        bookingIds.push(booking.id);
        await notificationService.create({
          type: "human_interview_booking_reminder",
          title: "真人面试即将开始",
          body: `${booking.candidate.name} 的真人面试将在 24 小时内开始，请确认履约信息。`,
          href: `/human-interviews/hr/applications/${booking.applicationId}`,
          entityType: "human_interview_booking",
          entityPublicId: booking.id,
          payload: { bookingId: booking.id, applicationId: booking.applicationId },
        });
      }
    }
    writeReminderKeys(reminderKeys);
    return { processedCount: bookingIds.length, bookingIds };
  },

  async updateBookingStatus(input: UpdateBookingStatusInput) {
    const found = findBooking(input.bookingId);
    if (!found) throw new Error("未找到预约记录");
    if (found.booking.status !== "confirmed") {
      throw new Error("只有已预约记录可以更新履约状态");
    }
    if (
      !["cancelled", "completed", "candidate_no_show", "interviewer_no_show"].includes(input.status)
    ) {
      throw new Error("不支持的预约状态流转");
    }
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
          slot.bookingId === input.bookingId
            ? { ...slot, status: "released", bookingId: undefined }
            : slot,
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

  async rescheduleBooking(input: RescheduleHumanInterviewInput) {
    const found = findBooking(input.bookingId);
    if (!found) throw new Error("未找到预约记录");
    if (found.booking.status !== "confirmed") {
      throw new Error("只有已预约记录可以改期");
    }
    updateWorkspace(found.workspace.applicationId, (workspace) => {
      const nextSlot = workspace.slots.find((slot) => slot.id === input.slotId);
      if (!nextSlot || nextSlot.status !== "available") throw new Error("该时间段暂不可改期");
      workspace.slots = workspace.slots.map((slot) => {
        if (slot.bookingId === input.bookingId)
          return { ...slot, status: "released", bookingId: undefined };
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
              status: "confirmed",
              updatedAt: nowIso(),
              cancellationReason: input.reason,
            }
          : booking,
      );
      return workspace;
    });
    return findBooking(input.bookingId)?.booking as HumanInterviewBooking;
  },

  async saveReport(input: SaveHumanInterviewReportInput) {
    const found = findBooking(input.bookingId);
    if (!found) throw new Error("未找到预约记录");
    if (found.booking.status === "pending_confirmation" || found.booking.status === "expired") {
      throw new Error("当前预约状态不能填写真人面试报告");
    }
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

  async publishReport(bookingId: string) {
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
};

function shouldEnsureReport(status: HumanInterviewBookingStatus) {
  return (
    status === "completed" || status === "candidate_no_show" || status === "interviewer_no_show"
  );
}
