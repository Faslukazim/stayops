import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble, CalendarDays, CheckCircle2, ChevronDown, CreditCard,
  Home, IndianRupee, Loader2, MessageCircle, Pencil, Plus, Save,
  Trash2, Users, X, Building2,
} from 'lucide-react';
import { createTenant, deleteTenant, fetchTenants, updateTenant } from './services/tenantService';
import { fetchProperties, fetchRoomsWithBeds } from './services/propertyService';
import { hasSupabaseConfig } from './lib/supabase';
import RoomsPage from './RoomsPage';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function waLink(tenant) {
  const phone = tenant.phone.replace(/\D/g, '');
  const msg = `Hi ${tenant.name}, rent reminder for Room ${tenant.roomNumber} Bed ${tenant.bedNumber}. Monthly rent ${fmt(tenant.monthlyRent)} is unpaid. Please pay at your earliest.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

const emptyForm = { name: '', phone: '', propertyId: '', roomId: '', bedId: '', monthlyRent: '', joinDate: new Date().toISOString().slice(0, 10) };

// ─── tiny primitives ─────────────────────────────────────────────────────────

function Label({ children, className = '' }) {
  return <span className={`text-2xs font-semibold uppercase tracking-widest text-slate2 ${className}`}>{children}</span>;
}

function Card({ children, className = '' }) {
  return <div className={`rounded-xl bg-white shadow-card border border-border ${className}`}>{children}</div>;
}

function Btn({ children, className = '', ...props }) {
  return (
    <button type="button" className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${className}`} {...props}>
      {children}
    </button>
  );
}

// ─── stat strip ──────────────────────────────────────────────────────────────

function StatStrip({ tenants, totalBeds }) {
  const occupied = tenants.length;
  const available = Math.max(totalBeds - occupied, 0);
  const unpaid = tenants.filter(t => t.paymentStatus === 'Unpaid').length;
  const revenue = tenants.reduce((s, t) => s + Number(t.monthlyRent || 0), 0);
  const pct = totalBeds ? Math.round((occupied / totalBeds) * 100) : 0;

  const stats = [
    { label: 'Occupied', value: occupied, sub: `${pct}%`, color: 'text-leaf' },
    { label: 'Available', value: available, sub: `of ${totalBeds}`, color: 'text-amber' },
    { label: 'Unpaid', value: unpaid, sub: 'this month', color: unpaid > 0 ? 'text-coral' : 'text-leaf' },
    { label: 'Rent Roll', value: fmt(revenue), sub: '/month', color: 'text-ink' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(s => (
        <Card key={s.label} className="p-4">
          <Label>{s.label}</Label>
          <p className={`mt-1.5 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          <p className="mt-0.5 text-xs text-slate2">{s.sub}</p>
        </Card>
      ))}
    </div>
  );
}

// ─── bed grid ────────────────────────────────────────────────────────────────

function BedGrid({ tenants, properties, selectedPropertyId }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPropertyId || !hasSupabaseConfig) return;
    setLoading(true);
    fetchRoomsWithBeds(selectedPropertyId).then(setRooms).finally(() => setLoading(false));
  }, [selectedPropertyId]);

  const occupiedBeds = useMemo(() => new Set(tenants.map(t => t.bedId)), [tenants]);

  if (!selectedPropertyId) return null;
  if (loading) return <Card className="p-4 flex items-center gap-2 text-sm text-slate2"><Loader2 className="h-4 w-4 animate-spin" />Loading bed map…</Card>;

  return (
    <Card className="p-4">
      <Label>Bed map</Label>
      <div className="mt-3 flex flex-col gap-2">
        {rooms.map(room => (
          <div key={room.id} className="flex items-center gap-2">
            <span className="w-10 text-xs font-semibold text-slate2 shrink-0">{room.room_number}</span>
            <div className="flex gap-1.5 flex-wrap">
              {room.beds?.sort((a, b) => Number(a.bed_number) - Number(b.bed_number)).map(bed => {
                const isOccupied = occupiedBeds.has(bed.id) || bed.status === 'occupied';
                return (
                  <div
                    key={bed.id}
                    title={`Room ${room.room_number} · Bed ${bed.bed_number} · ${isOccupied ? 'Occupied' : 'Available'}`}
                    className={`h-6 w-6 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                      isOccupied ? 'bg-ink text-white' : 'bg-leaf/10 text-leaf border border-leaf/30'
                    }`}
                  >
                    {bed.bed_number}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate2">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-ink inline-block" /> Occupied</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-leaf/10 border border-leaf/30 inline-block" /> Available</span>
      </div>
    </Card>
  );
}

// ─── property selector ───────────────────────────────────────────────────────

function PropertyPill({ properties, selectedId, onChange, loading }) {
  if (loading) return <div className="flex items-center gap-1.5 text-xs text-white/60"><Loader2 className="h-3 w-3 animate-spin" />Loading…</div>;
  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={e => onChange(e.target.value)}
        className="appearance-none rounded-lg bg-white/15 pl-3 pr-7 py-1.5 text-sm font-semibold text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
      >
        {properties.map(p => <option key={p.id} value={p.id} className="text-ink bg-white">{p.name}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/70" />
    </div>
  );
}

// ─── header ──────────────────────────────────────────────────────────────────

function Header({ properties, selectedPropertyId, onPropertyChange, loadingProperties }) {
  const prop = properties.find(p => p.id === selectedPropertyId);
  return (
    <header className="bg-ink text-white px-4 pt-5 pb-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label className="text-white/40">StayOps</Label>
            <h1 className="mt-1 text-xl font-bold tracking-tight">{prop?.name ?? 'All Properties'}</h1>
          </div>
          <PropertyPill properties={properties} selectedId={selectedPropertyId} onChange={onPropertyChange} loading={loadingProperties} />
        </div>
      </div>
    </header>
  );
}

// ─── bottom tab bar (mobile) / top nav (desktop) ─────────────────────────────

const PAGES = [
  { id: 'dashboard', label: 'Overview', icon: Home },
  { id: 'rooms',     label: 'Rooms',    icon: BedDouble },
  { id: 'tenants',   label: 'Tenants',  icon: Users },
  { id: 'payments',  label: 'Payments', icon: CreditCard },
];

function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white sm:hidden">
      <div className="grid grid-cols-4">
        {PAGES.map(p => {
          const Icon = p.icon;
          const isActive = active === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`flex flex-col items-center gap-0.5 py-3 text-2xs font-semibold uppercase tracking-widest transition-colors ${isActive ? 'text-ink' : 'text-slate2'}`}
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
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-ink text-ink' : 'border-transparent text-slate2 hover:text-ink'}`}
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
    fetchRoomsWithBeds(propertyId).then(setRooms).catch(console.error).finally(() => setLoadingRooms(false));
  }, [propertyId]);

  const selectedRoom = rooms.find(r => r.id === roomId);
  const availableBeds = selectedRoom?.beds?.filter(b => b.status === 'available') ?? [];

  const selectCls = 'w-full appearance-none rounded-lg border border-border bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink disabled:bg-mist disabled:text-slate2';

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
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
      ].map(field => (
        <label key={field.label} className="block">
          <Label>{field.label}</Label>
          <div className="relative mt-1.5">
            <select required value={field.value} onChange={field.onChange} disabled={field.disabled} className={selectCls}>
              <option value="">{field.placeholder}</option>
              {field.options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate2" />
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── tenant form ─────────────────────────────────────────────────────────────

function TenantForm({ initialTenant, properties, defaultPropertyId, prefill, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (initialTenant) {
      setForm({ name: initialTenant.name, phone: initialTenant.phone, propertyId: initialTenant.propertyId ?? defaultPropertyId ?? '', roomId: initialTenant.roomId ?? '', bedId: initialTenant.bedId ?? '', monthlyRent: initialTenant.monthlyRent, joinDate: initialTenant.joinDate });
    } else if (prefill) {
      setForm({ ...emptyForm, propertyId: prefill.propertyId ?? '', roomId: prefill.roomId ?? '', bedId: prefill.bedId ?? '' });
    } else {
      setForm({ ...emptyForm, propertyId: defaultPropertyId ?? '' });
    }
  }, [initialTenant, defaultPropertyId, prefill]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    await onSubmit({ ...form, monthlyRent: Number(form.monthlyRent) });
    if (!initialTenant) setForm({ ...emptyForm, propertyId: defaultPropertyId ?? '' });
  }

  const inputCls = 'mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink';

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="font-semibold text-ink">{initialTenant ? 'Edit tenant' : 'Add tenant'}</h2>
        {initialTenant
          ? <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate2 hover:bg-mist hover:text-ink"><X className="h-4 w-4" /></button>
          : <Plus className="h-4 w-4 text-slate2" />
        }
      </div>
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Name</Label>
            <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Full name" />
          </label>
          <label className="block">
            <Label>Phone</Label>
            <input required value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="919876543210" />
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
            <input required min="0" type="number" value={form.monthlyRent} onChange={e => set('monthlyRent', e.target.value)} className={inputCls} placeholder="6500" />
          </label>
          <label className="block">
            <Label>Join date</Label>
            <input required type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} className={inputCls} />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3 text-sm font-semibold text-white transition hover:bg-ink/80 disabled:opacity-60 active:scale-[0.98]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {initialTenant ? 'Save changes' : 'Add tenant'}
        </button>
      </form>
    </Card>
  );
}

// ─── tenant card ─────────────────────────────────────────────────────────────

function TenantCard({ tenant, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  const isPaid = tenant.paymentStatus === 'Paid';
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-ink">{tenant.name}</p>
            <p className="text-sm text-slate2">{tenant.phone}</p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPaid ? 'bg-leaf/10 text-leaf' : 'bg-coral/10 text-coral'}`}>
            {tenant.paymentStatus}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-mist p-3">
          <div><Label>Room</Label><p className="mt-0.5 font-semibold tabular-nums">{tenant.roomNumber}</p></div>
          <div><Label>Bed</Label><p className="mt-0.5 font-semibold tabular-nums">{tenant.bedNumber}</p></div>
          <div><Label>Rent</Label><p className="mt-0.5 font-semibold tabular-nums">{fmt(tenant.monthlyRent)}</p></div>
        </div>

        {tenant.paymentDate && (
          <p className="mt-2 text-xs text-slate2">Paid on {tenant.paymentDate}</p>
        )}
      </div>

      <div className="grid grid-cols-4 border-t border-border divide-x divide-border">
        <Btn onClick={() => onEdit(tenant)} className="rounded-none py-2.5 text-slate2 hover:bg-mist hover:text-ink">
          <Pencil className="h-4 w-4" />
        </Btn>
        <Btn onClick={() => (isPaid ? onMarkUnpaid(tenant) : onMarkPaid(tenant))} className={`rounded-none py-2.5 ${isPaid ? 'text-coral hover:bg-coral/5' : 'text-leaf hover:bg-leaf/5'}`}>
          <CheckCircle2 className="h-4 w-4" />
        </Btn>
        <a href={waLink(tenant)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center py-2.5 text-slate2 hover:bg-mist hover:text-ink transition-colors">
          <MessageCircle className="h-4 w-4" />
        </a>
        <Btn onClick={() => onDelete(tenant)} className="rounded-none py-2.5 text-coral hover:bg-coral/5">
          <Trash2 className="h-4 w-4" />
        </Btn>
      </div>
    </Card>
  );
}

// ─── pages ───────────────────────────────────────────────────────────────────

function DashboardPage({ tenants, totalBeds, properties, selectedPropertyId, onGoToPayments }) {
  return (
    <div className="flex flex-col gap-4">
      <StatStrip tenants={tenants} totalBeds={totalBeds} />
      <BedGrid tenants={tenants} properties={properties} selectedPropertyId={selectedPropertyId} />
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <Label>Recent tenants</Label>
          <button type="button" onClick={onGoToPayments} className="text-xs font-semibold text-slate2 hover:text-ink">View payments →</button>
        </div>
        {tenants.length === 0
          ? <p className="px-4 py-6 text-sm text-slate2">No tenants yet. Add one in the Tenants tab.</p>
          : (
            <div className="divide-y divide-border">
              {tenants.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-slate2">Room {t.roomNumber} · Bed {t.bedNumber}</p>
                  </div>
                  <span className={`text-xs font-semibold ${t.paymentStatus === 'Paid' ? 'text-leaf' : 'text-coral'}`}>{t.paymentStatus}</span>
                </div>
              ))}
            </div>
          )
        }
      </Card>
    </div>
  );
}

function TenantsPage({ tenants, properties, defaultPropertyId, editingTenant, saving, roomPrefill, onAddTenant, onUpdateTenant, onCancelEdit, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <TenantForm initialTenant={editingTenant} properties={properties} defaultPropertyId={defaultPropertyId} prefill={roomPrefill} onSubmit={editingTenant ? onUpdateTenant : onAddTenant} onCancel={onCancelEdit} saving={saving} />
      <div className="flex flex-col gap-3">
        {tenants.length === 0
          ? <Card className="p-8 text-center text-sm text-slate2">No tenants yet.</Card>
          : tenants.map(t => <TenantCard key={t.id} tenant={t} onEdit={onEdit} onDelete={onDelete} onMarkPaid={onMarkPaid} onMarkUnpaid={onMarkUnpaid} />)
        }
      </div>
    </div>
  );
}

function PaymentsPage({ tenants, onMarkPaid, onMarkUnpaid }) {
  const unpaid = tenants.filter(t => t.paymentStatus === 'Unpaid');
  const pendingAmt = unpaid.reduce((s, t) => s + Number(t.monthlyRent || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <Label>Paid</Label>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-leaf">{tenants.length - unpaid.length}</p>
        </Card>
        <Card className="p-4">
          <Label>Unpaid</Label>
          <p className={`mt-1.5 text-2xl font-bold tabular-nums ${unpaid.length > 0 ? 'text-coral' : 'text-leaf'}`}>{unpaid.length}</p>
        </Card>
        <Card className="p-4">
          <Label>Pending</Label>
          <p className="mt-1.5 text-lg font-bold tabular-nums text-amber">{fmt(pendingAmt)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <Label>All tenants</Label>
        </div>
        <div className="divide-y divide-border">
          {tenants.length === 0
            ? <p className="px-4 py-6 text-sm text-slate2">No payment records yet.</p>
            : tenants.map(t => {
              const isPaid = t.paymentStatus === 'Paid';
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{t.name}</p>
                    <p className="text-xs text-slate2">Room {t.roomNumber} · Bed {t.bedNumber} · {fmt(t.monthlyRent)}</p>
                    {t.paymentDate && <p className="text-xs text-slate2">Paid {t.paymentDate}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Btn
                      onClick={() => isPaid ? onMarkUnpaid(t) : onMarkPaid(t)}
                      className={`text-xs ${isPaid ? 'bg-coral/10 text-coral hover:bg-coral/20' : 'bg-leaf/10 text-leaf hover:bg-leaf/20'}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isPaid ? 'Unpaid' : 'Paid'}
                    </Btn>
                    <a href={waLink(t)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-slate2 hover:text-ink transition-colors">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          }
        </div>
      </Card>
    </div>
  );
}

// ─── root ────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
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
          setSelectedPropertyId(valid ? saved : data[0].id);
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingProperties(false));
  }, []);

  useEffect(() => {
    if (selectedPropertyId) localStorage.setItem('stayops_property', selectedPropertyId);
    setLoading(true);
    fetchTenants(selectedPropertyId || null)
      .then(setTenants)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedPropertyId]);

  const totalBeds = useMemo(() => {
    if (selectedPropertyId) return properties.find(p => p.id === selectedPropertyId)?.total_beds ?? 0;
    return properties.reduce((s, p) => s + (p.total_beds ?? 0), 0);
  }, [properties, selectedPropertyId]);

  async function handleAdd(tenant) {
    setSaving(true); setError('');
    try { const c = await createTenant({ ...tenant, paymentStatus: 'Unpaid', paymentDate: '' }); setTenants(cur => [c, ...cur]); }
    catch (e) { setError(e.message); }
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
    } catch (e) { setError(e.message); }
  }

  async function patchPayment(tenant, status) {
    try {
      const u = await updateTenant(tenant.id, { paymentStatus: status, paymentDate: status === 'Paid' ? new Date().toISOString().slice(0, 10) : '' });
      setTenants(cur => cur.map(t => t.id === tenant.id ? u : t));
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="min-h-screen bg-mist pb-20 sm:pb-0">
      <Header properties={properties} selectedPropertyId={selectedPropertyId} onPropertyChange={setSelectedPropertyId} loadingProperties={loadingProperties} />
      <TopNav active={page} onChange={setPage} />

      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        {error && (
          <div className="mb-4 rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral flex items-start justify-between gap-3">
            {error}
            <button type="button" onClick={() => setError('')}><X className="h-4 w-4 shrink-0" /></button>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate2" />
          </div>
        ) : (
          <>
            {page === 'dashboard' && <DashboardPage tenants={tenants} totalBeds={totalBeds} properties={properties} selectedPropertyId={selectedPropertyId} onGoToPayments={() => setPage('payments')} />}
            {page === 'rooms' && (
              <RoomsPage
                selectedPropertyId={selectedPropertyId}
                onAssignBed={(prefill) => { setRoomPrefill(prefill); setPage('tenants'); }}
              />
            )}
            {page === 'tenants' && (
              <TenantsPage
                tenants={tenants} properties={properties} defaultPropertyId={selectedPropertyId}
                editingTenant={editingTenant} saving={saving}
                roomPrefill={roomPrefill}
                onAddTenant={(t) => { handleAdd(t); setRoomPrefill(null); }}
                onUpdateTenant={handleUpdate}
                onCancelEdit={() => setEditingTenant(null)}
                onEdit={t => { setEditingTenant(t); setPage('tenants'); }}
                onDelete={handleDelete}
                onMarkPaid={t => patchPayment(t, 'Paid')}
                onMarkUnpaid={t => patchPayment(t, 'Unpaid')}
              />
            )}
            {page === 'payments' && <PaymentsPage tenants={tenants} onMarkPaid={t => patchPayment(t, 'Paid')} onMarkUnpaid={t => patchPayment(t, 'Unpaid')} />}
          </>
        )}
      </main>

      <BottomNav active={page} onChange={setPage} />
    </div>
  );
}