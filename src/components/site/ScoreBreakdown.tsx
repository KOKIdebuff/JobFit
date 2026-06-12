import type { ScoreItem } from "@/lib/resume-parser";

/**
 * 通用「评分依据」可视化组件
 * 每一项展示：维度标签 + 命中内容胶囊 + 渐变进度条（score / max）+ 加分标注
 */
export function ScoreBreakdown({
  title,
  total,
  totalLabel = "总分",
  unit = "",
  items,
  summary,
}: {
  title: string;
  total: number;
  totalLabel?: string;
  unit?: string;
  items: ScoreItem[];
  summary?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-xl font-bold text-gradient">{total}</span>
          <span className="text-xs text-muted-foreground">
            {unit} · {totalLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        {items.map((it) => (
          <div key={it.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{it.label}</span>
              <span
                className={it.score > 0 ? "font-medium text-gradient" : "text-muted-foreground"}
              >
                +{it.score}
                <span className="text-muted-foreground"> / {it.max}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-rainbow transition-all"
                style={{ width: `${Math.min(100, (it.score / it.max) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{it.detail}</p>
            {it.hits && it.hits.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {it.hits.map((h) => (
                  <span
                    key={h}
                    className="line-clamp-1 max-w-[220px] rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {summary && (
        <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          {summary}
        </p>
      )}
    </div>
  );
}
