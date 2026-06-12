import { useState } from "react";
import { toast } from "sonner";
import { Layers, Check, Pencil, Trash2, Plus, X } from "lucide-react";
import {
  deleteVersion,
  renameVersion,
  saveVersion,
  setActiveVersion,
  useResumeVersions,
  type ParsedResume,
} from "@/lib/resume-parser";

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * 简历版本管理：保存多个改写版本，并在匹配与评分中切换使用。
 * @param current 当前解析结果，用于「保存为新版本」
 * @param compact 紧凑模式仅展示切换入口
 */
export function ResumeVersions({
  current,
  compact = false,
}: {
  current?: ParsedResume | null;
  compact?: boolean;
}) {
  const { versions, activeId } = useResumeVersions();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const startRename = (id: string, name: string) => {
    setEditingId(id);
    setDraftName(name);
  };

  const commitRename = (id: string) => {
    if (draftName.trim()) renameVersion(id, draftName.trim());
    setEditingId(null);
  };

  const handleSaveNew = () => {
    if (!current) return;
    const input = window.prompt("为这个简历版本命名", `版本 ${versions.length + 1}`);
    if (input === null) return;
    const name = input.trim() || `版本 ${versions.length + 1}`;
    saveVersion(current, name);
    toast.success("已保存为新版本", {
      description: `「${name}」已保存，并已设为当前使用版本`,
    });
  };

  if (compact) {
    return (
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gradient">
            <Layers className="h-3.5 w-3.5" /> 简历版本（{versions.length}）
          </div>
          {current && (
            <button
              onClick={handleSaveNew}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> 另存版本
            </button>
          )}
        </div>
        {versions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveVersion(v.id)}
                className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                  v.id === activeId
                    ? "bg-rainbow text-white"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Layers className="h-4 w-4 text-gradient" /> 简历版本管理
        </h4>
        <button
          onClick={handleSaveNew}
          disabled={!current}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> 保存为新版本
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="mt-4 text-xs text-muted-foreground">
          还没有保存的版本。上传或粘贴简历后，点击「保存为新版本」即可创建多个改写版本并随时切换。
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {versions.map((v) => {
            const active = v.id === activeId;
            return (
              <li
                key={v.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  active ? "border-transparent bg-secondary/60" : "border-border bg-card"
                }`}
              >
                <button
                  onClick={() => setActiveVersion(v.id)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    active ? "bg-rainbow text-white" : "bg-secondary text-muted-foreground"
                  }`}
                  title={active ? "当前使用中" : "切换为当前版本"}
                >
                  <Check className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  {editingId === v.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(v.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      />
                      <button onClick={() => commitRename(v.id)} className="text-gradient">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{v.name}</span>
                        {active && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-gradient">
                            使用中
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        完整度 {v.resume.completeness}% · {formatTime(v.createdAt)}
                      </p>
                    </>
                  )}
                </div>

                {editingId !== v.id && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => startRename(v.id, v.name)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="重命名"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`删除版本「${v.name}」？`)) deleteVersion(v.id);
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
