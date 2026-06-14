import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Check } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { FeatureHeader } from "./match";
import { NETWORK_NODES, type NetworkNode } from "@/lib/mock-data";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "后续规划：职业人脉原型 — HireLink AI" },
      {
        name: "description",
        content: "非 P0 的职业人脉概念原型，当前不作为真实招聘主流程能力。",
      },
      { property: "og:title", content: "后续规划：职业人脉原型 — HireLink AI" },
      { property: "og:description", content: "基于关系图谱的智能内推路径推荐。" },
    ],
  }),
  component: NetworkPage,
});

const RELATION_COLOR: Record<NetworkNode["relation"], string> = {
  我: "#1f2937",
  校友: "#4285f4",
  同行: "#34a853",
  内推人: "#ea4c89",
};

function NetworkPage() {
  const [selected, setSelected] = useState<NetworkNode | null>(null);
  const [requested, setRequested] = useState<string[]>([]);
  const me = NETWORK_NODES.find((n) => n.relation === "我")!;

  return (
    <PageShell>
      <FeatureHeader
        n="03"
        title="后续规划：职业人脉原型"
        desc="该页面是非 P0 概念演示，使用预置节点展示交互，不代表当前已接入真实关系数据或内推服务。"
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-5 pb-24 sm:px-8 lg:grid-cols-[1fr_340px]">
        {/* Graph */}
        <div className="relative rounded-3xl border border-border bg-card p-4 shadow-soft">
          <div className="relative aspect-square w-full sm:aspect-[4/3]">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              {NETWORK_NODES.filter((n) => n.relation !== "我").map((n) => (
                <line
                  key={n.id}
                  x1={me.x}
                  y1={me.y}
                  x2={n.x}
                  y2={n.y}
                  stroke={selected?.id === n.id ? RELATION_COLOR[n.relation] : "currentColor"}
                  strokeOpacity={selected?.id === n.id ? 0.9 : 0.18}
                  strokeWidth={selected?.id === n.id ? 0.8 : 0.4}
                  className="text-foreground"
                />
              ))}
            </svg>
            {NETWORK_NODES.map((n) => {
              const isMe = n.relation === "我";
              const active = selected?.id === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => !isMe && setSelected(n)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                  <span
                    className="flex items-center justify-center rounded-full font-medium text-white shadow-soft transition-transform"
                    style={{
                      width: isMe ? 56 : 44,
                      height: isMe ? 56 : 44,
                      background: isMe ? "var(--grad-rainbow)" : RELATION_COLOR[n.relation],
                      transform: active ? "scale(1.12)" : "scale(1)",
                      fontSize: isMe ? 14 : 12,
                      outline: active ? "2px solid var(--color-ring)" : "none",
                      outlineOffset: 3,
                    }}
                  >
                    {n.name.slice(0, isMe ? 1 : 2)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap justify-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
            {(["校友", "同行", "内推人"] as const).map((r) => (
              <span key={r} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: RELATION_COLOR[r] }}
                />
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="rounded-3xl border border-border bg-card p-7 shadow-soft lg:sticky lg:top-24 lg:self-start">
          {!selected ? (
            <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
              点击地图中的节点
              <br />
              查看人脉详情与内推路径
            </div>
          ) : (
            <div className="animate-float-up">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full font-medium text-white"
                  style={{ background: RELATION_COLOR[selected.relation] }}
                >
                  {selected.name.slice(0, 2)}
                </span>
                <div>
                  <h3 className="font-semibold">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.role}</p>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <Row label="关系" value={selected.relation} />
                <Row label="所在公司" value={selected.company} />
                <Row label="连接强度" value={`${selected.strength}%`} />
              </dl>
              <div className="mt-4">
                <div className="mb-1.5 text-xs text-muted-foreground">内推路径</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-full bg-secondary px-2.5 py-1">我</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded-full bg-secondary px-2.5 py-1">{selected.name}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="rounded-full bg-rainbow px-2.5 py-1 text-white">
                    {selected.company}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRequested((r) => [...new Set([...r, selected.id])])}
                disabled={requested.includes(selected.id)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-70"
              >
                {requested.includes(selected.id) ? (
                  <>
                    <Check className="h-4 w-4" /> 内推请求已发送
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> 请求内推
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
