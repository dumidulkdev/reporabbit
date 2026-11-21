// Typed client for the RepoRabbit FastAPI backend.
// Every read falls back to the seeded sample data when the backend is
// unreachable, and reports `sample: true` so the UI can label it.
//
// Live payloads from the backend use snake_case and the shapes documented
// in backend/README.md; the mappers below convert them to the short
// shapes the React islands render.

import {
  SAMPLE_ALERTS, SAMPLE_CONTRIBUTORS, SAMPLE_DORA, SAMPLE_KPIS,
  SAMPLE_PRS, SAMPLE_REPOS, SAMPLE_TREND, SAMPLE_VOLUME,
  initials,
  type AlertItem, type Contributor, type Kpi, type PR, type PRStatus, type Range, type Repo,
} from './sample';
import { getToken } from './store';

export const API_URL: string =
  (import.meta.env.PUBLIC_API_URL as string | undefined) ?? 'http://localhost:8000';

export interface DashboardData {
  kpis: Kpi[];
  trend: number[];
  dora: { label: string; value: string; pct: number }[];
  volume: { opened: number[]; merged: number[] };
  attention: PR[];
  contributors: Contributor[];
  sample: boolean;
}

async function getJson(path: string): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function requestJson(path: string, method: string, body: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json() as { detail?: string; message?: string };
      msg = data.detail ?? data.message ?? msg;
    } catch { /* keep default message */ }
    throw new Error(msg);
  }
  return res.json();
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  return requestJson(path, 'POST', body);
}

async function putJson(path: string, body: unknown): Promise<unknown> {
  return requestJson(path, 'PUT', body);
}

// --- mappers: backend snake_case -> frontend shapes ---

function shortRepo(fullName: string | null | undefined): string {
  if (!fullName) return '';
  return fullName.includes('/') ? (fullName.split('/').pop() as string) : fullName;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ageDays(iso: string | null | undefined): number {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return 0;
  return Math.max(0, Math.floor((Date.now() - d) / 86400000));
}

function relative(iso: string | null | undefined): string {
  if (!iso) return 'Never synced';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return 'Just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `Synced ${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Synced ${hours} h ago`;
  return `Synced ${Math.floor(hours / 24)} d ago`;
}

type BackendPR = {
  id: number; number: number; title: string; author: string; body?: string | null;
  repo_full_name?: string | null; labels?: string[]; additions: number; deletions: number;
  status: string; created_at: string; merged_at?: string | null;
  review_time_hours?: number | null; cycle_time_days?: number | null;
};

function mapPR(p: BackendPR): PR {
  const status: PRStatus =
    p.status === 'needs_review' ? 'review'
    : p.status === 'stale' ? 'stale'
    : p.status === 'merged' ? 'merged' : 'open';
  const statusLabel =
    status === 'review' ? 'Needs review'
    : status === 'stale' ? 'Stale'
    : status === 'merged' ? 'Merged' : 'Open';
  return {
    n: p.number,
    title: p.title,
    repo: shortRepo(p.repo_full_name),
    author: p.author,
    ini: initials(p.author),
    labels: (p.labels ?? []).slice(0, 2),
    add: p.additions,
    del: p.deletions,
    review: p.review_time_hours == null ? '—' : `${p.review_time_hours}h`,
    status,
    statusLabel,
    age: ageDays(p.created_at),
    created: fmtDate(p.created_at),
    desc: p.body ?? '',
    checks: '—',
    reviewers: '—',
  };
}

type BackendRepo = {
  id: number; owner: string; name: string; full_name: string; visibility: string;
  sync_status: string; last_synced_at?: string | null; open_prs: number; merged_prs: number;
};

function mapRepo(r: BackendRepo): Repo {
  const syncDot = r.sync_status === 'failed' ? 'r' : r.sync_status === 'syncing' ? 'a' : 'g';
  const sync =
    r.sync_status === 'failed' ? 'Sync failed'
    : r.sync_status === 'never' ? 'Never synced'
    : relative(r.last_synced_at);
  return {
    name: r.name,
    vis: r.visibility === 'private' ? 'Private' : 'Public',
    sync,
    syncDot,
    open: r.open_prs,
    merged: r.merged_prs,
    cycle: '—',
    last: r.last_synced_at ? fmtDate(r.last_synced_at) : '—',
  };
}

type BackendContributor = {
  id: number; name: string; github_username: string; prs_merged: number;
  reviews_given: number; avg_review_time_hours: number; additions: number; deletions: number;
};

function mapContributor(c: BackendContributor): Contributor {
  return {
    name: c.name,
    ini: initials(c.name),
    merged: c.prs_merged,
    reviews: c.reviews_given,
    reviewTime: `${c.avg_review_time_hours}h`,
    add: c.additions,
    del: c.deletions,
    trend: '—',
  };
}

type BackendAlert = {
  id: number; type: string; message: string; repo_id?: number | null; pr_id?: number | null;
  repo_full_name?: string | null; is_read: boolean; created_at: string;
};

function mapAlert(a: BackendAlert): AlertItem {
  const dot = a.type === 'failed_check' || a.type === 'sync_failed' ? 'r'
    : a.type === 'stale_pr' || a.type === 'large_pr' ? 'a' : 'g';
  return {
    dot,
    text: a.message,
    when: fmtDate(a.created_at),
    link: a.pr_id ? `#${a.pr_id}` : shortRepo(a.repo_full_name),
  };
}

function sampleDashboard(range: Range, repoFilter: string): DashboardData {
  const prs = repoFilter ? SAMPLE_PRS.filter((p) => p.repo === repoFilter) : SAMPLE_PRS;
  const attention = [...prs].filter((p) => p.status !== 'merged').sort((a, b) => b.age - a.age).slice(0, 5);
  return {
    kpis: SAMPLE_KPIS[range],
    trend: SAMPLE_TREND[range],
    dora: SAMPLE_DORA,
    volume: SAMPLE_VOLUME,
    attention,
    contributors: SAMPLE_CONTRIBUTORS,
    sample: true,
  };
}

type Overview = {
  cycle_time_days?: number | null; review_latency_hours?: number | null;
  merge_rate: number; open_prs: number; stale_prs: number; total_prs: number; merged_prs: number;
  cycle_time_trend: { date: string; value?: number | null; merged: number }[];
};

type Dora = {
  lead_time_days?: number | null; deployment_frequency_per_week: number;
  change_failure_rate: number; time_to_restore_hours?: number | null;
};

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export async function getDashboard(range: Range, repoFilter = ''): Promise<DashboardData> {
  try {
    const repoParam = repoFilter ? `&repo=${encodeURIComponent(repoFilter)}` : '';
    const [overview, dora, pullsPayload, contributorsPayload] = await Promise.all([
      getJson(`/api/metrics/overview?range=${range}${repoParam}`) as Promise<Overview>,
      getJson(`/api/metrics/dora?range=${range}${repoParam}`) as Promise<Dora>,
      getJson('/api/pulls?page_size=100') as Promise<{ items: BackendPR[] }>,
      getJson('/api/contributors') as Promise<BackendContributor[]>,
    ]);
    const pulls = (pullsPayload.items ?? []).map(mapPR);
    const filtered = repoFilter ? pulls.filter((p) => p.repo === repoFilter) : pulls;
    const attention = [...filtered]
      .filter((p) => p.status !== 'merged')
      .sort((a, b) => b.age - a.age)
      .slice(0, 5);
    const trendValues = overview.cycle_time_trend.map((t) => t.value ?? 0);
    const trend = trendValues.length > 0 ? trendValues : SAMPLE_TREND[range];
    // Weekly volume: bucket PRs opened into 8 buckets across the range,
    // and bucket merges from the overview trend into the same 8 buckets.
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const buckets = 8;
    const opened = Array<number>(buckets).fill(0);
    const now = Date.now();
    for (const p of filtered) {
      const createdMs = new Date(p.created).getTime();
      if (!Number.isNaN(createdMs)) {
        const idx = Math.min(buckets - 1, Math.floor(((now - createdMs) / 86400000 / days) * buckets));
        if (idx >= 0) opened[buckets - 1 - idx] += 1;
      }
    }
    const step = Math.max(1, Math.floor(overview.cycle_time_trend.length / buckets));
    const mergedBuckets = overview.cycle_time_trend
      .filter((_, i) => i % step === 0)
      .slice(0, buckets)
      .map((t) => t.merged);
    while (mergedBuckets.length < buckets) mergedBuckets.push(0);
    const kpis: Kpi[] = [
      {
        label: 'PR cycle time',
        value: overview.cycle_time_days == null ? '—' : `${overview.cycle_time_days}d`,
        delta: `${overview.total_prs} PRs in range`, dir: 'flat',
        cap: 'Average, created to merge',
      },
      {
        label: 'Review latency',
        value: overview.review_latency_hours == null ? '—' : `${overview.review_latency_hours}h`,
        delta: `${overview.merged_prs} merged in range`, dir: 'flat',
        cap: 'Average time to first review',
      },
      {
        label: 'Merge rate',
        value: `${overview.merge_rate}%`,
        delta: `${overview.merged_prs} of ${overview.total_prs} merged`, dir: 'flat',
        cap: 'Merged / opened',
      },
      {
        label: 'Open PRs',
        value: String(overview.open_prs),
        delta: `${overview.stale_prs} stale`, dir: 'flat',
        cap: 'Across tracked repositories',
      },
    ];
    const doraRows = [
      { label: 'Lead time for changes', value: dora.lead_time_days == null ? '—' : `${dora.lead_time_days}d`, pct: dora.lead_time_days == null ? 0 : clampPct(100 - dora.lead_time_days * 20) },
      { label: 'Deployment frequency', value: `${dora.deployment_frequency_per_week} / week`, pct: clampPct(dora.deployment_frequency_per_week * 15) },
      { label: 'Change failure rate', value: `${dora.change_failure_rate}%`, pct: clampPct(100 - dora.change_failure_rate) },
      { label: 'Time to restore service', value: dora.time_to_restore_hours == null ? '—' : `${dora.time_to_restore_hours}h`, pct: dora.time_to_restore_hours == null ? 0 : clampPct(100 - dora.time_to_restore_hours * 8) },
    ];
    return {
      kpis,
      trend,
      dora: doraRows,
      volume: { opened, merged: mergedBuckets },
      attention,
      contributors: (contributorsPayload as BackendContributor[]).map(mapContributor),
      sample: false,
    };
  } catch {
    return sampleDashboard(range, repoFilter);
  }
}

export async function getPulls(): Promise<{ pulls: PR[]; sample: boolean }> {
  try {
    const data = await getJson('/api/pulls?page_size=100') as { items: BackendPR[] } | BackendPR[];
    const items = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(items) || items.length === 0) throw new Error('Empty pulls payload');
    return { pulls: items.map(mapPR), sample: false };
  } catch {
    return { pulls: SAMPLE_PRS, sample: true };
  }
}

export async function getRepos(): Promise<{ repos: Repo[]; sample: boolean }> {
  try {
    const data = await getJson('/api/repos') as BackendRepo[] | { repos: BackendRepo[] };
    const repos = Array.isArray(data) ? data : data.repos;
    if (!Array.isArray(repos) || repos.length === 0) throw new Error('Empty repos payload');
    return { repos: repos.map(mapRepo), sample: false };
  } catch {
    return { repos: SAMPLE_REPOS, sample: true };
  }
}

export async function getContributors(): Promise<{ contributors: Contributor[]; sample: boolean }> {
  try {
    const data = await getJson('/api/contributors') as BackendContributor[] | { contributors: BackendContributor[] };
    const contributors = Array.isArray(data) ? data : data.contributors;
    if (!Array.isArray(contributors) || contributors.length === 0) throw new Error('Empty contributors payload');
    return { contributors: contributors.map(mapContributor), sample: false };
  } catch {
    return { contributors: SAMPLE_CONTRIBUTORS, sample: true };
  }
}

export async function getAlerts(): Promise<{ alerts: AlertItem[]; sample: boolean }> {
  try {
    const data = await getJson('/api/alerts') as BackendAlert[] | { alerts: BackendAlert[] };
    const alerts = Array.isArray(data) ? data : data.alerts;
    if (!Array.isArray(alerts)) throw new Error('Empty alerts payload');
    return { alerts: alerts.map(mapAlert), sample: false };
  } catch {
    return { alerts: SAMPLE_ALERTS, sample: true };
  }
}

export async function login(email: string, password: string): Promise<string> {
  const data = await postJson('/api/auth/login', { email, password }) as {
    access_token?: string; token?: string;
  };
  const token = data.access_token ?? data.token;
  if (!token) throw new Error('Login succeeded but no token was returned');
  return token;
}

export async function syncNow(): Promise<void> {
  await postJson('/api/repos/sync', {});
}

export async function connectRepo(fullName: string): Promise<void> {
  const [owner, name] = fullName.split('/').map((s) => s.trim());
  if (!owner || !name) throw new Error('Use owner/repo format, for example dumidulkdev/reporabbit');
  await postJson('/api/repos', { owner, name, visibility: 'public' });
}

export interface Settings {
  workspaceName: string;
  syncInterval: string;
  staleThreshold: string;
  largePrThreshold: string;
  digestEnabled: boolean;
}

export async function saveSettings(settings: Settings): Promise<boolean> {
  // Returns true when the backend accepted the settings, false when they
  // were only stored locally because the backend is unreachable.
  try {
    await putJson('/api/settings', {
      workspace_name: settings.workspaceName,
      sync_interval_minutes: Number(settings.syncInterval) || 60,
      stale_threshold_days: Number(settings.staleThreshold) || 5,
      digest_enabled: settings.digestEnabled,
    });
    return true;
  } catch {
    window.localStorage.setItem('rr:settings', JSON.stringify(settings));
    return false;
  }
}

export function loadLocalSettings(): Settings | null {
  try {
    const raw = window.localStorage.getItem('rr:settings');
    return raw ? (JSON.parse(raw) as Settings) : null;
  } catch {
    return null;
  }
}
