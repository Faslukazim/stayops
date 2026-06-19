// ─── Finance Page ─────────────────────────────────────────────────────────────
// Four sub-tabs: Rent | Expenses | P&L | Cashflow
// This is the primary decision-making module for hostel operators.

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle2, Plus, Trash2,
  Loader2, CreditCard, TrendingUp, TrendingDown, Calendar,
  AlertCircle, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react';
import {
  fmt, Label, Card, SectionHeader, Btn, IconBtn,
  StatusBadge, WhatsAppLink, StatStrip, EmptyState, CollectModal, MoneyInput,
} from './components/ui';
import {
  ensurePaymentRecords, fetchPaymentRecords,
  markRecordPaid, markRecordUnpaid,
} from './services/paymentService';
import {
  EXPENSE_CATEGORIES, CF_TYPES,
  fetchExpenses, addExpense, deleteExpense,
  fetchCashFlowItems, addCashFlowItem, deleteCashFlowItem,
} from './services/financeService';

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
  { id: 'rent',      label: 'Rent'      },
  { id: 'expenses',  label: 'Expenses'  },
  { id: 'pl',        label: 'P&L'       },
  { id: 'cashflow',  label: 'Cashflow'  },
];

function SubNav({ active, onChange }) {
  return (
    <div className="flex rounded-xl bg-white border border-border overflow-hidden shadow-card">
      {SUB_TABS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            active === t.id
              ? 'bg-ink text-white'
              : 'text-slate2 hover:text-ink hover:bg-mist'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Rent Tab (was PaymentsPage) ─────────────────────────────────────────────

function RentTab({ selectedPropertyId }) {
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

  const today = new Date().getDate();
  const isCur = ym === cur;

  function isOverdue(r) {
    if (r.status === 'paid') return false;
    return isCur ? today > r.dueDay : true;
  }
  function overdueLabel(r) {
    if (!isCur) return 'Overdue';
    const d = today - r.dueDay;
    return d <= 1 ? '1 day overdue' : `${d} days overdue`;
  }

  const paid = records.filter(r => r.status === 'paid');
  const unpaid = records.filter(r => r.status === 'unpaid');
  const overdueCnt = records.filter(r => isOverdue(r)).length;
  const collected = paid.reduce((s, r) => s + (r.amountCollected ?? r.amount), 0);
  const deductions = paid.reduce((s, r) => s + (r.amount - (r.amountCollected ?? r.amount)), 0);
  const pending = unpaid.reduce((s, r) => s + r.amount, 0);

  async function confirmPaid(amountCollected, deductionReason) {
    const r = collecting;
    setCollecting(null);
    setRecords(rs => rs.map(x => x.id === r.id
      ? { ...x, status: 'paid', paidAt: new Date().toISOString(), amountCollected, deductionReason }
      : x));
    try {
      await markRecordPaid(r.id, amountCollected, deductionReason);
    } catch (err) {
      console.error(err);
      setRecords(rs => rs.map(x => x.id === r.id
        ? { ...x, status: 'unpaid', paidAt: null, amountCollected: null, deductionReason: null }
        : x));
    }
  }

  async function handleUnpaid(r) {
    setRecords(rs => rs.map(x => x.id === r.id
      ? { ...x, status: 'unpaid', paidAt: null, amountCollected: null, deductionReason: null }
      : x));
    await markRecordUnpaid(r.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <MonthNav ym={ym} onChange={setYm} />

      <StatStrip stats={[
        { label: 'Collected',  value: fmt(collected), sub: `${paid.length} paid`,    color: collected > 0 ? 'text-leaf'  : 'text-slate2' },
        { label: 'Deductions', value: fmt(deductions), sub: deductions > 0 ? 'adjustments' : 'none', color: deductions > 0 ? 'text-coral' : 'text-ink' },
        { label: 'Pending',    value: fmt(pending),    sub: `${unpaid.length} unpaid`, color: pending > 0 ? 'text-amber' : 'text-leaf'  },
        { label: 'Overdue',    value: overdueCnt,      sub: overdueCnt > 0 ? 'need attention' : 'all clear', color: overdueCnt > 0 ? 'text-coral' : 'text-leaf' },
      ]} />

      {error && (
        <div className="rounded-lg border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">{error}</div>
      )}

      <Card className="overflow-hidden">
        <SectionHeader title="Payment Records" />
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
        ) : records.length === 0 ? (
          <EmptyState icon={CreditCard} title="No records for this month" body="Records are created automatically when tenants are active." />
        ) : (
          <div className="divide-y divide-border">
            {records.map(r => {
              const od = isOverdue(r);
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{r.name}</p>
                    <p className="text-xs text-slate2 tabular-nums">
                      Room {r.roomNumber} · Bed {r.bedNumber} · {fmt(r.amount)}
                    </p>
                    {od && <p className="text-xs font-semibold text-coral">{overdueLabel(r)}</p>}
                    {r.status === 'paid' && r.paidAt && (
                      <p className="text-xs text-slate2">
                        {r.amountCollected != null && r.amountCollected !== r.amount
                          ? <>{fmt(r.amountCollected)} collected · <span className="text-coral">{fmt(r.amount - r.amountCollected)} deducted</span>{r.deductionReason ? ` · ${r.deductionReason}` : ''}</>
                          : `Paid ${String(r.paidAt).slice(0, 10)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.status === 'unpaid' ? (
                      <>
                        <WhatsAppLink
                          name={r.name} phone={r.phone}
                          roomNumber={r.roomNumber} bedNumber={r.bedNumber} rent={r.amount}
                        />
                        <Btn size="sm" variant="filled-success" onClick={() => setCollecting(r)}>
                          Mark Paid
                        </Btn>
                      </>
                    ) : (
                      <>
                        <StatusBadge status="paid" />
                        <Btn size="sm" variant="ghost" onClick={() => handleUnpaid(r)}>Undo</Btn>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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

function PLTab({ selectedPropertyId, tenants }) {
  const [ym, setYm] = useState(ymNow);
  const [records, setRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedPropertyId) return;
    setLoading(true);
    Promise.all([
      fetchPaymentRecords(selectedPropertyId, ym),
      fetchExpenses(selectedPropertyId, ym),
    ])
      .then(([recs, exps]) => { setRecords(recs); setExpenses(exps); })
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
  const totalIncome = rentCollected + admissionIncome;

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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CF);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchCashFlowItems(selectedPropertyId)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPropertyId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.label || !form.amount || !form.dueDay) return;
    setSaving(true);
    try {
      const item = await addCashFlowItem(selectedPropertyId, { ...form, amount: Number(form.amount), dueDay: Number(form.dueDay) });
      setItems(prev => [...prev, item].sort((a, b) => a.dueDay - b.dueDay));
      setForm(EMPTY_CF);
      setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteCashFlowItem(id);
      setItems(prev => prev.filter(cf => cf.id !== id));
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  }

  const today = new Date().getDate();
  const unpaidTenants = tenants.filter(t => t.paymentStatus === 'Unpaid');
  const pendingRent = unpaidTenants.reduce((s, t) => s + Number(t.monthlyRent || 0), 0);
  const totalObligations = items.reduce((s, cf) => s + cf.amount, 0);

  function daysUntil(dueDay) {
    if (dueDay === today) return 0;
    if (dueDay > today) return dueDay - today;
    return dueDay + (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) - today;
  }

  function dueDayLabel(cf) {
    const d = daysUntil(cf.dueDay);
    if (d === 0) return 'Due today';
    if (d === 1) return 'Due tomorrow';
    if (d <= 7) return `Due in ${d} days`;
    return `Due on ${cf.dueDay}${['th','st','nd','rd'][Math.min(cf.dueDay % 10, 3)] || 'th'}`;
  }

  function urgencyColor(cf) {
    const d = daysUntil(cf.dueDay);
    if (d === 0) return 'text-coral font-bold';
    if (d <= 3) return 'text-coral';
    if (d <= 7) return 'text-amber';
    return 'text-slate2';
  }

  const cfTypeLabel = id => CF_TYPES.find(t => t.id === id)?.label ?? id;

  const inputCls = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink bg-white';

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <StatStrip stats={[
        { label: 'Monthly Obligations', value: fmt(totalObligations), sub: `${items.length} item${items.length !== 1 ? 's' : ''}`, color: totalObligations > 0 ? 'text-coral' : 'text-slate2' },
        { label: 'Rent Pending',        value: fmt(pendingRent),      sub: `${unpaidTenants.length} tenants`, color: pendingRent > 0 ? 'text-amber' : 'text-leaf' },
        { label: 'Net Position',        value: fmt(Math.abs(pendingRent - totalObligations)), sub: pendingRent >= totalObligations ? 'surplus if collected' : 'deficit risk', color: pendingRent >= totalObligations ? 'text-leaf' : 'text-coral' },
        { label: 'Coverage',            value: totalObligations > 0 ? `${Math.round((pendingRent / totalObligations) * 100)}%` : '—', sub: 'rent vs obligations', color: pendingRent >= totalObligations ? 'text-leaf' : 'text-coral' },
      ]} />

      {/* Scheduled obligations */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Monthly Obligations"
          action={
            <Btn variant="secondary" size="sm" onClick={() => setShowForm(v => !v)}>
              <Plus className="h-3.5 w-3.5" />
              {showForm ? 'Cancel' : 'Add'}
            </Btn>
          }
        />

        {showForm && (
          <form onSubmit={handleAdd} className="p-4 border-b border-border flex flex-col gap-3 bg-mist">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <Label>Type</Label>
                <div className="relative mt-1.5">
                  <select
                    value={form.type}
                    onChange={e => { set('type', e.target.value); if (!form.label) set('label', CF_TYPES.find(t => t.id === e.target.value)?.label ?? ''); }}
                    className={inputCls + ' appearance-none pr-8'}
                  >
                    {CF_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </label>
              <label className="block">
                <Label>Due Day (of month)</Label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dueDay}
                  onChange={e => set('dueDay', e.target.value)}
                  className={`mt-1.5 ${inputCls}`}
                  required
                />
              </label>
            </div>
            <label className="block">
              <Label>Label</Label>
              <input
                type="text"
                value={form.label}
                onChange={e => set('label', e.target.value)}
                placeholder="e.g. Building Rent – Main Street"
                className={inputCls}
                required
              />
            </label>
            <label className="block">
              <Label>Amount</Label>
              <MoneyInput value={form.amount} onChange={v => set('amount', v)} className="mt-1.5" />
            </label>
            <Btn variant="primary" className="w-full justify-center" {...{ type: 'submit' }} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save Obligation
            </Btn>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate2" /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No obligations added"
            body="Add building rent, salaries, and EMIs to track your monthly cash obligations."
          />
        ) : (
          <div className="divide-y divide-border">
            {[...items].sort((a, b) => a.dueDay - b.dueDay).map(cf => (
              <div key={cf.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{cf.label}</p>
                  <p className={`text-xs ${urgencyColor(cf)}`}>{dueDayLabel(cf)}</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-coral shrink-0">{fmt(cf.amount)}</span>
                <IconBtn
                  variant="ghost"
                  onClick={() => handleDelete(cf.id)}
                  disabled={deletingId === cf.id}
                  className="text-slate2 hover:text-coral"
                >
                  {deletingId === cf.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </IconBtn>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-mist">
              <Label>Total Monthly Obligations</Label>
              <span className="text-base font-bold tabular-nums text-coral">{fmt(totalObligations)}</span>
            </div>
          </div>
        )}
      </Card>

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

export default function FinancePage({ selectedPropertyId, tenants }) {
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
      {tab === 'rent'     && <RentTab     selectedPropertyId={selectedPropertyId} />}
      {tab === 'expenses' && <ExpensesTab selectedPropertyId={selectedPropertyId} />}
      {tab === 'pl'       && <PLTab       selectedPropertyId={selectedPropertyId} tenants={tenants} />}
      {tab === 'cashflow' && <CashflowTab selectedPropertyId={selectedPropertyId} tenants={tenants} />}
    </div>
  );
}
