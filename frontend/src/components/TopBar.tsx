import { RefreshCw, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { syncNow } from '../lib/api';
import { RANGE_EVENT, getRange, setRange } from '../lib/store';
import type { Range } from '../lib/sample';

const RANGES: Range[] = ['7d', '30d', '90d'];

export default function TopBar() {
  const [range, setRangeState] = useState<Range>('30d');
  const [query, setQuery] = useState('');
  const [syncing, setSyncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRangeState(getRange());
    const onRange = (e: Event) => setRangeState((e as CustomEvent<Range>).detail);
    window.addEventListener(RANGE_EVENT, onRange);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(RANGE_EVENT, onRange);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const goSearch = () => {
    window.location.href = query.trim() ? `/pulls?q=${encodeURIComponent(query.trim())}` : '/pulls';
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncNow();
      toast.success('Sync started — repositories are updating');
    } catch {
      toast.error('Sync failed: backend unreachable. Showing sample data.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line-soft bg-bg px-6 max-md:px-4">
      <label className="flex w-[340px] max-w-full items-center gap-2 rounded-md border border-line bg-[rgba(255,255,255,0.02)] px-2.5 py-1.5 text-[13px] text-muted">
        <Search size={14} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') goSearch(); }}
          type="text"
          placeholder="Search pull requests, repos, people…"
          aria-label="Search"
          className="min-w-0 flex-1 border-0 bg-transparent text-fg placeholder:text-muted"
        />
        <kbd className="rounded border border-line-soft px-1.5 font-mono text-[11px] text-meta">⌘K</kbd>
      </label>
      <div className="flex-1" />
      <div className="seg" role="group" aria-label="Time range">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={range === r ? 'active' : ''}
            aria-pressed={range === r}
          >
            {r}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-hover text-[10px] font-medium text-fg2" title="Dumidu Lakshan">DL</span>
    </header>
  );
}
