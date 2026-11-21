import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getContributors } from '../lib/api';
import type { Contributor } from '../lib/sample';
import { Avatar, LiveBadge, ProgressBar, SampleBadge } from './bits';

export default function ContributorsApp() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [sample, setSample] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContributors()
      .then(({ contributors: c, sample: s }) => { setContributors(c); setSample(s); })
      .catch(() => toast.error('Could not load contributors'))
      .finally(() => setLoading(false));
  }, []);

  const maxAdd = Math.max(1, ...contributors.map((c) => c.add));
  const maxReviews = Math.max(1, ...contributors.map((c) => c.reviews));

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.288px] leading-tight">Contributors</h1>
          <p className="mt-1 text-[13px] text-muted">
            Trailing 30 days · all repositories · {sample ? <SampleBadge /> : <LiveBadge />}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-[13px] text-muted">Loading contributors…</p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-3 max-lg:grid-cols-1">
            <div className="card">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Code churn</h2>
              <p className="mb-3.5 text-[12px] text-muted">Additions vs deletions per contributor</p>
              {contributors.map((c) => (
                <div key={c.name} className="mb-3">
                  <div className="flex justify-between text-[13px]">
                    <span>{c.name}</span>
                    <span className="text-muted">+{c.add.toLocaleString()} / −{c.del.toLocaleString()}</span>
                  </div>
                  <div className="mt-1.5 flex gap-1">
                    <div className="flex-1"><ProgressBar pct={Math.round((c.add / maxAdd) * 100)} /></div>
                    <div className="flex-[0.45]">
                      <div className="h-1 min-w-[90px] overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                        <div className="h-full bg-[rgba(255,255,255,0.22)]" style={{ width: `${Math.round((c.del / maxAdd) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Review load</h2>
              <p className="mb-3.5 text-[12px] text-muted">Reviews given vs reviews received — who is the bottleneck?</p>
              {contributors.map((c) => (
                <div key={c.name} className="mb-3">
                  <div className="flex justify-between text-[13px]">
                    <span>{c.name}</span>
                    <span className="text-muted">{c.reviews} given · {c.reviewTime} avg</span>
                  </div>
                  <div className="mt-1.5"><ProgressBar pct={Math.round((c.reviews / maxReviews) * 100)} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card px-4 py-1">
            <table className="w-full border-collapse">
              <thead className="table-head">
                <tr><th></th><th>Contributor</th><th>PRs merged</th><th>Reviews given</th><th>Avg review time</th><th>Lines changed</th><th>Trend</th></tr>
              </thead>
              <tbody>
                {contributors.map((c, i) => (
                  <tr key={c.name} className="table-row" style={{ cursor: 'default' }}>
                    <td className="w-[22px] font-mono text-[12px] text-meta">{i + 1}</td>
                    <td><span className="inline-flex items-center gap-2"><Avatar ini={c.ini} />{c.name}</span></td>
                    <td>{c.merged}</td>
                    <td>{c.reviews}</td>
                    <td>{c.reviewTime}</td>
                    <td><span className="text-success">+{c.add.toLocaleString()}</span> <span className="text-danger">−{c.del.toLocaleString()}</span></td>
                    <td className={c.trend.startsWith('+') ? 'text-success' : 'text-danger'}>{c.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3.5 text-[12px] text-meta">
            No scores, points or badges — just the numbers. Trend compares merged PRs with the previous 30 days.
          </p>
        </>
      )}
    </div>
  );
}
