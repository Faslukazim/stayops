import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Trash2, RefreshCw, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from './lib/supabase';
import { signOut } from './services/authService';

export default function AdminPage({ onSignOut, onOpenApp }) {
  const [orgs, setOrgs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]     = useState(null); // org_id being acted on

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_orgs');
    if (!error) setOrgs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(org_id) {
    setBusy(org_id);
    await supabase.rpc('admin_approve_org', { p_org_id: org_id });
    await load();
    setBusy(null);
  }

  async function reject(org_id) {
    if (!confirm('Delete this org? This cannot be undone.')) return;
    setBusy(org_id);
    await supabase.rpc('admin_reject_org', { p_org_id: org_id });
    await load();
    setBusy(null);
  }

  async function handleSignOut() {
    await signOut();
    onSignOut?.();
  }

  const pending  = orgs.filter(o => !o.approved);
  const approved = orgs.filter(o => o.approved);

  return (
    <div className="min-h-screen bg-mist">
      {/* Header */}
      <header className="bg-white border-b border-border px-5 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="StayOps" width="28" height="28" className="rounded-lg" />
          <span className="text-sm font-bold text-ink">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-slate2 hover:text-ink transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={onOpenApp} className="flex items-center gap-1.5 text-xs font-semibold text-slate2 hover:text-ink transition-colors">
            <LayoutDashboard className="h-3.5 w-3.5" />
            My workspace
          </button>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-xs font-semibold text-slate2 hover:text-ink transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Pending */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">Pending approval</h2>
            {pending.length > 0 && (
              <span className="rounded-full bg-amber/10 text-amber text-xs font-bold px-2 py-0.5">
                {pending.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl bg-white border border-border px-5 py-8 text-center text-sm text-slate2">
              No pending signups
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map(o => (
                <div key={o.org_id} className="rounded-2xl bg-white border border-border px-4 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{o.org_name}</p>
                    <p className="text-xs text-slate2 truncate">{o.owner_email}</p>
                    <p className="text-xs text-slate2 mt-0.5">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => reject(o.org_id)}
                      disabled={busy === o.org_id}
                      className="flex items-center justify-center h-9 w-9 rounded-xl border border-border text-slate2 hover:border-coral hover:text-coral transition-colors disabled:opacity-40"
                    >
                      {busy === o.org_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => approve(o.org_id)}
                      disabled={busy === o.org_id}
                      className="flex items-center gap-1.5 rounded-xl bg-leaf text-white px-3 py-2 text-xs font-bold hover:bg-leaf/90 transition-colors disabled:opacity-40"
                    >
                      {busy === o.org_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Approved */}
        {approved.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-ink mb-3">Active accounts <span className="font-normal text-slate2">({approved.length})</span></h2>
            <div className="flex flex-col gap-2">
              {approved.map(o => (
                <div key={o.org_id} className="rounded-2xl bg-white border border-border px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{o.org_name}</p>
                    <p className="text-xs text-slate2 truncate">{o.owner_email}</p>
                  </div>
                  <span className="text-xs font-semibold text-leaf shrink-0">Active</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
