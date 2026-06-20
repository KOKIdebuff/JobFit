import type {
  HumanInterviewAvailabilitySlot,
  HumanInterviewBooking,
  HumanInterviewInvitation,
  HumanInterviewParticipant,
  HumanInterviewReport,
  HumanInterviewWorkspace,
} from "./types";

export const HUMAN_INTERVIEW_DEMO_APPLICATION_ID = "application_ai_pm_li_001";
export const HUMAN_INTERVIEW_DEMO_TOKEN = "hilink-invite-li-202606";
export const HUMAN_INTERVIEW_EVENT = "hirelink:human-interviews-updated";

const candidate: HumanInterviewParticipant = {
  id: "candidate_li_001",
  name: "李同学",
  title: "候选人",
  email: "li.candidate@example.com",
  phone: "13800001234",
};

const hr: HumanInterviewParticipant = {
  id: "hr_chen_001",
  name: "陈经理",
  title: "岗位创建 HR",
  email: "chen.hr@example.com",
};

export const fallbackInterviewers: HumanInterviewParticipant[] = [
  {
    id: "interviewer_wang_001",
    name: "王晓晨",
    title: "AI 产品负责人",
    email: "wang.interviewer@example.com",
    phone: "13900001111",
  },
  {
    id: "interviewer_zhao_001",
    name: "赵雨晴",
    title: "资深产品经理",
    email: "zhao.interviewer@example.com",
    phone: "13900002222",
  },
];

const seedInvitation: HumanInterviewInvitation = {
  id: "hi_invite_001",
  token: HUMAN_INTERVIEW_DEMO_TOKEN,
  applicationId: HUMAN_INTERVIEW_DEMO_APPLICATION_ID,
  candidate,
  jobTitle: "AI 产品经理（校招）",
  company: "星河智能",
  createdByHr: hr,
  primaryInterviewer: fallbackInterviewers[0],
  interviewType: "online",
  status: "active",
  createdAt: "2026-06-20T10:00:00+08:00",
  expiresAt: "2026-06-23T10:00:00+08:00",
  meetingLink: "https://meet.example.com/hirelink-ai-pm-li",
  locationTemplate: "上海市浦东新区张江路 88 号星河智能 12F 观澜会议室",
};

const seedSlots: HumanInterviewAvailabilitySlot[] = [
  {
    id: "hi_slot_001",
    interviewerId: "interviewer_wang_001",
    startAt: "2026-06-22T10:00:00+08:00",
    endAt: "2026-06-22T11:00:00+08:00",
    timezone: "Asia/Shanghai",
    status: "available",
  },
  {
    id: "hi_slot_002",
    interviewerId: "interviewer_wang_001",
    startAt: "2026-06-22T15:00:00+08:00",
    endAt: "2026-06-22T16:00:00+08:00",
    timezone: "Asia/Shanghai",
    status: "available",
  },
  {
    id: "hi_slot_003",
    interviewerId: "interviewer_wang_001",
    startAt: "2026-06-23T14:00:00+08:00",
    endAt: "2026-06-23T15:00:00+08:00",
    timezone: "Asia/Shanghai",
    status: "available",
  },
  {
    id: "hi_slot_004",
    interviewerId: "interviewer_zhao_001",
    startAt: "2026-06-24T11:00:00+08:00",
    endAt: "2026-06-24T12:00:00+08:00",
    timezone: "Asia/Shanghai",
    status: "available",
  },
];

export function createFallbackWorkspace(
  applicationId = HUMAN_INTERVIEW_DEMO_APPLICATION_ID,
): HumanInterviewWorkspace {
  return {
    applicationId,
    invitation: { ...seedInvitation, applicationId },
    interviewers: fallbackInterviewers,
    slots: seedSlots.map((slot) => ({ ...slot })),
    bookings: [],
    reports: [],
  };
}

export function createFallbackReport(booking: HumanInterviewBooking): HumanInterviewReport {
  return {
    id: `hi_report_${booking.id}`,
    bookingId: booking.id,
    applicationId: booking.applicationId,
    status: "draft",
    conclusion: "建议进入后续业务面沟通",
    abilityAssessment:
      "候选人在产品分析、结构化表达和用户问题拆解上表现稳定，仍需继续验证跨团队推进经验。",
    keyObservations: [
      "能用业务目标拆解功能优先级",
      "对 AI 产品评估指标有基础理解",
      "回答中能主动补充风险假设",
    ],
    risksAndFollowups: ["需要追问真实项目中的冲突处理", "需继续确认数据分析深度"],
    candidateSummary:
      "你在产品理解和表达结构上表现较好，后续建议准备一个完整项目复盘，突出指标、权衡和结果。",
    internalNotes: "HR 内部备注仅用于企业复核，不向候选人展示。",
    authorInterviewer: booking.primaryInterviewer,
    revision: 1,
  };
}
