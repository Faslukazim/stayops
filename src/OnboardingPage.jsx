import { useState } from 'react';
import { Loader2, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { createOrganization, signOut } from './services/authService';

export default function OnboardingPage({ email, onCreated, onSignOut }) {
  const [step, setStep] = useState(1); // 1 = business name, 2 = first property
  const [orgName, setOrgName]         = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [totalBeds, setTotalBeds]     = useState('');
  const [error, setError]             = useState('');
  const [busy, setBusy]               = useState(false);

  const inputCls = 'w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-ink placeholder:text-slate2/60 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all';

  async function handleSignOut() {
    try { await signOut(); } finally { onSignOut?.(); }
  }

  function handleStep1(e) {
    e.preventDefault();
    setError('');
    if (!orgName.trim()) { setError('What should we call your business?'); return; }
    setStep(2);
  }

  async function handleStep2(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createOrganization({
        orgName: orgName.trim(),
        propertyName: propertyName.trim() || null,
        totalBeds: Number(totalBeds) || 0,
      });
      onCreated?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-mist flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="StayOps" width="28" height="28" className="rounded-lg" />
          <span className="text-sm font-bold text-ink tracking-tight">StayOps</span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate2 hover:text-ink transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <div className={`h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-ink' : 'w-2 bg-border'}`} />
        <div className={`h-2 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-ink' : 'w-2 bg-border'}`} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">

          {step === 1 && (
            <form onSubmit={handleStep1} className="flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-extrabold text-ink tracking-tight">
                  What's your business called?
                </h1>
                <p className="mt-2 text-sm text-slate2">
                  This is your private workspace — just for you and your team.
                </p>
              </div>

              {error && (
                <p className="text-sm text-coral">{error}</p>
              )}

              <input
                autoFocus
                required
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className={inputCls}
                placeholder="e.g. StayB Hostels"
              />

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-ink text-white py-3.5 text-sm font-bold hover:bg-ink/90 active:scale-[0.98] transition-all"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-slate2">
                Signed in as <span className="font-semibold text-ink">{email}</span>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="flex flex-col gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf mb-3">
                  <CheckCircle2 className="h-4 w-4" />
                  {orgName}
                </div>
                <h1 className="text-2xl font-extrabold text-ink tracking-tight">
                  Tell us about your first property
                </h1>
                <p className="mt-2 text-sm text-slate2">
                  You can add more properties, rooms, and beds after you're in.
                </p>
              </div>

              {error && (
                <p className="text-sm text-coral">{error}</p>
              )}

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate2 mb-1.5">Property name</label>
                  <input
                    autoFocus
                    value={propertyName}
                    onChange={e => setPropertyName(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. StayB Main Branch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate2 mb-1.5">
                    How many beds? <span className="font-normal text-slate2/70">(approx. is fine)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalBeds}
                    onChange={e => setTotalBeds(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 24"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-ink text-white py-3.5 text-sm font-bold hover:bg-ink/90 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {busy
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <ArrowRight className="h-4 w-4" />}
                  Open StayOps
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate2 hover:text-ink transition-colors py-1"
                >
                  Back
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
