import type { TrialCriterion } from "@/lib/trial-demo";

export function TrialCriteriaList({
  criteria,
  achieved,
}: {
  criteria: TrialCriterion[];
  achieved?: Record<string, number>;
}) {
  return (
    <div className="space-y-3">
      {criteria.map((criterion) => {
        const value = achieved?.[criterion.id];
        const percentage = value === undefined ? criterion.score : (value / criterion.score) * 100;
        return (
          <div key={criterion.id}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>{criterion.label}</span>
              <span className="font-medium tabular-nums">
                {value === undefined ? criterion.score : `${value}/${criterion.score}`} 分
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-rainbow transition-all"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
