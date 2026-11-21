import { Download, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getPulls } from '../lib/api';
import type { PR, PRStatus } from '../lib/sample';
import { getRepoFilter } from '../lib/store';
import { Avatar, LiveBadge, SampleBadge, Status } from './bits';

type SortKey = 'waiting' | 'newest' | 'changes';
const STATUSES: { key: '' | PRStatus; label: string }[] = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'review', label: 'Needs review' },
  { key: 'stale', label: 'Stale' },
  { key: 'merged', label: 'Merged' },
];

export default function PullsExplorer() {
  const [prs, setPrs] = useState<PR[]>([]);
  const [sample, setSample] = useState(true);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [author, setAuthor] = useState('');
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<'' | PRStatus>('');
  const [sort, setSort] = useState<SortKey>('waiting');
  const [staleOnly, setStaleOnly] = useState(false);
  const [selected, setSelected] = useState<PR | null>(null);
  const repoFilter = getRepoFilter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    getPulls()
      .then(({ pulls, sample: s }) => {
        setPrs(pulls);
        setSample(s);
        const prNum = Number(params.get('pr'));
        if (prNum) {
          const found = pulls.find((p) => p.n === prNum);
          if (found) setSelected(found);
        }
      })
      .catch(() => toast.error('Could not load pull requests'))
      .finally(() => setLoading(false));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const authors = useMemo(() => [...new Set(prs.map((p) => p.author))], [prs]);
  const labels = useMemo(() => [...new Set(prs.flatMap((p) => p.labels))], [prs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = prs.filter(
      (p) =>
        (!status || p.status === status) &&
        (!staleOnly || p.status === 'stale') &&
        (!author || p.author === author) &&
        (!label || p.labels.includes(label)) &&
        (!q || `${p.title} ${p.author} #${p.n}`.toLowerCase().includes(q)) &&
        (!repoFilter || p.repo === repoFilter),
    );
    if (sort === 'waiting') list.sort((a, b) => b.age - a.age);
    if (sort === 'newest') list.sort((a, b) => a.age - b.age);
    if (sort === 'changes') list.sort((a, b) => b.add + b.del - (a.add + a.del));
    return list;
  }, [prs, query, author, label, status, sort, staleOnly, repoFilter]);

  const clearFilters = () => {
    setQuery(''); setAuthor(''); setLabel(''); setStatus(''); setStaleOnly(false);
  };

  const exportCsv = () => {
    const header = 'number,title,repo,author,labels,additions,deletions,review_time,status,age_days';
    const rows = filtered.map((p) =>
      [p.n, `"${p.title.replace(/"/g, '""')}"`, p.repo, `"${p.author}"`, `"${p.labels.join(';')}"`, p.add, p.del, p.review, p.statusLabel, p.age].join(','),
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pull-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} pull requests to CSV`);
  };

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.288px] leading-tight">Pull Requests</h1>
          <p className="mt-1 text-[13px] text-muted">
            {filtered.length} pull request{filtered.length === 1 ? '' : 's'}
            {repoFilter ? ` · filtered to ${repoFilter}` : ''} · {sample ? <SampleBadge /> : <LiveBadge />}
          </p>
        </div>
        <button className="btn" onClick={exportCsv}><Download size={14} /> Export CSV</button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, author, or #number…"
          aria-label="Search pull requests"
          className="input min-w-[200px] flex-1"
        />
        <select value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Filter by author" className="select text-fg2">
          <option value="">Author: all</option>
          {authors.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Filter by label" className="select text-fg2">
          <option value="">Label: all</option>
          {labels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort" className="select text-fg2">
          <option value="waiting">Sort: longest waiting</option>
          <option value="newest">Sort: newest</option>
          <option value="changes">Sort: most changed</option>
        </select>
        <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] text-fg2">
          <input type="checkbox" checked={staleOnly} onChange={(e) => setStaleOnly(e.target.checked)} className="accent-[#5e6ad2]" />
          Stale only
        </label>
      </div>

      <div className="seg mb-3" role="group" aria-label="Status filter">
        {STATUSES.map((s) => (
          <button key={s.key || 'all'} onClick={() => setStatus(s.key)} className={status === s.key ? 'active' : ''} aria-pressed={status === s.key}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="card px-4 py-1">
        {loading ? (
          <p className="py-9 text-center text-[13px] text-muted">Loading pull requests…</p>
        ) : filtered.length === 0 ? (
          <div className="py-9 text-center text-[13px] text-muted">
            No pull requests match these filters.
            <br />
            <button className="btn mt-3" onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="table-head">
              <tr><th>Pull request</th><th>Author</th><th>Labels</th><th>Changes</th><th>Review time</th><th>Status</th><th>Age</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.n} className="table-row" onClick={() => setSelected(p)}>
                  <td>
                    <div className="font-medium text-fg">#{p.n} · {p.title}</div>
                    <div className="font-mono text-[12px] text-muted">{p.repo}</div>
                  </td>
                  <td><span className="inline-flex items-center gap-2"><Avatar ini={p.ini} size={22} />{p.author}</span></td>
                  <td>{p.labels.slice(0, 2).map((l) => <span key={l} className="pill">{l}</span>)}</td>
                  <td><span className="text-success">+{p.add}</span> <span className="text-danger">−{p.del}</span></td>
                  <td>{p.review}</td>
                  <td><Status status={p.status} label={p.statusLabel} /></td>
                  <td>{p.age}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3.5 text-[12px] text-meta">
        Stale = open for more than 3 days without a review. Review time is first review, or “—” when none yet. Click a row for checks, reviewers and timeline.
      </p>

      {selected && (
        <aside className="fixed bottom-0 right-0 top-0 z-50 w-[440px] max-w-[92vw] overflow-auto border-l border-line bg-panel p-5" aria-label="Pull request detail">
          <div className="flex items-start justify-between">
            <SampleBadge />
            <button className="btn btn-subtle" onClick={() => setSelected(null)}>Close <X size={14} /></button>
          </div>
          <h2 className="mt-2.5 text-[18px] font-medium leading-snug tracking-[-0.01em]">#{selected.n} · {selected.title}</h2>
          <p className="mt-1.5 text-[12px] text-meta">
            {selected.repo} · opened {selected.created} by {selected.author} · {selected.age}d old
          </p>
          <p className="mt-1 text-[13px] text-fg2">{selected.desc}</p>
          <div className="mt-3.5">
            {[
              ['Status', selected.statusLabel],
              ['Checks', selected.checks],
              ['Reviewers', selected.reviewers],
              ['Changes', `+${selected.add} / −${selected.del} lines`],
              ['First review', selected.review],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line-soft py-2.5 text-[13px]">
                <span className="text-muted">{k}</span>
                <b className="text-right font-medium">{v}</b>
              </div>
            ))}
          </div>
          <h2 className="mb-1 mt-[18px] text-[15px] font-semibold">Timeline</h2>
          <ul className="mt-1.5 list-none">
            {[
              `${selected.created} — Opened by ${selected.author}`,
              `Review requested from ${selected.reviewers}`,
              selected.review === '—' ? 'No review yet — flagged stale after 3 days' : `First review after ${selected.review}`,
              selected.status === 'merged' ? 'Merged into main' : 'Awaiting review / merge',
            ].map((t) => (
              <li key={t} className="relative border-l border-line py-2 pl-4 text-[13px] text-fg2">
                <span className="absolute -left-[4px] top-[14px] h-[7px] w-[7px] rounded-full border border-line bg-hover" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2">
            <button className="btn btn-primary" onClick={() => toast.success(`Review requested for PR #${selected.n}`)}>Request review</button>
            <button className="btn" onClick={() => toast.success(`Merge requested for PR #${selected.n}`)}>Merge</button>
          </div>
          <p className="mt-3.5 text-[12px] text-meta">Actions call the backend when it is connected; with sample data they only confirm the request.</p>
        </aside>
      )}
    </div>
  );
}
