import { useEffect, useMemo, useState } from 'react';
import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
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
import {
  createTenant,
  deleteTenant,
  fetchTenants,
  updateTenant,
} from './services/tenantService';
import { hasSupabaseConfig } from './lib/supabase';

const TOTAL_BEDS = 24;
const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

const emptyForm = {
  name: '',
  phone: '',
  roomNumber: '',
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
  const message = `Hi ${tenant.name}, this is a rent reminder for room ${tenant.roomNumber}. Your monthly rent of ${formatCurrency(
    tenant.monthlyRent,
  )} is currently unpaid. Please pay at your earliest convenience.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function AppShell({ activePage, onPageChange, children }) {
  return (
    <main className="min-h-screen bg-mist text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-lg bg-ink p-5 text-white shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">StayB</p>
              <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Hostel Management</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                A lean MVP for tenants, rent tracking, vacancies, and WhatsApp reminders.
              </p>
            </div>
            <div className="rounded-md bg-white/10 px-3 py-2 text-sm text-slate-100">
              {hasSupabaseConfig ? 'Supabase connected' : 'Local storage mode'}
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
                    isActive
                      ? 'bg-white text-ink'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
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

function TenantForm({ initialTenant, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(
      initialTenant
        ? {
            name: initialTenant.name,
            phone: initialTenant.phone,
            roomNumber: initialTenant.roomNumber,
            monthlyRent: initialTenant.monthlyRent,
            joinDate: initialTenant.joinDate,
          }
        : emptyForm,
    );
  }, [initialTenant]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({
      ...form,
      monthlyRent: Number(form.monthlyRent),
    });

    if (!initialTenant) setForm(emptyForm);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            {initialTenant ? 'Edit Tenant' : 'Add Tenant'}
          </h2>
          <p className="text-sm text-slate-500">Name, phone, room, rent, and join date.</p>
        </div>
        {initialTenant ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-ink"
            aria-label="Cancel edit"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <Plus className="h-5 w-5 text-leaf" aria-hidden="true" />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Name
          <input
            required
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            placeholder="Tenant name"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            required
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            placeholder="919876543210"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Room Number
          <input
            required
            value={form.roomNumber}
            onChange={(event) => updateField('roomNumber', event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            placeholder="101-A"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Monthly Rent
          <input
            required
            min="0"
            type="number"
            value={form.monthlyRent}
            onChange={(event) => updateField('monthlyRent', event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            placeholder="6500"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Join Date
          <input
            required
            type="date"
            value={form.joinDate}
            onChange={(event) => updateField('joinDate', event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-leaf px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
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
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <span>
              <span className="block text-slate-500">Room</span>
              <span className="font-medium text-slate-800">{tenant.roomNumber}</span>
            </span>
            <span>
              <span className="block text-slate-500">Rent</span>
              <span className="font-medium text-slate-800">{formatCurrency(tenant.monthlyRent)}</span>
            </span>
            <span>
              <span className="block text-slate-500">Join Date</span>
              <span className="font-medium text-slate-800">{tenant.joinDate}</span>
            </span>
            <span>
              <span className="block text-slate-500">Payment</span>
              <span className={isPaid ? 'font-medium text-leaf' : 'font-medium text-coral'}>
                {tenant.paymentStatus}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <button
            type="button"
            onClick={() => onEdit(tenant)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-leaf hover:text-leaf"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => (isPaid ? onMarkUnpaid(tenant) : onMarkPaid(tenant))}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
              isPaid
                ? 'bg-red-50 text-coral hover:bg-red-100'
                : 'bg-emerald-50 text-leaf hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
          </button>
          <a
            href={reminderLink(tenant)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-leaf hover:text-leaf"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Remind
          </a>
          <button
            type="button"
            onClick={() => onDelete(tenant)}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-coral hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Vacate
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {tenant.paymentDate ? `Payment date: ${tenant.paymentDate}` : 'Payment date: not recorded'}
      </p>
    </article>
  );
}

function DashboardPage({ tenants, stats, onGoToPayments }) {
  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard cards">
        <StatCard icon={Users} label="Total Tenants" value={stats.totalTenants} tone="bg-emerald-50 text-leaf" />
        <StatCard icon={BedDouble} label="Occupied Beds" value={stats.occupiedBeds} tone="bg-sky-50 text-sky-700" />
        <StatCard icon={BedDouble} label="Available Beds" value={stats.availableBeds} tone="bg-amber-50 text-amber-700" />
        <StatCard icon={CalendarDays} label="Unpaid Rents" value={stats.unpaidRents} tone="bg-red-50 text-coral" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Vacancy Tracking</h2>
              <p className="text-sm text-slate-500">{stats.occupiedBeds} occupied out of {TOTAL_BEDS} beds.</p>
            </div>
            <BedDouble className="h-5 w-5 text-leaf" aria-hidden="true" />
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-leaf"
              style={{ width: `${Math.min((stats.occupiedBeds / TOTAL_BEDS) * 100, 100)}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-sm text-slate-500">Occupied Beds</p>
              <p className="text-xl font-semibold">{stats.occupiedBeds}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-sm text-slate-500">Available Beds</p>
              <p className="text-xl font-semibold">{stats.availableBeds}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Rent Overview</h2>
          <p className="mt-1 text-sm text-slate-500">Monthly rent roll and pending collections.</p>
          <p className="mt-5 text-3xl font-semibold text-ink">{formatCurrency(stats.monthlyRevenue)}</p>
          <p className="mt-1 text-sm text-slate-500">Total monthly rent</p>
          <button
            type="button"
            onClick={onGoToPayments}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            View Payments
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">Recent Tenants</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tenants.slice(0, 3).map((tenant) => (
            <div key={tenant.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-semibold text-ink">{tenant.name}</p>
              <p className="text-sm text-slate-500">Room {tenant.roomNumber}</p>
              <p className={tenant.paymentStatus === 'Paid' ? 'mt-2 text-sm font-medium text-leaf' : 'mt-2 text-sm font-medium text-coral'}>
                {tenant.paymentStatus}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TenantsPage(props) {
  const {
    tenants,
    editingTenant,
    saving,
    onAddTenant,
    onUpdateTenant,
    onCancelEdit,
    onEdit,
    onDelete,
    onMarkPaid,
    onMarkUnpaid,
  } = props;

  return (
    <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <TenantForm
        initialTenant={editingTenant}
        onSubmit={editingTenant ? onUpdateTenant : onAddTenant}
        onCancel={onCancelEdit}
        saving={saving}
      />
      <div className="flex flex-col gap-3">
        {tenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            onEdit={onEdit}
            onDelete={onDelete}
            onMarkPaid={onMarkPaid}
            onMarkUnpaid={onMarkUnpaid}
          />
        ))}
        {tenants.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-soft">
            No tenants added yet.
          </div>
        )}
      </div>
    </section>
  );
}

function PaymentsPage({ tenants, onMarkPaid, onMarkUnpaid }) {
  const unpaidTenants = tenants.filter((tenant) => tenant.paymentStatus === 'Unpaid');

  return (
    <section className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={CreditCard} label="Paid Rents" value={tenants.length - unpaidTenants.length} tone="bg-emerald-50 text-leaf" />
        <StatCard icon={CalendarDays} label="Unpaid Rents" value={unpaidTenants.length} tone="bg-red-50 text-coral" />
        <StatCard
          icon={IndianRupee}
          label="Pending Amount"
          value={formatCurrency(unpaidTenants.reduce((sum, tenant) => sum + Number(tenant.monthlyRent || 0), 0))}
          tone="bg-amber-50 text-amber-700"
        />
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
                  <p className="text-sm text-slate-500">Room {tenant.roomNumber} • {formatCurrency(tenant.monthlyRent)}</p>
                </div>
                <div>
                  <p className={isPaid ? 'font-semibold text-leaf' : 'font-semibold text-coral'}>
                    {tenant.paymentStatus}
                  </p>
                  <p className="text-xs text-slate-500">
                    {tenant.paymentDate ? `Payment date: ${tenant.paymentDate}` : 'Payment date: not recorded'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => (isPaid ? onMarkUnpaid(tenant) : onMarkPaid(tenant))}
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                      isPaid
                        ? 'bg-red-50 text-coral hover:bg-red-100'
                        : 'bg-emerald-50 text-leaf hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                  </button>
                  <a
                    href={reminderLink(tenant)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:border-leaf hover:text-leaf"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Remind
                  </a>
                </div>
              </div>
            );
          })}
          {tenants.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">No payment records yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [tenants, setTenants] = useState([]);
  const [editingTenant, setEditingTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const totalTenants = tenants.length;
    const occupiedBeds = tenants.length;
    const availableBeds = Math.max(TOTAL_BEDS - occupiedBeds, 0);
    const unpaidRents = tenants.filter((tenant) => tenant.paymentStatus === 'Unpaid').length;
    const monthlyRevenue = tenants.reduce((sum, tenant) => sum + Number(tenant.monthlyRent || 0), 0);

    return { totalTenants, occupiedBeds, availableBeds, unpaidRents, monthlyRevenue };
  }, [tenants]);

  useEffect(() => {
    fetchTenants()
      .then(setTenants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddTenant(tenant) {
    setSaving(true);
    setError('');

    try {
      const created = await createTenant({
        ...tenant,
        paymentStatus: 'Unpaid',
        paymentDate: '',
      });
      setTenants((current) => [created, ...current]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTenant(tenant) {
    setSaving(true);
    setError('');

    try {
      const updated = await updateTenant(editingTenant.id, tenant);
      setTenants((current) => current.map((item) => (item.id === editingTenant.id ? updated : item)));
      setEditingTenant(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTenant(tenant) {
    setError('');

    try {
      await deleteTenant(tenant.id);
      setTenants((current) => current.filter((item) => item.id !== tenant.id));
      if (editingTenant?.id === tenant.id) setEditingTenant(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function patchPayment(tenant, paymentStatus) {
    const patch = {
      paymentStatus,
      paymentDate: paymentStatus === 'Paid' ? new Date().toISOString().slice(0, 10) : '',
    };

    try {
      const updated = await updateTenant(tenant.id, patch);
      setTenants((current) => current.map((item) => (item.id === tenant.id ? updated : item)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell activePage={activePage} onPageChange={setActivePage}>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-soft">
          <Loader2 className="h-6 w-6 animate-spin text-leaf" aria-label="Loading tenants" />
        </div>
      ) : (
        <>
          {activePage === 'dashboard' && (
            <DashboardPage
              tenants={tenants}
              stats={stats}
              onGoToPayments={() => setActivePage('payments')}
            />
          )}
          {activePage === 'tenants' && (
            <TenantsPage
              tenants={tenants}
              editingTenant={editingTenant}
              saving={saving}
              onAddTenant={handleAddTenant}
              onUpdateTenant={handleUpdateTenant}
              onCancelEdit={() => setEditingTenant(null)}
              onEdit={(tenant) => {
                setEditingTenant(tenant);
                setActivePage('tenants');
              }}
              onDelete={handleDeleteTenant}
              onMarkPaid={(tenant) => patchPayment(tenant, 'Paid')}
              onMarkUnpaid={(tenant) => patchPayment(tenant, 'Unpaid')}
            />
          )}
          {activePage === 'payments' && (
            <PaymentsPage
              tenants={tenants}
              onMarkPaid={(tenant) => patchPayment(tenant, 'Paid')}
              onMarkUnpaid={(tenant) => patchPayment(tenant, 'Unpaid')}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
