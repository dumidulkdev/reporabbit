// Small shared client-side store: time range + repo filter, synced across
// islands through localStorage and window events.

import type { Range } from './sample';

export const RANGE_KEY = 'rr:range';
export const REPO_KEY = 'rr:repo';
export const TOKEN_KEY = 'rr:token';
export const RANGE_EVENT = 'rr:range';
export const REPO_EVENT = 'rr:repo';

export function getRange(): Range {
  if (typeof window === 'undefined') return '30d';
  const v = window.localStorage.getItem(RANGE_KEY);
  return v === '7d' || v === '30d' || v === '90d' ? v : '30d';
}

export function setRange(r: Range) {
  window.localStorage.setItem(RANGE_KEY, r);
  window.dispatchEvent(new CustomEvent(RANGE_EVENT, { detail: r }));
}

export function getRepoFilter(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(REPO_KEY) ?? '';
}

export function setRepoFilter(repo: string) {
  if (repo) window.localStorage.setItem(REPO_KEY, repo);
  else window.localStorage.removeItem(REPO_KEY);
  window.dispatchEvent(new CustomEvent(REPO_EVENT, { detail: repo }));
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
