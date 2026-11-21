import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAlerts } from '../lib/api';
import type { AlertItem } from '../lib/sample';
import { LiveBadge, SampleBadge } from './bits';

interface AlertRow extends AlertItem {
  read: boolean;
}

export default function AlertsApp() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [sample, setSample] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts()
      .then(({ alerts: a, sample: s }) => {
        setAlerts(a.map((x) => ({ ...x, read: false })));
        setSample(s);
      })
      .catch(() => toast.error('Could not load alerts'))
      .finally(() => setLoading(false));
  }, []);

  const unread = alerts.filter((a) => !a.read).length;

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    toast.success('All alerts marked as read');
  };

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-[-0.288px] leading-tight">Alerts</h1>
          <p className="mt-1 text-[13px] text-muted">
            {unread} unread · {sample ? <SampleBadge /> : <LiveBadge />}
          </p>
        </div>
        <button className="btn" onClick={markAllRead} disabled={unread === 0}>Mark all read</button>
      </div>

      <div className="card">
        {loading ? (
          <p className="py-4 text-[13px] text-muted">Loading alerts…</p>
        ) : alerts.length === 0 ? (
          <p className="py-4 text-[13px] text-muted">No alerts.</p>
        ) : (
          alerts.map((a, i) => (
            <div
              key={i}
              onClick={() => setAlerts((prev) => prev.map((x, j) => (j === i ? { ...x, read: true } : x)))}
              className={`flex cursor-pointer items-start gap-3 border-b border-line-soft py-3 text-[13px] last:border-b-0 ${a.read ? 'opacity-55' : ''}`}
            >
              <span className={`dot dot-${a.dot} mt-[7px]`} />
              <div className="flex-1">
                {a.text}
                <div className="mt-0.5 text-[12px] text-meta">{a.link} · {a.when}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="mt-3.5 text-[12px] text-meta">
        Alert rules live in Settings: stale threshold, large-PR threshold, and failed-check notifications.
      </p>
    </div>
  );
}
