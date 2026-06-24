import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Trash2, RefreshCw, LogOut, LayoutDashboard, Plus, X, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { supabase } from './lib/supabase';
import { signOut } from './services/authService';

const EDGE_URL = 'https://drlkmfhpthhkvnljuprm.supabase.co/functions/v1/admin-create-user';

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function AdminPage({ onSignOut, onOpenApp }) {
  const [orgs, setOrgs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [orgName, setOrgName]         = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState(generatePassword());
  const [propertyName, setPropertyName] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');
  const [created, setCreated]         = useState(null); // {email, password, orgName}
  const [copied, setCopied]           = useState('');

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

  async function reject(org_id, org_name) {
    if (!confirm(`Delete "${org_name}"? This cannot be undone.`)) return;
    setBusy(org_id);
    await supabase.rpc('admin_reject_org', { p_org_id: org_id });
    await load();
    setBusy(null);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          org_name: orgName.trim(),
          property_name: propertyName.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create account');
      setCreated({ email: email.trim(), password, orgName: orgName.trim() });
      setOrgName(''); setEmail(''); setPassword(generatePassword()); setPropertyName('');
      await load();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  async function handleSignOut() {
    await signOut();
    onSignOut?.();
  }

  const pending  = orgs.filter(o => !o.approved);
  const approved = orgs.filter(o => o.approved);

  const inputCls = 'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

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

        {/* Create account */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">Create account</h2>
            {!showCreate && (
              <button
                onClick={() => { setShowCreate(true); setCreated(null); setCreateError(''); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-white px-3 py-1.5 text-xs font-bold hover:bg-ink/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New account
              </button>
            )}
          </div>

          {/* Success card */}
          {created && (
            <div className="rounded-2xl bg-leaf/5 border border-leaf/20 p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-leaf" />
                <p className="text-sm font-bold text-ink">Account created — share these credentials</p>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Organization', value: created.orgName, key: 'org' },
                  { label: 'Email', value: created.email, key: 'email' },
                  { label: 'Password', value: created.password, key: 'pass' },
                ].map(({ label, value, key }) => (
                  <div key={key} className="flex items-center justify-between bg-white rounded-xl border border-border px-3 py-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate2 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-mono text-ink">{value}</p>
                    </div>
                    <button onClick={() => copyText(value, key)} className="text-slate2 hover:text-ink transition-colors ml-2">
                      {copied === key ? <Check className="h-4 w-4 text-leaf" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => copyText(`StayOps login\nEmail: ${created.email}\nPassword: ${created.password}`, 'all')}
                className="mt-3 w-full text-xs font-semibold text-leaf hover:text-leaf/80 transition-colors"
              >
                {copied === 'all' ? '✓ Copied!' : 'Copy all for WhatsApp'}
              </button>
            </div>
          )}

          {/* Create form */}
          {showCreate && (
            <form onSubmit={handleCreate} className="rounded-2xl bg-white border border-border p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">New client account</p>
                <button type="button" onClick={() => setShowCreate(false)} className="text-slate2 hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {createError && <p className="text-xs text-coral">{createError}</p>}

              <div>
                <label className="block text-xs font-semibold text-slate2 mb-1.5">Business / org name</label>
                <input required value={orgName} onChange={e => setOrgName(e.target.value)} className={inputCls} placeholder="e.g. Sunrise Hostel" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate2 mb-1.5">First property <span className="font-normal">(optional)</span></label>
                <input value={propertyName} onChange={e => setPropertyName(e.target.value)} className={inputCls} placeholder="e.g. Sunrise Main Branch" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate2 mb-1.5">Login email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="owner@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate2 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputCls} pr-10 font-mono`}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate2">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => setPassword(generatePassword())} className="mt-1 text-xs text-slate2 hover:text-ink transition-colors">
                  Generate new password
                </button>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-white py-2.5 text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create account
              </button>
            </form>
          )}
        </section>

        {/* Pending */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">Pending approval</h2>
            {pending.length > 0 && (
              <span className="rounded-full bg-amber/10 text-amber text-xs font-bold px-2 py-0.5">{pending.length}</span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
          ) : pending.length === 0 ? (
            <div className="rounded-2xl bg-white border border-border px-5 py-6 text-center text-sm text-slate2">
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
                      onClick={() => reject(o.org_id, o.org_name)}
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

        {/* Active accounts */}
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-leaf">Active</span>
                    <button
                      onClick={() => reject(o.org_id, o.org_name)}
                      disabled={busy === o.org_id}
                      className="flex items-center justify-center h-7 w-7 rounded-lg text-slate2 hover:text-coral transition-colors disabled:opacity-40"
                    >
                      {busy === o.org_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
