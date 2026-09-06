export type RadarDimension = { label: string; value: number };

export function RadarChart({ data, size = 280 }: { data: RadarDimension[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 44;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, val: number) => {
    const rr = (val / 100) * r;
    return [cx + rr * Math.cos(angle(i)), cy + rr * Math.sin(angle(i))];
  };
  const rings = [0.25, 0.5, 0.75, 1];
  const valuePts = data.map((d, i) => point(i, d.value).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[320px]">
      <defs>
        <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285f4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ea4c89" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="radarStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285f4" />
          <stop offset="100%" stopColor="#ea4c89" />
        </linearGradient>
      </defs>
      {rings.map((rg, idx) => (
        <polygon
          key={idx}
          points={data.map((_, i) => point(i, rg * 100).join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.12}
          className="text-foreground"
        />
      ))}
      {data.map((_, i) => {
        const [x, y] = point(i, 100);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.1}
            className="text-foreground"
          />
        );
      })}
      <polygon
        points={valuePts}
        fill="url(#radarFill)"
        stroke="url(#radarStroke)"
        strokeWidth={2}
      />
      {data.map((d, i) => {
        const [x, y] = point(i, d.value);
        const [lx, ly] = point(i, 122);
        return (
          <g key={d.label}>
            <circle cx={x} cy={y} r={3.5} fill="url(#radarStroke)" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
