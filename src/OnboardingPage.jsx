import { useState } from 'react';
import { Loader2, Building2, ArrowRight, LogOut } from 'lucide-react';
import { createOrganization, signOut } from './services/authService';
import { Btn, Label } from './components/ui';

export default function OnboardingPage({ email, onCreated, onSignOut }) {
  const [orgName, setOrgName] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [totalBeds, setTotalBeds] = useState('0');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const inputCls = 'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!orgName.trim()) { setError('Organization name is required.'); return; }
    setBusy(true);
    try {
      await createOrganization({
        orgName: orgName.trim(),
        propertyName: propertyName.trim() || null,
        totalBeds: Number(totalBeds) || 0,
      });
      onCreated?.();
    } catch (err) {
      setError(err.message || 'Could not create your workspace. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    try { await signOut(); } finally { onSignOut?.(); }
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate2">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-semibold">Set up your workspace</span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate2 hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        <div className="rounded-2xl bg-white border border-border shadow-card p-6">
          <h1 className="text-lg font-bold text-ink">Create your organization</h1>
          <p className="mt-1 text-sm text-slate2">
            {email ? <>Signed in as <span className="font-semibold text-ink">{email}</span>. </> : null}
            This is your private workspace — only you and people you invite can see its data.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-coral/30 bg-coral/5 px-3 py-2.5 text-sm text-coral">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <label className="block">
              <Label>Organization name</Label>
              <input
                required
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className={`mt-1.5 ${inputCls}`}
                placeholder="e.g. StayB Hostels"
              />
            </label>

            <label className="block">
              <Label>First property <span className="font-normal text-slate2">(optional)</span></Label>
              <input
                value={propertyName}
                onChange={e => setPropertyName(e.target.value)}
                className={`mt-1.5 ${inputCls}`}
                placeholder="e.g. StayB Main Branch"
              />
            </label>

            <label className="block">
              <Label>Total beds <span className="font-normal text-slate2">(optional)</span></Label>
              <input
                type="number"
                min="0"
                value={totalBeds}
                onChange={e => setTotalBeds(e.target.value)}
                className={`mt-1.5 ${inputCls}`}
                placeholder="e.g. 24"
              />
              <p className="mt-1 text-xs text-slate2">You can change this later. Rooms and beds are added per property.</p>
            </label>

            <Btn variant="primary" className="w-full justify-center py-3" disabled={busy} {...{ type: 'submit' }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Create workspace
            </Btn>
          </form>
        </div>
      </div>
    </div>
  );
}
