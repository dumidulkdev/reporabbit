import { statusDot, type PRStatus } from '../lib/sample';

export function SampleBadge() {
  return (
    <span className="whitespace-nowrap rounded-full border border-line-soft px-2.5 py-0.5 text-[11px] text-meta">
      Sample data
    </span>
  );
}

export function LiveBadge() {
  return (
    <span className="whitespace-nowrap rounded-full border border-line-soft px-2.5 py-0.5 text-[11px] text-success">
      Live data
    </span>
  );
}

export function Avatar({ ini, size = 24 }: { ini: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-hover font-medium text-fg2"
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.42) }}
    >
      {ini}
    </span>
  );
}

export function Status({ status, label }: { status: PRStatus; label: string }) {
  return (
    <span className="whitespace-nowrap text-[13px]">
      <span className={`dot dot-${statusDot(status)}`} />
      {label}
    </span>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1 min-w-[90px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}
