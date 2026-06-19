import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CreditCard,
  Home, Loader2, MessageCircle, Pencil, Plus, Save, Trash2, UserPlus, Users, X,
} from 'lucide-react';
import { createTenant, deleteTenant, fetchTenants, forfeitDeposit, returnDeposit, updateTenant } from './services/tenantService';
import { ensurePaymentRecords, fetchPaymentRecords, markRecordPaid, markRecordUnpaid } from './services/paymentService';
import { logActivity, fetchRecentActivity } from './services/activityService';
import { fetchProperties, fetchRoomsWithBeds } from './services/propertyService';
import { hasSupabaseConfig } from './lib/supabase';
import RoomsPage from './RoomsPage';
import {
  fmt, Label, Card, SectionHeader, Btn, IconBtn,
  StatusBadge, PaymentToggleBtn, WhatsAppLink,
  PageLoader, StatCard, StatStrip, ConfirmInline, EmptyState,
} from './components/ui';



function PropertyPill({ properties, selectedId, onChange, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-white/60">
        <Loader2 className="h-3 w-3 animate-spin" />Loading…
      </div>
    );
  }
  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={e => onChange(e.target.value)}
        className="appearance-none rounded-lg bg-white/15 pl-3 pr-7 py-1.5 text-sm font-semibold text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
      >
        {properties.map(p => (
          <option key={p.id} value={p.id} className="text-ink bg-white">{p.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/70" />
    </div>
  );
}

// ─── header ──────────────────────────────────────────────────────────────────

function StayOpsLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="7" fill="white" fillOpacity="0.12"/>
        <text x="14" y="20" fontFamily="system-ui,-apple-system,sans-serif" fontSize="16" fontWeight="700" fill="white" textAnchor="middle">S</text>
      </svg>
      <span className="text-[13px] font-semibold tracking-wide text-white/70 hidden sm:block">StayOps</span>
    </div>
  );
}

function Header({ properties, selectedPropertyId, onPropertyChange, loadingProperties }) {
  const prop = properties.find(p => p.id === selectedPropertyId);
  return (
    <header className="bg-ink text-white px-4 py-3.5 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StayOpsLogo />
            <h1 className="text-lg font-bold tracking-tight leading-tight">
              {prop?.name ?? 'All Properties'}
            </h1>
          </div>
          <PropertyPill
            properties={properties}
            selectedId={selectedPropertyId}
            onChange={onPropertyChange}
            loading={loadingProperties}
          />
        </div>
      </div>
    </header>
  );
}

// ─── nav ─────────────────────────────────────────────────────────────────────

const PAGES = [
  { id: 'dashboard', label: 'Overview',  icon: Home },
  { id: 'rooms',     label: 'Rooms',     icon: BedDouble },
  { id: 'tenants',   label: 'Tenants',   icon: Users },
  { id: 'payments',  label: 'Payments',  icon: CreditCard },
];

function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4">
        {PAGES.map(p => {
          const Icon = p.icon;
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium tracking-normal transition-colors ${
                isActive ? 'text-ink' : 'text-slate2'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              {p.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TopNav({ active, onChange }) {
  return (
    <nav className="hidden sm:flex border-b border-border bg-white px-6">
      <div className="mx-auto max-w-5xl w-full flex gap-1">
        {PAGES.map(p => {
          const Icon = p.icon;
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                isActive
                  ? 'border-ink text-ink'
                  : 'border-transparent text-slate2 hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" />
              {p.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─── bed selector ────────────────────────────────────────────────────────────

function BedSelector({ properties, propertyId, roomId, bedId, onPropertyChange, onRoomChange, onBedChange }) {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (!propertyId) { setRooms([]); return; }
    setLoadingRooms(true);
    fetchRoomsWithBeds(propertyId)
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoadingRooms(false));
  }, [propertyId]);

  const selectedRoom = rooms.find(r => r.id === roomId);
  const availableBeds = selectedRoom?.beds?.filter(b => b.status === 'available') ?? [];

  const selectCls = 'w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink disabled:bg-mist disabled:text-slate2';

  const fields = [
    {
      label: 'Property', value: propertyId,
      onChange: e => { onPropertyChange(e.target.value); onRoomChange(''); onBedChange(''); },
      disabled: false,
      options: properties.map(p => ({ value: p.id, label: p.name })),
      placeholder: 'Select property',
    },
    {
      label: 'Room', value: roomId,
      onChange: e => { onRoomChange(e.target.value); onBedChange(''); },
      disabled: !propertyId || loadingRooms,
      options: rooms.map(r => {
        const free = r.beds?.filter(b => b.status === 'available').length ?? 0;
        return { value: r.id, label: `Room ${r.room_number} (${free} free)`, disabled: free === 0 };
      }),
      placeholder: loadingRooms ? 'Loading…' : 'Select room',
    },
    {
      label: 'Bed', value: bedId,
      onChange: e => onBedChange(e.target.value),
      disabled: !roomId,
      options: availableBeds.map(b => ({ value: b.id, label: `Bed ${b.bed_number}` })),
      placeholder: 'Select bed',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {fields.map(field => (
        <label key={field.label} className="block">
          <Label>{field.label}</Label>
          <div className="relative mt-1.5">
            <select
              required
              value={field.value}
              onChange={field.onChange}
              disabled={field.disabled}
              className={selectCls}
            >
              <option value="">{field.placeholder}</option>
              {field.options.map(o => (
                <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── tenant form ─────────────────────────────────────────────────────────────

// after
const emptyForm = {
  name: '', phone: '', propertyId: '', roomId: '', bedId: '',
  monthlyRent: '7000', joinDate: new Date().toISOString().slice(0, 10),
  depositAmount: '500',
};

function TenantForm({ initialTenant, properties, defaultPropertyId, prefill, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialTenant) {
      setForm({
        name: initialTenant.name,
        phone: initialTenant.phone,
        propertyId: initialTenant.propertyId ?? defaultPropertyId ?? '',
        roomId: initialTenant.roomId ?? '',
        bedId: initialTenant.bedId ?? '',
        monthlyRent: initialTenant.monthlyRent,
        joinDate: initialTenant.joinDate,
        depositAmount: initialTenant.depositAmount ?? '',
      });
    } else if (prefill) {
      setForm({ ...emptyForm, propertyId: prefill.propertyId ?? '', roomId: prefill.roomId ?? '', bedId: prefill.bedId ?? '' });
    } else {
      setForm({ ...emptyForm, propertyId: defaultPropertyId ?? '' });
    }
  }, [initialTenant, defaultPropertyId, prefill]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({
      ...form,
      monthlyRent: Number(form.monthlyRent),
      depositAmount: Number(form.depositAmount || 0),
    });
    if (!initialTenant) setForm({ ...emptyForm, propertyId: defaultPropertyId ?? '' });
  }

  const inputCls = 'mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <h2 className="font-semibold text-ink">{initialTenant ? 'Edit tenant' : 'Add tenant'}</h2>
        {initialTenant
          ? <IconBtn variant="ghost" onClick={onCancel}><X className="h-4 w-4" /></IconBtn>
          : <Plus className="h-4 w-4 text-slate2" />
        }
      </div>
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Name</Label>
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={inputCls}
              placeholder="Full name"
            />
          </label>
          <label className="block">
            <Label>Phone</Label>
            <input
              required
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className={inputCls}
              placeholder="919876543210"
            />
          </label>
        </div>

        <BedSelector
          properties={properties}
          propertyId={form.propertyId}
          roomId={form.roomId}
          bedId={form.bedId}
          onPropertyChange={v => set('propertyId', v)}
          onRoomChange={v => set('roomId', v)}
          onBedChange={v => set('bedId', v)}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Monthly rent</Label>
            <input
              required
              min="0"
              type="number"
              value={form.monthlyRent}
              onChange={e => set('monthlyRent', e.target.value)}
              className={inputCls}
              placeholder="6500"
            />
          </label>
          <label className="block">
            <Label>Join date</Label>
            <input
              required
              type="date"
              value={form.joinDate}
              onChange={e => set('joinDate', e.target.value)}
              className={inputCls}
            />
          </label>
        </div>

        <label className="block">
          <Label>Security deposit <span className="text-slate2 font-normal">(0 if none)</span></Label>
          <input
            min="0"
            type="number"
            value={form.depositAmount}
            onChange={e => set('depositAmount', e.target.value)}
            className={inputCls}
            placeholder="0"
          />
        </label>

        <Btn
          variant="primary"
          disabled={saving}
          className="w-full py-3 justify-center"
          onClick={undefined}
          {...{ type: 'submit' }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initialTenant ? 'Save changes' : 'Add tenant'}
        </Btn>
      </form>
    </Card>
  );
}

// ─── tenant card ─────────────────────────────────────────────────────────────

function TenantCard({ tenant, onEdit, onDelete, onMarkPaid, onMarkUnpaid, onReturnDeposit, onForfeitDeposit }) {
  const isPaid = tenant.paymentStatus === 'Paid';
  const hasDeposit = tenant.depositAmount > 0;
  const depositHeld = hasDeposit && tenant.depositStatus === 'held';
  const depositReturned = hasDeposit && tenant.depositStatus === 'returned';
  const depositForfeited = hasDeposit && tenant.depositStatus === 'forfeited';
  const [confirmingForfeit, setConfirmingForfeit] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink truncate">{tenant.name}</p>
            <p className="text-sm text-slate2">{tenant.phone}</p>
          </div>
          <StatusBadge status={isPaid ? 'paid' : 'unpaid'} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-mist p-3">
          <div>
            <Label>Room</Label>
            <p className="mt-0.5 font-semibold tabular-nums">{tenant.roomNumber}</p>
          </div>
          <div>
            <Label>Bed</Label>
            <p className="mt-0.5 font-semibold tabular-nums">{tenant.bedNumber}</p>
          </div>
          <div>
            <Label>Rent</Label>
            <p className="mt-0.5 font-semibold tabular-nums">{fmt(tenant.monthlyRent)}</p>
          </div>
        </div>

        {hasDeposit && (
          confirmingForfeit ? (
            <div className="mt-2 rounded-lg overflow-hidden">
              <ConfirmInline
                message={<>Mark {fmt(tenant.depositAmount)} deposit as not refundable for <span className="font-semibold">{tenant.name}</span>?</>}
                confirmLabel="Confirm"
                onCancel={() => setConfirmingForfeit(false)}
                onConfirm={() => { onForfeitDeposit(tenant); setConfirmingForfeit(false); }}
              />
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <Label>Deposit</Label>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">{fmt(tenant.depositAmount)}</p>
              </div>
              {depositHeld && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onReturnDeposit(tenant)}
                    className="text-xs font-semibold text-amber hover:text-amber/80 border border-amber/30 rounded-lg px-2.5 py-1.5 hover:bg-amber/5 transition-colors"
                  >
                    Return Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingForfeit(true)}
                    className="text-xs font-semibold text-coral hover:text-coral/80 border border-coral/30 rounded-lg px-2.5 py-1.5 hover:bg-coral/5 transition-colors"
                  >
                    Not Refundable
                  </button>
                </div>
              )}
              {depositReturned && (
                <span className="text-xs font-semibold text-leaf">Returned</span>
              )}
              {depositForfeited && (
                <span className="text-xs font-semibold text-coral">Deposit Not Refundable</span>
              )}
            </div>
          )
        )}

        {tenant.paymentDate && (
          <p className="mt-2 text-xs text-slate2">Paid on {tenant.paymentDate}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-0.5 px-3 py-1.5 border-t border-border">
        <IconBtn
          variant="ghost"
          onClick={() => onEdit(tenant)}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </IconBtn>
        <PaymentToggleBtn
          isPaid={isPaid}
          onMarkPaid={() => onMarkPaid(tenant)}
          onMarkUnpaid={() => onMarkUnpaid(tenant)}
        />
        <WhatsAppLink
          name={tenant.name}
          phone={tenant.phone}
          roomNumber={tenant.roomNumber}
          bedNumber={tenant.bedNumber}
          rent={tenant.monthlyRent}
        />
        <IconBtn
          variant="danger"
          onClick={() => setConfirmingDelete(true)}
          title="Remove tenant"
        >
          <Trash2 className="h-4 w-4" />
        </IconBtn>
      </div>

      {confirmingDelete && (
        <ConfirmInline
          message={<>Remove <span className="font-semibold">{tenant.name}</span> from Bed {tenant.bedNumber}?</>}
          confirmLabel="Yes, remove"
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => { onDelete(tenant); setConfirmingDelete(false); }}
        />
      )}
    </Card>
  );
}

// ─── pages ───────────────────────────────────────────────────────────────────

// ─── dashboard: business health ──────────────────────────────────────────────
// Occupancy, vacancy, pending rent, and committed monthly revenue at a glance.

function BusinessHealth({ tenants, totalBeds }) {
  const occupied = tenants.length;
  const vacant = Math.max(totalBeds - occupied, 0);
  const pct = totalBeds ? Math.round((occupied / totalBeds) * 100) : 0;
  const unpaid = tenants.filter(t => t.paymentStatus === 'Unpaid');
  const pendingRent = unpaid.reduce((s, t) => s + Number(t.monthlyRent || 0), 0);
  const revenue = tenants.reduce((s, t) => s + Number(t.monthlyRent || 0), 0);

  return (
    <StatStrip stats={[
      {
        label: 'Occupancy',
        value: `${pct}%`,
        sub: `${occupied}/${totalBeds} beds`,
        color: pct >= 80 ? 'text-leaf' : pct >= 50 ? 'text-amber' : 'text-coral',
      },
      {
        label: 'Vacant Beds',
        value: vacant,
        sub: `of ${totalBeds}`,
        color: vacant > 0 ? 'text-amber' : 'text-leaf',
      },
      {
        label: 'Pending Rent',
        value: fmt(pendingRent),
        sub: `${unpaid.length} unpaid`,
        color: pendingRent > 0 ? 'text-coral' : 'text-leaf',
      },
      {
        label: 'Monthly Revenue',
        value: fmt(revenue),
        sub: `${tenants.length} tenants`,
        color: 'text-ink',
      },
    ]} />
  );
}

// ─── dashboard: attention required ───────────────────────────────────────────
// Unpaid tenants only — the people who need a nudge today.

function AttentionRequired({ tenants }) {
  const unpaid = tenants.filter(t => t.paymentStatus === 'Unpaid');
  const [remindExpanded, setRemindExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        title="Attention Required"
        action={unpaid.length > 0 && (
          <Btn
            variant="secondary"
            size="sm"
            onClick={() => setRemindExpanded(v => !v)}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {remindExpanded ? 'Close' : `Remind All (${unpaid.length})`}
          </Btn>
        )}
      />

      {remindExpanded && unpaid.length > 0 && (
        <div className="border-b border-border bg-mist px-4 py-3 flex flex-col gap-1.5">
          <p className="text-xs text-slate2 mb-1">Tap each to open WhatsApp — send one at a time.</p>
          {unpaid.map(t => {
            const phone = String(t.phone).replace(/\D/g, '');
            const msg = `Hi ${t.name}, rent reminder for Room ${t.roomNumber} Bed ${t.bedNumber}. Monthly rent ${fmt(t.monthlyRent)} is unpaid. Please pay at your earliest.`;
            const href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            return (
              <a
                key={t.id}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 border border-border bg-white rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-mist transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-slate2 shrink-0" />
                <span>{t.name.split(' ')[0]}</span>
                <span className="text-slate2">·</span>
                <span className="text-slate2 text-xs">Room {t.roomNumber}</span>
                <span className="ml-auto text-xs font-semibold text-coral tabular-nums">{fmt(t.monthlyRent)}</span>
              </a>
            );
          })}
        </div>
      )}

      {unpaid.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="All paid up" body="Nothing needs attention right now." />
      ) : (
        <div className="divide-y divide-border">
          {unpaid.map(t => (
            <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">{t.name}</p>
                <p className="text-xs text-slate2">Room {t.roomNumber}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm font-semibold text-coral tabular-nums">
                  {fmt(t.monthlyRent)}
                </span>
                <WhatsAppLink
                  name={t.name}
                  phone={t.phone}
                  roomNumber={t.roomNumber}
                  bedNumber={t.bedNumber}
                  rent={t.monthlyRent}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── dashboard: quick actions ─────────────────────────────────────────────────
// The four things an operator actually does, one tap away.

function QuickActions({ onAssignTenant, onAddTenant, onOpenRooms, onOpenPayments }) {
  const actions = [
    { label: 'Assign Tenant', icon: UserPlus,  onClick: onAssignTenant },
    { label: 'Add Tenant',    icon: Plus,      onClick: onAddTenant },
    { label: 'Open Rooms',    icon: BedDouble, onClick: onOpenRooms },
    { label: 'Payments',      icon: CreditCard,onClick: onOpenPayments },
  ];

  return (
    <Card className="overflow-hidden">
      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        {actions.map(a => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="flex flex-col items-center gap-1.5 rounded-lg py-3.5 text-xs font-semibold text-ink transition-all hover:bg-mist active:scale-95"
          >
            <a.icon className="h-5 w-5 text-slate2" />
            {a.label}
          </button>
        ))}
      </div>
    </Card>
  );
}

// ─── dashboard: recent activity ──────────────────────────────────────────────

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTIVITY_DOT = {
  tenant_assigned: 'bg-leaf',
  tenant_moved:    'bg-amber',
  tenant_vacated:  'bg-coral',
  payment_paid:    'bg-leaf',
  payment_unpaid:  'bg-coral',
  deposit_returned:'bg-leaf',
  deposit_forfeited:'bg-coral',
};

function RecentActivity({ propertyId }) {
  const events = fetchRecentActivity(propertyId);
  if (events.length === 0) return null;
  return (
    <Card className="overflow-hidden">
      <SectionHeader title="Recent Activity" />
      <div className="divide-y divide-border">
        {events.map(e => (
          <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className={`h-2 w-2 rounded-full shrink-0 ${ACTIVITY_DOT[e.type] ?? 'bg-slate2/40'}`} />
            <p className="text-sm text-ink flex-1 min-w-0 truncate">{e.description}</p>
            <p className="text-[11px] text-slate2 shrink-0 tabular-nums">{relativeTime(e.at)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DashboardPage({ tenants, totalBeds, selectedPropertyId, onGoToPayments, onGoToRooms, onAddTenant, onAssignTenant }) {
  return (
    <div className="flex flex-col gap-4">
      <BusinessHealth tenants={tenants} totalBeds={totalBeds} />
      <AttentionRequired tenants={tenants} />
      <QuickActions
        onAssignTenant={onAssignTenant}
        onAddTenant={onAddTenant}
        onOpenRooms={onGoToRooms}
        onOpenPayments={onGoToPayments}
      />
      <RecentActivity propertyId={selectedPropertyId} />
    </div>
  );
}

function TenantsPage({ tenants, properties, defaultPropertyId, editingTenant, saving, roomPrefill, onAddTenant, onUpdateTenant, onCancelEdit, onEdit, onDelete, onMarkPaid, onMarkUnpaid, onReturnDeposit, onForfeitDeposit }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      String(t.roomNumber).toLowerCase().includes(q)
    );
  }, [tenants, query]);

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <TenantForm
        initialTenant={editingTenant}
        properties={properties}
        defaultPropertyId={defaultPropertyId}
        prefill={roomPrefill}
        onSubmit={editingTenant ? onUpdateTenant : onAddTenant}
        onCancel={onCancelEdit}
        saving={saving}
      />
      <div className="flex flex-col gap-3">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, phone, or room…"
            className="w-full rounded-lg border border-border bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate2 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {tenants.length === 0 ? (
          <Card><EmptyState icon={Users} title="No tenants yet" body="Add your first tenant using the form on the left." /></Card>
        ) : filtered.length === 0 ? (
          <Card><EmptyState icon={Users} title={`No results for "${query}"`} body="Try a different name, phone number, or room." /></Card>
        ) : (
          <>
            {query && (
              <p className="text-xs text-slate2 px-1">{filtered.length} of {tenants.length} tenants</p>
            )}
            {filtered.map(t => (
              <TenantCard
                key={t.id}
                tenant={t}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkPaid={onMarkPaid}
                onMarkUnpaid={onMarkUnpaid}
                onReturnDeposit={onReturnDeposit}
                onForfeitDeposit={onForfeitDeposit}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function PaymentsPage({ selectedPropertyId }) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [yearMonth, setYearMonth] = useState(currentYM);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordError, setRecordError] = useState('');

  useEffect(() => {
    if (!selectedPropertyId) return;
    setLoadingRecords(true);
    setRecordError('');
    ensurePaymentRecords(selectedPropertyId, yearMonth)
      .then(() => fetchPaymentRecords(selectedPropertyId, yearMonth))
      .then(setRecords)
      .catch(e => setRecordError(e.message))
      .finally(() => setLoadingRecords(false));
  }, [selectedPropertyId, yearMonth]);

  function prevMonth() {
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m - 2);
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  function nextMonth() {
    if (yearMonth >= currentYM) return;
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m);
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const today = now.getDate();
  const isCurrentMonth = yearMonth === currentYM;

  function isOverdue(r) {
    if (r.status === 'paid') return false;
    return isCurrentMonth ? today > r.dueDay : true;
  }
  function daysOverdueLabel(r) {
    if (!isCurrentMonth) return 'Overdue';
    const d = today - r.dueDay;
    return d === 1 ? '1 day overdue' : `${d} days overdue`;
  }

  const paid = records.filter(r => r.status === 'paid').length;
  const unpaid = records.filter(r => r.status === 'unpaid').length;
  const overdue = records.filter(r => isOverdue(r)).length;
  const pendingAmt = records.filter(r => r.status === 'unpaid').reduce((s, r) => s + r.amount, 0);

  const monthLabel = new Date(yearMonth + '-02').toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  async function handleMarkPaid(r) {
    await markRecordPaid(r.id);
    setRecords(rs => rs.map(x => x.id === r.id ? { ...x, status: 'paid', paidAt: new Date().toISOString() } : x));
  }
  async function handleMarkUnpaid(r) {
    await markRecordUnpaid(r.id);
    setRecords(rs => rs.map(x => x.id === r.id ? { ...x, status: 'unpaid', paidAt: null } : x));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <IconBtn onClick={prevMonth}><ChevronLeft className="h-5 w-5" /></IconBtn>
        <span className="font-semibold text-ink">{monthLabel}</span>
        <IconBtn onClick={nextMonth} disabled={yearMonth >= currentYM} className="disabled:opacity-30 disabled:pointer-events-none">
          <ChevronRight className="h-5 w-5" />
        </IconBtn>
      </div>

      <StatStrip stats={[
        { label: 'Paid',    value: paid,            color: 'text-leaf' },
        { label: 'Unpaid',  value: unpaid,          color: unpaid > 0 ? 'text-coral' : 'text-leaf' },
        { label: 'Overdue', value: overdue,         color: overdue > 0 ? 'text-coral' : 'text-leaf' },
        { label: 'Pending', value: fmt(pendingAmt), color: 'text-amber' },
      ]} />

      {recordError && (
        <div className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
          {recordError}
        </div>
      )}

      <Card className="overflow-hidden">
        <SectionHeader title="Payment records" />
        {loadingRecords ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate2" />
          </div>
        ) : records.length === 0 ? (
          <EmptyState icon={CreditCard} title="No records for this month" body="Records are created automatically when tenants are active." />
        ) : (
          <div className="divide-y divide-border">
            {records.map(r => {
              const overdue = isOverdue(r);
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                    <p className="text-xs text-slate2 tabular-nums">
                      Room {r.roomNumber} · Bed {r.bedNumber} · {fmt(r.amount)}
                    </p>
                    {overdue && (
                      <p className="text-xs font-semibold text-coral">{daysOverdueLabel(r)}</p>
                    )}
                    {r.status === 'paid' && r.paidAt && (
                      <p className="text-xs text-slate2">Paid {String(r.paidAt).slice(0, 10)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={r.status === 'paid' ? 'paid' : 'unpaid'} />
                    <PaymentToggleBtn
                      isPaid={r.status === 'paid'}
                      onMarkPaid={() => handleMarkPaid(r)}
                      onMarkUnpaid={() => handleMarkUnpaid(r)}
                    />
                    {r.status === 'unpaid' && (
                      <WhatsAppLink
                        name={r.name}
                        phone={r.phone}
                        roomNumber={r.roomNumber}
                        bedNumber={r.bedNumber}
                        rent={r.amount}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── root ────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('stayops_page');
    return ['dashboard','rooms','tenants','payments'].includes(saved) ? saved : 'dashboard';
  });
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    () => localStorage.getItem('stayops_property') || ''
  );
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [editingTenant, setEditingTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roomPrefill, setRoomPrefill] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasSupabaseConfig) { setLoadingProperties(false); return; }
    fetchProperties()
      .then(data => {
        setProperties(data);
        if (data.length > 0) {
          const saved = localStorage.getItem('stayops_property');
          const valid = saved && data.find(p => p.id === saved);
          if (!valid) setSelectedPropertyId(data[0].id);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingProperties(false));
  }, []);

  useEffect(() => {
    if (selectedPropertyId) localStorage.setItem('stayops_property', selectedPropertyId);
    setLoading(cur => cur); // keep existing spinner state; only show spinner if already loading
    fetchTenants(selectedPropertyId || null)
      .then(data => { setTenants(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [selectedPropertyId]);

  function navigateTo(newPage) {
    localStorage.setItem('stayops_page', newPage);
    setPage(newPage);
  }

  const totalBeds = useMemo(() => {
    if (selectedPropertyId) return properties.find(p => p.id === selectedPropertyId)?.total_beds ?? 0;
    return properties.reduce((s, p) => s + (p.total_beds ?? 0), 0);
  }, [properties, selectedPropertyId]);

  async function handleAdd(tenant) {
    setSaving(true); setError('');
    try {
      const c = await createTenant({ ...tenant, paymentStatus: 'Unpaid', paymentDate: '' });
      setTenants(cur => [c, ...cur]);
      logActivity(selectedPropertyId, 'tenant_assigned', `${c.name} assigned to Room ${c.roomNumber} Bed ${c.bedNumber}`);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(tenant) {
    setSaving(true); setError('');
    try {
      const u = await updateTenant(editingTenant.id, tenant);
      setTenants(cur => cur.map(t => t.id === editingTenant.id ? u : t));
      setEditingTenant(null);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(tenant) {
    setError('');
    try {
      await deleteTenant(tenant.id);
      setTenants(cur => cur.filter(t => t.id !== tenant.id));
      if (editingTenant?.id === tenant.id) setEditingTenant(null);
      logActivity(selectedPropertyId, 'tenant_vacated', `${tenant.name} vacated Room ${tenant.roomNumber} Bed ${tenant.bedNumber}`);
    } catch (e) { setError(e.message); }
  }

  async function patchPayment(tenant, status) {
    try {
      const u = await updateTenant(tenant.id, {
        paymentStatus: status,
        paymentDate: status === 'Paid' ? new Date().toISOString().slice(0, 10) : '',
      });
      setTenants(cur => cur.map(t => t.id === tenant.id ? u : t));
      logActivity(selectedPropertyId, status === 'Paid' ? 'payment_paid' : 'payment_unpaid',
        `${tenant.name} marked ${status.toLowerCase()} — Room ${tenant.roomNumber}`);
    } catch (e) { setError(e.message); }
  }

  async function handleReturnDeposit(tenant) {
    try {
      const u = await returnDeposit(tenant.id);
      setTenants(cur => cur.map(t => t.id === tenant.id ? u : t));
      logActivity(selectedPropertyId, 'deposit_returned', `${tenant.name} deposit returned`);
    } catch (e) { setError(e.message); }
  }

  async function handleForfeitDeposit(tenant) {
    try {
      const u = await forfeitDeposit(tenant.id);
      setTenants(cur => cur.map(t => t.id === tenant.id ? u : t));
      logActivity(selectedPropertyId, 'deposit_forfeited', `${tenant.name} deposit marked not refundable`);
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="min-h-screen bg-mist pb-14 sm:pb-0">
      <Header
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
        loadingProperties={loadingProperties}
      />
      <TopNav active={page} onChange={navigateTo} />

      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        {error && (
          <div className="mb-4 rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral flex items-start justify-between gap-3">
            {error}
            <IconBtn variant="ghost" onClick={() => setError('')}>
              <X className="h-4 w-4 shrink-0" />
            </IconBtn>
          </div>
        )}

        {loading
          ? <PageLoader />
          : (
            <div key={page} className="page-enter">
              {page === 'dashboard' && (
                <DashboardPage
                  tenants={tenants}
                  totalBeds={totalBeds}
                  selectedPropertyId={selectedPropertyId}
                  onGoToPayments={() => navigateTo('payments')}
                  onGoToRooms={() => navigateTo('rooms')}
                  onAssignTenant={() => navigateTo('rooms')}
                  onAddTenant={() => {
                    setEditingTenant(null);
                    setRoomPrefill(null);
                    navigateTo('tenants');
                  }}
                />
              )}
              {page === 'rooms' && (
                <RoomsPage
                  selectedPropertyId={selectedPropertyId}
                  onAssignBed={prefill => { setRoomPrefill(prefill); navigateTo('tenants'); }}
                />
              )}
              {page === 'tenants' && (
                <TenantsPage
                  tenants={tenants}
                  properties={properties}
                  defaultPropertyId={selectedPropertyId}
                  editingTenant={editingTenant}
                  saving={saving}
                  roomPrefill={roomPrefill}
                  onAddTenant={t => { handleAdd(t); setRoomPrefill(null); }}
                  onUpdateTenant={handleUpdate}
                  onCancelEdit={() => setEditingTenant(null)}
                  onEdit={t => { setEditingTenant(t); navigateTo('tenants'); }}
                  onDelete={handleDelete}
                  onMarkPaid={t => patchPayment(t, 'Paid')}
                  onMarkUnpaid={t => patchPayment(t, 'Unpaid')}
                  onReturnDeposit={handleReturnDeposit}
                  onForfeitDeposit={handleForfeitDeposit}
                />
              )}
              {page === 'payments' && (
                <PaymentsPage selectedPropertyId={selectedPropertyId} />
              )}
            </div>
          )
        }
      </main>

      <BottomNav active={page} onChange={navigateTo} />
    </div>
  );
}