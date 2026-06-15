import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Home,
  IndianRupee,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { createTenant, deleteTenant, fetchTenants, updateTenant } from './services/tenantService';
import { fetchProperties, fetchRoomsWithBeds } from './services/propertyService';
import { hasSupabaseConfig } from './lib/supabase';

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

const emptyForm = {
  name: '',
  phone: '',
  propertyId: '',
  roomId: '',
  bedId: '',
  monthlyRent: '',
  joinDate: new Date().toISOString().slice(0, 10),
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function reminderLink(tenant) {
  const phone = tenant.phone.replace(/\D/g, '');
  const message = `Hi ${tenant.name}, this is a rent reminder for room ${tenant.roomNumber} bed ${tenant.bedNumber}. Your monthly rent of ${formatCurrency(tenant.monthlyRent)} is currently unpaid. Please pay at your earliest convenience.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Property selector in header
function PropertySelector({ properties, selectedId, onChange, loading }) {
  if (loading) return <div className="flex items-center gap-2 text-sm text-slate-300"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>;

  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-md bg-white/10 pl-3 pr-8 py-2 text-sm text-slate-100 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
      >
        <option value="" className="text-ink bg-white">All Properties</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id} className="text-ink bg-white">{p.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
    </div>
  );
}

function AppShell({ activePage, onPageChange, properties, selectedPropertyId, onPropertyChange, loadingProperties, children }) {
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  return (
    <main className="min-h-screen bg-mist text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-lg bg-ink p-5 text-white shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">StayOps</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
                {selectedProperty ? selectedProperty.name : 'All Properties'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Hostel management — tenants, beds, rent, and WhatsApp reminders.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <PropertySelector
                properties={properties}
                selectedId={selectedPropertyId}
                onChange={onPropertyChange}
                loading={loadingProperties}
              />
              <div className="rounded-md bg-white/10 px-3 py-2 text-sm text-slate-100">
                {hasSupabaseConfig ? 'Supabase connected' : 'Local mode'}
              </div>
            </div>
          </div>

          <nav className="mt-5 grid gap-2 sm:grid-cols-3" aria-label="Primary navigation">
            {pages.map((page) => {
              const Icon = page.icon;
              const isActive = activePage === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => onPageChange(page.id)}
                  className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                    isActive ? 'bg-white text-ink' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {page.label}
                </button>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <div className={`rounded-md p-3 ${tone}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// Bed/Room selector component
function BedSelector({ properties, selectedPropertyId, roomId, bedId, onPropertyChange, onRoomChange, onBedChange, excludeTenantId }) {
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (!selectedPropertyId) { setRooms([]); return; }
    setLoadingRooms(true);
    fetchRoomsWithBeds(selectedPropertyId)
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoadingRooms(false));
  }, [selectedPropertyId]);

  const selectedRoom = rooms.find(r => r.id === roomId);
  const availableBeds = selectedRoom?.beds?.filter(b => b.status === 'available') ?? [];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm font-medium text-slate-700">
        Property
        <div className="relative mt-1">
          <select
            required
            value={selectedPropertyId}
            onChange={(e) => { onPropertyChange(e.target.value); onRoomChange(''); onBedChange(''); }}
            className="w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-8 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          >
            <option value="">Select property</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </label>

      <label className="text-sm font-medium text-slate-700">
        Room
        <div className="relative mt-1">
          <select
            required
            value={roomId}
            onChange={(e) => { onRoomChange(e.target.value); onBedChange(''); }}
            disabled={!selectedPropertyId || loadingRooms}
            className="w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-8 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">{loadingRooms ? 'Loading...' : 'Select room'}</option>
            {rooms.map(r => {
              const available = r.beds?.filter(b => b.status === 'available').length ?? 0;
              return <option key={r.id} value={r.id} disabled={available === 0}>Room {r.room_number} ({available} free)</option>;
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </label>

      <label className="text-sm font-medium text-slate-700">
        Bed
        <div className="relative mt-1">
          <select
            required
            value={bedId}
            onChange={(e) => onBedChange(e.target.value)}
            disabled={!roomId}
            className="w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-8 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">Select bed</option>
            {availableBeds.map(b => <option key={b.id} value={b.id}>Bed {b.bed_number}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        </div>
      </label>
    </div>
  );
}

function TenantForm({ initialTenant, properties, defaultPropertyId, onSubmit, onCancel, saving }) {
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
      });
    } else {
      setForm({ ...emptyForm, propertyId: defaultPropertyId ?? '' });
    }
  }, [initialTenant, defaultPropertyId]);

  function updateField(field, value) {
    setForm((cur) => ({ ...cur, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ ...form, monthlyRent: Number(form.monthlyRent) });
    if (!initialTenant) setForm({ ...emptyForm, propertyId: defaultPropertyId ?? '' });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">{initialTenant ? 'Edit Tenant' : 'Add Tenant'}</h2>
          <p className="text-sm text-slate-500">Fill in all fields to assign a bed.</p>
        </div>
        {initialTenant ? (
          <button type="button" onClick={onCancel} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        ) : (
          <Plus className="h-5 w-5 text-leaf" />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Name
          <input
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            placeholder="Tenant name"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            required
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            placeholder="919876543210"
          />
        </label>
      </div>

      <div className="mt-3">
        <BedSelector
          properties={properties}
          selectedPropertyId={form.propertyId}
          roomId={form.roomId}
          bedId={form.bedId}
          onPropertyChange={(v) => updateField('propertyId', v)}
          onRoomChange={(v) => updateField('roomId', v)}
          onBedChange={(v) => updateField('bedId', v)}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Monthly Rent
          <input
            required
            min="0"
            type="number"
            value={form.monthlyRent}
            onChange={(e) => updateField('monthlyRent', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            placeholder="6500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Join Date
          <input
            required
            type="date"
            value={form.joinDate}
            onChange={(e) => updateField('joinDate', e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-leaf px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {initialTenant ? 'Save Tenant' : 'Add Tenant'}
      </button>
    </form>
  );
}

function TenantCard({ tenant, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  const isPaid = tenant.paymentStatus === 'Paid';
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ink">{tenant.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{tenant.phone}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            <span><span className="block text-slate-500">Room</span><span className="font-medium text-slate-800">{tenant.roomNumber}</span></span>
            <span><span className="block text-slate-500">Bed</span><span className="font-medium text-slate-800">{tenant.bedNumber}</span></span>
            <span><span className="block text-slate-500">Rent</span><span className="font-medium text-slate-800">{formatCurrency(tenant.monthlyRent)}</span></span>
            <span><span className="block text-slate-500">Joined</span><span className="font-medium text-slate-800">{tenant.joinDate}</span></span>
            <span><span className="block text-slate-500">Payment</span><span className={isPaid ? 'font-medium text-leaf' : 'font-medium text-coral'}>{tenant.paymentStatus}</span></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <button type="button" onClick={() => onEdit(tenant)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-leaf hover:text-leaf">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => (isPaid ? onMarkUnpaid(tenant) : onMarkPaid(tenant))}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isPaid ? 'bg-red-50 text-coral hover:bg-red-100' : 'bg-emerald-50 text-leaf hover:bg-emerald-100'}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
          </button>
          <a href={reminderLink(tenant)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-leaf hover:text-leaf">
            <MessageCircle className="h-4 w-4" /> Remind
          </a>
          <button type="button" onClick={() => onDelete(tenant)} className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-coral hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Vacate
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {tenant.paymentDate ? `Payment date: ${tenant.paymentDate}` : 'Payment date: not recorded'}
      </p>
    </article>
  );
}

function DashboardPage({ tenants, totalBeds, onGoToPayments }) {
  const stats = useMemo(() => {
    const occupiedBeds = tenants.length;
    const availableBeds = Math.max(totalBeds - occupiedBeds, 0);
    const unpaidRents = tenants.filter(t => t.paymentStatus === 'Unpaid').length;
    const monthlyRevenue = tenants.reduce((sum, t) => sum + Number(t.monthlyRent || 0), 0);
    return { occupiedBeds, availableBeds, unpaidRents, monthlyRevenue };
  }, [tenants, totalBeds]);

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Tenants" value={tenants.length} tone="bg-emerald-50 text-leaf" />
        <StatCard icon={BedDouble} label="Occupied Beds" value={stats.occupiedBeds} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={BedDouble} label="Available Beds" value={stats.availableBeds} tone="bg-amber-50 text-amber-700" />
        <StatCard icon={CalendarDays} label="Unpaid Rents" value={stats.unpaidRents} tone="bg-red-50 text-coral" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Vacancy Tracking</h2>
              <p className="text-sm text-slate-500">{stats.occupiedBeds} occupied out of {totalBeds} beds.</p>
            </div>
            <BedDouble className="h-5 w-5 text-leaf" />
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-leaf" style={{ width: `${totalBeds ? Math.min((stats.occupiedBeds / totalBeds) * 100, 100) : 0}%` }} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-3"><p className="text-sm text-slate-500">Occupied</p><p className="text-xl font-semibold">{stats.occupiedBeds}</p></div>
            <div className="rounded-md bg-slate-50 p-3"><p className="text-sm text-slate-500">Available</p><p className="text-xl font-semibold">{stats.availableBeds}</p></div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Rent Overview</h2>
          <p className="mt-1 text-sm text-slate-500">Monthly rent roll and pending collections.</p>
          <p className="mt-5 text-3xl font-semibold text-ink">{formatCurrency(stats.monthlyRevenue)}</p>
          <p className="mt-1 text-sm text-slate-500">Total monthly rent</p>
          <button type="button" onClick={onGoToPayments} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
            <CreditCard className="h-4 w-4" /> View Payments
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Recent Tenants</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tenants.slice(0, 3).map((tenant) => (
            <div key={tenant.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-semibold text-ink">{tenant.name}</p>
              <p className="text-sm text-slate-500">Room {tenant.roomNumber} · Bed {tenant.bedNumber}</p>
              <p className={tenant.paymentStatus === 'Paid' ? 'mt-2 text-sm font-medium text-leaf' : 'mt-2 text-sm font-medium text-coral'}>{tenant.paymentStatus}</p>
            </div>
          ))}
          {tenants.length === 0 && <p className="text-sm text-slate-500">No tenants yet.</p>}
        </div>
      </section>
    </div>
  );
}

function TenantsPage({ tenants, properties, defaultPropertyId, editingTenant, saving, onAddTenant, onUpdateTenant, onCancelEdit, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[400px_1fr]">
      <TenantForm
        initialTenant={editingTenant}
        properties={properties}
        defaultPropertyId={defaultPropertyId}
        onSubmit={editingTenant ? onUpdateTenant : onAddTenant}
        onCancel={onCancelEdit}
        saving={saving}
      />
      <div className="flex flex-col gap-3">
        {tenants.map((tenant) => (
          <TenantCard key={tenant.id} tenant={tenant} onEdit={onEdit} onDelete={onDelete} onMarkPaid={onMarkPaid} onMarkUnpaid={onMarkUnpaid} />
        ))}
        {tenants.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-soft">No tenants yet.</div>
        )}
      </div>
    </section>
  );
}

function PaymentsPage({ tenants, onMarkPaid, onMarkUnpaid }) {
  const unpaidTenants = tenants.filter(t => t.paymentStatus === 'Unpaid');
  return (
    <section className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CreditCard} label="Paid Rents" value={tenants.length - unpaidTenants.length} tone="bg-emerald-50 text-leaf" />
        <StatCard icon={CalendarDays} label="Unpaid Rents" value={unpaidTenants.length} tone="bg-red-50 text-coral" />
        <StatCard icon={IndianRupee} label="Pending Amount" value={formatCurrency(unpaidTenants.reduce((sum, t) => sum + Number(t.monthlyRent || 0), 0))} tone="bg-amber-50 text-amber-700" />
      </div>
      <div className="rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-ink">Payment Tracking</h2>
          <p className="text-sm text-slate-500">Mark rent paid or unpaid and send reminders.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {tenants.map((tenant) => {
            const isPaid = tenant.paymentStatus === 'Paid';
            return (
              <div key={tenant.id} className="grid gap-4 p-4 md:grid-cols-[1.3fr_1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold text-ink">{tenant.name}</p>
                  <p className="text-sm text-slate-500">Room {tenant.roomNumber} · Bed {tenant.bedNumber} · {formatCurrency(tenant.monthlyRent)}</p>
                </div>
                <div>
                  <p className={isPaid ? 'font-semibold text-leaf' : 'font-semibold text-coral'}>{tenant.paymentStatus}</p>
                  <p className="text-xs text-slate-500">{tenant.paymentDate ? `Paid: ${tenant.paymentDate}` : 'Not recorded'}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button type="button" onClick={() => (isPaid ? onMarkUnpaid(tenant) : onMarkPaid(tenant))} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${isPaid ? 'bg-red-50 text-coral hover:bg-red-100' : 'bg-emerald-50 text-leaf hover:bg-emerald-100'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                  </button>
                  <a href={reminderLink(tenant)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-leaf hover:text-leaf">
                    <MessageCircle className="h-4 w-4" /> Remind
                  </a>
                </div>
              </div>
            );
          })}
          {tenants.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No payment records yet.</div>}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [editingTenant, setEditingTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load properties once
  useEffect(() => {
    if (!hasSupabaseConfig) { setLoadingProperties(false); return; }
    fetchProperties()
      .then((data) => {
        setProperties(data);
        if (data.length > 0) setSelectedPropertyId(data[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingProperties(false));
  }, []);

  // Load tenants when property changes
  useEffect(() => {
    setLoading(true);
    fetchTenants(selectedPropertyId || null)
      .then(setTenants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedPropertyId]);

  const totalBeds = useMemo(() => {
    if (selectedPropertyId) {
      return properties.find(p => p.id === selectedPropertyId)?.total_beds ?? 0;
    }
    return properties.reduce((sum, p) => sum + (p.total_beds ?? 0), 0);
  }, [properties, selectedPropertyId]);

  async function handleAddTenant(tenant) {
    setSaving(true); setError('');
    try {
      const created = await createTenant({ ...tenant, paymentStatus: 'Unpaid', paymentDate: '' });
      setTenants((cur) => [created, ...cur]);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleUpdateTenant(tenant) {
    setSaving(true); setError('');
    try {
      const updated = await updateTenant(editingTenant.id, tenant);
      setTenants((cur) => cur.map((t) => (t.id === editingTenant.id ? updated : t)));
      setEditingTenant(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDeleteTenant(tenant) {
    setError('');
    try {
      await deleteTenant(tenant.id);
      setTenants((cur) => cur.filter((t) => t.id !== tenant.id));
      if (editingTenant?.id === tenant.id) setEditingTenant(null);
    } catch (err) { setError(err.message); }
  }

  async function patchPayment(tenant, paymentStatus) {
    const patch = { paymentStatus, paymentDate: paymentStatus === 'Paid' ? new Date().toISOString().slice(0, 10) : '' };
    try {
      const updated = await updateTenant(tenant.id, patch);
      setTenants((cur) => cur.map((t) => (t.id === tenant.id ? updated : t)));
    } catch (err) { setError(err.message); }
  }

  return (
    <AppShell
      activePage={activePage}
      onPageChange={setActivePage}
      properties={properties}
      selectedPropertyId={selectedPropertyId}
      onPropertyChange={setSelectedPropertyId}
      loadingProperties={loadingProperties}
    >
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-soft">
          <Loader2 className="h-6 w-6 animate-spin text-leaf" />
        </div>
      ) : (
        <>
          {activePage === 'dashboard' && (
            <DashboardPage tenants={tenants} totalBeds={totalBeds} onGoToPayments={() => setActivePage('payments')} />
          )}
          {activePage === 'tenants' && (
            <TenantsPage
              tenants={tenants}
              properties={properties}
              defaultPropertyId={selectedPropertyId}
              editingTenant={editingTenant}
              saving={saving}
              onAddTenant={handleAddTenant}
              onUpdateTenant={handleUpdateTenant}
              onCancelEdit={() => setEditingTenant(null)}
              onEdit={(tenant) => { setEditingTenant(tenant); setActivePage('tenants'); }}
              onDelete={handleDeleteTenant}
              onMarkPaid={(t) => patchPayment(t, 'Paid')}
              onMarkUnpaid={(t) => patchPayment(t, 'Unpaid')}
            />
          )}
          {activePage === 'payments' && (
            <PaymentsPage
              tenants={tenants}
              onMarkPaid={(t) => patchPayment(t, 'Paid')}
              onMarkUnpaid={(t) => patchPayment(t, 'Unpaid')}
            />
          )}
        </>
      )}
    </AppShell>
  );
}