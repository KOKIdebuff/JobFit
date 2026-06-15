export type ProfilePhase =
  | "idle" // 解析前
  | "parsing" // AI 解析中
  | "success" // 解析成功
  | "partial" // 部分成功
  | "failed" // 解析失败
  | "review" // 待 HR 确认
  | "confirmed"; // 已确认

export interface SkillItem {
  name: string;
  weight?: "high" | "normal";
}

export interface CompetencyDim {
  label: string;
  value: number; // 0-100
  desc: string;
}

export interface RiskItem {
  id: string;
  level: "high" | "medium" | "low";
  title: string;
  detail: string;
  suggestion: string;
}

export interface JobProfile {
  summary: string;
  responsibilities: string[];
  mustSkills: SkillItem[];
  niceSkills: SkillItem[];
  experience: string;
  education: string;
  competencies: CompetencyDim[];
  risks: RiskItem[];
}

export interface ParseStep {
  key: string;
  label: string;
  desc: string;
}

export const PARSE_STEPS: ParseStep[] = [
  { key: "read", label: "读取 JD", desc: "解析原始岗位描述文本结构" },
  { key: "duty", label: "提取职责", desc: "归纳核心职责与岗位摘要" },
  { key: "skill", label: "区分技能", desc: "区分必备技能与加分技能" },
  { key: "risk", label: "检查风险", desc: "识别歧义、缺失与待确认项" },
];

export const RAW_JD = `岗位名称：AI 产品经理（大模型方向）
部门：智能产品中心
工作地点：北京 · 海淀

岗位职责：
1. 负责大模型驱动的招聘产品规划与落地，定义产品路线图；
2. 深入业务场景，挖掘 RAG / Agent 应用机会并推动技术方案落地；
3. 协同算法、工程与设计团队，完成从需求到上线的全流程；
4. 建立数据指标体系，基于数据持续迭代产品体验；
5. 跟踪行业前沿，输出竞品分析与产品策略。

任职要求：
1. 本科及以上学历，计算机、人工智能或相关专业优先；
2. 3 年以上互联网产品经验，有 AI / 大模型产品经验者优先；
3. 熟悉 LLM、RAG、向量检索等技术原理，能与算法团队高效协作；
4. 优秀的数据分析能力，熟练使用 SQL；
5. 良好的沟通与跨团队协作能力，结果导向。

加分项：
- 有 0-1 产品从 0 到 1 的落地经验；
- 熟悉 Python，能独立完成数据分析；
- 有招聘 / HR SaaS 行业背景。`;

// 字段 → 原文依据片段（用于「查看原文依据」）
export const JD_EVIDENCE: Record<string, string> = {
  summary: "负责大模型驱动的招聘产品规划与落地，定义产品路线图",
  responsibilities: "岗位职责：1. 负责大模型驱动的招聘产品规划与落地…",
  mustSkills: "熟悉 LLM、RAG、向量检索等技术原理；优秀的数据分析能力，熟练使用 SQL",
  niceSkills: "加分项：有 0-1 产品从 0 到 1 的落地经验；熟悉 Python；有招聘 / HR SaaS 行业背景",
  experience: "3 年以上互联网产品经验，有 AI / 大模型产品经验者优先",
  education: "本科及以上学历，计算机、人工智能或相关专业优先",
  competencies: "熟悉 LLM、RAG；建立数据指标体系；良好的沟通与跨团队协作能力",
};

export const SAMPLE_JOB = {
  title: "AI 产品经理（大模型方向）",
  location: "北京 · 海淀",
  type: "全职",
};

export const MOCK_PROFILE: JobProfile = {
  summary:
    "面向招聘场景的大模型产品负责人，主导 AI 招聘产品从规划到落地的全流程，需兼具技术理解力与业务落地能力。",
  responsibilities: [
    "负责大模型驱动的招聘产品规划与路线图定义",
    "挖掘 RAG / Agent 应用机会并推动技术方案落地",
    "协同算法、工程与设计团队完成需求到上线全流程",
    "建立数据指标体系并基于数据持续迭代产品",
    "跟踪行业前沿，输出竞品分析与产品策略",
  ],
  mustSkills: [
    { name: "大模型产品规划", weight: "high" },
    { name: "RAG / 向量检索原理", weight: "high" },
    { name: "数据分析", weight: "high" },
    { name: "SQL", weight: "normal" },
    { name: "跨团队协作", weight: "normal" },
  ],
  niceSkills: [
    { name: "0-1 产品落地经验" },
    { name: "Python" },
    { name: "HR SaaS 行业背景" },
    { name: "Agent 应用设计" },
  ],
  experience: "3 年以上互联网产品经验，具备 AI / 大模型产品经验者优先",
  education: "本科及以上，计算机 / 人工智能或相关专业优先",
  competencies: [
    { label: "技术理解", value: 85, desc: "对 LLM、RAG、向量检索有清晰认知" },
    { label: "业务落地", value: 90, desc: "推动需求从 0 到 1 上线" },
    { label: "数据驱动", value: 80, desc: "构建指标体系并迭代" },
    { label: "沟通协作", value: 75, desc: "跨算法/工程/设计协同" },
  ],
  risks: [
    {
      id: "r1",
      level: "high",
      title: "经验年限与「应届优先」存在冲突",
      detail: "JD 标题暗示偏向资深，但要求中出现 3 年经验，画像定位需确认。",
      suggestion: "建议明确为「3 年以上」，移除应届暗示。",
    },
    {
      id: "r2",
      level: "medium",
      title: "薪资区间缺失",
      detail: "原始 JD 未提供薪资范围，影响候选人匹配精度。",
      suggestion: "建议补充薪资区间，如 25-40K · 15 薪。",
    },
    {
      id: "r3",
      level: "low",
      title: "「优秀的数据分析能力」表述模糊",
      detail: "缺少可量化标准，难以转化为匹配条件。",
      suggestion: "建议量化为「能独立完成 A/B 实验与漏斗分析」。",
    },
  ],
};
