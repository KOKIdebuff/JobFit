import { Info } from "lucide-react";

export function DemoNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 ${className}`}
      role="status"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <p>评分与排序基于已确认的岗位画像，结果用于辅助 HR 判断。</p>
    </div>
  );
}
