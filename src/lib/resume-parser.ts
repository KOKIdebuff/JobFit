import { useEffect, useState } from "react";

/** 单项评分依据（用于可视化拆解） */
export interface ScoreItem {
  label: string;
  score: number;
  max: number;
  detail: string;
  /** 命中的具体内容（技能名 / 教育片段等），用于展示胶囊 */
  hits?: string[];
}

export interface ParsedResume {
  raw: string;
  fileName?: string;
  education: string[];
  skills: string[];
  experience: string[];
  /** 简历完整度 0-100，用于影响匹配与评分 */
  completeness: number;
  /** 完整度评分的逐项依据 */
  completenessBreakdown: ScoreItem[];
}

const SKILL_DICT = [
  "Python",
  "Java",
  "C++",
  "Go",
  "JavaScript",
  "TypeScript",
  "React",
  "Vue",
  "Node",
  "SQL",
  "PyTorch",
  "TensorFlow",
  "LLM",
  "RAG",
  "Prompt",
  "向量",
  "Embedding",
  "推荐",
  "深度学习",
  "机器学习",
  "数据分析",
  "可视化",
  "产品",
  "需求分析",
  "原型",
  "增长",
  "A/B",
  "特征工程",
  "NLP",
  "算法",
  "工程化",
  "性能优化",
  "微服务",
  "Docker",
  "Kubernetes",
  "Linux",
  "Git",
];

const EDU_KEYWORDS = [
  "大学",
  "学院",
  "学历",
  "本科",
  "硕士",
  "博士",
  "专业",
  "GPA",
  "绩点",
  "毕业",
];
const EXP_KEYWORDS = [
  "实习",
  "项目",
  "负责",
  "工作",
  "经历",
  "公司",
  "团队",
  "主导",
  "参与",
  "上线",
  "提升",
];

function splitLines(text: string): string[] {
  return text
    .split(/[\n\r。；;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);
}

/** 基于关键词与词典的轻量级简历解析（前端模拟 NLP 抽取） */
export function parseResume(text: string, fileName?: string): ParsedResume {
  const lines = splitLines(text);

  const education = lines.filter((l) => EDU_KEYWORDS.some((k) => l.includes(k))).slice(0, 4);
  const experience = lines.filter((l) => EXP_KEYWORDS.some((k) => l.includes(k))).slice(0, 6);

  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const skills = SKILL_DICT.filter((s) => new RegExp(escapeRe(s), "i").test(text)).slice(0, 14);

  const eduScore = education.length ? 30 : 0;
  const skillScore = skills.length ? Math.min(40, skills.length * 6) : 0;
  const expScore = experience.length ? Math.min(30, experience.length * 8) : 0;
  const completeness = Math.min(100, eduScore + skillScore + expScore);

  const completenessBreakdown: ScoreItem[] = [
    {
      label: "教育背景",
      score: eduScore,
      max: 30,
      detail: education.length ? `已识别 ${education.length} 段教育经历` : "未识别到教育信息",
      hits: education.slice(0, 2),
    },
    {
      label: "技能匹配",
      score: skillScore,
      max: 40,
      detail: skills.length ? `识别 ${skills.length} 项技能（每项 +6，上限 40）` : "未识别到技能",
      hits: skills,
    },
    {
      label: "项目/实习经历",
      score: expScore,
      max: 30,
      detail: experience.length
        ? `识别 ${experience.length} 段经历（每段 +8，上限 30）`
        : "未识别到经历",
      hits: experience.slice(0, 3),
    },
  ];

  return {
    raw: text,
    fileName,
    education,
    skills,
    experience,
    completeness,
    completenessBreakdown,
  };
}

/** 提升建议（针对评分明细自动生成的可执行改写建议） */
export interface Suggestion {
  category: "技能" | "教育" | "经历";
  severity: "高" | "中" | "低";
  title: string;
  advice: string;
  /** 具体改写示例（before / after 或标准句式） */
  example?: string;
}

/** 高频岗位核心技能（用于技能补齐建议优先推荐） */
const CORE_SKILLS = [
  "LLM",
  "RAG",
  "向量",
  "Python",
  "SQL",
  "数据分析",
  "机器学习",
  "React",
  "需求分析",
  "A/B",
];

function hasNumber(text: string): boolean {
  return /\d|百分|倍|万|提升|增长|下降|优化/.test(text);
}

/**
 * 依据已解析简历的评分明细，生成技能补齐 / 教育对齐 / 经历重写的具体建议。
 * @param targetSkills 可选：目标岗位所需技能标签，用于针对岗位生成差距建议
 */
export function buildResumeSuggestions(
  resume: ParsedResume,
  targetSkills?: string[],
): Suggestion[] {
  const out: Suggestion[] = [];
  const lower = (s: string) => s.toLowerCase();
  const has = (skill: string) =>
    resume.skills.some((s) => lower(s).includes(lower(skill)) || lower(skill).includes(lower(s)));

  // —— 技能补齐 ——
  const pool = targetSkills && targetSkills.length ? targetSkills : CORE_SKILLS;
  const missing = pool.filter((s) => !has(s));
  if (missing.length) {
    const sev: Suggestion["severity"] =
      resume.skills.length < 4 ? "高" : missing.length > 3 ? "中" : "低";
    out.push({
      category: "技能",
      severity: sev,
      title: `补齐 ${missing.length} 项关键技能`,
      advice: `当前简历缺少${targetSkills?.length ? "该岗位所需" : "高频岗位"}技能：${missing.slice(0, 6).join("、")}。建议在技能栏列出并在项目中体现实际使用场景。`,
      example: `技能：${[...resume.skills.slice(0, 3), ...missing.slice(0, 2)].join(" · ")}（如「使用 ${missing[0]} 完成 xxx，效果提升 xx%」）`,
    });
  }

  // —— 教育对齐 ——
  if (!resume.education.length) {
    out.push({
      category: "教育",
      severity: "高",
      title: "补充完整教育背景",
      advice: "未识别到教育信息。建议补充学校、专业、学历层次、GPA 与毕业届别，便于通过初筛。",
      example: "星河大学 · 计算机科学与技术 · 本科 · GPA 3.8/4.0 · 2025 届毕业",
    });
  } else {
    const eduText = resume.education.join(" ");
    const missingFields: string[] = [];
    if (!/GPA|绩点/i.test(eduText)) missingFields.push("GPA/绩点");
    if (!/届|毕业|20\d{2}/.test(eduText)) missingFields.push("毕业届别");
    if (!/本科|硕士|博士|学历/.test(eduText)) missingFields.push("学历层次");
    if (missingFields.length) {
      out.push({
        category: "教育",
        severity: "中",
        title: "对齐教育关键信息",
        advice: `教育背景已识别，但缺少：${missingFields.join("、")}。补齐后更利于自动筛选与匹配。`,
        example: `${resume.education[0]}，GPA 3.8/4.0，2025 届毕业`,
      });
    }
  }

  // —— 经历重写 ——
  if (!resume.experience.length) {
    out.push({
      category: "经历",
      severity: "高",
      title: "补充项目/实习经历",
      advice: "未识别到经历。建议补充 1-3 段项目或实习，采用「角色 + 行动 + 量化结果」结构描述。",
      example: "智能简历助手（产品负责人）：主导岗位匹配评分逻辑，上线两月积累 1 万+ 用户",
    });
  } else {
    const weak = resume.experience.filter((e) => !hasNumber(e));
    if (weak.length) {
      out.push({
        category: "经历",
        severity: weak.length >= 2 ? "中" : "低",
        title: `量化重写 ${weak.length} 段经历`,
        advice: `有 ${weak.length} 段经历缺少量化成果。建议按 STAR 结构加入数据（百分比、用户量、指标提升）。`,
        example: `「${weak[0].slice(0, 18)}…」→「主导该工作，关键指标提升 xx%，覆盖 xx 用户」`,
      });
    }
  }

  // 按优先级排序：高 > 中 > 低
  const rank = { 高: 0, 中: 1, 低: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

const STORAGE_KEY = "hirelink:resume";
const VERSIONS_KEY = "hirelink:resume-versions";
const ACTIVE_KEY = "hirelink:resume-active";
const EVENT = "hirelink:resume-change";

/** 一份已保存的简历版本 */
export interface ResumeVersion {
  id: string;
  name: string;
  createdAt: number;
  resume: ParsedResume;
}

function genId(): string {
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function readVersions(): ResumeVersion[] {
  if (typeof window === "undefined") return [];
  try {
    const v = localStorage.getItem(VERSIONS_KEY);
    if (v) return JSON.parse(v) as ResumeVersion[];
  } catch {
    /* ignore */
  }
  // 迁移旧的单条简历数据为「默认版本」
  try {
    const old = localStorage.getItem(STORAGE_KEY);
    if (old) {
      const resume = JSON.parse(old) as ParsedResume;
      const version: ResumeVersion = {
        id: genId(),
        name: resume.fileName ?? "默认版本",
        createdAt: Date.now(),
        resume,
      };
      localStorage.setItem(VERSIONS_KEY, JSON.stringify([version]));
      localStorage.setItem(ACTIVE_KEY, version.id);
      localStorage.removeItem(STORAGE_KEY);
      return [version];
    }
  } catch {
    /* ignore */
  }
  return [];
}

function writeVersions(versions: ResumeVersion[]) {
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
}

function readActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

/** 列出所有已保存版本 */
export function listVersions(): ResumeVersion[] {
  return readVersions();
}

/** 当前激活版本 id */
export function getActiveVersionId(): string | null {
  const versions = readVersions();
  const id = readActiveId();
  if (id && versions.some((v) => v.id === id)) return id;
  return versions[0]?.id ?? null;
}

/** 读取当前激活版本的简历 */
function readResume(): ParsedResume | null {
  const versions = readVersions();
  if (!versions.length) return null;
  const id = getActiveVersionId();
  return versions.find((v) => v.id === id)?.resume ?? versions[0].resume;
}

/**
 * 保存/更新简历：写入当前激活版本（无版本时自动创建默认版本）。
 * 传入 null 表示清除当前激活版本。
 */
export function saveResume(resume: ParsedResume | null) {
  if (typeof window === "undefined") return;
  let versions = readVersions();

  if (resume === null) {
    const id = getActiveVersionId();
    versions = versions.filter((v) => v.id !== id);
    writeVersions(versions);
    const next = versions[0]?.id ?? null;
    if (next) localStorage.setItem(ACTIVE_KEY, next);
    else localStorage.removeItem(ACTIVE_KEY);
    window.dispatchEvent(new Event(EVENT));
    return;
  }

  let id = getActiveVersionId();
  if (id && versions.some((v) => v.id === id)) {
    versions = versions.map((v) =>
      v.id === id ? { ...v, resume, name: v.name || resume.fileName || "默认版本" } : v,
    );
  } else {
    const version: ResumeVersion = {
      id: genId(),
      name: resume.fileName ?? "默认版本",
      createdAt: Date.now(),
      resume,
    };
    versions = [version, ...versions];
    id = version.id;
    localStorage.setItem(ACTIVE_KEY, id);
  }
  writeVersions(versions);
  window.dispatchEvent(new Event(EVENT));
}

/** 基于一份简历另存为新版本，并激活 */
export function saveVersion(resume: ParsedResume, name?: string): ResumeVersion {
  const versions = readVersions();
  const version: ResumeVersion = {
    id: genId(),
    name: name?.trim() || resume.fileName || `版本 ${versions.length + 1}`,
    createdAt: Date.now(),
    resume,
  };
  writeVersions([version, ...versions]);
  localStorage.setItem(ACTIVE_KEY, version.id);
  window.dispatchEvent(new Event(EVENT));
  return version;
}

export function deleteVersion(id: string) {
  const versions = readVersions().filter((v) => v.id !== id);
  writeVersions(versions);
  if (readActiveId() === id) {
    const next = versions[0]?.id ?? null;
    if (next) localStorage.setItem(ACTIVE_KEY, next);
    else localStorage.removeItem(ACTIVE_KEY);
  }
  window.dispatchEvent(new Event(EVENT));
}

export function setActiveVersion(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
  window.dispatchEvent(new Event(EVENT));
}

export function renameVersion(id: string, name: string) {
  const versions = readVersions().map((v) =>
    v.id === id ? { ...v, name: name.trim() || v.name } : v,
  );
  writeVersions(versions);
  window.dispatchEvent(new Event(EVENT));
}

/** 跨页面共享已解析的简历（当前激活版本） */
export function useStoredResume() {
  const [resume, setResume] = useState<ParsedResume | null>(null);

  useEffect(() => {
    setResume(readResume());
    const handler = () => setResume(readResume());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return resume;
}

/** 订阅版本列表与激活态变化 */
export function useResumeVersions() {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setVersions(readVersions());
      setActiveId(getActiveVersionId());
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { versions, activeId };
}

/** 读取上传文件的纯文本内容（支持 txt / md，PDF 读取可读取的文本片段） */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
