import { useEffect, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { loadLocalSettings, saveSettings, type Settings } from '../lib/api';

const DEFAULTS: Settings = {
  workspaceName: 'dumidulkdev',
  syncInterval: 'hourly',
  staleThreshold: '3',
  largePrThreshold: '500',
  digestEnabled: true,
};

export default function SettingsApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const local = loadLocalSettings();
    if (local) setSettings({ ...DEFAULTS, ...local });
  }, []);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!settings.workspaceName.trim()) {
      toast.error('Workspace name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const savedRemotely = await saveSettings(settings);
      toast.success(savedRemotely ? 'Settings saved' : 'Settings saved locally — backend unreachable');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const row = (title: string, meta: string, control: ReactNode) => (
    <div className="flex items-center justify-between gap-4 border-b border-line-soft py-[13px] text-[13px]">
      <div>
        <b className="font-medium">{title}</b>
        <div className="text-[12px] text-meta">{meta}</div>
      </div>
      {control}
    </div>
  );

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-medium tracking-[-0.288px] leading-tight">Settings</h1>
        <p className="mt-1 text-[13px] text-muted">Workspace · dumidulkdev</p>
      </div>

      <div className="card">
        {row('Workspace name', 'Shown in the sidebar and in weekly digests.', (
          <input
            value={settings.workspaceName}
            onChange={(e) => set('workspaceName', e.target.value)}
            aria-label="Workspace name"
            className="input w-[220px]"
          />
        ))}
        {row('GitHub connection', 'GitHub App installed on 4 repositories. Token expires in 41 days.', (
          <button className="btn" onClick={() => toast.success('GitHub connection refreshed')}>Reconnect</button>
        ))}
        {row('Sync interval', 'How often RepoRabbit pulls PR, issue and check data.', (
          <select value={settings.syncInterval} onChange={(e) => set('syncInterval', e.target.value)} aria-label="Sync interval" className="select">
            <option value="15m">Every 15 minutes</option>
            <option value="hourly">Every hour</option>
            <option value="6h">Every 6 hours</option>
          </select>
        ))}
        {row('Stale PR threshold', 'A PR with no review after this long is flagged stale.', (
          <select value={settings.staleThreshold} onChange={(e) => set('staleThreshold', e.target.value)} aria-label="Stale threshold" className="select">
            <option value="2">2 days</option>
            <option value="3">3 days</option>
            <option value="5">5 days</option>
            <option value="7">7 days</option>
          </select>
        ))}
        {row('Large PR threshold', 'PRs above this size trigger a "large PR" alert.', (
          <select value={settings.largePrThreshold} onChange={(e) => set('largePrThreshold', e.target.value)} aria-label="Large PR threshold" className="select">
            <option value="300">300 lines</option>
            <option value="500">500 lines</option>
            <option value="1000">1,000 lines</option>
          </select>
        ))}
        {row('Weekly digest', 'Email summary every Monday, 09:00 Asia/Colombo.', (
          <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] text-fg2">
            <input
              type="checkbox"
              checked={settings.digestEnabled}
              onChange={(e) => set('digestEnabled', e.target.checked)}
              className="accent-[#5e6ad2]"
            />
            Enabled
          </label>
        ))}
        <div className="pt-4">
          <button className="btn btn-primary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
