import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, CheckCircle2, Trash2, RefreshCw, LayoutDashboard,
  Plus, X, Eye, EyeOff, Copy, Check, ChevronDown, ChevronUp,
  Ban, ShieldCheck, KeyRound, Building2, Users, BedDouble, Clock, AlertCircle, Sparkles, BookmarkPlus, Mail,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { SignOutBtn } from './components/ui';
import { NivaLogo } from './components/NivaLogo';

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
  if (s < 60)      return 'Just now';
  if (s < 3600)    return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)   return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

function toMsg(err) {
  if (!err) return 'Something went wrong';
  if (typeof err === 'string') return err;
  return err.message || err.details || err.hint || JSON.stringify(err);
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function ToastItem({ toast, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-lg text-sm font-semibold text-white transition-all ${
      toast.type === 'error' ? 'bg-coral' : 'bg-leaf'
    }`}>
      {toast.type === 'error'
        ? <AlertCircle className="h-4 w-4 shrink-0" />
        : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      {toast.message}
    </div>
  );
}

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDone={() => onDismiss(t.id)} />
      ))}
    </div>
  );
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

function CredentialsPanel({ userId, email: initEmail, password: initPassword, onClose, onSaved, onToast }) {
  const hasSaved = !!(initEmail && initPassword);
  const [email, setEmail]       = useState(initEmail ?? '');
  const [password, setPassword] = useState(initPassword ?? '');
  const [show, setShow]         = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);
  const [saved, setSaved]       = useState(hasSaved);

  async function handleSave(e) {
    e.preventDefault();
    if (!email || !password) { setError('Enter both email and password'); return; }
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase
        .from('admin_credentials')
        .upsert({ user_id: userId, email: email.trim(), password, updated_at: new Date().toISOString() });
      if (err) throw new Error(toMsg(err));
      setSaved(true);
      onSaved?.(email.trim(), password);
      onToast?.({ message: 'Credentials saved', type: 'success' });
    } catch (err) {
      setError(toMsg(err));
    } finally {
      setBusy(false);
    }
  }

  function copyAll() {
    navigator.clipboard.writeText(
      `NivaOps login\nEmail: ${email}\nPassword: ${password}\nApp: https://nivaops.vercel.app`
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
          <p className="text-xs text-slate2">Enter the current credentials you remember — saved for future reference.</p>
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
            className="w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Current password"
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
            />
            <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate2 hover:text-ink">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit" disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green text-white py-2.5 text-sm font-bold hover:bg-green-hover transition-colors disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save
          </button>
        </form>
      )}
    </div>
  );
}

// ── PasswordResetPanel ────────────────────────────────────────────────────────

function PasswordResetPanel({ userId, ownerEmail, onClose, onPasswordSaved, onToast }) {
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

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
        body: JSON.stringify({ user_id: userId, new_password: password }),
      });
      let json = {};
      try { json = await res.json(); } catch (_) {}
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);
      onPasswordSaved?.(password);
      onToast?.({ message: `Password updated for ${ownerEmail}`, type: 'success' });
      onClose();
    } catch (err) {
      setError(toMsg(err));
    } finally {
      setBusy(false);
    }
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
          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
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
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green text-white py-2.5 text-sm font-bold hover:bg-green-hover transition-colors disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Set password
      </button>
    </form>
  );
}

// ── EmailChangePanel ──────────────────────────────────────────────────────────

function EmailChangePanel({ userId, currentEmail, onClose, onEmailChanged, onToast }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setError('Enter a new email'); return; }
    if (trimmed === currentEmail) { setError('That\'s the same email'); return; }
    setBusy(true);
    setError('');
    try {
      const { error: err } = await supabase.rpc('admin_update_user_email', {
        p_user_id: userId,
        p_email: trimmed,
      });
      if (err) {
        const msg = toMsg(err);
        throw new Error(msg.includes('unique') || msg.includes('already') ? 'That email is already used by another account' : msg);
      }
      onEmailChanged?.(trimmed);
      onToast?.({ message: `Email changed to ${trimmed}`, type: 'success' });
      onClose();
    } catch (err) {
      setError(toMsg(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Change email</p>
        <button type="button" onClick={onClose} className="text-slate2 hover:text-ink"><X className="h-4 w-4" /></button>
      </div>
      <p className="text-xs text-slate2">Current: <span className="font-semibold text-ink">{currentEmail}</span></p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-coral/5 border border-coral/20 px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-coral shrink-0" />
          <p className="text-xs text-coral">{error}</p>
        </div>
      )}

      <input
        autoFocus
        type="text"
        inputMode="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="New email address"
        className="w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
      />

      <button type="submit" disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green text-white py-2.5 text-sm font-bold hover:bg-green-hover transition-colors disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Update email
      </button>
    </form>
  );
}

// ── OrgCard ───────────────────────────────────────────────────────────────────

function OrgCard({ org, onApprove, onReject, onBan, onPlanChange, busy, onToast }) {
  const [open, setOpen]             = useState(false);
  const [showReset, setShowReset]   = useState(false);
  const [showCreds, setShowCreds]   = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [banConfirm, setBanConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [planConfirm, setPlanConfirm]     = useState(false);
  const [localEmail, setLocalEmail]       = useState(org.last_email);
  const [localPassword, setLocalPassword] = useState(org.last_password);
  const [ownerEmail, setOwnerEmail]       = useState(org.owner_email);

  const isPending = !org.approved;
  const isBusy    = busy === org.org_id;

  function closeActions() {
    setShowReset(false);
    setShowCreds(false);
    setShowEmailChange(false);
    setBanConfirm(false);
    setDeleteConfirm(false);
    setPlanConfirm(false);
  }

  function toggleSection(section) {
    const isOpen = (section === 'reset'  && showReset)
                || (section === 'creds'  && showCreds)
                || (section === 'email'  && showEmailChange)
                || (section === 'ban'    && banConfirm)
                || (section === 'delete' && deleteConfirm)
                || (section === 'plan'   && planConfirm);
    closeActions();
    if (!isOpen) {
      if (section === 'reset')  setShowReset(true);
      if (section === 'creds')  setShowCreds(true);
      if (section === 'email')  setShowEmailChange(true);
      if (section === 'ban')    setBanConfirm(true);
      if (section === 'delete') setDeleteConfirm(true);
      if (section === 'plan')   setPlanConfirm(true);
    }
  }

  return (
    <div className={`rounded-2xl border overflow-hidden transition-colors ${
      org.banned ? 'border-coral/30 bg-coral/5' : isPending ? 'border-amber/30 bg-amber/5' : 'border-border bg-white'
    }`}>
      {/* Header */}
      <div className="px-4 py-4 flex items-start gap-3">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
          org.banned ? 'bg-coral/15 text-coral' : isPending ? 'bg-amber/15 text-amber' : 'bg-ink/8 text-ink'
        }`}>
          {org.org_name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-ink">{org.org_name}</p>
            {org.banned  && <span className="text-[10px] font-bold text-coral bg-coral/10 rounded-full px-2 py-0.5">Suspended</span>}
            {isPending   && <span className="text-[10px] font-bold text-amber bg-amber/10 rounded-full px-2 py-0.5">Pending</span>}
            {org.plan === 'pro'
              ? <span className="text-[10px] font-bold text-green bg-green/10 rounded-full px-2 py-0.5">Pro</span>
              : <span className="text-[10px] font-bold text-slate2 bg-border rounded-full px-2 py-0.5">Starter</span>
            }
          </div>
          <p className="text-xs text-slate2 mt-0.5 truncate">{ownerEmail}</p>
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

        {!isPending && (
          <button onClick={() => { setOpen(v => !v); closeActions(); }}
            className="text-slate2 hover:text-ink transition-colors mt-0.5 shrink-0">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Pending actions */}
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

      {/* Expanded section */}
      {!isPending && open && (
        <div className="border-t border-border">
          {/* Action bar */}
          <div className="flex items-center gap-1 px-4 py-2.5 bg-mist/60 flex-wrap">
            <button onClick={() => toggleSection('creds')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${showCreds ? 'bg-ink text-white' : 'bg-white border border-border text-slate2 hover:bg-mist'}`}>
              {localPassword ? <Eye className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
              {localPassword ? 'View password' : 'Save password'}
            </button>
            <button onClick={() => toggleSection('reset')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${showReset ? 'bg-ink text-white' : 'bg-white border border-border text-ink hover:bg-mist'}`}>
              <KeyRound className="h-3.5 w-3.5" /> Reset password
            </button>
            <button onClick={() => toggleSection('email')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${showEmailChange ? 'bg-ink text-white' : 'bg-white border border-border text-ink hover:bg-mist'}`}>
              <Mail className="h-3.5 w-3.5" /> Change email
            </button>
            <button onClick={() => toggleSection('plan')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                planConfirm ? 'bg-ink text-white'
                : org.plan === 'pro'
                  ? 'bg-white border border-border text-slate2 hover:bg-mist'
                  : 'bg-white border border-border text-slate2 hover:bg-mist'
              }`}>
              <Sparkles className="h-3.5 w-3.5" />
              {org.plan === 'pro' ? 'Downgrade' : 'Upgrade'}
            </button>
            <button onClick={() => toggleSection('ban')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                banConfirm ? 'bg-amber text-white'
                : org.banned ? 'bg-white border border-leaf/30 text-leaf hover:bg-leaf/5'
                : 'bg-white border border-border text-slate2 hover:border-amber/40 hover:text-amber'
              }`}>
              {org.banned ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
              {org.banned ? 'Unsuspend' : 'Suspend'}
            </button>
            <div className="flex-1" />
            <button onClick={() => toggleSection('delete')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${deleteConfirm ? 'bg-coral text-white' : 'border border-coral/30 text-coral hover:bg-coral/5'}`}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>

          {/* Inline panels */}
          <div className="px-4 pb-4 flex flex-col gap-3 mt-1">

            {showCreds && (
              <CredentialsPanel
                userId={org.owner_id}
                email={localEmail}
                password={localPassword}
                onClose={() => setShowCreds(false)}
                onSaved={(e, p) => { setLocalEmail(e); setLocalPassword(p); }}
                onToast={onToast}
              />
            )}

            {showReset && (
              <PasswordResetPanel
                userId={org.owner_id}
                ownerEmail={ownerEmail}
                onClose={() => setShowReset(false)}
                onPasswordSaved={p => { setLocalPassword(p); setLocalEmail(ownerEmail); }}
                onToast={onToast}
              />
            )}

            {showEmailChange && (
              <EmailChangePanel
                userId={org.owner_id}
                currentEmail={ownerEmail}
                onClose={() => setShowEmailChange(false)}
                onEmailChanged={e => setOwnerEmail(e)}
                onToast={onToast}
              />
            )}

            {planConfirm && (
              <div className="rounded-xl border border-border bg-white p-4">
                <p className="text-sm font-semibold text-ink mb-1">
                  {org.plan === 'pro' ? 'Downgrade to Starter?' : 'Upgrade to Pro?'}
                </p>
                <p className="text-xs text-slate2 mb-3">
                  {org.plan === 'pro'
                    ? 'This account will be limited to 1 property. Extra properties will remain but the owner can\'t add new ones.'
                    : 'This account can manage multiple properties.'}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => { setPlanConfirm(false); onPlanChange(org.org_id, org.plan === 'pro' ? 'starter' : 'pro'); }}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-ink text-white px-3 py-1.5 text-xs font-bold hover:bg-ink/80 transition-colors disabled:opacity-60">
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {org.plan === 'pro' ? 'Downgrade' : 'Upgrade to Pro'}
                  </button>
                  <button onClick={() => setPlanConfirm(false)}
                    className="inline-flex items-center rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-slate2 hover:bg-mist transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
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

            {!showCreds && !showReset && !showEmailChange && !banConfirm && !deleteConfirm && !planConfirm && (
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

function CreateAccountForm({ onCreated, onClose, onToast }) {
  const [orgName, setOrgName]   = useState('');
  const [propName, setPropName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan]         = useState('starter');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

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
        body: JSON.stringify({ email: email.trim(), password, org_name: orgName.trim(), property_name: propName.trim() || null, plan }),
      });
      let json = {};
      try { json = await res.json(); } catch (_) {}
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);
      onToast?.({ message: `Account created for ${email.trim()}`, type: 'success' });
      onCreated({ email: email.trim(), password, orgName: orgName.trim(), plan });
    } catch (err) {
      setError(toMsg(err));
    } finally {
      setBusy(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green transition-all';

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
        <input required type="text" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="owner@example.com" />
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

      <div>
        <label className="block text-xs font-semibold text-slate2 mb-2">Plan <span className="text-coral">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'starter', label: 'Starter', sub: '₹799/mo · 1 property' },
            { value: 'pro',     label: 'Pro',     sub: '₹1,499/mo · Multiple' },
          ].map(p => (
            <button key={p.value} type="button" onClick={() => setPlan(p.value)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                plan === p.value
                  ? 'border-green bg-green/5 text-ink'
                  : 'border-border bg-white text-slate2 hover:border-slate2/40'
              }`}>
              <p className="text-xs font-bold">{p.label}</p>
              <p className="text-[11px] mt-0.5 opacity-70">{p.sub}</p>
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={busy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green text-white py-3 text-sm font-bold hover:bg-green-hover transition-colors disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Create account
      </button>
    </form>
  );
}

// ── CredentialsCard (post-creation) ──────────────────────────────────────────

function CredentialsCard({ creds, onClose }) {
  const [copied, setCopied] = useState(false);
  function copyAll() {
    navigator.clipboard.writeText(
      `NivaOps login\nOrganization: ${creds.orgName}\nPlan: ${creds.plan === 'pro' ? 'Pro' : 'Starter'}\nEmail: ${creds.email}\nPassword: ${creds.password}\nApp: https://nivaops.vercel.app`
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
  const [toasts, setToasts]     = useState([]);

  function toast(t) {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...t }]);
  }
  function dismissToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_list_orgs');
    setOrgs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel('admin-watch')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memberships' }, () => {
        load();
        toast({ message: 'New signup!', type: 'success' });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  async function approve(org_id) {
    setBusy(org_id);
    await supabase.rpc('admin_approve_org', { p_org_id: org_id });
    await load();
    setBusy(null);
    toast({ message: 'Account approved', type: 'success' });
  }

  async function reject(org_id, org_name, skipConfirm = false) {
    if (!skipConfirm && !confirm(`Delete "${org_name}"?`)) return;
    setBusy(org_id);
    await supabase.rpc('admin_reject_org', { p_org_id: org_id });
    await load();
    setBusy(null);
    toast({ message: `"${org_name}" removed`, type: 'success' });
  }

  async function ban(user_id, banned) {
    const org = orgs.find(o => o.owner_id === user_id);
    setBusy(org?.org_id);
    await supabase.rpc('admin_set_banned', { p_user_id: user_id, p_banned: banned });
    await load();
    setBusy(null);
    toast({ message: banned ? 'Account suspended' : 'Account unsuspended', type: 'success' });
  }

  async function changePlan(org_id, newPlan) {
    setBusy(org_id);
    const { error } = await supabase.from('organizations').update({ plan: newPlan }).eq('id', org_id);
    if (error) toast({ message: `Failed: ${toMsg(error)}`, type: 'error' });
    else toast({ message: `Plan changed to ${newPlan === 'pro' ? 'Pro' : 'Starter'}`, type: 'success' });
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
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className="bg-white border-b border-border px-5 flex items-center justify-between sticky top-0 z-40"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: '1rem' }}>
        <div className="flex items-center gap-2.5">
          <NivaLogo size={28} />
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

        {creds && <CredentialsCard creds={creds} onClose={() => setCreds(null)} />}

        {/* Create account */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink">Accounts</h2>
            <button onClick={() => { setShowCreate(v => !v); setCreds(null); }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-green text-white px-3 py-1.5 text-xs font-bold hover:bg-green-hover transition-colors">
              {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showCreate ? 'Cancel' : 'New account'}
            </button>
          </div>
          {showCreate && <CreateAccountForm onCreated={handleCreated} onClose={() => setShowCreate(false)} onToast={toast} />}
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
                  {pending.map(o => <OrgCard key={o.org_id} org={o} busy={busy} onApprove={approve} onReject={reject} onBan={ban} onPlanChange={changePlan} onToast={toast} />)}
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
                  {approved.map(o => <OrgCard key={o.org_id} org={o} busy={busy} onApprove={approve} onReject={reject} onBan={ban} onPlanChange={changePlan} onToast={toast} />)}
                </div>
          }
        </section>

      </div>
    </div>
  );
}
