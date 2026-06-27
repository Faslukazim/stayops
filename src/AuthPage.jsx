import { useState } from 'react';
import { Loader2, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { signIn, signUp } from './services/authService';
import { Btn } from './components/ui';
import { NivaLogo } from './components/NivaLogo';

function StayOpsMark() {
  return (
    <div className="flex flex-col items-center gap-2">
      <NivaLogo size={56} className="rounded-xl" />
      <span className="text-lg font-bold tracking-tight text-ink">NivaOps</span>
    </div>
  );
}

export default function AuthPage({ onAuthed, onBack, defaultMode = 'signin' }) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  const inputCls = 'w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green';

  function switchMode(newMode) {
    setMode(newMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSignIn(e) {
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

  async function handleSignUp(e) {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setError('');
    setBusy(true);
    try {
      const { session, needsConfirmation } = await signUp(email, password);
      if (needsConfirmation) {
        setSignedUp(true);
      } else if (session) {
        onAuthed?.(session);
      }
    } catch (err) {
      setError(err.message || 'Could not create account. Please try again.');
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

  if (signedUp) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <div className="mb-8 flex justify-center"><StayOpsMark /></div>
          <div className="rounded-2xl bg-white border border-border shadow-md p-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green/10">
              <ArrowRight className="h-6 w-6 text-green" />
            </div>
            <h1 className="text-lg font-bold text-ink">Check your email</h1>
            <p className="mt-2 text-sm text-slate2">
              We sent a confirmation link to <strong className="text-ink">{email}</strong>. Click it to activate your account.
            </p>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="mt-6 text-sm font-semibold text-green hover:text-green-hover transition-colors"
            >
              Back to sign in →
            </button>
          </div>
        </div>
      </div>
    );
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

        <div className="rounded-2xl bg-white border border-border shadow-md p-8">
          {mode === 'signup' ? (
            <>
              <h1 className="text-lg font-bold text-ink text-center">Create your account</h1>
              <p className="mt-1 text-sm text-slate2 text-center">Start managing your property in minutes.</p>

              {error && (
                <div className="mt-4 rounded-lg border border-coral/30 bg-coral/5 px-3 py-2.5 text-sm text-coral">{error}</div>
              )}

              <form onSubmit={handleSignUp} className="mt-5 flex flex-col gap-3">
                <label className="block">
                  <span className="text-2xs font-semibold uppercase tracking-widest text-slate2">Email</span>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
                    <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-2xs font-semibold uppercase tracking-widest text-slate2">Password</span>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
                    <input type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Min. 8 characters" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-2xs font-semibold uppercase tracking-widest text-slate2">Confirm Password</span>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
                    <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} placeholder="Repeat password" />
                  </div>
                </label>
                <Btn variant="primary" className="w-full justify-center py-3 mt-1" disabled={busy} {...{ type: 'submit' }}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Create account
                </Btn>
              </form>

              <p className="mt-4 text-center text-sm text-slate2">
                Already have an account?{' '}
                <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-ink hover:text-green transition-colors">Sign in</button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-lg font-bold text-ink text-center">Welcome back</h1>
              <p className="mt-1 text-sm text-slate2 text-center">Sign in to your NivaOps workspace.</p>

              {error && (
                <div className="mt-4 rounded-lg border border-coral/30 bg-coral/5 px-3 py-2.5 text-sm text-coral">{error}</div>
              )}

              <form onSubmit={handleSignIn} className="mt-5 flex flex-col gap-3">
                <label className="block">
                  <span className="text-2xs font-semibold uppercase tracking-widest text-slate2">Email</span>
                  <div className="relative mt-1.5">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
                    <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-2xs font-semibold uppercase tracking-widest text-slate2">Password</span>
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
                    <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Your password" />
                  </div>
                </label>
                <Btn variant="primary" className="w-full justify-center py-3 mt-1" disabled={busy} {...{ type: 'submit' }}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Sign in
                </Btn>
              </form>

              <div className="mt-4 border-t border-border pt-4">
                <button type="button" onClick={tryDemo} disabled={busy}
                  className="w-full rounded-lg border border-border bg-mist px-3 py-2.5 text-sm font-semibold text-slate2 hover:bg-border hover:text-ink transition-colors disabled:opacity-50">
                  Try live demo instead
                </button>
              </div>

              <p className="mt-4 text-center text-sm text-slate2">
                New to NivaOps?{' '}
                <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-ink hover:text-green transition-colors">Create an account</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
