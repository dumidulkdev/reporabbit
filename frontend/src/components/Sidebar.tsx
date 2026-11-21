import { Bell, FolderGit2, GitPullRequest, LayoutDashboard, Settings, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { REPO_EVENT, getRepoFilter, setRepoFilter } from '../lib/store';

type NavSection = { kind: 'section'; label: string };
type NavLink = { kind: 'link'; href: string; label: string; icon: typeof LayoutDashboard; count?: string };
type NavItem = NavSection | NavLink;

const NAV: NavItem[] = [
  { kind: 'section', label: 'Workspace' },
  { kind: 'link', href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { kind: 'link', href: '/pulls', label: 'Pull Requests', icon: GitPullRequest, count: '23' },
  { kind: 'link', href: '/repos', label: 'Repositories', icon: FolderGit2, count: '4' },
  { kind: 'link', href: '/contributors', label: 'Contributors', icon: Users },
  { kind: 'link', href: '/alerts', label: 'Alerts', icon: Bell, count: '5' },
  { kind: 'section', label: 'System' },
  { kind: 'link', href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPath }: { currentPath: string }) {
  const [repoFilter, setRepo] = useState('');
  useEffect(() => {
    setRepo(getRepoFilter());
    const onChange = (e: Event) => setRepo((e as CustomEvent<string>).detail ?? getRepoFilter());
    window.addEventListener(REPO_EVENT, onChange);
    return () => window.removeEventListener(REPO_EVENT, onChange);
  }, []);

  return (
    <aside className="flex h-screen w-[232px] shrink-0 flex-col border-r border-line-soft bg-panel max-md:w-16 sticky top-0">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-accent text-[15px] font-semibold text-white">R</div>
        <div className="max-md:hidden">
          <div className="text-sm font-medium tracking-[-0.01em]">RepoRabbit</div>
          <div className="text-[11px] text-meta">Engineering analytics</div>
        </div>
      </div>

      <button
        onClick={() => { if (repoFilter) setRepoFilter(''); }}
        title={repoFilter ? `Filtered to ${repoFilter} — click to clear` : 'All repositories'}
        className="mx-3 mb-3 flex items-center justify-between rounded-md border border-line bg-[rgba(255,255,255,0.02)] px-2.5 py-2 text-[13px] max-md:hidden"
      >
        <span className="font-mono text-[12.5px] text-fg2">{repoFilter ? `dumidulkdev / ${repoFilter}` : 'dumidulkdev / *'}</span>
        <span className="flex items-center gap-1 text-meta">
          {repoFilter ? <X size={12} /> : 'All repos'}
        </span>
      </button>

      <nav className="flex-1 overflow-auto px-2">
        {NAV.map((item, i) =>
          item.kind === 'section' ? (
            <h3 key={i} className="px-2 pb-1.5 pt-3.5 text-[11px] font-medium uppercase tracking-[0.06em] text-meta max-md:hidden">
              {item.label}
            </h3>
          ) : (
            <a
              key={item.href}
              href={item.href}
              className={`mb-0.5 flex items-center gap-2.5 rounded-r-md border-l-2 py-[7px] pl-2.5 pr-2 text-[13.5px] font-medium max-md:justify-center max-md:px-0 ${
                currentPath === item.href
                  ? 'border-accent2 bg-[rgba(255,255,255,0.05)] text-fg'
                  : 'border-transparent text-fg2 hover:bg-[rgba(255,255,255,0.03)] hover:text-fg'
              }`}
            >
              {item.icon && <item.icon size={16} className={currentPath === item.href ? 'text-accent2' : 'text-muted'} />}
              <span className="max-md:hidden">{item.label}</span>
              {item.count && (
                <span className="ml-auto rounded-full border border-line-soft bg-[rgba(255,255,255,0.04)] px-[7px] text-[11px] leading-[18px] text-meta max-md:hidden">
                  {item.count}
                </span>
              )}
            </a>
          ),
        )}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line-soft px-4 py-3.5 text-[13px]">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-hover text-[10px] font-medium text-fg2">DL</span>
        <span className="leading-tight max-md:hidden">
          Dumidu Lakshan
          <br />
          <span className="text-meta">dumidulkdev</span>
        </span>
      </div>
    </aside>
  );
}
