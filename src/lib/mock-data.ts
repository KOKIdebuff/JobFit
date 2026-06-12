export interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  score: number;
  tags: string[];
  reasons: string[];
}

export const JOB_MATCHES: JobMatch[] = [
  {
    id: "j1",
    title: "AI 产品经理（应届）",
    company: "星河智能",
    location: "北京 · 海淀",
    salary: "18-28K · 14薪",
    score: 96,
    tags: ["LLM 产品", "RAG", "数据驱动"],
    reasons: [
      "你的『AI 产品实习』经历与岗位高度相关",
      "技能标签命中 8/10",
      "团队偏好有竞赛经历的候选人",
    ],
  },
  {
    id: "j2",
    title: "算法工程师 - 推荐方向",
    company: "云岭科技",
    location: "杭州 · 余杭",
    salary: "22-35K · 15薪",
    score: 91,
    tags: ["向量召回", "Python", "深度学习"],
    reasons: [
      "你的向量匹配项目经验匹配岗位核心要求",
      "学历与目标院校画像吻合",
      "薪资预期落在区间内",
    ],
  },
  {
    id: "j3",
    title: "前端工程师（大模型应用）",
    company: "光合未来",
    location: "深圳 · 南山",
    salary: "16-26K · 13薪",
    score: 87,
    tags: ["React", "TypeScript", "可视化"],
    reasons: [
      "你的开源项目展示了扎实的前端能力",
      "意向城市与公司所在地一致",
      "可接受的入职时间符合要求",
    ],
  },
  {
    id: "j4",
    title: "数据分析师 - 增长方向",
    company: "潮汐数据",
    location: "上海 · 徐汇",
    salary: "14-22K · 13薪",
    score: 82,
    tags: ["SQL", "增长", "A/B 测试"],
    reasons: ["你的统计学背景符合岗位画像", "具备实习中的数据分析产出", "软技能评估匹配团队文化"],
  },
];

export interface NetworkNode {
  id: string;
  name: string;
  role: string;
  relation: "校友" | "同行" | "内推人" | "我";
  company: string;
  strength: number;
  x: number;
  y: number;
}

export const NETWORK_NODES: NetworkNode[] = [
  {
    id: "me",
    name: "我",
    role: "2025 届求职者",
    relation: "我",
    company: "—",
    strength: 100,
    x: 50,
    y: 50,
  },
  {
    id: "n1",
    name: "林学长",
    role: "高级算法工程师",
    relation: "校友",
    company: "星河智能",
    strength: 88,
    x: 78,
    y: 24,
  },
  {
    id: "n2",
    name: "陈学姐",
    role: "AI 产品负责人",
    relation: "校友",
    company: "星河智能",
    strength: 75,
    x: 24,
    y: 22,
  },
  {
    id: "n3",
    name: "王工",
    role: "前端技术专家",
    relation: "同行",
    company: "光合未来",
    strength: 62,
    x: 82,
    y: 70,
  },
  {
    id: "n4",
    name: "周经理",
    role: "HRBP / 内推官",
    relation: "内推人",
    company: "星河智能",
    strength: 91,
    x: 50,
    y: 84,
  },
  {
    id: "n5",
    name: "赵同学",
    role: "数据分析实习",
    relation: "同行",
    company: "潮汐数据",
    strength: 48,
    x: 16,
    y: 66,
  },
];

export interface InterviewQuestion {
  id: number;
  question: string;
  hint: string;
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 1,
    question: "请用一分钟做个自我介绍，并说明你为什么选择 AI 产品方向。",
    hint: "突出与岗位相关的经历与动机",
  },
  {
    id: 2,
    question: "讲一个你主导过的项目，你是如何拆解问题并推动落地的？",
    hint: "用 STAR 结构：情境-任务-行动-结果",
  },
  {
    id: 3,
    question: "如果一个核心指标在上线后下降了 20%，你会如何排查？",
    hint: "展示数据敏感度与系统化思维",
  },
  {
    id: 4,
    question: "你如何看待大模型在招聘场景中的应用边界与风险？",
    hint: "体现行业理解与批判性思考",
  },
];

export interface ScoreDim {
  label: string;
  value: number;
}

export const INTERVIEW_SCORES: ScoreDim[] = [
  { label: "表达逻辑", value: 88 },
  { label: "专业深度", value: 82 },
  { label: "岗位匹配", value: 91 },
  { label: "应变能力", value: 79 },
  { label: "综合印象", value: 86 },
];

export const ADVANTAGE_SCORES: ScoreDim[] = [
  { label: "创新性", value: 94 },
  { label: "落地性", value: 88 },
  { label: "技术实现", value: 90 },
  { label: "商业价值", value: 86 },
  { label: "用户体验", value: 92 },
];

export const TECH_STACK = [
  { name: "LLM 大语言模型", desc: "理解意图、生成简历与面试问答" },
  { name: "RAG 检索增强", desc: "结合岗位库与企业知识精准生成" },
  { name: "向量匹配", desc: "简历与岗位语义相似度召回排序" },
  { name: "数字人", desc: "虚拟面试官形象与表情驱动" },
  { name: "WebRTC", desc: "低延迟实时音视频面试通道" },
  { name: "评分模型", desc: "多维度量化面试表现与匹配度" },
];
