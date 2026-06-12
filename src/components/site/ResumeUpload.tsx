import { useRef, useState } from "react";
import { Upload, FileText, X, GraduationCap, Wrench, Briefcase, Sparkles } from "lucide-react";
import {
  buildResumeSuggestions,
  parseResume,
  readFileAsText,
  saveResume,
  useStoredResume,
  type ParsedResume,
} from "@/lib/resume-parser";
import { ScoreBreakdown } from "@/components/site/ScoreBreakdown";
import { SuggestionList } from "@/components/site/SuggestionList";
import { ResumeVersions } from "@/components/site/ResumeVersions";

const SAMPLE = `李同学
教育背景：星河大学 计算机科学与技术 本科，GPA 3.8/4.0，2025 届毕业
技能：Python、PyTorch、向量检索、RAG、LLM 应用、SQL、数据分析、React
项目经历：智能简历助手（产品负责人），设计岗位匹配评分逻辑，上线两月积累 1 万+ 用户
实习经历：在云岭科技负责推荐算法，AUC 提升 0.06，支撑增长策略落地`;

export function ResumeUpload({ compact = false }: { compact?: boolean }) {
  const resume = useStoredResume();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const content = await readFileAsText(file);
      const parsed = parseResume(content, file.name);
      saveResume(parsed);
      setText(content);
    } finally {
      setBusy(false);
    }
  };

  const parseText = (value: string) => {
    const parsed = parseResume(value, "粘贴文本");
    saveResume(parsed);
  };

  const useSample = () => {
    setText(SAMPLE);
    saveResume(parseResume(SAMPLE, "示例简历.txt"));
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rainbow text-white">
          <Upload className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">上传简历</h3>
          <p className="text-xs text-muted-foreground">
            支持 .txt / .md / .pdf，自动解析教育、技能与经历
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-7 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-secondary/40 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Sparkles className="h-5 w-5 animate-pulse" /> 正在解析…
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                点击选择简历文件
                <span className="text-xs">或在右侧粘贴简历文本</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.md,.pdf,text/plain,text/markdown"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button onClick={useSample} className="mt-3 text-xs text-gradient hover:underline">
            没有简历？填入示例简历
          </button>
        </div>

        <div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              parseText(e.target.value);
            }}
            placeholder="在此粘贴你的简历文本，输入即自动解析…"
            className="h-32 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>

      {resume && (
        <div className="mt-5 rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-gradient" />
              {resume.fileName ?? "已解析简历"}
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                完整度 {resume.completeness}%
              </span>
            </div>
            <button
              onClick={() => {
                saveResume(null);
                setText("");
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> 清除
            </button>
          </div>

          {!compact && (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <ParsedGroup
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="教育"
                  items={resume.education}
                />
                <ParsedGroup
                  icon={<Wrench className="h-4 w-4" />}
                  label="技能"
                  items={resume.skills}
                  pills
                />
                <ParsedGroup
                  icon={<Briefcase className="h-4 w-4" />}
                  label="经历"
                  items={resume.experience}
                />
              </div>
              <div className="mt-4">
                <ScoreBreakdown
                  title="完整度评分依据"
                  total={resume.completeness}
                  unit="%"
                  items={resume.completenessBreakdown}
                  summary="完整度 = 教育背景(满30) + 技能匹配(每项+6，满40) + 项目/实习经历(每段+8，满30)，上限 100。完整度越高，岗位匹配将获得额外加成。"
                />
              </div>
              <div className="mt-4">
                <SuggestionList items={buildResumeSuggestions(resume)} />
              </div>
              <div className="mt-4">
                <ResumeVersions current={resume} />
              </div>
            </>
          )}

          {compact && (
            <div className="mt-4">
              <ResumeVersions current={resume} compact />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ParsedGroup({
  icon,
  label,
  items,
  pills,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  pills?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gradient">
        {icon} {label}（{items.length}）
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">未识别到相关信息</p>
      ) : pills ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((s) => (
            <span
              key={s}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      ) : (
        <ul className="mt-2 space-y-1">
          {items.map((s) => (
            <li key={s} className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              • {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { ParsedResume };
