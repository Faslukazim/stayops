import { useState } from 'react';
import { Loader2, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { signIn } from './services/authService';
import { Btn } from './components/ui';

function StayOpsMark() {
  return (
    <div className="flex flex-col items-center gap-2">
      <img src="/favicon.png" alt="StayOps" width="56" height="56" className="rounded-xl" />
      <span className="text-lg font-bold tracking-tight text-ink">StayOps</span>
    </div>
  );
}

export default function AuthPage({ onAuthed, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const inputCls = 'w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const session = await signIn(email, password);
      onAuthed?.(session);
    } catch (err) {
      setError(err.message || 'Incorrect email or password.');
    } finally {
      setBusy(false);
    }
  }

  async function tryDemo() {
    setError('');
    setBusy(true);
    try {
      const session = await signIn('demo@stayops.com', 'demo2026');
      onAuthed?.(session);
    } catch {
      setError('Demo unavailable right now.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate2 hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        )}

        <div className="mb-8 flex justify-center">
          <StayOpsMark />
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-card p-6">
          <h1 className="text-lg font-bold text-ink text-center">Welcome back</h1>
          <p className="mt-1 text-sm text-slate2 text-center">Sign in to your StayOps workspace.</p>

          {error && (
            <div className="mt-4 rounded-lg border border-coral/30 bg-coral/5 px-3 py-2.5 text-sm text-coral">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
            <label className="block">
              <span className="text-2xs font-semibold uppercase tracking-widest text-slate2">Email</span>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="you@example.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-2xs font-semibold uppercase tracking-widest text-slate2">Password</span>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputCls}
                  placeholder="Your password"
                />
              </div>
            </label>

            <Btn variant="primary" className="w-full justify-center py-3 mt-1" disabled={busy} {...{ type: 'submit' }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Sign in
            </Btn>
          </form>

          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={tryDemo}
              disabled={busy}
              className="w-full rounded-lg border border-border bg-mist px-3 py-2.5 text-sm font-semibold text-slate2 hover:bg-border hover:text-ink transition-colors disabled:opacity-50"
            >
              Try live demo instead
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-slate2">
          Don't have access?{' '}
          <a
            href="https://wa.me/919633310117?text=Hi%2C%20I%27d%20like%20to%20get%20access%20to%20StayOps"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ink hover:underline"
          >
            Request access →
          </a>
        </p>
      </div>
    </div>
  );
}
