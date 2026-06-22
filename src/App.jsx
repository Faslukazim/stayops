import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart2, BedDouble, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Home, Loader2, LogOut, MessageCircle, Pencil, Plus, Save, Sparkles, Trash2, UserPlus, Users, X,
} from 'lucide-react';
import { createTenant, deleteTenant, fetchTenants, fetchVacatedTenants, forfeitDeposit, returnDeposit, updateTenant } from './services/tenantService';
import { markTenantRecordPaid } from './services/paymentService';
import { logActivity, fetchRecentActivity } from './services/activityService';
import { fetchProperties, fetchRoomsWithBeds, updatePropertyUpiId } from './services/propertyService';
import { readExpensesSync } from './services/financeService';
import { seedSampleWorkspace, clearSampleWorkspace } from './services/seedService';
import { hasSupabaseConfig } from './lib/supabase';
import { STATUS, computeTenantStatus, tenantDaysOverdue } from './utils/paymentStatus';
import RoomsPage from './RoomsPage';
import FinancePage from './FinancePage';
import TenantProfile from './TenantProfile';
import {
  fmt, Label, Card, SectionHeader, Btn, IconBtn,
  StatusBadge, WhatsAppLink,
  PageLoader, StatStrip, ConfirmInline, EmptyState, CollectModal,
  MoneyInput, normalizePhone, isValidPhone,
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
      <span className="text-[13px] font-semibold tracking-wide text-white/70">StayOps</span>
    </div>
  );
}

function Header({ properties, selectedPropertyId, onPropertyChange, loadingProperties, onSignOut }) {
  return (
    <header className="bg-ink text-white px-4 py-3.5 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <StayOpsLogo />
          <div className="flex items-center gap-2">
            <PropertyPill
              properties={properties}
              selectedId={selectedPropertyId}
              onChange={onPropertyChange}
              loading={loadingProperties}
            />
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title="Sign out"
                className="inline-flex items-center justify-center rounded-lg bg-white/10 p-2 text-white/70 border border-white/15 hover:bg-white/20 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── nav ─────────────────────────────────────────────────────────────────────

const PAGES = [
  { id: 'dashboard', label: 'Overview', icon: Home },
  { id: 'rooms',     label: 'Rooms',    icon: BedDouble },
  { id: 'tenants',   label: 'Tenants',  icon: Users },
  { id: 'finance',   label: 'Finance',  icon: BarChart2 },
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
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium tracking-normal transition-colors ${
                isActive ? 'text-ink' : 'text-slate2'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-ink" />
              )}
              <div className={`rounded-xl p-1 transition-colors ${isActive ? 'bg-black/6' : ''}`}>
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              </div>
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

function BedSelector({ properties, propertyId, roomId, bedId, onPropertyChange, onRoomChange, onBedChange, editingBedId }) {
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
  // When editing, include the tenant's own bed even if status='occupied'
  const availableBeds = selectedRoom?.beds?.filter(
    b => b.status === 'available' || b.id === editingBedId
  ) ?? [];

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
        // When editing, count the current bed as available for its room
        const free = r.beds?.filter(b => b.status === 'available' || b.id === editingBedId).length ?? 0;
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
  rentDueDay: String(new Date().getDate()),
  admissionFee: '500', depositAmount: '500', moveInCollection: '8000',
};

function TenantForm({ initialTenant, properties, defaultPropertyId, prefill, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(emptyForm);
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    if (initialTenant) {
      setPhoneError('');
      setForm({
        name: initialTenant.name,
        phone: initialTenant.phone,
        propertyId: initialTenant.propertyId ?? defaultPropertyId ?? '',
        roomId: initialTenant.roomId ?? '',
        bedId: initialTenant.bedId ?? '',
        monthlyRent: initialTenant.monthlyRent,
        joinDate: initialTenant.joinDate,
        rentDueDay: String(
          initialTenant.rentDueDay
            ?? (initialTenant.joinDate ? Number(initialTenant.joinDate.slice(8, 10)) : 1)
        ),
        admissionFee: initialTenant.admissionFee ?? '500',
        depositAmount: initialTenant.depositAmount ?? '',
        moveInCollection: initialTenant.moveInCollection ?? '',
      });
    } else if (prefill) {
      setForm({ ...emptyForm, propertyId: prefill.propertyId ?? '', roomId: prefill.roomId ?? '', bedId: prefill.bedId ?? '' });
    } else {
      setForm({ ...emptyForm, propertyId: defaultPropertyId ?? '' });
    }
  }, [initialTenant, defaultPropertyId, prefill]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const rent = Number(form.monthlyRent || 0);
    const fee = Number(form.admissionFee || 0);
    const dep = Number(form.depositAmount || 0);
    setForm(f => ({ ...f, moveInCollection: String(rent + fee + dep) }));
  }, [form.monthlyRent, form.admissionFee, form.depositAmount]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValidPhone(form.phone)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number (e.g. 9876543210)');
      return;
    }
    setPhoneError('');
    await onSubmit({
      ...form,
      phone: normalizePhone(form.phone),
      monthlyRent: Number(form.monthlyRent),
      rentDueDay: Number(form.rentDueDay || form.joinDate?.slice(8, 10) || 1),
      admissionFee: Number(form.admissionFee || 0),
      depositAmount: Number(form.depositAmount || 0),
      moveInCollection: Number(form.moveInCollection || 0),
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
              onChange={e => { set('phone', e.target.value); setPhoneError(''); }}
              onBlur={() => form.phone && !isValidPhone(form.phone) && setPhoneError('Enter a valid 10-digit Indian mobile number')}
              className={`${inputCls} ${phoneError ? 'border-coral focus:ring-coral/20 focus:border-coral' : ''}`}
              placeholder="9876543210"
              inputMode="tel"
            />
            {phoneError && <p className="mt-1 text-xs text-coral">{phoneError}</p>}
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
          editingBedId={initialTenant?.bedId}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Monthly rent</Label>
            <MoneyInput value={form.monthlyRent} onChange={v => set('monthlyRent', v)} className="mt-1.5" />
          </label>
          <label className="block">
            <Label>Join date</Label>
            <input
              required
              type="date"
              value={form.joinDate}
              onChange={e => {
                const d = e.target.value;
                set('joinDate', d);
                // Auto-sync rent due day for new tenants (operator can override)
                if (!initialTenant && d) set('rentDueDay', String(Number(d.slice(8, 10))));
              }}
              className={inputCls}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Rent Due Day <span className="text-slate2 font-normal">(day of month)</span></Label>
            <input
              required
              type="number"
              min="1"
              max="28"
              value={form.rentDueDay}
              onChange={e => set('rentDueDay', e.target.value)}
              className={`mt-1.5 ${inputCls}`}
              placeholder="e.g. 5"
            />
            <p className="mt-1 text-xs text-slate2">Rent is due on this day every month</p>
          </label>
          <div />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Admission Fee <span className="text-slate2 font-normal">(one-time)</span></Label>
            <MoneyInput value={form.admissionFee} onChange={v => set('admissionFee', v)} className="mt-1.5" />
          </label>
          <label className="block">
            <Label>Security Deposit <span className="text-slate2 font-normal">(refundable)</span></Label>
            <MoneyInput value={form.depositAmount} onChange={v => set('depositAmount', v)} className="mt-1.5" />
          </label>
        </div>

        <div className="rounded-lg bg-mist px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <Label>Move-In Collection</Label>
            <span className="text-xs text-slate2">Rent + Admission + Deposit</span>
          </div>
          <MoneyInput value={form.moveInCollection} onChange={v => set('moveInCollection', v)} />
        </div>

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

function TenantCard({ tenant, upiId, onEdit, onDelete, onMarkPaid, onMarkUnpaid, onReturnDeposit, onForfeitDeposit }) {
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

        {tenant.admissionFee > 0 && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <div className="flex items-center gap-3">
              <div>
                <Label>Admission</Label>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">{fmt(tenant.admissionFee)}</p>
              </div>
              {tenant.moveInCollection > 0 && (
                <div>
                  <Label>Move-In Collected</Label>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">{fmt(tenant.moveInCollection)}</p>
                </div>
              )}
            </div>
            <span className="text-xs font-semibold text-slate2">Non-refundable</span>
          </div>
        )}

        {tenant.paymentDate && (
          <p className="mt-2 text-xs text-slate2">Paid on {tenant.paymentDate}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border">
        {isPaid ? (
          <button
            type="button"
            onClick={() => onMarkUnpaid(tenant)}
            className="flex items-center gap-1.5 text-xs text-slate2 hover:text-ink transition-colors py-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-leaf" />
            Paid · Undo
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onMarkPaid(tenant)}
            className="flex items-center gap-1.5 rounded-lg bg-leaf px-3 py-1.5 text-sm font-semibold text-white hover:bg-leaf/90 active:scale-95 transition-all"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark Paid
          </button>
        )}
        <div className="flex items-center gap-0.5">
          <WhatsAppLink
            name={tenant.name}
            phone={tenant.phone}
            roomNumber={tenant.roomNumber}
            bedNumber={tenant.bedNumber}
            rent={tenant.monthlyRent}
            upiId={upiId}
          />
          <IconBtn variant="ghost" onClick={() => onEdit(tenant)} title="Edit">
            <Pencil className="h-4 w-4" />
          </IconBtn>
          <IconBtn variant="danger" onClick={() => setConfirmingDelete(true)} title="Remove">
            <Trash2 className="h-4 w-4" />
          </IconBtn>
        </div>
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

function BusinessHealth({ tenants, totalBeds }) {
  const occupied = tenants.length;
  const vacant = Math.max(totalBeds - occupied, 0);
  const pct = totalBeds ? Math.round((occupied / totalBeds) * 100) : 0;
  // Use same status logic as Finance page — exclude new tenants (UPCOMING) from pending
  const unpaid = tenants.filter(t => {
    const s = computeTenantStatus(t);
    return s === STATUS.OVERDUE || s === STATUS.DUE_TODAY || s === STATUS.DUE_SOON;
  });
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
        label: 'Potential Revenue',
        value: fmt(revenue),
        sub: `${tenants.length} occupied beds`,
        color: 'text-ink',
      },
    ]} />
  );
}

// ─── dashboard: move-in & deposit health ─────────────────────────────────────

function MoveInHealth({ tenants }) {
  const currentYM = new Date().toISOString().slice(0, 7);
  const newThisMonth = tenants.filter(t => t.joinDate?.startsWith(currentYM));
  const moveInTotal = newThisMonth.reduce((s, t) => s + Number(t.moveInCollection || 0), 0);
  const admissionTotal = newThisMonth.reduce((s, t) => s + Number(t.admissionFee || 0), 0);
  const depositsHeld = tenants.filter(t => t.depositStatus === 'held').reduce((s, t) => s + Number(t.depositAmount || 0), 0);
  const depositsReturned = tenants.filter(t => t.depositStatus === 'returned').reduce((s, t) => s + Number(t.depositAmount || 0), 0);
  const depositsForfeited = tenants.filter(t => t.depositStatus === 'forfeited').reduce((s, t) => s + Number(t.depositAmount || 0), 0);
  const depositsSettled = depositsReturned + depositsForfeited;

  return (
    <StatStrip stats={[
      { label: 'Move-In This Month', value: fmt(moveInTotal),    sub: `${newThisMonth.length} new tenant${newThisMonth.length !== 1 ? 's' : ''}`, color: moveInTotal > 0 ? 'text-leaf' : 'text-slate2' },
      { label: 'Admission Revenue',  value: fmt(admissionTotal), sub: 'non-refundable fees',  color: admissionTotal > 0 ? 'text-ink' : 'text-slate2' },
      { label: 'Deposits Held',      value: fmt(depositsHeld),   sub: 'refundable liability', color: depositsHeld > 0 ? 'text-amber' : 'text-leaf' },
      { label: 'Deposits Settled',   value: fmt(depositsSettled),sub: depositsForfeited > 0 ? `${fmt(depositsForfeited)} forfeited` : 'returned', color: 'text-slate2' },
    ]} />
  );
}

// ─── dashboard: financial health ─────────────────────────────────────────────

function FinancialHealth({ selectedPropertyId, totalBeds, tenants }) {
  const currentYM = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    if (!selectedPropertyId) return;
    // fetchPaymentRecords is no longer imported at root — derive from tenants
    import('./services/paymentService').then(m =>
      m.fetchPaymentRecords(selectedPropertyId, currentYM).then(setRecords).catch(() => {})
    );
  }, [selectedPropertyId, currentYM]);

  if (records.length === 0) return null;

  const occupied = tenants.length;
  const vacant = Math.max(totalBeds - occupied, 0);
  const potentialRevenue = records.reduce((s, r) => s + r.amount, 0);
  const paidRecords = records.filter(r => r.status === 'paid');
  const actualCollected = paidRecords.reduce((s, r) => s + (r.amountCollected ?? r.amount), 0);
  const deductionLoss = paidRecords.reduce((s, r) => s + (r.amount - (r.amountCollected ?? r.amount)), 0);
  const avgRent = occupied > 0 ? potentialRevenue / occupied : 0;
  const vacancyLoss = Math.round(vacant * avgRent);

  // Expenses from localStorage for quick profit estimate
  const expenses = readExpensesSync(selectedPropertyId, currentYM);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netProfit = actualCollected - totalExpenses;
  const hasExpenses = totalExpenses > 0;

  const ml = new Date(currentYM + '-02').toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <Card className="overflow-hidden">
      <SectionHeader title={`Revenue Health · ${ml}`} />
      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {[
          { label: 'Potential',     value: fmt(potentialRevenue), sub: `${occupied} occupied beds`,                 color: 'text-ink' },
          { label: 'Collected',     value: fmt(actualCollected),  sub: `${paidRecords.length} paid`,                color: actualCollected > 0 ? 'text-leaf' : 'text-slate2' },
          { label: 'Deductions',    value: fmt(deductionLoss),    sub: deductionLoss > 0 ? 'adjustments' : 'none', color: deductionLoss > 0 ? 'text-coral' : 'text-ink' },
          { label: 'Vacancy Loss',  value: fmt(vacancyLoss),      sub: `${vacant} vacant beds`,                     color: vacancyLoss > 0 ? 'text-amber' : 'text-leaf' },
        ].map(s => (
          <div key={s.label} className="bg-white px-4 py-4">
            <Label>{s.label}</Label>
            <p className={`mt-1.5 text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            {s.sub && <p className="mt-0.5 text-xs text-slate2">{s.sub}</p>}
          </div>
        ))}
      </div>
      {hasExpenses && (
        <div className={`grid grid-cols-3 gap-px bg-border border-t border-border`}>
          {[
            { label: 'Expenses',   value: fmt(totalExpenses), color: 'text-coral' },
            { label: netProfit >= 0 ? 'Net Profit' : 'Net Loss', value: fmt(Math.abs(netProfit)), color: netProfit >= 0 ? 'text-leaf' : 'text-coral' },
            { label: 'Profit %',  value: actualCollected > 0 ? `${Math.round((netProfit / actualCollected) * 100)}%` : '—', color: netProfit >= 0 ? 'text-leaf' : 'text-coral' },
          ].map(s => (
            <div key={s.label} className="bg-white px-4 py-3">
              <Label>{s.label}</Label>
              <p className={`mt-1 text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── dashboard: attention required ───────────────────────────────────────────

const ATTENTION_ORDER = [STATUS.OVERDUE, STATUS.DUE_TODAY, STATUS.DUE_SOON];

const ATTENTION_META = {
  [STATUS.OVERDUE]:  { label: 'Overdue',   labelColor: 'text-coral', badgeCls: 'bg-coral/10 text-coral' },
  [STATUS.DUE_TODAY]:{ label: 'Due Today', labelColor: 'text-amber', badgeCls: 'bg-amber/10 text-amber' },
  [STATUS.DUE_SOON]: { label: 'Due Soon',  labelColor: 'text-amber', badgeCls: 'bg-amber/8 text-amber'  },
};

function AttentionRequired({ tenants, upiId, onMarkPaid, onViewTenant }) {
  const [remindExpanded, setRemindExpanded] = useState(false);

  // Group tenants by their computed status — same logic as Finance page
  const grouped = { [STATUS.OVERDUE]: [], [STATUS.DUE_TODAY]: [], [STATUS.DUE_SOON]: [] };
  for (const t of tenants) {
    const s = computeTenantStatus(t);
    if (grouped[s]) grouped[s].push(t);
  }
  // Sort overdue: most overdue first (per-tenant dueDay, not global days-since-month-start)
  grouped[STATUS.OVERDUE].sort((a, b) => tenantDaysOverdue(b) - tenantDaysOverdue(a));

  const actionable = [
    ...grouped[STATUS.OVERDUE],
    ...grouped[STATUS.DUE_TODAY],
    ...grouped[STATUS.DUE_SOON],
  ];

  return (
    <Card className="overflow-hidden">
      <SectionHeader
        title="Attention Required"
        action={actionable.length > 0 && (
          <Btn variant="secondary" size="sm" onClick={() => setRemindExpanded(v => !v)}>
            <MessageCircle className="h-3.5 w-3.5" />
            {remindExpanded ? 'Close' : `Remind All (${actionable.length})`}
          </Btn>
        )}
      />

      {remindExpanded && actionable.length > 0 && (
        <div className="border-b border-border bg-mist px-4 py-3 flex flex-col gap-1.5">
          <p className="text-xs text-slate2 mb-1">Tap each to open WhatsApp — send one at a time.</p>
          {actionable.map(t => {
            const phone = String(t.phone).replace(/\D/g, '');
            const msg = `Hi ${t.name}, rent reminder for Room ${t.roomNumber} Bed ${t.bedNumber}. Monthly rent ${fmt(t.monthlyRent)} is unpaid. Please pay at your earliest.`;
            const href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
            return (
              <a key={t.id} href={href} target="_blank" rel="noreferrer"
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

      {actionable.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="All paid up" body="Nothing needs attention right now." />
      ) : (
        <div className="divide-y divide-border">
          {ATTENTION_ORDER.map(st => grouped[st].map(t => {
            const meta = ATTENTION_META[st];
            const daysOd = st === STATUS.OVERDUE ? tenantDaysOverdue(t) : 0;
            const joinDate = t.joinDate;
            const dueDay = joinDate ? Number(joinDate.slice(8, 10)) : 1;
            const today = new Date().getDate();
            const daysUntil = Math.max(0, dueDay - today);
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewTenant(t.id)}
                      className="font-semibold text-ink truncate hover:underline text-left"
                    >
                      {t.name}
                    </button>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${meta.badgeCls}`}>{meta.label}</span>
                  </div>
                  <p className="text-xs text-slate2">Room {t.roomNumber} · {fmt(t.monthlyRent)}</p>
                  {st === STATUS.OVERDUE && daysOd > 0 && (
                    <p className={`text-xs font-semibold ${meta.labelColor}`}>
                      {daysOd === 1 ? '1 day overdue' : `${daysOd} days overdue`}
                    </p>
                  )}
                  {st === STATUS.DUE_SOON && (
                    <p className={`text-xs ${meta.labelColor}`}>Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}</p>
                  )}
                  {st === STATUS.DUE_TODAY && (
                    <p className={`text-xs font-semibold ${meta.labelColor}`}>Due today</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <WhatsAppLink name={t.name} phone={t.phone} roomNumber={t.roomNumber} bedNumber={t.bedNumber} rent={t.monthlyRent} upiId={upiId} />
                  <Btn size="sm" variant="filled-success" onClick={() => onMarkPaid(t)}>Mark Paid</Btn>
                </div>
              </div>
            );
          }))}
        </div>
      )}
    </Card>
  );
}

// ─── dashboard: quick actions ─────────────────────────────────────────────────
// The four things an operator actually does, one tap away.

function QuickActions({ onAssignTenant, onAddTenant, onOpenRooms, onOpenFinance }) {
  const actions = [
    { label: 'Assign Tenant', icon: UserPlus,  onClick: onAssignTenant },
    { label: 'Add Tenant',    icon: Plus,      onClick: onAddTenant },
    { label: 'Open Rooms',    icon: BedDouble, onClick: onOpenRooms },
    { label: 'Finance',       icon: BarChart2, onClick: onOpenFinance },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map(a => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          className="flex flex-col items-start gap-3 rounded-xl bg-white border border-border shadow-card p-4 text-left transition-all hover:border-slate2/40 active:scale-[0.97]"
        >
          <div className="rounded-lg bg-mist p-2.5">
            <a.icon className="h-5 w-5 text-ink" />
          </div>
          <span className="text-sm font-semibold text-ink leading-tight">{a.label}</span>
        </button>
      ))}
    </div>
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

function DashboardPage({ tenants, totalBeds, selectedPropertyId, upiId, onGoToFinance, onGoToRooms, onAddTenant, onAssignTenant, onMarkPaid, onViewTenant }) {
  return (
    <div className="flex flex-col gap-4">
      <BusinessHealth tenants={tenants} totalBeds={totalBeds} />
      <AttentionRequired tenants={tenants} upiId={upiId} onMarkPaid={onMarkPaid} onViewTenant={onViewTenant} />
      <MoveInHealth tenants={tenants} />
      <FinancialHealth selectedPropertyId={selectedPropertyId} totalBeds={totalBeds} tenants={tenants} />
      <QuickActions
        onAssignTenant={onAssignTenant}
        onAddTenant={onAddTenant}
        onOpenRooms={onGoToRooms}
        onOpenFinance={onGoToFinance}
      />
      <RecentActivity propertyId={selectedPropertyId} />
    </div>
  );
}

function UpiSettings({ propertyId, upiId, onSave }) {
  const [val, setVal] = useState(upiId ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setVal(upiId ?? ''); }, [upiId]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(val.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card className="overflow-hidden">
      <SectionHeader title="Property Settings" />
      <form onSubmit={handleSave} className="p-4 flex flex-col gap-3">
        <label className="block">
          <Label>GPay / UPI ID</Label>
          <p className="text-xs text-slate2 mt-0.5 mb-1.5">Added to WhatsApp rent reminders so tenants can pay instantly.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder="yourname@okicici"
              className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
            />
            <Btn variant="primary" disabled={saving} {...{ type: 'submit' }}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 text-leaf" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved' : 'Save'}
            </Btn>
          </div>
        </label>
      </form>
    </Card>
  );
}

function TenantsPage({ tenants, properties, defaultPropertyId, editingTenant, saving, roomPrefill, upiId, onAddTenant, onUpdateTenant, onCancelEdit, onEdit, onDelete, onMarkPaid, onMarkUnpaid, onReturnDeposit, onForfeitDeposit, selectedPropertyId }) {
  const [query, setQuery] = useState('');
  const [showPast, setShowPast] = useState(false);
  const [vacated, setVacated] = useState([]);
  const [loadingVacated, setLoadingVacated] = useState(false);

  useEffect(() => {
    if (!showPast) return;
    setLoadingVacated(true);
    fetchVacatedTenants(selectedPropertyId)
      .then(setVacated)
      .catch(console.error)
      .finally(() => setLoadingVacated(false));
  }, [showPast, selectedPropertyId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      String(t.roomNumber).toLowerCase().includes(q)
    );
  }, [tenants, query]);

  const filteredVacated = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vacated;
    return vacated.filter(t => t.name.toLowerCase().includes(q) || t.phone.includes(q));
  }, [vacated, query]);

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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
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
              <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate2 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowPast(v => !v)}
            className={`shrink-0 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${showPast ? 'bg-ink text-white border-ink' : 'border-border text-slate2 hover:text-ink hover:bg-mist'}`}
          >
            {showPast ? 'Active' : 'Past'}
          </button>
        </div>

        {!showPast ? (
          tenants.length === 0 ? (
            <Card><EmptyState icon={Users} title="No tenants yet" body="Add your first tenant using the form on the left." /></Card>
          ) : filtered.length === 0 ? (
            <Card><EmptyState icon={Users} title={`No results for "${query}"`} body="Try a different name, phone number, or room." /></Card>
          ) : (
            <>
              {query && <p className="text-xs text-slate2 px-1">{filtered.length} of {tenants.length} tenants</p>}
              {filtered.map(t => (
                <TenantCard
                  key={t.id}
                  tenant={t}
                  upiId={upiId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onMarkPaid={onMarkPaid}
                  onMarkUnpaid={onMarkUnpaid}
                  onReturnDeposit={onReturnDeposit}
                  onForfeitDeposit={onForfeitDeposit}
                />
              ))}
            </>
          )
        ) : loadingVacated ? (
          <Card><div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div></Card>
        ) : filteredVacated.length === 0 ? (
          <Card><EmptyState icon={Users} title="No past tenants" body="Vacated tenants will appear here." /></Card>
        ) : (
          <>
            {query && <p className="text-xs text-slate2 px-1">{filteredVacated.length} past tenants</p>}
            {filteredVacated.map(t => (
              <Card key={t.id} className="overflow-hidden opacity-80">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{t.name}</p>
                      <p className="text-sm text-slate2">{t.phone}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-mist text-slate2 shrink-0">Vacated</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-mist p-3">
                    <div><Label>Room</Label><p className="mt-0.5 font-semibold">{t.roomNumber}</p></div>
                    <div><Label>Bed</Label><p className="mt-0.5 font-semibold">{t.bedNumber}</p></div>
                    <div><Label>Rent</Label><p className="mt-0.5 font-semibold tabular-nums">{fmt(t.monthlyRent)}</p></div>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-slate2">
                    {t.joinDate && <span>Joined {t.joinDate}</span>}
                    {t.endDate && <span>· Left {t.endDate}</span>}
                  </div>
                  {t.depositAmount > 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div><Label>Deposit</Label><p className="mt-0.5 text-sm font-semibold tabular-nums">{fmt(t.depositAmount)}</p></div>
                      <span className={`text-xs font-semibold ${t.depositStatus === 'returned' ? 'text-leaf' : t.depositStatus === 'forfeited' ? 'text-coral' : 'text-amber'}`}>
                        {t.depositStatus === 'returned' ? 'Returned' : t.depositStatus === 'forfeited' ? 'Not refundable' : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── empty workspace (new org / after clearing demo) ─────────────────────────

function EmptyWorkspace({ onSeed, seeding }) {
  return (
    <div className="flex justify-center pt-6">
      <Card className="w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-mist">
          <BedDouble className="h-6 w-6 text-ink" />
        </div>
        <h2 className="text-lg font-bold text-ink">Welcome to StayOps</h2>
        <p className="mt-1.5 text-sm text-slate2">
          Your workspace is empty. Load a sample hostel — rooms, tenants, and this month&apos;s rent — to see how StayOps works.
        </p>
        <Btn variant="primary" className="mt-4 w-full justify-center py-3" onClick={onSeed} disabled={seeding}>
          {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Load sample workspace
        </Btn>
        <p className="mt-2 text-xs text-slate2">
          Adds &ldquo;Sample Hostel&rdquo; with 3 rooms, 6 tenants, and live rent statuses — clearly labelled demo data you can remove anytime.
        </p>
      </Card>
    </div>
  );
}

// ─── root ────────────────────────────────────────────────────────────────────

export default function App({ session, organizationName, onSignOut } = {}) {
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('stayops_page');
    // 'payments' is now 'finance' — migrate old saved value
    if (saved === 'payments') return 'finance';
    return ['dashboard','rooms','tenants','finance'].includes(saved) ? saved : 'dashboard';
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
  const [mountedPages, setMountedPages] = useState(() => new Set([page]));
  const [enteringPage, setEnteringPage] = useState(page);
  const [roomsVersion, setRoomsVersion] = useState(0);
  const [collectingTenant, setCollectingTenant] = useState(null);
  const [viewingTenantId, setViewingTenantId] = useState(null);
  const [toast, setToast] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(id);
  }, [toast]);
  const viewingTenant = viewingTenantId ? tenants.find(t => t.id === viewingTenantId) ?? null : null;

  const loadProperties = useCallback(async () => {
    if (!hasSupabaseConfig) { setLoadingProperties(false); return []; }
    setLoadingProperties(true);
    try {
      const data = await fetchProperties();
      setProperties(data);
      setSelectedPropertyId(cur => {
        if (data.length === 0) return '';
        const valid = cur && data.find(p => p.id === cur);
        return valid ? cur : data[0].id;
      });
      return data;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  useEffect(() => { loadProperties(); }, [loadProperties]);

  useEffect(() => {
    if (selectedPropertyId) localStorage.setItem('stayops_property', selectedPropertyId);
    setUpiId(properties.find(p => p.id === selectedPropertyId)?.upi_id ?? '');
    setLoading(cur => cur);
    fetchTenants(selectedPropertyId || null)
      .then(data => { setTenants(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [selectedPropertyId, properties]);

  useEffect(() => {
    if (!enteringPage) return;
    const id = setTimeout(() => setEnteringPage(null), 250);
    return () => clearTimeout(id);
  }, [enteringPage]);

  function navigateTo(newPage) {
    localStorage.setItem('stayops_page', newPage);
    setPage(newPage);
    setEnteringPage(newPage);
    setMountedPages(m => { const n = new Set(m); n.add(newPage); return n; });
  }

  const totalBeds = useMemo(() => {
    if (selectedPropertyId) return properties.find(p => p.id === selectedPropertyId)?.total_beds ?? 0;
    return properties.reduce((s, p) => s + (p.total_beds ?? 0), 0);
  }, [properties, selectedPropertyId]);

  const selectedProperty = useMemo(
    () => properties.find(p => p.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId],
  );
  const isDemoProperty = Boolean(selectedProperty?.is_demo);

  async function handleSeed() {
    setSeeding(true); setError('');
    try {
      await seedSampleWorkspace();
      localStorage.removeItem('stayops_property');
      setSelectedPropertyId('');
      await loadProperties();
    } catch (e) { setError(e.message); }
    finally { setSeeding(false); }
  }

  async function handleClearDemo() {
    setSeeding(true); setError('');
    try {
      await clearSampleWorkspace();
      localStorage.removeItem('stayops_property');
      setSelectedPropertyId('');
      await loadProperties();
    } catch (e) { setError(e.message); }
    finally { setSeeding(false); }
  }

  async function handleSaveUpi(newUpiId) {
    try {
      await updatePropertyUpiId(selectedPropertyId, newUpiId);
      setUpiId(newUpiId);
      setProperties(cur => cur.map(p => p.id === selectedPropertyId ? { ...p, upi_id: newUpiId || null } : p));
    } catch (e) { setError(e.message); }
  }

  async function handleAdd(tenant) {
    setSaving(true); setError('');
    try {
      const c = await createTenant({ ...tenant, paymentStatus: 'Unpaid', paymentDate: '' });
      setTenants(cur => [c, ...cur]);
      setRoomsVersion(v => v + 1);
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
      setToast(`${u.name} updated`);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(tenant) {
    setError('');
    try {
      await deleteTenant(tenant.id);
      setTenants(cur => cur.filter(t => t.id !== tenant.id));
      if (editingTenant?.id === tenant.id) setEditingTenant(null);
      setRoomsVersion(v => v + 1);
      logActivity(selectedPropertyId, 'tenant_vacated', `${tenant.name} vacated Room ${tenant.roomNumber} Bed ${tenant.bedNumber}`);
    } catch (e) { setError(e.message); }
  }

  async function handleTenantMarkPaid(amountCollected, deductionReason) {
    const t = collectingTenant;
    setCollectingTenant(null);
    const currentYM = new Date().toISOString().slice(0, 7);
    await patchPayment(t, 'Paid');
    markTenantRecordPaid(t.id, currentYM, amountCollected, deductionReason).catch(console.error);
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
        onSignOut={onSignOut}
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

        {loading || loadingProperties
          ? <PageLoader />
          : properties.length === 0 && hasSupabaseConfig
          ? <EmptyWorkspace onSeed={handleSeed} seeding={seeding} />
          : (
            <>
              {isDemoProperty && (
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber/30 bg-amber/5 px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber" />
                    <p className="truncate text-sm font-medium text-amber">Sample demo data — explore freely.</p>
                  </div>
                  <Btn variant="secondary" size="sm" onClick={handleClearDemo} disabled={seeding} className="shrink-0">
                    {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Clear demo data
                  </Btn>
                </div>
              )}
              <div className={page !== 'dashboard' ? 'hidden' : enteringPage === 'dashboard' ? 'page-enter' : undefined}>
                <DashboardPage
                  tenants={tenants}
                  totalBeds={totalBeds}
                  selectedPropertyId={selectedPropertyId}
                  upiId={upiId}
                  onGoToFinance={() => navigateTo('finance')}
                  onGoToRooms={() => navigateTo('rooms')}
                  onAssignTenant={() => navigateTo('rooms')}
                  onMarkPaid={setCollectingTenant}
                  onViewTenant={setViewingTenantId}
                  onAddTenant={() => {
                    setEditingTenant(null);
                    setRoomPrefill(null);
                    navigateTo('tenants');
                  }}
                />
                <div className="mt-4">
                  <UpiSettings propertyId={selectedPropertyId} upiId={upiId} onSave={handleSaveUpi} />
                </div>
              </div>
              <div className={page !== 'rooms' ? 'hidden' : enteringPage === 'rooms' ? 'page-enter' : undefined}>
                {mountedPages.has('rooms') && (
                  <RoomsPage
                    key={`${selectedPropertyId}-${roomsVersion}`}
                    selectedPropertyId={selectedPropertyId}
                    upiId={upiId}
                    onAssignBed={prefill => { setRoomPrefill(prefill); navigateTo('tenants'); }}
                    onViewTenant={setViewingTenantId}
                  />
                )}
              </div>
              <div className={page !== 'tenants' ? 'hidden' : enteringPage === 'tenants' ? 'page-enter' : undefined}>
                <TenantsPage
                  tenants={tenants}
                  properties={properties}
                  defaultPropertyId={selectedPropertyId}
                  selectedPropertyId={selectedPropertyId}
                  editingTenant={editingTenant}
                  saving={saving}
                  roomPrefill={roomPrefill}
                  upiId={upiId}
                  onAddTenant={t => { handleAdd(t); setRoomPrefill(null); }}
                  onUpdateTenant={handleUpdate}
                  onCancelEdit={() => setEditingTenant(null)}
                  onEdit={t => { setEditingTenant(t); navigateTo('tenants'); }}
                  onDelete={handleDelete}
                  onMarkPaid={setCollectingTenant}
                  onMarkUnpaid={t => patchPayment(t, 'Unpaid')}
                  onReturnDeposit={handleReturnDeposit}
                  onForfeitDeposit={handleForfeitDeposit}
                />
              </div>
              <div className={page !== 'finance' ? 'hidden' : enteringPage === 'finance' ? 'page-enter' : undefined}>
                {mountedPages.has('finance') && (
                  <FinancePage selectedPropertyId={selectedPropertyId} tenants={tenants} onViewTenant={setViewingTenantId} upiId={upiId} />
                )}
              </div>
            </>
          )
        }
      </main>

      {collectingTenant && (
        <CollectModal
          record={{ amount: collectingTenant.monthlyRent, name: collectingTenant.name, roomNumber: collectingTenant.roomNumber, bedNumber: collectingTenant.bedNumber }}
          onConfirm={handleTenantMarkPaid}
          onCancel={() => setCollectingTenant(null)}
        />
      )}

      {viewingTenant && (
        <TenantProfile
          tenant={viewingTenant}
          properties={properties}
          onClose={() => setViewingTenantId(null)}
          onCollect={(t, amt, reason) => {
            const currentYM = new Date().toISOString().slice(0, 7);
            patchPayment(t, 'Paid');
            markTenantRecordPaid(t.id, currentYM, amt, reason).catch(console.error);
          }}
          onEdit={t => { setViewingTenantId(null); setEditingTenant(t); navigateTo('tenants'); }}
          onDelete={t => { setViewingTenantId(null); handleDelete(t); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none">
          <CheckCircle2 className="h-4 w-4 text-leaf shrink-0" />
          {toast}
        </div>
      )}

      <BottomNav active={page} onChange={navigateTo} />
    </div>
  );
}