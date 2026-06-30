// ─── Finance Page ─────────────────────────────────────────────────────────────
// Four sub-tabs: Rent | Expenses | P&L | Cashflow
// This is the primary decision-making module for hostel operators.

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Plus, Trash2,
  Loader2, CreditCard, TrendingUp, TrendingDown, Calendar,
  AlertCircle, ArrowDownCircle, ArrowUpCircle, Camera, User, Link2,
} from 'lucide-react';
import { createPaymentLink } from './services/paymentLinkService';
import {
  fmt, Label, Card, SectionHeader, Btn, IconBtn,
  StatusBadge, WhatsAppLink, StatStrip, EmptyState, CollectModal, MoneyInput,
} from './components/ui';
import {
  ensurePaymentRecords, fetchPaymentRecords,
  markRecordPaid, markRecordUnpaid, syncOccupancyPaymentStatus,
} from './services/paymentService';
import {
  STATUS, computeRecordStatus, recordDaysOverdue, recordDaysUntilDue,
} from './utils/paymentStatus';
import {
  EXPENSE_CATEGORIES, CF_TYPES,
  fetchExpenses, addExpense, deleteExpense,
  fetchCashFlowItems, addCashFlowItem, deleteCashFlowItem,
} from './services/financeService';
import {
  INCOME_CATEGORIES, fetchIncomeRecords, addIncomeRecord, deleteIncomeRecord, uploadIdPhoto,
} from './services/incomeService';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ymNow() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}
function ymPrev(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function ymNext(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function ymLabel(ym) {
  return new Date(ym + '-02').toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function MonthNav({ ym, onChange }) {
  const cur = ymNow();
  return (
    <div className="flex items-center justify-between px-1">
      <IconBtn onClick={() => onChange(ymPrev(ym))}><ChevronLeft className="h-5 w-5" /></IconBtn>
      <span className="font-semibold text-ink tabular-nums">{ymLabel(ym)}</span>
      <IconBtn
        onClick={() => onChange(ymNext(ym))}
        disabled={ym >= cur}
        className="disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight className="h-5 w-5" />
      </IconBtn>
    </div>
  );
}

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { id: 'rent',      label: 'Rent',     short: 'Rent'  },
  { id: 'income',    label: 'Income',   short: 'Income' },
  { id: 'expenses',  label: 'Expenses', short: 'Exp'   },
  { id: 'pl',        label: 'P&L',      short: 'P&L'   },
  { id: 'cashflow',  label: 'Cashflow', short: 'Cash'  },
];

function SubNav({ active, onChange }) {
  return (
    <div className="flex gap-4 border-b border-border px-1">
      {SUB_TABS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`text-sm transition-colors ${
            active === t.id
              ? 'text-green border-b-2 border-green font-semibold pb-2'
              : 'text-slate hover:text-charcoal pb-2'
          }`}
        >
          <span className="sm:hidden">{t.short}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Rent Tab ─────────────────────────────────────────────────────────────────

const STATUS_META = {
  [STATUS.OVERDUE]:  { label: 'Overdue',  bg: 'bg-coral/8',  border: 'border-coral/20',  text: 'text-coral',  dot: 'bg-coral'  },
  [STATUS.DUE_TODAY]:{ label: 'Due Today',bg: 'bg-amber/8',  border: 'border-amber/20',  text: 'text-amber',  dot: 'bg-amber'  },
  [STATUS.DUE_SOON]: { label: 'Due Soon', bg: 'bg-amber/5',  border: 'border-amber/15',  text: 'text-amber',  dot: 'bg-amber/70'},
  [STATUS.PAID]:     { label: 'Paid',     bg: 'bg-leaf/5',   border: 'border-leaf/20',   text: 'text-leaf',   dot: 'bg-leaf'   },
  [STATUS.UPCOMING]: { label: 'New Tenants (Grace Period)', bg: 'bg-mist', border: 'border-border', text: 'text-slate2', dot: 'bg-slate2/40' },
};

function PaymentLinkBtn({ record, onGenerated }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState(record.payment_link ?? null);

  async function handle() {
    if (link) { navigator.clipboard?.writeText(link); return; }
    setBusy(true);
    try {
      const url = await createPaymentLink({
        paymentRecordId: record.id,
        tenantName: record.name,
        phone: record.phone,
        amount: record.amount,
        description: `Monthly rent`,
      });
      setLink(url);
      onGenerated?.(url);
      navigator.clipboard?.writeText(url);
    } catch {
      // Razorpay not configured — silent fail; button stays available
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      title={link ? 'Copy payment link' : 'Generate Razorpay payment link'}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors ${link ? 'bg-leaf/10 text-leaf hover:bg-leaf/20' : 'text-slate2 hover:bg-mist hover:text-ink'}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
      {link ? 'Copy link' : 'Pay link'}
    </button>
  );
}

function RentStatusRow({ r, ym, onMarkPaid, onMarkUnpaid, onViewTenant, upiId, onPaymentLink }) {
  const st = computeRecordStatus(r, ym);
  const daysOd = recordDaysOverdue(r, ym);
  const daysUntil = recordDaysUntilDue(r);

  let statusLine = null;
  if (st === STATUS.OVERDUE) {
    statusLine = <p className="text-xs font-semibold text-coral">{daysOd === 1 ? '1 day overdue' : `${daysOd} days overdue`}</p>;
  } else if (st === STATUS.DUE_TODAY) {
    statusLine = <p className="text-xs font-semibold text-amber">Due today</p>;
  } else if (st === STATUS.DUE_SOON) {
    statusLine = <p className="text-xs text-amber">Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}</p>;
  } else if (st === STATUS.PAID && r.paidAt) {
    statusLine = (
      <p className="text-xs text-slate2">
        {r.amountCollected != null && r.amountCollected !== r.amount
          ? <>{fmt(r.amountCollected)} collected · <span className="text-coral">{fmt(r.amount - r.amountCollected)} deducted</span>{r.deductionReason ? ` · ${r.deductionReason}` : ''}</>
          : `Paid ${String(r.paidAt).slice(0, 10)}`}
      </p>
    );
  } else if (st === STATUS.UPCOMING) {
    statusLine = <p className="text-xs text-slate2">New tenant — first cycle not due yet</p>;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onViewTenant?.(r.tenantId)}
          className="text-sm font-semibold text-ink truncate hover:underline text-left w-full"
        >
          {r.name}
        </button>
        <p className="text-xs text-slate2 tabular-nums">Room {r.roomNumber} · Bed {r.bedNumber} · {fmt(r.amount)}</p>
        {statusLine}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {st !== STATUS.PAID ? (
          <>
            <WhatsAppLink name={r.name} phone={r.phone} roomNumber={r.roomNumber} bedNumber={r.bedNumber} rent={r.amount} label="Remind" upiId={upiId} />
            {onPaymentLink && (
              <PaymentLinkBtn record={r} onGenerated={link => onPaymentLink(r, link)} />
            )}
            <Btn size="sm" variant="filled-success" onClick={() => onMarkPaid(r)}>Mark Paid</Btn>
          </>
        ) : (
          <>
            <StatusBadge status="paid" />
            <Btn size="sm" variant="ghost" onClick={() => onMarkUnpaid(r)}>Undo</Btn>
          </>
        )}
      </div>
    </div>
  );
}

function RentSection({ title, meta, records, ym, onMarkPaid, onMarkUnpaid, onViewTenant, upiId, onPaymentLink }) {
  if (records.length === 0) return null;
  return (
    <div className={`rounded-xl border overflow-hidden ${meta.border}`}>
      <div className={`flex items-center justify-between px-4 py-2.5 ${meta.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          <span className={`text-xs font-bold uppercase tracking-wide ${meta.text}`}>{title}</span>
        </div>
        <span className={`text-xs font-semibold ${meta.text}`}>{records.length}</span>
      </div>
      <div className="divide-y divide-border bg-white">
        {records.map(r => (
          <RentStatusRow key={r.id} r={r} ym={ym} onMarkPaid={onMarkPaid} onMarkUnpaid={onMarkUnpaid} onViewTenant={onViewTenant} upiId={upiId} onPaymentLink={onPaymentLink} />
        ))}
      </div>
    </div>
  );
}

function RentTab({ selectedPropertyId, onViewTenant, upiId }) {
  const cur = ymNow();
  const [ym, setYm] = useState(cur);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collecting, setCollecting] = useState(null);

  useEffect(() => {
    if (!selectedPropertyId) return;
    setLoading(true); setError('');
    ensurePaymentRecords(selectedPropertyId, ym)
      .then(() => fetchPaymentRecords(selectedPropertyId, ym))
      .then(setRecords)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedPropertyId, ym]);

  // Group records by computed status
  const grouped = {
    [STATUS.OVERDUE]:   [],
    [STATUS.DUE_TODAY]: [],
    [STATUS.DUE_SOON]:  [],
    [STATUS.PAID]:      [],
    [STATUS.UPCOMING]:  [],
  };
  for (const r of records) {
    grouped[computeRecordStatus(r, ym)].push(r);
  }
  // Sort overdue: most overdue first
  grouped[STATUS.OVERDUE].sort((a, b) => recordDaysOverdue(b, ym) - recordDaysOverdue(a, ym));

  const paid = grouped[STATUS.PAID];
  const overdue = grouped[STATUS.OVERDUE];
  const dueToday = grouped[STATUS.DUE_TODAY];
  const dueSoon = grouped[STATUS.DUE_SOON];

  const collected = paid.reduce((s, r) => s + (r.amountCollected ?? r.amount), 0);
  const deductions = paid.reduce((s, r) => s + (r.amount - (r.amountCollected ?? r.amount)), 0);
  const pending = [...overdue, ...dueToday, ...dueSoon].reduce((s, r) => s + r.amount, 0);

  async function confirmPaid(amountCollected, deductionReason) {
    const r = collecting;
    setCollecting(null);
    const now = new Date().toISOString();
    setRecords(rs => rs.map(x => x.id === r.id
      ? { ...x, status: 'paid', paidAt: now, amountCollected, deductionReason }
      : x));
    try {
      await markRecordPaid(r.id, amountCollected, deductionReason);
      // Sync occupancy so Dashboard counts stay consistent
      syncOccupancyPaymentStatus(r.tenantId, 'Paid').catch(console.error);
    } catch (err) {
      console.error(err);
      setRecords(rs => rs.map(x => x.id === r.id
        ? { ...x, status: 'unpaid', paidAt: null, amountCollected: null, deductionReason: null }
        : x));
    }
  }

  function handlePaymentLink(record, link) {
    setRecords(rs => rs.map(r => r.id === record.id ? { ...r, payment_link: link } : r));
  }

  async function handleUnpaid(r) {
    setRecords(rs => rs.map(x => x.id === r.id
      ? { ...x, status: 'unpaid', paidAt: null, amountCollected: null, deductionReason: null }
      : x));
    try {
      await markRecordUnpaid(r.id);
      syncOccupancyPaymentStatus(r.tenantId, 'Unpaid').catch(console.error);
    } catch (err) {
      console.error(err);
      setRecords(rs => rs.map(x => x.id === r.id
        ? { ...x, status: 'paid' }
        : x));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <MonthNav ym={ym} onChange={setYm} />

      <StatStrip stats={[
        { label: 'Overdue',   value: overdue.length,   sub: overdue.length > 0 ? 'need collection' : 'none', color: overdue.length > 0 ? 'text-coral' : 'text-leaf' },
        { label: 'Due Today', value: dueToday.length,  sub: dueToday.length > 0 ? 'collect today' : 'none', color: dueToday.length > 0 ? 'text-amber' : 'text-ink'  },
        { label: 'Due Soon',  value: dueSoon.length,   sub: dueSoon.length > 0 ? 'due in 1–3 days' : 'none', color: dueSoon.length > 0 ? 'text-amber' : 'text-ink'  },
        { label: 'Paid',      value: paid.length,      sub: fmt(collected),      color: paid.length > 0 ? 'text-leaf' : 'text-slate2' },
      ]} />

      {deductions > 0 && (
        <div className="rounded-lg bg-white border border-border px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-slate2">Total deductions this month</span>
          <span className="text-sm font-semibold text-coral tabular-nums">−{fmt(deductions)}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
      ) : records.length === 0 ? (
        <Card><EmptyState icon={CreditCard} title="No records for this month" body="Records auto-create when you add tenants. Add your first tenant to start tracking rent." /></Card>
      ) : (
        <>
          <RentSection title="Overdue"   meta={STATUS_META[STATUS.OVERDUE]}   records={overdue}   ym={ym} onMarkPaid={setCollecting} onMarkUnpaid={handleUnpaid} onViewTenant={onViewTenant} upiId={upiId} onPaymentLink={handlePaymentLink} />
          <RentSection title="Due Today" meta={STATUS_META[STATUS.DUE_TODAY]} records={dueToday}  ym={ym} onMarkPaid={setCollecting} onMarkUnpaid={handleUnpaid} onViewTenant={onViewTenant} upiId={upiId} onPaymentLink={handlePaymentLink} />
          <RentSection title="Due Soon"  meta={STATUS_META[STATUS.DUE_SOON]}  records={dueSoon}   ym={ym} onMarkPaid={setCollecting} onMarkUnpaid={handleUnpaid} onViewTenant={onViewTenant} upiId={upiId} onPaymentLink={handlePaymentLink} />
          <RentSection title="Paid"      meta={STATUS_META[STATUS.PAID]}      records={paid}      ym={ym} onMarkPaid={setCollecting} onMarkUnpaid={handleUnpaid} onViewTenant={onViewTenant} upiId={upiId} />
          <RentSection title="New Tenants (Grace Period)" meta={STATUS_META[STATUS.UPCOMING]} records={grouped[STATUS.UPCOMING]} ym={ym} onMarkPaid={setCollecting} onMarkUnpaid={handleUnpaid} onViewTenant={onViewTenant} upiId={upiId} />
        </>
      )}

      {collecting && (
        <CollectModal
          record={collecting}
          onConfirm={confirmPaid}
          onCancel={() => setCollecting(null)}
        />
      )}
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────

const EMPTY_EXPENSE = {
  category: 'building_rent',
  amount: '5000',
  description: '',
  expenseDate: new Date().toISOString().slice(0, 10),
};

function ExpensesTab({ selectedPropertyId }) {
  const [ym, setYm] = useState(ymNow);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchExpenses(selectedPropertyId, ym)
      .then(setExpenses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPropertyId, ym]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.category || !form.amount || !form.expenseDate) return;
    setSaving(true);
    try {
      const item = await addExpense(selectedPropertyId, { ...form, amount: Number(form.amount) });
      setExpenses(prev => [item, ...prev].sort((a, b) => b.expenseDate.localeCompare(a.expenseDate)));
      setForm(EMPTY_EXPENSE);
      setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const catLabel = id => EXPENSE_CATEGORIES.find(c => c.id === id)?.label ?? id;

  const inputCls = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink bg-white';

  return (
    <div className="flex flex-col gap-4">
      <MonthNav ym={ym} onChange={setYm} />

      {/* Stats */}
      {expenses.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <Label>Total Expenses</Label>
            <span className="text-xl font-bold tabular-nums text-coral">{fmt(total)}</span>
          </div>
          {byCategory.length > 0 && (
            <div className="divide-y divide-border">
              {byCategory.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-ink">{cat.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full rounded-full bg-coral/60"
                        style={{ width: `${Math.round((cat.total / total) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-coral w-20 text-right">{fmt(cat.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add button / form */}
      {!showForm ? (
        <Btn variant="secondary" className="w-full justify-center gap-2 py-3" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Add Expense
        </Btn>
      ) : (
        <Card className="overflow-hidden">
          <SectionHeader
            title="Add Expense"
            action={<IconBtn variant="ghost" onClick={() => setShowForm(false)}><ChevronLeft className="h-4 w-4" /></IconBtn>}
          />
          <form onSubmit={handleAdd} className="p-4 flex flex-col gap-3">
            {/* Category chips */}
            <div>
              <Label>Category</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => set('category', cat.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                      form.category === cat.id
                        ? 'bg-ink text-white border-ink'
                        : 'bg-white text-slate2 border-border hover:border-slate2/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <Label>Amount</Label>
                <MoneyInput value={form.amount} onChange={v => set('amount', v)} className="mt-1.5" />
              </label>
              <label className="block">
                <Label>Date</Label>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={e => set('expenseDate', e.target.value)}
                  className={`mt-1.5 ${inputCls}`}
                  required
                />
              </label>
            </div>

            <label className="block">
              <Label>Description <span className="font-normal text-slate2">(optional)</span></Label>
              <input
                type="text"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="e.g. June rent to landlord"
                className={`mt-1.5 ${inputCls}`}
              />
            </label>

            <div className="flex gap-2">
              <Btn variant="secondary" className="flex-1 justify-center" onClick={() => setShowForm(false)}>Cancel</Btn>
              <Btn variant="primary" className="flex-1 justify-center" {...{ type: 'submit' }} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Expense list */}
      <Card className="overflow-hidden">
        <SectionHeader title="Expense Records" />
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={TrendingDown}
            title="No expenses recorded"
            body="Add your first expense to start tracking profitability."
          />
        ) : (
          <div className="divide-y divide-border">
            {expenses.map(exp => (
              <div key={exp.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{catLabel(exp.category)}</p>
                  <p className="text-xs text-slate2">{exp.expenseDate}{exp.description ? ` · ${exp.description}` : ''}</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-coral shrink-0">{fmt(exp.amount)}</span>
                <IconBtn
                  variant="ghost"
                  onClick={() => handleDelete(exp.id)}
                  disabled={deletingId === exp.id}
                  className="text-slate2 hover:text-coral"
                >
                  {deletingId === exp.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </IconBtn>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── P&L Tab ──────────────────────────────────────────────────────────────────

// ─── Income Tab ──────────────────────────────────────────────────────────────

const INCOME_TYPE_CHIPS = [
  ...INCOME_CATEGORIES.map(c => ({ id: c, label: c, type: 'extra_charge' })),
  { id: 'Day Guest', label: 'Day Guest', type: 'day_guest' },
];

const EMPTY_INCOME_FORM = {
  typeChip: 'Food',
  amount: '', date: new Date().toISOString().slice(0, 10), note: '', tenant_id: '',
  name: '', phone: '', daily_rate: '', days: '1',
};

function IncomeTab({ selectedPropertyId, organizationId, tenants }) {
  const [ym, setYm] = useState(ymNow);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_INCOME_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isDayGuest = form.typeChip === 'Day Guest';

  useEffect(() => {
    if (!selectedPropertyId) return;
    setLoading(true);
    fetchIncomeRecords(selectedPropertyId, ym)
      .then(setRecords).catch(console.error).finally(() => setLoading(false));
  }, [selectedPropertyId, ym]);

  const total = records.reduce((s, r) => s + Number(r.amount), 0);
  const byType = [
    ...INCOME_CATEGORIES.map(cat => ({
      label: cat,
      total: records.filter(r => r.type === 'extra_charge' && r.category === cat).reduce((s, r) => s + Number(r.amount), 0),
    })),
    { label: 'Day Guest', total: records.filter(r => r.type === 'day_guest').reduce((s, r) => s + Number(r.amount), 0) },
  ].filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let rec;
      if (isDayGuest) {
        const days = Number(form.days) || 1;
        const dailyRate = Number(form.daily_rate);
        const amount = dailyRate * days;
        let photoPath = null;
        if (photoFile && organizationId) {
          const { path } = await uploadIdPhoto(organizationId, crypto.randomUUID(), photoFile);
          photoPath = path;
        }
        rec = await addIncomeRecord(selectedPropertyId, organizationId, {
          type: 'day_guest', amount, daily_rate: dailyRate, days,
          name: form.name, phone: form.phone || null,
          date: form.date, note: form.note || null, id_photo_url: photoPath,
        });
      } else {
        rec = await addIncomeRecord(selectedPropertyId, organizationId, {
          type: 'extra_charge', category: form.typeChip,
          amount: Number(form.amount), date: form.date,
          note: form.note || null, tenant_id: form.tenant_id || null,
        });
      }
      setRecords(prev => [rec, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
      setForm(EMPTY_INCOME_FORM); setPhotoFile(null); setPhotoPreview(null); setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteIncomeRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  }

  const inputCls = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink bg-white';

  return (
    <div className="flex flex-col gap-4">
      <MonthNav ym={ym} onChange={setYm} />

      {/* Stats */}
      {records.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-border">
            <Label>Total Income</Label>
            <span className="text-xl font-bold tabular-nums text-leaf">{fmt(total)}</span>
          </div>
          {byType.length > 0 && (
            <div className="divide-y divide-border">
              {byType.map(cat => (
                <div key={cat.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-ink">{cat.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-leaf/60" style={{ width: `${Math.round((cat.total / total) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-leaf w-20 text-right">{fmt(cat.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add button / form */}
      {!showForm ? (
        <Btn variant="secondary" className="w-full justify-center gap-2 py-3" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Income
        </Btn>
      ) : (
        <Card className="overflow-hidden">
          <SectionHeader title="Add Income" action={<IconBtn variant="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_INCOME_FORM); setPhotoFile(null); setPhotoPreview(null); }}><ChevronLeft className="h-4 w-4" /></IconBtn>} />
          <form onSubmit={handleAdd} className="p-4 flex flex-col gap-3">
            {/* Type chips */}
            <div>
              <Label>Type</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {INCOME_TYPE_CHIPS.map(chip => (
                  <button key={chip.id} type="button" onClick={() => set('typeChip', chip.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${form.typeChip === chip.id ? 'bg-ink text-white border-ink' : 'bg-white text-slate2 border-border hover:border-slate2/40'}`}>
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {isDayGuest ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block"><Label>Guest Name</Label>
                    <input required type="text" value={form.name} onChange={e => set('name', e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder="Full name" />
                  </label>
                  <label className="block"><Label>Phone <span className="text-slate2 font-normal">(optional)</span></Label>
                    <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder="9876543210" inputMode="tel" />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block"><Label>Daily Rate (₹)</Label>
                    <input required type="number" min="1" value={form.daily_rate} onChange={e => set('daily_rate', e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder="300" />
                  </label>
                  <label className="block"><Label>Days</Label>
                    <input required type="number" min="1" value={form.days} onChange={e => set('days', e.target.value)} className={`mt-1.5 ${inputCls}`} />
                  </label>
                  <label className="block"><Label>Date</Label>
                    <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} className={`mt-1.5 ${inputCls}`} />
                  </label>
                </div>
                {form.daily_rate && form.days && (
                  <div className="rounded-lg bg-mist px-3 py-2 flex items-center justify-between">
                    <Label>Total</Label>
                    <span className="text-sm font-bold text-ink tabular-nums">{fmt(Number(form.daily_rate) * Number(form.days))}</span>
                  </div>
                )}
                <div>
                  <Label>ID Photo</Label>
                  <div className="mt-1.5 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-2.5 text-sm font-semibold text-slate2 hover:bg-mist transition-colors">
                      <Camera className="h-4 w-4" />{photoPreview ? 'Retake' : 'Capture ID'}
                      <input type="file" accept="image/*" capture="environment" onChange={e => { const f = e.target.files?.[0]; if (f) { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); } }} className="sr-only" />
                    </label>
                    {photoPreview && <img src={photoPreview} alt="ID" className="h-12 w-16 rounded-lg object-cover border border-border" />}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><Label>Amount</Label>
                  <MoneyInput value={form.amount} onChange={v => set('amount', v)} className="mt-1.5" />
                </label>
                <label className="block"><Label>Date</Label>
                  <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} className={`mt-1.5 ${inputCls}`} />
                </label>
              </div>
            )}

            <label className="block">
              <Label>Note <span className="text-slate2 font-normal">(optional)</span></Label>
              <input type="text" value={form.note} onChange={e => set('note', e.target.value)} className={`mt-1.5 ${inputCls}`} placeholder={isDayGuest ? 'e.g. room 2 overnight' : 'e.g. 3 days food'} />
            </label>

            {!isDayGuest && (
              <label className="block">
                <Label>Tenant <span className="text-slate2 font-normal">(optional)</span></Label>
                <select value={form.tenant_id} onChange={e => set('tenant_id', e.target.value)} className={`mt-1.5 ${inputCls} appearance-none`}>
                  <option value="">— None —</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name} · {t.roomNumber}</option>)}
                </select>
              </label>
            )}

            <div className="flex gap-2">
              <Btn variant="secondary" className="flex-1 justify-center" onClick={() => { setShowForm(false); setForm(EMPTY_INCOME_FORM); setPhotoFile(null); setPhotoPreview(null); }}>Cancel</Btn>
              <Btn variant="primary" className="flex-1 justify-center" {...{ type: 'submit' }} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
              </Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Records list */}
      <Card className="overflow-hidden">
        <SectionHeader title="Income Records" />
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
        ) : records.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No income recorded" body="Add extra charges or day guests above." />
        ) : (
          <div className="divide-y divide-border">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{r.type === 'day_guest' ? `${r.name} · Day Guest` : r.category}</p>
                  <p className="text-xs text-slate2">
                    {r.date}
                    {r.type === 'day_guest' && r.days > 1 && ` · ${r.days} days @ ${fmt(r.daily_rate)}/day`}
                    {r.note && ` · ${r.note}`}
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums text-leaf shrink-0">{fmt(r.amount)}</span>
                {confirmDeleteId === r.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => { handleDelete(r.id); setConfirmDeleteId(null); }} className="text-xs font-semibold text-coral hover:underline">Delete</button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-xs text-slate2 hover:underline">Cancel</button>
                  </div>
                ) : (
                  <IconBtn variant="ghost" onClick={() => setConfirmDeleteId(r.id)} disabled={deletingId === r.id} className="text-slate2 hover:text-coral">
                    {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </IconBtn>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PLTab({ selectedPropertyId, tenants }) {
  const [ym, setYm] = useState(ymNow);
  const [records, setRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomeRecs, setIncomeRecs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPropertyId) return;
    setLoading(true);
    Promise.all([
      fetchPaymentRecords(selectedPropertyId, ym),
      fetchExpenses(selectedPropertyId, ym),
      fetchIncomeRecords(selectedPropertyId, ym),
    ])
      .then(([recs, exps, incs]) => { setRecords(recs); setExpenses(exps); setIncomeRecs(incs); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPropertyId, ym]);

  // Income
  const paidRecords = records.filter(r => r.status === 'paid');
  const rentCollected = paidRecords.reduce((s, r) => s + (r.amountCollected ?? r.amount), 0);
  const rentDeductions = paidRecords.reduce((s, r) => s + (r.amount - (r.amountCollected ?? r.amount)), 0);

  const curYM = ymNow();
  const newThisMonth = tenants.filter(t => t.joinDate?.startsWith(ym));
  const admissionIncome = newThisMonth.reduce((s, t) => s + Number(t.admissionFee || 0), 0);
  const otherIncome = incomeRecs.reduce((s, r) => s + Number(r.amount), 0);
  const totalIncome = rentCollected + admissionIncome + otherIncome;

  // Expenses
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0);

  const netProfit = totalIncome - totalExpenses;
  const profitColor = netProfit >= 0 ? 'text-leaf' : 'text-coral';
  const profitLabel = netProfit >= 0 ? 'Net Profit' : 'Net Loss';
  const hasData = totalIncome > 0 || totalExpenses > 0;

  return (
    <div className="flex flex-col gap-4">
      <MonthNav ym={ym} onChange={setYm} />

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
      ) : !hasData ? (
        <Card>
          <EmptyState icon={TrendingUp} title="No data for this month" body="Collect rent and add expenses to see your P&L statement." />
        </Card>
      ) : (
        <>
          {/* Net result — big call-out */}
          <div className={`rounded-xl border-2 px-5 py-4 text-center ${netProfit >= 0 ? 'border-leaf/30 bg-leaf/5' : 'border-coral/30 bg-coral/5'}`}>
            <Label>{profitLabel}</Label>
            <p className={`mt-1 text-4xl font-bold tabular-nums ${profitColor}`}>{fmt(Math.abs(netProfit))}</p>
            <p className="mt-1 text-xs text-slate2">{ymLabel(ym)}</p>
          </div>

          {/* Income section */}
          <Card className="overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <Label>Income</Label>
              <span className="text-sm font-bold text-leaf tabular-nums">{fmt(totalIncome)}</span>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-ink">Rent Collected</p>
                  <p className="text-xs text-slate2">{paidRecords.length} tenants paid</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-ink">{fmt(rentCollected)}</span>
              </div>
              {rentDeductions > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-coral">Deductions</p>
                    <p className="text-xs text-slate2">adjustments from rent</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-coral">−{fmt(rentDeductions)}</span>
                </div>
              )}
              {admissionIncome > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-ink">Admission Fees</p>
                    <p className="text-xs text-slate2">{newThisMonth.length} new tenant{newThisMonth.length !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{fmt(admissionIncome)}</span>
                </div>
              )}
              {otherIncome > 0 && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-ink">Extra Charges & Day Guests</p>
                    <p className="text-xs text-slate2">{incomeRecs.length} record{incomeRecs.length !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-ink">{fmt(otherIncome)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Expenses section */}
          <Card className="overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <Label>Expenses</Label>
              <span className="text-sm font-bold text-coral tabular-nums">{fmt(totalExpenses)}</span>
            </div>
            {totalExpenses === 0 ? (
              <div className="px-4 py-4 text-sm text-slate2">
                No expenses recorded for this month. Go to the Expenses tab to add them.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {byCategory.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                    <p className="text-sm text-ink">{cat.label}</p>
                    <span className="text-sm font-semibold tabular-nums text-coral">{fmt(cat.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Cashflow Tab ─────────────────────────────────────────────────────────────

const EMPTY_CF = { type: 'building_rent', label: '', amount: '5000', dueDay: '1' };

function CashflowTab({ selectedPropertyId, tenants }) {
  const unpaidTenants = tenants.filter(t => t.paymentStatus === 'Unpaid');
  const pendingRent = unpaidTenants.reduce((s, t) => s + Number(t.monthlyRent || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <StatStrip stats={[
        { label: 'Rent Pending', value: fmt(pendingRent), sub: `${unpaidTenants.length} tenant${unpaidTenants.length !== 1 ? 's' : ''}`, color: pendingRent > 0 ? 'text-amber' : 'text-leaf' },
      ]} />

      {/* Pending rent collection */}
      <Card className="overflow-hidden">
        <SectionHeader title="Pending Rent Collection" />
        {unpaidTenants.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="All rent collected" body="No unpaid tenants this month." />
        ) : (
          <div className="divide-y divide-border">
            {unpaidTenants.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink truncate">{t.name}</p>
                  <p className="text-xs text-slate2">Room {t.roomNumber} · Bed {t.bedNumber}</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-amber shrink-0">{fmt(t.monthlyRent)}</span>
              </div>
            ))}
            {unpaidTenants.length > 10 && (
              <div className="px-4 py-2.5 text-xs text-slate2 text-center">
                +{unpaidTenants.length - 10} more unpaid tenants
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 bg-mist">
              <Label>Total Pending</Label>
              <span className="text-base font-bold tabular-nums text-amber">{fmt(pendingRent)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function FinancePage({ selectedPropertyId, organizationId, tenants, onViewTenant, upiId }) {
  const [tab, setTab] = useState(() => {
    const saved = localStorage.getItem('stayops_finance_tab');
    return SUB_TABS.find(t => t.id === saved) ? saved : 'rent';
  });

  function changeTab(t) {
    setTab(t);
    localStorage.setItem('stayops_finance_tab', t);
  }

  return (
    <div className="flex flex-col gap-4">
      <SubNav active={tab} onChange={changeTab} />
      {tab === 'rent'     && <RentTab     selectedPropertyId={selectedPropertyId} onViewTenant={onViewTenant} upiId={upiId} />}
      {tab === 'income'   && <IncomeTab   selectedPropertyId={selectedPropertyId} organizationId={organizationId} tenants={tenants} />}
      {tab === 'expenses' && <ExpensesTab selectedPropertyId={selectedPropertyId} />}
      {tab === 'pl'       && <PLTab       selectedPropertyId={selectedPropertyId} tenants={tenants} />}
      {tab === 'cashflow' && <CashflowTab selectedPropertyId={selectedPropertyId} tenants={tenants} />}
    </div>
  );
}
