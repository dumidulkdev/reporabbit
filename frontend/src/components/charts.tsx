// Plain-SVG charts using only the design tokens. No chart library, no
// extra palette.

export function LineChart({ data, label }: { data: number[]; label: string }) {
  const w = 560, h = 180, pad = 28;
  const max = Math.max(...data) * 1.15;
  const min = Math.min(...data) * 0.7;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / (data.length - 1);
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label}>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad} y1={h * f} x2={w - pad} y2={h * f} stroke="rgba(255,255,255,0.05)" />
      ))}
      <polyline points={pts} fill="none" stroke="#7170ff" strokeWidth="2" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#08090a" stroke="#7170ff" strokeWidth="2">
          <title>{v.toFixed(1)} days</title>
        </circle>
      ))}
      <text x={pad} y={h - 6} fill="#62666d" fontSize="11">Start</text>
      <text x={w - pad - 24} y={h - 6} fill="#62666d" fontSize="11">Now</text>
    </svg>
  );
}

export function GroupedBarChart({ opened, merged, label }: { opened: number[]; merged: number[]; label: string }) {
  const w = 560, h = 170, pad = 28, bw = 18;
  const max = Math.max(...opened, ...merged) * 1.1;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label}>
      {opened.map((o, i) => {
        const m = merged[i];
        const x = pad + i * ((w - 2 * pad) / opened.length) + 8;
        const oh = (o / max) * (h - 2 * pad);
        const mh = (m / max) * (h - 2 * pad);
        return (
          <g key={i}>
            <rect x={x} y={h - pad - oh} width={bw} height={oh} rx="2" fill="rgba(255,255,255,0.14)">
              <title>Opened {o}</title>
            </rect>
            <rect x={x + bw + 3} y={h - pad - mh} width={bw} height={mh} rx="2" fill="#5e6ad2">
              <title>Merged {m}</title>
            </rect>
          </g>
        );
      })}
      <text x={pad} y={h - 6} fill="#62666d" fontSize="11">8 weeks ago</text>
      <text x={w - pad - 30} y={h - 6} fill="#62666d" fontSize="11">This week</text>
    </svg>
  );
}
