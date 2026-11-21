import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { login } from '../lib/api';
import { TOKEN_KEY } from '../lib/store';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Enter your email and password');
      return;
    }
    setBusy(true);
    try {
      const token = await login(email.trim(), password);
      window.localStorage.setItem(TOKEN_KEY, token);
      toast.success('Signed in — welcome back');
      window.location.href = '/';
    } catch (err) {
      toast.error(err instanceof Error ? `Sign-in failed: ${err.message}` : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="card w-full max-w-[380px]">
      <div className="mb-1 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-accent text-[15px] font-semibold text-white">R</div>
        <h1 className="text-[18px] font-medium tracking-[-0.01em]">Sign in to RepoRabbit</h1>
      </div>
      <p className="mb-4 text-[13px] text-muted">Engineering analytics for dumidulkdev</p>
      <label className="mb-3 block text-[13px]">
        <span className="mb-1.5 block text-muted">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="input w-full"
        />
      </label>
      <label className="mb-4 block text-[13px]">
        <span className="mb-1.5 block text-muted">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          className="input w-full"
        />
      </label>
      <button type="submit" className="btn btn-primary w-full justify-center" disabled={busy}>
        <LogIn size={14} />
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="mt-3 text-center text-[12px] text-meta">
        No account yet? The main pages work without signing in, using sample data.
      </p>
      <p className="mt-1 text-center text-[12px]">
        <a href="/">Continue without signing in</a>
      </p>
    </form>
  );
}
