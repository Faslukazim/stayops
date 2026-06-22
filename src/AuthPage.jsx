import { useState } from 'react';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { signIn, signUp } from './services/authService';
import { Btn } from './components/ui';

function StayOpsMark() {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="44" height="44" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="8" fill="#0F1117" />
        <text x="14" y="20" fontFamily="system-ui,-apple-system,sans-serif" fontSize="16" fontWeight="700" fill="white" textAnchor="middle">S</text>
      </svg>
      <span className="text-lg font-bold tracking-tight text-ink">StayOps</span>
    </div>
  );
}

export default function AuthPage({ onAuthed }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';
  const inputCls = 'w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setInfo('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (isSignup) {
        const { session, needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setInfo('Account created. Check your email to confirm, then sign in.');
          setMode('signin');
        } else if (session) {
          onAuthed?.(session);
        }
      } else {
        const session = await signIn(email, password);
        onAuthed?.(session);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <StayOpsMark />
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-card p-6">
          <h1 className="text-lg font-bold text-ink text-center">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-slate2 text-center">
            {isSignup ? 'Start managing your property in minutes.' : 'Sign in to your StayOps workspace.'}
          </p>

          {info && (
            <div className="mt-4 rounded-lg border border-leaf/30 bg-leaf/5 px-3 py-2.5 text-sm text-leaf">
              {info}
            </div>
          )}
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
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputCls}
                  placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                />
              </div>
            </label>

            <Btn variant="primary" className="w-full justify-center py-3 mt-1" disabled={busy} {...{ type: 'submit' }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isSignup ? 'Create account' : 'Sign in'}
            </Btn>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-slate2">
          {isSignup ? 'Already have an account?' : 'New to StayOps?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setError(''); setInfo(''); }}
            className="font-semibold text-ink hover:underline"
          >
            {isSignup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
}
