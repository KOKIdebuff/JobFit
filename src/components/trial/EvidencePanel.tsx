import { ChevronDown, Quote } from "lucide-react";
import type { NonNullableEvaluation } from "./types";

export function EvidencePanel({ dimensions }: { dimensions: NonNullableEvaluation["dimensions"] }) {
  return (
    <div className="space-y-3">
      {dimensions.map((dimension) => (
        <details
          key={dimension.id}
          className="group rounded-2xl border border-border bg-background p-4"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
            <span>
              {dimension.label} · {dimension.achieved}/{dimension.score}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <blockquote className="mt-3 flex gap-2 rounded-xl border-l-4 border-primary bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
            <Quote className="mt-0.5 h-4 w-4 shrink-0" />
            {dimension.evidence}
          </blockquote>
        </details>
      ))}
    </div>
  );
}
