import type { AgentRunEntity } from "./types";

const agents: AgentRunEntity["agents"] = [
  {
    id: "data-aggregation",
    name: "数据聚合 Agent",
    responsibility: "整理候选人、岗位、简历、匹配、面试和岗位任务输入。",
    status: "completed",
    completedActions: ["校验候选人与岗位关系", "合并简历与岗位画像", "整理可复核证据片段"],
    outputSummary: "已形成完整候选人上下文，并标记需要 HR 重点复核的证据缺口。",
    humanQuestions: ["候选人的项目负责边界是否需要继续追问？"],
    evidenceCount: 18,
  },
  {
    id: "match-explanation",
    name: "匹配解释 Agent",
    responsibility: "把岗位要求与候选人能力证据转成 HR 可读的匹配解释。",
    status: "completed",
    completedActions: ["拆解岗位核心能力", "对齐候选人项目经历", "输出匹配优势与缺口"],
    outputSummary: "候选人在 AI 产品理解和数据分析上匹配度较高，复杂项目推进仍需确认。",
    humanQuestions: ["是否将复杂项目推进列为后续面试重点？"],
    evidenceCount: 7,
  },
  {
    id: "risk-check",
    name: "风险检查 Agent",
    responsibility: "检查结论边界、证据不足和需要人工判断的风险点。",
    status: "review_required",
    completedActions: ["检查自动化决策边界", "标记证据不足项", "生成 HR 复核提醒"],
    outputSummary: "已提醒 HR 不应把报告结论直接作为淘汰依据。",
    humanQuestions: ["是否确认报告只作为辅助判断材料？"],
    evidenceCount: 4,
  },
];

const timeline: AgentRunEntity["timeline"] = [
  {
    id: "context-check",
    title: "校验候选人与岗位上下文",
    status: "completed",
    businessSummary: "确认候选人、岗位和招聘阶段可用于本次协作。",
    keyOutputs: ["候选人和岗位关系已确认", "招聘阶段上下文已整理"],
    detail: "系统先检查候选人与岗位是否属于同一招聘流程，避免混入无关材料。",
  },
  {
    id: "output-merge",
    title: "汇总 Agent 输出",
    status: "completed",
    businessSummary: "汇总各 Agent 的判断，保留差异和需人工确认的问题。",
    keyOutputs: ["优势与缺口已合并", "人工确认问题已标记"],
    detail: "不确定结论不会直接覆盖，而是保留给 HR 复核。",
  },
  {
    id: "hr-action",
    title: "等待 HR 确认或重试",
    status: "review_required",
    businessSummary: "等待 HR 决定确认、重试或介入处理。",
    keyOutputs: ["可确认本次结果", "可请求重新运行"],
    detail: "HR 操作会保留在当前浏览器会话中，刷新后仍可继续演示。",
  },
];

export const AGENT_RUN_FIXTURES: AgentRunEntity[] = [
  {
    id: "agent-run-demo-report-001",
    applicationId: "application_ai_pm_li_001",
    processName: "证据链报告生成",
    candidateName: "李同学",
    jobTitle: "AI 产品经理（校招）",
    status: "review_required",
    progress: 92,
    startedAt: "2026-06-16T14:10:00+08:00",
    updatedAt: "2026-06-16T14:18:00+08:00",
    needsHrReview: true,
    preservedData: ["简历与候选人画像", "岗位画像与匹配解释", "面试回答", "岗位任务提交与评价"],
    nextActions: ["补充内部备注", "确认重点关注项", "确认本次协作结果"],
    hrReview: { note: "", reviewed: false, priority: true, confirmed: false },
    agents,
    timeline,
  },
  {
    id: "agent-run-demo-trial-evaluation-003",
    applicationId: "application_ai_pm_li_001",
    processName: "岗位任务评价",
    candidateName: "李同学",
    jobTitle: "AI 产品经理（校招）",
    status: "failed",
    progress: 68,
    startedAt: "2026-06-16T16:05:00+08:00",
    updatedAt: "2026-06-16T16:08:00+08:00",
    needsHrReview: true,
    preservedData: ["岗位任务提交正文", "附件信息", "候选人基础资料"],
    nextActions: ["重新运行评价", "转为 HR 介入", "返回岗位任务结果页核对材料"],
    failureSummary: "岗位任务评价未完成，候选人提交内容和已整理的岗位上下文均已保留。",
    hrReview: { note: "", reviewed: false, priority: false, confirmed: false },
    agents: agents.map((agent) =>
      agent.id === "risk-check"
        ? agent
        : { ...agent, status: agent.id === "data-aggregation" ? "completed" : "failed" },
    ),
    timeline: timeline.map((step) =>
      step.id === "output-merge"
        ? { ...step, status: "failed", businessSummary: "岗位任务评价阶段未完成。" }
        : step,
    ),
  },
];
