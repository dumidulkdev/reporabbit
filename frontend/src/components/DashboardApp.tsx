import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDashboard, type DashboardData } from '../lib/api';
import type { Range } from '../lib/sample';
import { RANGE_EVENT, REPO_EVENT, getRange, getRepoFilter, setRepoFilter } from '../lib/store';
import { Avatar, LiveBadge, ProgressBar, SampleBadge, Status } from './bits';
import { GroupedBarChart, LineChart } from './charts';

export default function DashboardApp() {
  const [range, setRangeState] = useState<Range>('30d');
  const [repoFilter, setRepo] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRangeState(getRange());
    setRepo(getRepoFilter());
    const onRange = (e: Event) => setRangeState((e as CustomEvent<Range>).detail);
    const onRepo = (e: Event) => setRepo((e as CustomEvent<string>).detail ?? getRepoFilter());
    window.addEventListener(RANGE_EVENT, onRange);
    window.addEventListener(REPO_EVENT, onRepo);
    return () => {
      window.removeEventListener(RANGE_EVENT, onRange);
      window.removeEventListener(REPO_EVENT, onRepo);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboard(range, repoFilter)
      .then((d) => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, repoFilter]);

  const totalOpened = data ? data.volume.opened.reduce((a, b) => a + b, 0) : 0;
  const totalMerged = data ? data.volume.merged.reduce((a, b) => a + b, 0) : 0;

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.288px] leading-tight">Overview</h1>
          <p className="mt-1 text-[13px] text-muted">
            {repoFilter ? <span className="font-mono text-[12.5px] text-fg2">{repoFilter}</span> : 'All repositories'}
            {' · '}Last sync 12 min ago{' · '}
            {data?.sample ? <SampleBadge /> : <LiveBadge />}
          </p>
          {repoFilter && (
            <button
              onClick={() => setRepoFilter('')}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-line-soft px-2.5 py-0.5 text-[12px] text-fg2 hover:bg-[rgba(255,255,255,0.04)]"
            >
              Filtered to {repoFilter} <X size={12} />
            </button>
          )}
        </div>
        <span className="whitespace-nowrap rounded-full border border-line-soft px-2.5 py-0.5 text-[11px] text-meta">
          {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'} · vs previous {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
        </span>
      </div>

      {loading && !data && <p className="text-[13px] text-muted">Loading metrics…</p>}
      {loading && data && <p className="mb-3 text-[12px] text-meta">Refreshing…</p>}

      {data && (
        <>
          <div className="mb-3 grid grid-cols-4 gap-3 max-lg:grid-cols-2">
            {data.kpis.map((k) => (
              <div key={k.label} className="card">
                <div className="text-[12px] text-muted">{k.label}</div>
                <div className="my-1.5 text-[28px] font-medium leading-none tracking-[-0.02em]">{k.value}</div>
                <div className={`text-[12px] ${k.dir === 'up' ? 'text-success' : k.dir === 'down' ? 'text-danger' : 'text-muted'}`}>
                  {k.delta}
                </div>
                <div className="mt-1 text-[12px] text-meta">{k.cap}</div>
              </div>
            ))}
          </div>

          <div className="mb-3 grid grid-cols-[1.6fr_1fr] gap-3 max-lg:grid-cols-1">
            <div className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Cycle time trend</h2>
                  <p className="mb-3.5 text-[12px] text-muted">Median days from first commit to merge</p>
                </div>
                <span className="text-[12px] text-meta">{range} · median</span>
              </div>
              <LineChart data={data.trend} label="Cycle time trend chart" />
            </div>
            <div className="card">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">DORA metrics</h2>
              <p className="mb-3.5 text-[12px] text-muted">Four keys, trailing {range}</p>
              {data.dora.map((row) => (
                <div key={row.label} className="mb-3.5">
                  <div className="flex justify-between text-[13px]">
                    <span>{row.label}</span>
                    <b className="font-medium">{row.value}</b>
                  </div>
                  <div className="mt-[7px]"><ProgressBar pct={row.pct} /></div>
                </div>
              ))}
              <p className="mt-0.5 text-[12px] text-meta">
                Bars are relative to the workspace target, not a score. Change failure rate is inverted: higher bar means further inside target.
              </p>
            </div>
          </div>

          <div className="mb-3 grid grid-cols-[1.6fr_1fr] gap-3 max-lg:grid-cols-1">
            <div className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Needs attention</h2>
                  <p className="mb-3.5 text-[12px] text-muted">Longest-waiting open pull requests</p>
                </div>
                <a href="/pulls" className="btn btn-subtle">View all</a>
              </div>
              <table className="w-full border-collapse">
                <thead className="table-head"><tr><th>Pull request</th><th>Author</th><th>Waiting</th><th>Status</th></tr></thead>
                <tbody>
                  {data.attention.map((p) => (
                    <tr key={p.n} className="table-row" onClick={() => { window.location.href = `/pulls?pr=${p.n}`; }}>
                      <td>
                        <div className="font-medium text-fg">#{p.n} · {p.title}</div>
                        <div className="font-mono text-[12px] text-muted">{p.repo}</div>
                      </td>
                      <td><span className="inline-flex items-center gap-2"><Avatar ini={p.ini} size={22} />{p.author}</span></td>
                      <td>{p.age}d</td>
                      <td><Status status={p.status} label={p.statusLabel} /></td>
                    </tr>
                  ))}
                  {data.attention.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-[13px] text-muted">No open pull requests need attention.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="card">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Weekly volume</h2>
              <p className="mb-3.5 text-[12px] text-muted">PRs opened vs merged, last 8 weeks</p>
              <GroupedBarChart opened={data.volume.opened} merged={data.volume.merged} label="Weekly volume chart" />
              <p className="mt-3.5 text-[12px] text-meta">
                Opened bars are neutral; merged bars use the accent. {totalOpened} opened, {totalMerged} merged in the period.
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Top contributors</h2>
            <p className="mb-3.5 text-[12px] text-muted">PRs merged, trailing {range}</p>
            <div className="divide-y divide-[rgba(255,255,255,0.05)]">
              {data.contributors.slice(0, 5).map((c, i) => (
                <div key={c.name} className="flex items-center gap-3 py-2.5 text-[13px]">
                  <span className="w-[22px] font-mono text-[12px] text-meta">{i + 1}</span>
                  <Avatar ini={c.ini} />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-muted">{c.merged} merged</span>
                  <span className={c.trend.startsWith('+') ? 'text-success' : 'text-danger'}>{c.trend}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3.5 text-[12px] text-meta">
            Numbers are {data.sample ? 'sample data' : 'live data from the connected backend'}. The 7d / 30d / 90d control above updates the KPIs and the trend chart. Click any PR row to open its detail panel.
          </p>
        </>
      )}
    </div>
  );
}
