import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { connectRepo, getRepos } from '../lib/api';
import type { Repo } from '../lib/sample';
import { getRepoFilter, setRepoFilter } from '../lib/store';
import { LiveBadge, SampleBadge } from './bits';

const FULL_NAME_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export default function ReposApp() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [sample, setSample] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const selectedRepo = getRepoFilter();

  useEffect(() => {
    getRepos()
      .then(({ repos: r, sample: s }) => { setRepos(r); setSample(s); })
      .catch(() => toast.error('Could not load repositories'))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    const value = fullName.trim();
    if (!value) {
      setError('Enter a repository, e.g. dumidulkdev/reporabbit');
      return;
    }
    if (!FULL_NAME_RE.test(value)) {
      setError('Use the format owner/repository, e.g. dumidulkdev/reporabbit');
      return;
    }
    setError('');
    setConnecting(true);
    try {
      await connectRepo(value);
      toast.success(`Connected ${value}`);
      setFullName('');
      setShowForm(false);
    } catch {
      // Backend unreachable: keep the repo locally so the flow still works.
      const name = value.split('/')[1];
      if (!repos.some((r) => r.name === name)) {
        setRepos((prev) => [...prev, { name, vis: 'Public', sync: 'Sync pending', syncDot: 'a', open: 0, merged: 0, cycle: '—', last: 'Just now' }]);
      }
      toast.success(`Connected ${value} (saved locally — backend unreachable)`);
      setFullName('');
      setShowForm(false);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.288px] leading-tight">Repositories</h1>
          <p className="mt-1 text-[13px] text-muted">
            {repos.length} connected · GitHub App · {sample ? <SampleBadge /> : <LiveBadge />}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> Connect repository
        </button>
      </div>

      {showForm && (
        <div className="card mb-3">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Connect a repository</h2>
          <p className="mb-3.5 text-[12px] text-muted">Public repositories only in this workspace. The GitHub App requests read access to code, pull requests and checks.</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') void submit(); }}
              placeholder="owner / repository, e.g. dumidulkdev/reporabbit"
              aria-label="Repository name"
              className="input min-w-[200px] flex-1"
            />
            <button className="btn btn-primary" onClick={() => void submit()} disabled={connecting}>
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
            <button className="btn" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
          </div>
          {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
        </div>
      )}

      <div className="card px-4 py-1">
        {loading ? (
          <p className="py-9 text-center text-[13px] text-muted">Loading repositories…</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="table-head">
              <tr><th>Repository</th><th>Sync</th><th>Open PRs</th><th>Merged · 30d</th><th>Avg cycle time</th><th>Last activity</th></tr>
            </thead>
            <tbody>
              {repos.map((r) => (
                <tr
                  key={r.name}
                  className={`table-row ${selectedRepo === r.name ? 'bg-[rgba(255,255,255,0.04)]' : ''}`}
                  onClick={() => {
                    if (selectedRepo === r.name) {
                      setRepoFilter('');
                      toast.success('Dashboard filter cleared — showing all repositories');
                    } else {
                      setRepoFilter(r.name);
                      toast.success(`Dashboard filtered to ${r.name}`);
                      window.location.href = '/';
                    }
                  }}
                  title="Click to filter the Dashboard to this repo"
                >
                  <td>
                    <div className="flex items-center gap-2 font-mono text-[12.5px] font-medium text-fg">
                      {r.name}
                      {selectedRepo === r.name && <X size={12} className="text-muted" />}
                    </div>
                    <div className="text-[12px] text-muted">{r.vis}</div>
                  </td>
                  <td>
                    <span className={`dot dot-${r.syncDot}`} />
                    <span className={r.syncDot === 'r' ? 'text-danger' : ''}>{r.sync}</span>
                  </td>
                  <td>{r.open}</td>
                  <td>{r.merged}</td>
                  <td>{r.cycle}</td>
                  <td className="text-muted">{r.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3.5 text-[12px] text-meta">
        Select a repository row to filter the Dashboard to that repo. Disconnecting a repo stops its sync and keeps its historical metrics.
      </p>
    </div>
  );
}
