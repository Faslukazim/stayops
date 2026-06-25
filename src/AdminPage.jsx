import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, CheckCircle2, Trash2, RefreshCw, LayoutDashboard,
  Plus, X, Eye, EyeOff, Copy, Check, ChevronDown, ChevronUp,
  Ban, ShieldCheck, KeyRound, Building2, Users, BedDouble, Clock, AlertCircle,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { SignOutBtn } from './components/ui';

const CREATE_URL = 'https://drlkmfhpthhkvnljuprm.supabase.co/functions/v1/admin-create-user';
const RESET_URL  = 'https://drlkmfhpthhkvnljuprm.supabase.co/functions/v1/admin-reset-password';

// ── helpers ──────────────────────────────────────────────────────────────────

function genPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function timeAgo(ts) {
  if (!ts) return 'Never logged in';
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)       return 'Just now';
  if (s < 3600)     return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)    return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000)  return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

// ── CopyField ────────────────────────────────────────────────────────────────

function CopyField({ label, value, mono = false }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="flex items-center justify-between bg-mist rounded-xl border border-border px-3 py-2.5">
      <div>
        <p className="text-[10px] font-bold text-slate2 uppercase tracking-wider">{label}</p>
        <p className={`text-sm text-ink mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
      </div>
      <button onClick={copy} className="ml-3 text-slate2 hover:text-ink transition-colors shrink-0">
        {copied ? <Check className="h-4 w-4 text-leaf" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ── CredentialsPanel ─────────────────────────────────────────────────────────
// Shows saved credentials, or a form to save them for the first time.

function CredentialsPanel({ orgId, email: initEmail, password: initPassword, onClose, onSaved }) {
  const hasSaved = !!(initEmail && initPassword);
  const [email, setEmail]     = useState(initEmail ?? '');
  const [password, setPassword] = useState(initPassword ?? '');
  const [show, setShow]       = useState(false);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);
  const [saved, setSaved]     = useState(hasSaved);

  async function handleSave(e) {
    e.preventDefault();
    if (!email || !password) { setError('Enter both email and password'); return; }
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('admin_credentials')
        .upsert({ org_id: orgId, email: email.trim(), password, updated_at: new Date().toISOString() });
      if (err) throw err;
      setSaved(true);
      onSaved?.(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function copyAll() {
    navigator.clipboard.writeText(
      `StayOps login\nEmail: ${email}\nPassword: ${password}\nApp: https://stayops.vercel.app`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{saved ? 'Saved credentials' : 'Save credentials'}</p>
        <button onClick={onClose} className="text-slate2 hover:text-ink"><X className="h-4 w-4" /></button>
      </div>

      {saved ? (
        <>
          <CopyField label="Email" value={email} />
          <CopyField label="Password" value={password} mono />
          <button onClick={copyAll}
            className="w-full rounded-xl border border-border bg-mist py-2 text-xs font-bold text-ink hover:bg-border transition-colors">
            {copied ? '✓ Copied!' : 'Copy all for WhatsApp'}
          </button>
          <button onClick={() => setSaved(false)} className="text-xs text-slate2 hover:text-ink transition-colors text-left">
            Update saved password
          </button>
        </>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <p className="text-xs text-slate2">Enter the current credentials you remember — they'll be saved for future reference.</p>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-coral/5 border border-coral/20 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-coral shrink-0" />
              <p className="text-xs text-coral">{error}</p>
            </div>
          )}
          <input
            type="text"
            inputMode="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Login email"
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
          />
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Current password"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
            />
            <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate2 hover:text-ink">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit" disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-white py-2.5 text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save
          </button>
        </form>
      )}
    </div>
  );
}

// ── PasswordResetPanel ────────────────────────────────────────────────────────
// Only sends the reset when the user explicitly clicks "Set password".
// The new password field starts empty.

function PasswordResetPanel({ userId, orgId, onClose, onPasswordSaved }) {
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [busy, setBusy]         = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [savedPass, setSavedPass] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) { setError('Enter a new password'); return; }
    if (password.length < 6) { setError('Minimum 6 characters'); return; }
    setBusy(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(RESET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, org_id: orgId, new_password: password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setSavedPass(password);
      setPassword('');
      setDone(true);
      onPasswordSaved?.(password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-leaf/20 bg-leaf/5 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-leaf" />
            <p className="text-sm font-semibold text-ink">Password updated</p>
          </div>
          <button onClick={onClose} className="text-slate2 hover:text-ink"><X className="h-4 w-4" /></button>
        </div>
        <CopyField label="New password" value={savedPass} mono />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Reset password</p>
        <button type="button" onClick={onClose} className="text-slate2 hover:text-ink"><X className="h-4 w-4" /></button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-coral/5 border border-coral/20 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-coral shrink-0" />
          <p className="text-xs text-coral">{error}</p>
        </div>
      )}

      <div className="relative">
        <input
          autoFocus
          type={show ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter new password"
          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
        />
        <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate2 hover:text-ink">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <button type="button" onClick={() => { setPassword(genPassword()); setShow(true); }}
        className="text-xs text-slate2 hover:text-ink transition-colors text-left">
        Generate random password
      </button>

      <button type="submit" disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-white py-2.5 text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Set password
      </button>
    </form>
  );
}

// ── OrgCard ───────────────────────────────────────────────────────────────────

function OrgCard({ org, onApprove, onReject, onBan, busy }) {
  const [open, setOpen]             = useState(false);
  const [showReset, setShowReset]   = useState(false);
  const [showCreds, setShowCreds]   = useState(false);
  const [banConfirm, setBanConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [localEmail, setLocalEmail]       = useState(org.last_email);
  const [localPassword, setLocalPassword] = useState(org.last_password);

  const isPending = !org.approved;
  const isBusy    = busy === org.org_id;

  function closeActions() {
    setShowReset(false);
    setShowCreds(false);
    setBanConfirm(false);
    setDeleteConfirm(false);
  }

  function toggleSection(section) {
    // Capture current open state BEFORE closeActions resets everything
    const isOpen = (section === 'reset' && showReset)
                || (section === 'creds' && showCreds)
                || (section === 'ban'   && banConfirm)
                || (section === 'delete' && deleteConfirm);
    closeActions();
    if (!isOpen) {
      if (section === 'reset')  setShowReset(true);
      if (section === 'creds')  setShowCreds(true);
      if (section === 'ban')    setBanConfirm(true);
      if (section === 'delete') setDeleteConfirm(true);
    }
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${
      org.banned ? 'border-coral/30 bg-coral/5' : isPending ? 'border-amber/30 bg-amber/5' : 'border-border bg-white'
    }`}>
      {/* ── Card header ── */}
      <div className="px-4 py-4 flex items-start gap-3">
        {/* Avatar */}
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
          org.banned ? 'bg-coral/15 text-coral' : isPending ? 'bg-amber/15 text-amber' : 'bg-ink/8 text-ink'
        }`}>
          {org.org_name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-ink">{org.org_name}</p>
            {org.banned   && <span className="text-[10px] font-bold text-coral  bg-coral/10  rounded-full px-2 py-0.5">Suspended</span>}
            {isPending    && <span className="text-[10px] font-bold text-amber  bg-amber/10  rounded-full px-2 py-0.5">Pending</span>}
          </div>
          <p className="text-xs text-slate2 mt-0.5 truncate">{org.owner_email}</p>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-slate2">
              <Building2 className="h-3 w-3" />{org.property_count} {org.property_count === 1 ? 'property' : 'properties'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate2">
              <Users className="h-3 w-3" />{org.tenant_count} tenants
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate2">
              <BedDouble className="h-3 w-3" />{org.bed_count} beds
            </span>
            <span className={`inline-flex items-center gap-1 text-xs ${org.last_login ? 'text-slate2' : 'text-coral'}`}>
              <Clock className="h-3 w-3" />{timeAgo(org.last_login)}
            </span>
          </div>
        </div>

        {/* Expand toggle (approved only) */}
        {!isPending && (
          <button onClick={() => { setOpen(v => !v); closeActions(); }}
            className="text-slate2 hover:text-ink transition-colors mt-0.5 shrink-0">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* ── Pending actions ── */}
      {isPending && (
        <div className="border-t border-amber/20 px-4 py-3 flex items-center gap-2 bg-white/60">
          <button onClick={() => onReject(org.org_id, org.org_name, true)} disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate2 hover:border-coral hover:text-coral transition-colors disabled:opacity-40">
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Reject
          </button>
          <button onClick={() => onApprove(org.org_id)} disabled={isBusy}
            className="inline-flex items-center gap-1.5 rounded-xl bg-leaf text-white px-4 py-1.5 text-xs font-bold hover:bg-leaf/90 transition-colors disabled:opacity-40 ml-auto">
            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Approve
          </button>
        </div>
      )}

      {/* ── Approved expanded section ── */}
      {!isPending && open && (
        <div className="border-t border-border">

          {/* Action bar */}
          <div className="flex items-center gap-1 px-4 py-2.5 bg-mist/60 flex-wrap">
            <button onClick={() => toggleSection('creds')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${showCreds ? 'bg-ink text-white' : 'bg-white border border-border text-slate2 hover:bg-mist'}`}>
              <Eye className="h-3.5 w-3.5" />
              {localPassword ? 'View password' : 'Save password'}
            </button>
            <button onClick={() => toggleSection('reset')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${showReset ? 'bg-ink text-white' : 'bg-white border border-border text-ink hover:bg-mist'}`}>
              <KeyRound className="h-3.5 w-3.5" /> Reset password
            </button>
            <button onClick={() => toggleSection('ban')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                banConfirm
                  ? 'bg-amber text-white'
                  : org.banned
                  ? 'bg-white border border-leaf/30 text-leaf hover:bg-leaf/5'
                  : 'bg-white border border-border text-slate2 hover:border-amber/40 hover:text-amber'
              }`}>
              {org.banned ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
              {org.banned ? 'Unsuspend' : 'Suspend'}
            </button>
            <button onClick={() => toggleSection('delete')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${deleteConfirm ? 'bg-coral text-white' : 'bg-white border border-border text-slate2 hover:border-coral/40 hover:text-coral'}`}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>

          {/* Inline panels */}
          <div className="px-4 pb-4 flex flex-col gap-3 mt-1">

            {showCreds && (
              <CredentialsPanel
                orgId={org.org_id}
                email={localEmail}
                password={localPassword}
                onClose={() => setShowCreds(false)}
                onSaved={(e, p) => { setLocalEmail(e); setLocalPassword(p); }}
              />
            )}

            {showReset && (
              <PasswordResetPanel
                userId={org.owner_id}
                orgId={org.org_id}
                onClose={() => setShowReset(false)}
                onPasswordSaved={p => { setLocalPassword(p); setLocalEmail(org.owner_email); }}
              />
            )}

            {banConfirm && (
              <div className="rounded-xl border border-amber/30 bg-amber/5 p-4">
                <p className="text-sm font-semibold text-ink mb-1">
                  {org.banned ? 'Unsuspend this account?' : 'Suspend this account?'}
                </p>
                <p className="text-xs text-slate2 mb-3">
                  {org.banned
                    ? 'The user will be able to log in again immediately.'
                    : 'The user will be locked out immediately. Their data is preserved.'}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => { setBanConfirm(false); onBan(org.owner_id, !org.banned); }}
                    disabled={isBusy}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-60 ${org.banned ? 'bg-leaf hover:bg-leaf/90' : 'bg-amber hover:bg-amber/90'}`}>
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {org.banned ? 'Yes, unsuspend' : 'Yes, suspend'}
                  </button>
                  <button onClick={() => setBanConfirm(false)}
                    className="inline-flex items-center rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate2 hover:bg-mist transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {deleteConfirm && (
              <div className="rounded-xl border border-coral/30 bg-coral/5 p-4">
                <p className="text-sm font-semibold text-ink mb-1">Delete "{org.org_name}"?</p>
                <p className="text-xs text-slate2 mb-3">This permanently deletes the account and all its data. Cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={() => { setDeleteConfirm(false); onReject(org.org_id, org.org_name, true); }}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-coral text-white px-3 py-1.5 text-xs font-bold hover:bg-coral/90 transition-colors disabled:opacity-60">
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Yes, delete permanently
                  </button>
                  <button onClick={() => setDeleteConfirm(false)}
                    className="inline-flex items-center rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate2 hover:bg-mist transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Joined date footer */}
            {!showCreds && !showReset && !banConfirm && !deleteConfirm && (
              <p className="text-xs text-slate2">
                Joined {new Date(org.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CreateAccountForm ─────────────────────────────────────────────────────────

function CreateAccountForm({ onCreated, onClose }) {
  const [orgName, setOrgName]         = useState('');
  const [propName, setPropName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) { setError('Enter a password'); return; }
    if (password.length < 6) { setError('Minimum 6 characters'); return; }
    setBusy(true);
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(CREATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: email.trim(), password, org_name: orgName.trim(), property_name: propName.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create account');
      onCreated({ email: email.trim(), password, orgName: orgName.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all';

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-border p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">New client account</p>
        <button type="button" onClick={onClose} className="text-slate2 hover:text-ink"><X className="h-4 w-4" /></button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-coral/5 border border-coral/20 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-coral shrink-0" />
          <p className="text-xs text-coral">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate2 mb-1.5">Business name <span className="text-coral">*</span></label>
        <input required value={orgName} onChange={e => setOrgName(e.target.value)} className={inputCls} placeholder="e.g. Sunrise Hostel" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate2 mb-1.5">First property <span className="font-normal text-slate2/70">(optional)</span></label>
        <input value={propName} onChange={e => setPropName(e.target.value)} className={inputCls} placeholder="e.g. Main Branch" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate2 mb-1.5">Login email <span className="text-coral">*</span></label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="owner@example.com" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate2 mb-1.5">Password <span className="text-coral">*</span></label>
        <div className="relative">
          <input
            required
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter or generate a password"
            className={`${inputCls} pr-10 font-mono`}
          />
          <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate2 hover:text-ink">
            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button type="button" onClick={() => { setPassword(genPassword()); setShowPass(true); }}
          className="mt-1.5 text-xs text-slate2 hover:text-ink transition-colors">
          Generate random password
        </button>
      </div>

      <button type="submit" disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink text-white py-3 text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Create account
      </button>
    </form>
  );
}

// ── CredentialsCard ───────────────────────────────────────────────────────────

function CredentialsCard({ creds, onClose }) {
  const [copied, setCopied] = useState(false);
  function copyAll() {
    navigator.clipboard.writeText(
      `StayOps login\nOrganization: ${creds.orgName}\nEmail: ${creds.email}\nPassword: ${creds.password}\nApp: https://stayops.vercel.app`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-2xl border border-leaf/20 bg-leaf/5 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-leaf" />
          <p className="text-sm font-bold text-ink">Account created</p>
        </div>
        <button onClick={onClose} className="text-slate2 hover:text-ink"><X className="h-4 w-4" /></button>
      </div>
      <CopyField label="Organization" value={creds.orgName} />
      <CopyField label="Email" value={creds.email} />
      <CopyField label="Password" value={creds.password} mono />
      <button onClick={copyAll}
        className="w-full rounded-xl border border-leaf/30 bg-white py-2 text-xs font-bold text-leaf hover:bg-leaf/5 transition-colors">
        {copied ? '✓ Copied!' : 'Copy all for WhatsApp'}
      </button>
    </div>
  );
}

// ── AdminPage ─────────────────────────────────────────────────────────────────

export default function AdminPage({ onSignOut, onOpenApp }) {
  const [orgs, setOrgs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creds, setCreds]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_list_orgs');
    setOrgs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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

  async function reject(org_id, org_name, skipConfirm = false) {
    if (!skipConfirm && !confirm(`Delete "${org_name}"?`)) return;
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

  function handleCreated(newCreds) {
    setShowCreate(false);
    setCreds(newCreds);
    load();
  }

  const pending  = orgs.filter(o => !o.approved);
  const approved = orgs.filter(o => o.approved);

  return (
    <div className="min-h-screen bg-mist">
      {/* Header */}
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
          <button onClick={load} className="text-slate2 hover:text-ink transition-colors" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={onOpenApp} className="flex items-center gap-1.5 text-xs font-semibold text-slate2 hover:text-ink transition-colors">
            <LayoutDashboard className="h-3.5 w-3.5" /> My workspace
          </button>
          <SignOutBtn onSignOut={onSignOut} />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Credentials after creation */}
        {creds && <CredentialsCard creds={creds} onClose={() => setCreds(null)} />}

        {/* Create account section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">Accounts</h2>
            <button onClick={() => { setShowCreate(v => !v); setCreds(null); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-white px-3 py-1.5 text-xs font-bold hover:bg-ink/90 transition-colors">
              {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showCreate ? 'Cancel' : 'New account'}
            </button>
          </div>
          {showCreate && <CreateAccountForm onCreated={handleCreated} onClose={() => setShowCreate(false)} />}
        </section>

        {/* Pending */}
        {(loading || pending.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-ink">Pending approval</h2>
              {pending.length > 0 && (
                <span className="rounded-full bg-amber/15 text-amber text-xs font-bold px-2 py-0.5">{pending.length}</span>
              )}
            </div>
            {loading
              ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
              : <div className="flex flex-col gap-2">
                  {pending.map(o => <OrgCard key={o.org_id} org={o} busy={busy} onApprove={approve} onReject={reject} onBan={ban} />)}
                </div>
            }
          </section>
        )}

        {/* Active */}
        <section>
          <h2 className="text-sm font-bold text-ink mb-3">
            Active <span className="font-normal text-slate2">({approved.length})</span>
          </h2>
          {loading
            ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
            : approved.length === 0
              ? <div className="rounded-2xl bg-white border border-border px-5 py-8 text-center text-sm text-slate2">No active accounts yet</div>
              : <div className="flex flex-col gap-2">
                  {approved.map(o => <OrgCard key={o.org_id} org={o} busy={busy} onApprove={approve} onReject={reject} onBan={ban} />)}
                </div>
          }
        </section>

      </div>
    </div>
  );
}
