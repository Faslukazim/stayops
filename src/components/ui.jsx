// ─── StayOps shared primitives ───────────────────────────────────────────────
// Single source of truth for all reusable UI elements.
// Import from here, never redefine inline.

import { Loader2, MessageCircle, CheckCircle2 } from 'lucide-react';

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
    primary:   'bg-ink text-white hover:bg-ink/80',
    secondary: 'border border-border text-slate2 hover:bg-mist hover:text-ink',
    ghost:     'text-slate2 hover:bg-mist hover:text-ink',
    danger:    'text-coral hover:bg-coral/10',
    success:   'text-leaf hover:bg-leaf/10',
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

export function WhatsAppLink({ name, phone, roomNumber, bedNumber, rent, label, className = '' }) {
  const p = String(phone).replace(/\D/g, '');
  const msg = `Hi ${name}, rent reminder for Room ${roomNumber} Bed ${bedNumber}. Monthly rent ${fmt(rent)} is unpaid. Please pay at your earliest.`;
  const href = `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title="WhatsApp reminder"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg p-2.5 text-slate2 hover:bg-mist hover:text-ink transition-colors ${className}`}
    >
      <MessageCircle className="h-4 w-4 shrink-0" />
      {label && <span className="text-xs font-semibold">{label}</span>}
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
        className="bg-coral text-white hover:bg-red-600"
        onClick={onConfirm}
      >
        {confirmLabel}
      </Btn>
    </div>
  );
}