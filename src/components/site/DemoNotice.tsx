import { FlaskConical } from "lucide-react";

export function DemoNotice({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800 ${className}`}
      role="status"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        当前为前端模拟演示，解析、评分和排序使用预置数据，不代表已接入真实模型、RAG 或向量数据库。
      </p>
    </div>
  );
}
