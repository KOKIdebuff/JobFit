import { Lightbulb, Wrench, GraduationCap, Briefcase } from "lucide-react";
import type { Suggestion } from "@/lib/resume-parser";

const CATEGORY_ICON: Record<Suggestion["category"], React.ReactNode> = {
  技能: <Wrench className="h-4 w-4" />,
  教育: <GraduationCap className="h-4 w-4" />,
  经历: <Briefcase className="h-4 w-4" />,
};

const SEVERITY_STYLE: Record<Suggestion["severity"], string> = {
  高: "bg-rainbow text-white",
  中: "bg-secondary text-foreground",
  低: "bg-secondary text-muted-foreground",
};

/**
 * 「提升建议清单」可视化组件
 * 根据评分明细自动生成的技能补齐 / 教育对齐 / 经历重写建议。
 */
export function SuggestionList({
  title = "提升建议清单",
  items,
  emptyHint = "评分已较为完善，暂无关键提升项 🎉",
}: {
  title?: string;
  items: Suggestion[];
  emptyHint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Lightbulb className="h-4 w-4 text-gradient" />
          {title}
        </h4>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {items.length} 条建议
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((s, i) => (
            <li key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-gradient">
                  {CATEGORY_ICON[s.category]}
                </span>
                <span className="text-sm font-medium">{s.title}</span>
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] ${SEVERITY_STYLE[s.severity]}`}
                >
                  {s.severity}优先级
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.advice}</p>
              {s.example && (
                <div className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-gradient">改写示例：</span>
                  {s.example}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
