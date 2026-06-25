import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, CheckCircle2, Trash2, RefreshCw, LayoutDashboard,
  Plus, X, Eye, EyeOff, Copy, Check, ChevronDown, ChevronUp,
  Ban, ShieldCheck, KeyRound, Building2, Users, BedDouble, Clock,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { SignOutBtn } from './components/ui';

const CREATE_URL  = 'https://drlkmfhpthhkvnljuprm.supabase.co/functions/v1/admin-create-user';
const RESET_URL   = 'https://drlkmfhpthhkvnljuprm.supabase.co/functions/v1/admin-reset-password';

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function timeAgo(ts) {
  if (!ts) return 'Never';
  const secs = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 2592000) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function StatPill({ icon: Icon, value, label, color = 'text-slate2' }) {
  return (
    <div className="flex items-center gap-1">
      <Icon className={`h-3 w-3 ${color}`} />
      <span className={`text-xs font-semibold ${color}`}>{value}</span>
      <span className="text-xs text-slate2">{label}</span>
    </div>
  );
}

function OrgCard({ org, onApprove, onReject, onBan, onResetPassword, busy }) {
  const [expanded, setExpanded] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPass, setNewPass]   = useState(generatePassword());
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied]     = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  async function handleReset() {
    setResetting(true);
    await onResetPassword(org.owner_id, newPass);
    setResetting(false);
    setResetDone(true);
    setTimeout(() => { setResetDone(false); setShowReset(false); }, 2000);
  }

  const waLink = `https://wa.me/${org.owner_email.replace(/\D/g, '')}`;

  return (
    <div className={`rounded-2xl bg-white border ${org.banned ? 'border-coral/40 bg-coral/5' : 'border-border'} overflow-hidden`}>
      {/* Main row */}
      <div className="px-4 py-3.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-ink truncate">{org.org_name}</p>
            {org.banned && <span className="text-[10px] font-bold text-coral bg-coral/10 rounded-full px-1.5 py-0.5">Banned</span>}
          </div>
          <p className="text-xs text-slate2 truncate">{org.owner_email}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <StatPill icon={Building2}  value={org.property_count} label="prop" />
            <StatPill icon={Users}      value={org.tenant_count}   label="tenants" />
            <StatPill icon={BedDouble}  value={org.bed_count}      label="beds" />
            <StatPill icon={Clock}      value={timeAgo(org.last_login)} label="login" color={org.last_login ? 'text-slate2' : 'text-coral'} />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!org.approved && (
            <>
              <button onClick={() => onReject(org.org_id, org.org_name)} disabled={busy === org.org_id}
                className="h-8 w-8 flex items-center justify-center rounded-xl border border-border text-slate2 hover:border-coral hover:text-coral transition-colors disabled:opacity-40">
                {busy === org.org_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => onApprove(org.org_id)} disabled={busy === org.org_id}
                className="flex items-center gap-1 rounded-xl bg-leaf text-white px-2.5 py-1.5 text-xs font-bold hover:bg-leaf/90 transition-colors disabled:opacity-40">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
            </>
          )}
          {org.approved && (
            <button onClick={() => setExpanded(v => !v)}
              className="h-8 w-8 flex items-center justify-center rounded-xl border border-border text-slate2 hover:bg-mist transition-colors">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded actions for approved orgs */}
      {org.approved && expanded && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3 bg-mist/50">

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setShowReset(v => !v); setResetDone(false); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mist transition-colors">
              <KeyRound className="h-3.5 w-3.5" /> Reset password
            </button>
            <button onClick={() => onBan(org.owner_id, !org.banned)} disabled={busy === org.org_id}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                org.banned
                  ? 'border-leaf/30 bg-leaf/5 text-leaf hover:bg-leaf/10'
                  : 'border-border bg-white text-coral hover:border-coral/40 hover:bg-coral/5'
              }`}>
              {org.banned ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
              {busy === org.org_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (org.banned ? 'Unban' : 'Ban')}
            </button>
            <button onClick={() => onReject(org.org_id, org.org_name)} disabled={busy === org.org_id}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate2 hover:border-coral hover:text-coral transition-colors disabled:opacity-40">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>

          {/* Password reset */}
          {showReset && (
            <div className="rounded-xl border border-border bg-white p-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate2">New password for {org.owner_email}</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ink/20 pr-8"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate2">
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button onClick={() => copyText(newPass, 'pass')} className="text-slate2 hover:text-ink">
                  {copied === 'pass' ? <Check className="h-4 w-4 text-leaf" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setNewPass(generatePassword())} className="text-xs text-slate2 hover:text-ink transition-colors">
                  Generate new
                </button>
                <button onClick={handleReset} disabled={resetting || resetDone}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-ink text-white px-3 py-1.5 text-xs font-bold hover:bg-ink/90 transition-colors disabled:opacity-60">
                  {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : resetDone ? <Check className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
                  {resetDone ? 'Done!' : 'Set password'}
                </button>
              </div>
            </div>
          )}

          {/* Joined date */}
          <p className="text-xs text-slate2">
            Joined {new Date(org.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminPage({ onSignOut, onOpenApp }) {
  const [orgs, setOrgs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [orgName, setOrgName]         = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState(generatePassword());
  const [propertyName, setPropertyName] = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');
  const [created, setCreated]         = useState(null);
  const [copied, setCopied]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_list_orgs');
    setOrgs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime — auto-refresh when memberships change (new signups)
  useEffect(() => {
    const ch = supabase.channel('admin-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memberships' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

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

  async function ban(user_id, banned) {
    const org = orgs.find(o => o.owner_id === user_id);
    setBusy(org?.org_id);
    await supabase.rpc('admin_set_banned', { p_user_id: user_id, p_banned: banned });
    await load();
    setBusy(null);
  }

  async function resetPassword(user_id, new_password) {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch(RESET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ user_id, new_password }),
    });
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(CREATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ email: email.trim(), password, org_name: orgName.trim(), property_name: propertyName.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setCreated({ email: email.trim(), password, orgName: orgName.trim() });
      setOrgName(''); setEmail(''); setPassword(generatePassword()); setPropertyName('');
      setShowCreate(false);
      await load();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const pending  = orgs.filter(o => !o.approved);
  const approved = orgs.filter(o => o.approved);
  const inputCls = 'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-white border-b border-border px-5 flex items-center justify-between sticky top-0 z-40"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: '1rem' }}>
        <div className="flex items-center gap-2.5">
          <img src="/favicon.png" alt="StayOps" width="28" height="28" className="rounded-lg" />
          <span className="text-sm font-bold text-ink">Admin</span>
          {pending.length > 0 && (
            <span className="rounded-full bg-amber text-white text-[10px] font-bold px-1.5 py-0.5 leading-none">{pending.length}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="text-slate2 hover:text-ink transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={onOpenApp} className="flex items-center gap-1.5 text-xs font-semibold text-slate2 hover:text-ink transition-colors">
            <LayoutDashboard className="h-3.5 w-3.5" /> My workspace
          </button>
          <SignOutBtn onSignOut={onSignOut} />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Created credentials card */}
        {created && (
          <div className="rounded-2xl bg-leaf/5 border border-leaf/20 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-leaf" />
                <p className="text-sm font-bold text-ink">Account ready — share credentials</p>
              </div>
              <button onClick={() => setCreated(null)} className="text-slate2 hover:text-ink"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Organization', value: created.orgName, key: 'org' },
                { label: 'Email / Username', value: created.email, key: 'email' },
                { label: 'Password', value: created.password, key: 'pass' },
              ].map(({ label, value, key }) => (
                <div key={key} className="flex items-center justify-between bg-white rounded-xl border border-border px-3 py-2">
                  <div>
                    <p className="text-[10px] font-semibold text-slate2 uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-mono text-ink">{value}</p>
                  </div>
                  <button onClick={() => copyText(value, key)} className="text-slate2 hover:text-ink ml-2">
                    {copied === key ? <Check className="h-4 w-4 text-leaf" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => copyText(`StayOps login\nUsername: ${created.email}\nPassword: ${created.password}\nApp: https://stayops.vercel.app`, 'all')}
              className="mt-3 w-full text-xs font-semibold text-leaf hover:text-leaf/80 transition-colors">
              {copied === 'all' ? '✓ Copied!' : 'Copy all for WhatsApp'}
            </button>
          </div>
        )}

        {/* Create account */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">Accounts</h2>
            <button
              onClick={() => { setShowCreate(v => !v); setCreateError(''); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-white px-3 py-1.5 text-xs font-bold hover:bg-ink/90 transition-colors">
              {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showCreate ? 'Cancel' : 'New account'}
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="rounded-2xl bg-white border border-border p-5 flex flex-col gap-4 mb-4">
              {createError && <p className="text-xs text-coral">{createError}</p>}
              <div>
                <label className="block text-xs font-semibold text-slate2 mb-1.5">Business name</label>
                <input required value={orgName} onChange={e => setOrgName(e.target.value)} className={inputCls} placeholder="e.g. Sunrise Hostel" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate2 mb-1.5">First property <span className="font-normal">(optional)</span></label>
                <input value={propertyName} onChange={e => setPropertyName(e.target.value)} className={inputCls} placeholder="e.g. Main Branch" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate2 mb-1.5">Login email / username</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="owner@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate2 mb-1.5">Password</label>
                <div className="relative">
                  <input required type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    className={`${inputCls} pr-10 font-mono`} />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate2">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <button type="button" onClick={() => setPassword(generatePassword())} className="mt-1 text-xs text-slate2 hover:text-ink transition-colors">
                  Generate new password
                </button>
              </div>
              <button type="submit" disabled={creating}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-white py-2.5 text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-60">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create account
              </button>
            </form>
          )}
        </section>

        {/* Pending */}
        {(loading || pending.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-ink">Pending</h2>
              {pending.length > 0 && <span className="rounded-full bg-amber/15 text-amber text-xs font-bold px-2 py-0.5">{pending.length}</span>}
            </div>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map(o => (
                  <OrgCard key={o.org_id} org={o} busy={busy} onApprove={approve} onReject={reject} onBan={ban} onResetPassword={resetPassword} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Active */}
        <section>
          <h2 className="text-sm font-bold text-ink mb-3">
            Active <span className="font-normal text-slate2">({approved.length})</span>
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
          ) : approved.length === 0 ? (
            <div className="rounded-2xl bg-white border border-border px-5 py-6 text-center text-sm text-slate2">No active accounts yet</div>
          ) : (
            <div className="flex flex-col gap-2">
              {approved.map(o => (
                <OrgCard key={o.org_id} org={o} busy={busy} onApprove={approve} onReject={reject} onBan={ban} onResetPassword={resetPassword} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
