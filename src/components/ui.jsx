// ─── StayOps shared primitives ───────────────────────────────────────────────
// Single source of truth for all reusable UI elements.
// Import from here, never redefine inline.

import { useState, useEffect, useRef } from 'react';
import { Loader2, MessageCircle, CheckCircle2, ChevronDown, LogOut } from 'lucide-react';

// ─── SignOutBtn ───────────────────────────────────────────────────────────────
// Two-tap sign out: first tap shows "Sure?", second confirms.
// Reset back to idle if user clicks away.

export function SignOutBtn({ onSignOut, className = '' }) {
  const [confirm, setConfirm] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!confirm) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setConfirm(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [confirm]);

  if (confirm) {
    return (
      <div ref={ref} className="flex items-center gap-1.5">
        <span className="text-xs font-semibold text-ink">Sign out?</span>
        <button
          onClick={onSignOut}
          className="rounded-lg bg-coral text-white px-2.5 py-1 text-xs font-bold hover:bg-coral/90 transition-colors"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="rounded-lg bg-mist border border-border px-2.5 py-1 text-xs font-semibold text-slate2 hover:text-ink transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className={`flex items-center gap-1.5 text-xs font-semibold text-slate2 hover:text-ink transition-colors ${className}`}
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </button>
  );
}

// ─── fmt ─────────────────────────────────────────────────────────────────────

export function fmt(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

// ─── Label ───────────────────────────────────────────────────────────────────
// Use for all field labels, section headings, stat titles.

export function Label({ children, className = '' }) {
  return (
    <span className={`text-2xs font-semibold uppercase tracking-widest text-slate2 ${className}`}>
      {children}
    </span>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
// Base surface. Always use this — never raw div with bg-white + border.

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white shadow-card border border-border ${className}`}>
      {children}
    </div>
  );
}

// ─── SectionHeader ───────────────────────────────────────────────────────────
// Card header row with optional right-side action.

export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border">
      <Label>{title}</Label>
      {action}
    </div>
  );
}

// ─── Btn ─────────────────────────────────────────────────────────────────────
// Base button. Use variant prop for hierarchy.
// variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

export function Btn({ children, className = '', variant = 'ghost', size = 'md', ...props }) {
  const variants = {
    primary:        'bg-ink text-white hover:bg-ink/80',
    secondary:      'border border-border text-slate2 hover:bg-mist hover:text-ink',
    ghost:          'text-slate2 hover:bg-mist hover:text-ink',
    danger:         'text-coral hover:bg-coral/10',
    success:        'text-leaf hover:bg-leaf/10',
    'filled-success': 'bg-leaf text-white hover:bg-leaf/90',
  };
  const sizes = {
    sm:   'px-2.5 py-1.5 text-xs',
    md:   'px-3 py-2 text-sm',
    lg:   'px-4 py-2.5 text-sm',
    icon: 'p-2.5',   // 40px effective tap target — minimum for mobile
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition-all active:scale-95 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── LoadingBtn ──────────────────────────────────────────────────────────────
// Btn that shows spinner + disables itself while loading.

export function LoadingBtn({ children, loading = false, loadingText, className = '', variant = 'primary', size = 'md', ...props }) {
  return (
    <Btn variant={variant} size={size} className={className} disabled={loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? (loadingText ?? children) : children}
    </Btn>
  );
}

// ─── IconBtn ─────────────────────────────────────────────────────────────────
// Icon-only button with correct 40px tap target.

export function IconBtn({ children, className = '', variant = 'ghost', title, ...props }) {
  return (
    <Btn variant={variant} size="icon" title={title} className={className} {...props}>
      {children}
    </Btn>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
// Single source of truth for all status chips.
// status: 'paid' | 'unpaid' | 'vacant' | 'full' | 'empty' | 'partial'

export function StatusBadge({ status, label }) {
  const styles = {
    paid:    'bg-leaf/10 text-leaf',
    unpaid:  'bg-coral/10 text-coral',
    vacant:  'bg-amber/10 text-amber',
    full:    'bg-leaf/10 text-leaf',
    empty:   'bg-amber/10 text-amber',
    partial: 'bg-mist text-slate2',
    free:    'bg-leaf/10 text-leaf',
  };
  const defaultLabels = {
    paid: 'Paid', unpaid: 'Unpaid', vacant: 'Vacant',
    full: 'Full', empty: 'Empty', partial: 'Partial', free: 'Free',
  };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-2xs font-semibold shrink-0 ${styles[status] ?? 'bg-mist text-slate2'}`}>
      {label ?? defaultLabels[status] ?? status}
    </span>
  );
}

// ─── PaymentToggleBtn ─────────────────────────────────────────────────────────
// Mark paid / unpaid toggle. Used in TenantCard, BedRow, PaymentsPage.

export function PaymentToggleBtn({ isPaid, onMarkPaid, onMarkUnpaid, showLabel = false }) {
  return (
    <IconBtn
      variant={isPaid ? 'danger' : 'success'}
      title={isPaid ? 'Mark unpaid' : 'Mark paid'}
      onClick={() => isPaid ? onMarkUnpaid() : onMarkPaid()}
      size={showLabel ? 'sm' : 'icon'}
    >
      <CheckCircle2 className="h-4 w-4" />
      {showLabel && <span>{isPaid ? 'Unpaid' : 'Paid'}</span>}
    </IconBtn>
  );
}

// ─── WhatsAppLink ─────────────────────────────────────────────────────────────
// Consistent WA reminder link. Used in TenantCard, BedRow, PaymentsPage, RoomDetail.

export function WhatsAppLink({ name, phone, roomNumber, bedNumber, rent, label, upiId, className = '' }) {
  const p = String(phone).replace(/\D/g, '');
  const upiLine = upiId ? ` Pay via GPay/UPI: ${upiId}` : '';
  const msg = `Hi ${name}, rent reminder for Room ${roomNumber} Bed ${bedNumber}. Monthly rent ${fmt(rent)} is unpaid. Please pay at your earliest.${upiLine}`;
  const href = `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title="WhatsApp reminder"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-slate2 hover:bg-mist hover:text-ink transition-colors ${label ? 'px-2.5 py-2 text-xs font-semibold' : 'p-2.5'} ${className}`}
    >
      <MessageCircle className="h-4 w-4 shrink-0" />
      {label && <span>{label}</span>}
    </a>
  );
}

// ─── PageLoader ───────────────────────────────────────────────────────────────
// Centered spinner. Single pattern for all loading states.

export function PageLoader() {
  return (
    <div className="flex min-h-60 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate2" />
    </div>
  );
}

// ─── InlineLoader ─────────────────────────────────────────────────────────────
// For card-level loading (e.g. BedGrid).

export function InlineLoader({ text = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 p-4 text-sm text-slate2">
      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      {text}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Used in StatStrip (dashboard) and RoomsPage summary.

export function StatCard({ label, value, sub, color = 'text-ink' }) {
  return (
    <Card className="p-4">
      <Label>{label}</Label>
      <p className={`mt-1.5 text-xl font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate2">{sub}</p>}
    </Card>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
// Consistent empty state. icon, title required. body and action optional.

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-2">
      {Icon && <Icon className="h-7 w-7 text-slate2/30 mb-1" />}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {body && <p className="text-sm text-slate2">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── StatStrip ────────────────────────────────────────────────────────────────
// One card, divided grid. Use instead of multiple StatCards in a row.
// Pass stats as array: [{ label, value, sub?, color? }]

export function StatStrip({ stats }) {
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white px-4 py-4">
            <Label>{s.label}</Label>
            <p className={`mt-1.5 text-xl font-bold tabular-nums ${s.color ?? 'text-ink'}`}>{s.value}</p>
            {s.sub && <p className="mt-0.5 text-xs text-slate2">{s.sub}</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── ConfirmInline ────────────────────────────────────────────────────────────
// Inline confirm row. Replaces one-off confirm patterns.
// Wrap the normal row content and show this when confirming.

export function ConfirmInline({ message, onConfirm, onCancel, confirmLabel = 'Confirm', className = '' }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-coral/5 ${className}`}>
      <p className="text-sm text-ink flex-1">{message}</p>
      <Btn variant="secondary" size="sm" onClick={onCancel}>Cancel</Btn>
      <Btn variant="danger" size="sm"
        className="bg-coral text-white hover:bg-coral/90"
        onClick={onConfirm}
      >
        {confirmLabel}
      </Btn>
    </div>
  );
}

// ─── normalizePhone / isValidPhone ───────────────────────────────────────────
// Always store as +91XXXXXXXXXX. Strip non-digits, prepend country code.

export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

export function isValidPhone(raw) {
  return /^\+91[6-9]\d{9}$/.test(normalizePhone(raw));
}

// ─── MoneyInput ───────────────────────────────────────────────────────────────
// [-] value [+] with ₹500 step. Hides native spinners. Large touch targets.

export function MoneyInput({ value, onChange, min = 0, className = '' }) {
  const num = Number(value) || 0;
  return (
    <div className={`flex items-center rounded-lg border border-border bg-white overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => onChange(String(Math.max(min, num - 500)))}
        className="flex items-center justify-center w-12 self-stretch text-2xl font-light text-slate2 hover:bg-mist active:bg-border transition-colors shrink-0 select-none"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        className="flex-1 min-w-0 text-center text-sm font-bold text-ink bg-transparent py-3 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(String(num + 500))}
        className="flex items-center justify-center w-12 self-stretch text-2xl font-light text-slate2 hover:bg-mist active:bg-border transition-colors shrink-0 select-none"
      >
        +
      </button>
    </div>
  );
}

// ─── CollectModal ─────────────────────────────────────────────────────────────
// Mark-paid modal: captures amount collected + optional deduction reason.
// record: { amount, name, roomNumber, bedNumber }

const DEDUCTION_REASONS = ['Food not taken', 'Home leave', 'Temporary discount', 'Adjustment', 'Other'];

export function CollectModal({ record, onConfirm, onCancel }) {
  const [amount, setAmount] = useState(String(record.amount));
  const [reason, setReason] = useState('');

  const numAmount = Math.max(0, Number(amount) || 0);
  const deduction = record.amount - numAmount;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="px-5 pt-5 pb-4">
          <h3 className="font-semibold text-ink">Record Payment</h3>
          <p className="text-sm text-slate2 mt-0.5">{record.name} · Room {record.roomNumber} · Bed {record.bedNumber}</p>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-mist px-3 py-2.5">
            <Label>Standard Rent</Label>
            <span className="text-sm font-bold text-ink tabular-nums">{fmt(record.amount)}</span>
          </div>

          <label className="mt-3 block">
            <Label>Amount Collected</Label>
            <MoneyInput value={amount} onChange={setAmount} min={0} className="mt-1.5" />
          </label>

          {deduction > 0 && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-coral/20 bg-coral/5 px-3 py-2">
              <span className="text-xs text-slate2">Deduction</span>
              <span className="text-sm font-bold text-coral tabular-nums">{fmt(deduction)}</span>
            </div>
          )}

          {deduction > 0 && (
            <label className="mt-3 block">
              <Label>Reason <span className="font-normal text-slate2">(optional)</span></Label>
              <div className="relative mt-1.5">
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
                >
                  <option value="">Select reason…</option>
                  {DEDUCTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
              </div>
            </label>
          )}
        </div>

        <div className="flex gap-2 justify-end border-t border-border px-5 py-3.5">
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn variant="filled-success" onClick={() => onConfirm(numAmount, reason || null)}>
            <CheckCircle2 className="h-4 w-4" />
            Confirm
          </Btn>
        </div>
      </div>
    </div>
  );
}