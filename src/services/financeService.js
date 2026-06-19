import { hasSupabaseConfig, supabase } from '../lib/supabase';

// ─── Categories ──────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = [
  { id: 'building_rent', label: 'Building Rent' },
  { id: 'food',          label: 'Food'          },
  { id: 'salary',        label: 'Salary'        },
  { id: 'electricity',   label: 'Electricity'   },
  { id: 'internet',      label: 'Internet'      },
  { id: 'maintenance',   label: 'Maintenance'   },
  { id: 'misc',          label: 'Misc'          },
];

export const CF_TYPES = [
  { id: 'building_rent', label: 'Building Rent' },
  { id: 'salary',        label: 'Salary'        },
  { id: 'emi',           label: 'EMI / Loan'   },
  { id: 'other',         label: 'Other'         },
];

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const EXP_KEY = 'stayops_expenses';
const CF_KEY  = 'stayops_cashflow';

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function writeLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function fetchExpenses(propertyId, yearMonth) {
  if (!hasSupabaseConfig) {
    return readLocal(EXP_KEY).filter(e =>
      (!propertyId || e.propertyId === propertyId) &&
      (!yearMonth || (e.expenseDate || '').startsWith(yearMonth))
    );
  }
  const q = supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });
  if (propertyId) q.eq('property_id', propertyId);
  if (yearMonth) {
    const [y, m] = yearMonth.split('-').map(Number);
    const end = new Date(y, m, 1).toISOString().slice(0, 10);
    q.gte('expense_date', `${yearMonth}-01`).lt('expense_date', end);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data.map(toUiExpense);
}

function toUiExpense(r) {
  return {
    id: r.id,
    propertyId: r.property_id,
    category: r.category,
    amount: Number(r.amount),
    description: r.description ?? '',
    expenseDate: r.expense_date,
  };
}

export async function addExpense(propertyId, expense) {
  if (!hasSupabaseConfig) {
    const item = { ...expense, id: crypto.randomUUID(), propertyId };
    writeLocal(EXP_KEY, [item, ...readLocal(EXP_KEY)]);
    return item;
  }
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      property_id: propertyId || null,
      category: expense.category,
      amount: expense.amount,
      description: expense.description || null,
      expense_date: expense.expenseDate,
    })
    .select()
    .single();
  if (error) throw error;
  return toUiExpense(data);
}

export async function deleteExpense(id) {
  if (!hasSupabaseConfig) {
    writeLocal(EXP_KEY, readLocal(EXP_KEY).filter(e => e.id !== id));
    return;
  }
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

// ─── Cash Flow Items (recurring obligations) ──────────────────────────────────

export function fetchCashFlowItemsSync(propertyId) {
  return readLocal(CF_KEY).filter(cf => !propertyId || cf.propertyId === propertyId);
}

export async function fetchCashFlowItems(propertyId) {
  if (!hasSupabaseConfig) return fetchCashFlowItemsSync(propertyId);
  const q = supabase.from('cash_flow_items').select('*').eq('active', true);
  if (propertyId) q.eq('property_id', propertyId);
  const { data, error } = await q;
  if (error) throw error;
  return data.map(r => ({
    id: r.id, propertyId: r.property_id, type: r.type,
    label: r.label, amount: Number(r.amount), dueDay: r.due_day,
  }));
}

export async function addCashFlowItem(propertyId, item) {
  if (!hasSupabaseConfig) {
    const newItem = { ...item, id: crypto.randomUUID(), propertyId };
    writeLocal(CF_KEY, [...readLocal(CF_KEY), newItem]);
    return newItem;
  }
  const { data, error } = await supabase
    .from('cash_flow_items')
    .insert({
      property_id: propertyId || null,
      type: item.type,
      label: item.label,
      amount: item.amount,
      due_day: item.dueDay,
      active: true,
    })
    .select().single();
  if (error) throw error;
  return { id: data.id, propertyId: data.property_id, type: data.type, label: data.label, amount: Number(data.amount), dueDay: data.due_day };
}

export async function deleteCashFlowItem(id) {
  if (!hasSupabaseConfig) {
    writeLocal(CF_KEY, readLocal(CF_KEY).filter(cf => cf.id !== id));
    return;
  }
  const { error } = await supabase.from('cash_flow_items').update({ active: false }).eq('id', id);
  if (error) throw error;
}

// ─── Sync reads for Dashboard ─────────────────────────────────────────────────
// Read from localStorage without async — used for Dashboard quick summaries.

export function readExpensesSync(propertyId, yearMonth) {
  return readLocal(EXP_KEY).filter(e =>
    (!propertyId || e.propertyId === propertyId) &&
    (!yearMonth || (e.expenseDate || '').startsWith(yearMonth))
  );
}
