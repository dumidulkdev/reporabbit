// Sample data used when the backend is unreachable. Clearly labelled
// "Sample data" in the UI; never presented as live numbers.

export type Range = '7d' | '30d' | '90d';
export type PRStatus = 'open' | 'review' | 'stale' | 'merged';

export interface PR {
  n: number;
  title: string;
  repo: string;
  author: string;
  ini: string;
  labels: string[];
  add: number;
  del: number;
  review: string;
  status: PRStatus;
  statusLabel: string;
  age: number;
  created: string;
  desc: string;
  checks: string;
  reviewers: string;
}

export interface Repo {
  name: string;
  vis: string;
  sync: string;
  syncDot: 'g' | 'a' | 'r';
  open: number;
  merged: number;
  cycle: string;
  last: string;
}

export interface Contributor {
  name: string;
  ini: string;
  merged: number;
  reviews: number;
  reviewTime: string;
  add: number;
  del: number;
  trend: string;
}

export interface AlertItem {
  dot: 'a' | 'r' | 'g';
  text: string;
  when: string;
  link: string;
}

export interface Kpi {
  label: string;
  value: string;
  delta: string;
  dir: 'up' | 'down' | 'flat';
  cap: string;
}

export const SAMPLE_PRS: PR[] = [
  { n: 482, title: 'Add rate limiting to the GitHub sync worker', repo: 'reporabbit', author: 'Anika Perera', ini: 'AP', labels: ['backend', 'sync'], add: 214, del: 63, review: '4.1h', status: 'review', statusLabel: 'Needs review', age: 1, created: 'Nov 20, 2026', desc: 'Caps GitHub API calls per repo at 4,000/hour with a token-bucket limiter and backs off on 403 responses instead of failing the sync.', checks: '5 of 5 checks passing', reviewers: 'Dumidu Lakshan, Kavindu Rajapakse' },
  { n: 481, title: 'Fix DORA lead-time calculation for reopened PRs', repo: 'reporabbit', author: 'Dumidu Lakshan', ini: 'DL', labels: ['bug', 'metrics'], add: 96, del: 41, review: '2.3h', status: 'open', statusLabel: 'Open', age: 1, created: 'Nov 20, 2026', desc: 'Reopened PRs were counted from the original open date. Lead time now restarts at the reopen event.', checks: '5 of 5 checks passing', reviewers: 'Anika Perera' },
  { n: 479, title: 'Redesign contributor table for mobile', repo: 'reporabbit', author: 'Shenali Fernando', ini: 'SF', labels: ['frontend'], add: 342, del: 188, review: '—', status: 'stale', statusLabel: 'Stale', age: 6, created: 'Nov 15, 2026', desc: 'Collapses the leaderboard to a stacked layout under 768px and moves churn into a detail row. No review after 6 days.', checks: '4 of 5 checks passing', reviewers: '—' },
  { n: 478, title: 'Add webhook signature verification', repo: 'reporabbit', author: 'Kavindu Rajapakse', ini: 'KR', labels: ['backend', 'security'], add: 178, del: 22, review: '7.8h', status: 'review', statusLabel: 'Needs review', age: 2, created: 'Nov 19, 2026', desc: 'Verifies the HMAC-SHA256 signature on every GitHub webhook delivery and rejects unsigned payloads with 401.', checks: '5 of 5 checks passing', reviewers: 'Dumidu Lakshan' },
  { n: 476, title: 'Cache contributor stats for 15 minutes', repo: 'fastapi-invoicing', author: 'Nethmi Silva', ini: 'NS', labels: ['backend'], add: 121, del: 54, review: '—', status: 'stale', statusLabel: 'Stale', age: 5, created: 'Nov 16, 2026', desc: 'Adds a Redis-backed cache around the contributor aggregation query, which was the slowest endpoint on the dashboard.', checks: '3 of 4 checks passing', reviewers: '—' },
  { n: 475, title: 'Export PR data to CSV', repo: 'reporabbit', author: 'Anika Perera', ini: 'AP', labels: ['feature'], add: 267, del: 19, review: '3.2h', status: 'merged', statusLabel: 'Merged', age: 4, created: 'Nov 17, 2026', desc: 'Exports the filtered PR table to CSV with the same columns as the explorer, including review time and labels.', checks: '5 of 5 checks passing', reviewers: 'Dumidu Lakshan, Shenali Fernando' },
  { n: 473, title: 'Migrate sync jobs from BackgroundTasks to ARQ', repo: 'reporabbit', author: 'Dumidu Lakshan', ini: 'DL', labels: ['backend', 'sync'], add: 512, del: 301, review: '11.4h', status: 'stale', statusLabel: 'Stale', age: 8, created: 'Nov 13, 2026', desc: 'Moves long-running repo syncs out of request-scoped background tasks into a persistent ARQ worker with retries. Largest PR open right now.', checks: '4 of 5 checks passing', reviewers: 'Kavindu Rajapakse' },
  { n: 471, title: 'Add stale-PR alerts to the digest email', repo: 'reporabbit', author: 'Shenali Fernando', ini: 'SF', labels: ['feature'], add: 89, del: 12, review: '5.0h', status: 'merged', statusLabel: 'Merged', age: 6, created: 'Nov 15, 2026', desc: 'The Monday digest now lists PRs older than the stale threshold, grouped by repository.', checks: '5 of 5 checks passing', reviewers: 'Anika Perera' },
  { n: 469, title: 'Fix pagination on the repositories table', repo: 'astro-commerce', author: 'Kavindu Rajapakse', ini: 'KR', labels: ['frontend', 'bug'], add: 44, del: 38, review: '1.6h', status: 'merged', statusLabel: 'Merged', age: 9, created: 'Nov 12, 2026', desc: 'Page state reset to 1 whenever the sync-status filter changed, dropping the user back to the first page.', checks: '5 of 5 checks passing', reviewers: 'Dumidu Lakshan' },
  { n: 468, title: 'Add Postgres indexes for the metrics queries', repo: 'fastapi-invoicing', author: 'Nethmi Silva', ini: 'NS', labels: ['backend'], add: 37, del: 9, review: '—', status: 'stale', statusLabel: 'Stale', age: 4, created: 'Nov 17, 2026', desc: 'Composite indexes on (repo_id, merged_at) and (author, created_at) cut the DORA query from 1.9s to 140ms.', checks: '2 of 3 checks passing', reviewers: '—' },
  { n: 465, title: 'Support GitHub Enterprise Server URLs', repo: 'reporabbit', author: 'Dumidu Lakshan', ini: 'DL', labels: ['feature'], add: 198, del: 47, review: '6.7h', status: 'open', statusLabel: 'Open', age: 3, created: 'Nov 18, 2026', desc: 'Lets a workspace point the GitHub client at a self-hosted Enterprise Server base URL instead of api.github.com.', checks: '5 of 5 checks passing', reviewers: 'Anika Perera, Kavindu Rajapakse' },
  { n: 462, title: 'Tighten JWT expiry to 15 minutes with refresh', repo: 'notes-api', author: 'Anika Perera', ini: 'AP', labels: ['security'], add: 143, del: 66, review: '2.9h', status: 'merged', statusLabel: 'Merged', age: 11, created: 'Nov 10, 2026', desc: 'Access tokens now expire after 15 minutes; refresh tokens rotate on use and are stored hashed.', checks: '5 of 5 checks passing', reviewers: 'Dumidu Lakshan' },
];

export const SAMPLE_REPOS: Repo[] = [
  { name: 'reporabbit', vis: 'Public', sync: 'Synced 12 min ago', syncDot: 'g', open: 14, merged: 96, cycle: '1.8d', last: '2 hours ago' },
  { name: 'fastapi-invoicing', vis: 'Public', sync: 'Synced 28 min ago', syncDot: 'g', open: 5, merged: 41, cycle: '2.4d', last: '5 hours ago' },
  { name: 'astro-commerce', vis: 'Public', sync: 'Synced 1 h ago', syncDot: 'g', open: 3, merged: 34, cycle: '1.5d', last: 'Yesterday' },
  { name: 'notes-api', vis: 'Public', sync: 'Sync failed · rate limit', syncDot: 'r', open: 1, merged: 15, cycle: '2.1d', last: '2 days ago' },
];

export const SAMPLE_CONTRIBUTORS: Contributor[] = [
  { name: 'Dumidu Lakshan', ini: 'DL', merged: 38, reviews: 52, reviewTime: '3.1h', add: 4821, del: 1930, trend: '+12%' },
  { name: 'Anika Perera', ini: 'AP', merged: 31, reviews: 44, reviewTime: '4.4h', add: 3910, del: 1488, trend: '+8%' },
  { name: 'Kavindu Rajapakse', ini: 'KR', merged: 24, reviews: 29, reviewTime: '6.2h', add: 2744, del: 1102, trend: '−3%' },
  { name: 'Shenali Fernando', ini: 'SF', merged: 19, reviews: 21, reviewTime: '5.0h', add: 2210, del: 986, trend: '+5%' },
  { name: 'Nethmi Silva', ini: 'NS', merged: 14, reviews: 12, reviewTime: '7.9h', add: 1480, del: 640, trend: '−6%' },
];

export const SAMPLE_ALERTS: AlertItem[] = [
  { dot: 'a', text: 'PR #473 has been open for 8 days without a merge — the longest in the workspace.', when: '32 min ago', link: '#473 · reporabbit' },
  { dot: 'a', text: 'PR #479 has had no review in 6 days.', when: '1 h ago', link: '#479 · reporabbit' },
  { dot: 'r', text: 'Sync failed for notes-api: GitHub API rate limit reached. Next retry in 15 minutes.', when: '2 h ago', link: 'notes-api' },
  { dot: 'a', text: 'PR #473 is 813 lines changed — above the 500-line large-PR threshold.', when: 'Yesterday', link: '#473 · reporabbit' },
  { dot: 'g', text: 'Weekly digest sent: 96 PRs merged, median cycle time 1.8 days.', when: 'Monday, 09:00', link: 'Digest' },
];

export const SAMPLE_KPIS: Record<Range, Kpi[]> = {
  '7d': [
    { label: 'PR cycle time', value: '1.6d', delta: '↓ 0.2d vs prior 7d', dir: 'up', cap: 'Median, first commit to merge' },
    { label: 'Review latency', value: '5.4h', delta: '↓ 0.8h vs prior 7d', dir: 'up', cap: 'Median time to first review' },
    { label: 'Merge rate', value: '89%', delta: '↑ 2pp vs prior 7d', dir: 'up', cap: 'Merged / opened' },
    { label: 'Open PRs', value: '23', delta: '5 stale · 3 need review', dir: 'flat', cap: 'Across 4 repositories' },
  ],
  '30d': [
    { label: 'PR cycle time', value: '1.8d', delta: '↓ 0.4d vs prior 30d', dir: 'up', cap: 'Median, first commit to merge' },
    { label: 'Review latency', value: '6.2h', delta: '↓ 1.1h vs prior 30d', dir: 'up', cap: 'Median time to first review' },
    { label: 'Merge rate', value: '87%', delta: '↑ 3pp vs prior 30d', dir: 'up', cap: 'Merged / opened' },
    { label: 'Open PRs', value: '23', delta: '5 stale · 3 need review', dir: 'flat', cap: 'Across 4 repositories' },
  ],
  '90d': [
    { label: 'PR cycle time', value: '2.1d', delta: '↑ 0.3d vs prior 90d', dir: 'down', cap: 'Median, first commit to merge' },
    { label: 'Review latency', value: '7.0h', delta: '↑ 0.6h vs prior 90d', dir: 'down', cap: 'Median time to first review' },
    { label: 'Merge rate', value: '84%', delta: '↓ 2pp vs prior 90d', dir: 'down', cap: 'Merged / opened' },
    { label: 'Open PRs', value: '23', delta: '5 stale · 3 need review', dir: 'flat', cap: 'Across 4 repositories' },
  ],
};

export const SAMPLE_TREND: Record<Range, number[]> = {
  '7d': [2.1, 1.9, 1.7, 1.8, 1.5, 1.6, 1.6],
  '30d': [2.4, 2.2, 2.0, 2.3, 1.9, 1.8, 1.7, 1.9, 1.6, 1.8],
  '90d': [2.6, 2.4, 2.3, 2.5, 2.2, 2.1, 2.3, 2.0, 1.9, 2.1, 1.8, 2.1],
};

export const SAMPLE_DORA = [
  { label: 'Lead time for changes', value: '1.8d', pct: 86 },
  { label: 'Deployment frequency', value: '4.2 / week', pct: 72 },
  { label: 'Change failure rate', value: '6%', pct: 94 },
  { label: 'Time to restore service', value: '3.4h', pct: 68 },
];

export const SAMPLE_VOLUME = {
  opened: [22, 26, 19, 31, 24, 28, 21, 23],
  merged: [19, 22, 17, 27, 21, 25, 19, 20],
};

export function statusDot(status: PRStatus): string {
  return status === 'stale' ? 'a' : status === 'merged' ? 'g' : status === 'review' ? 'b' : 'n';
}

export function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
