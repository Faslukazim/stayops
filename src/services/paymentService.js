import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { fetchTenants } from './tenantService';

function localRecordsFromTenants(tenants) {
  return tenants.map(t => ({
    id: `local-${t.id}`,
    tenantId: t.id,
    name: t.name,
    phone: t.phone,
    roomNumber: t.roomNumber,
    bedNumber: t.bedNumber,
    amount: t.monthlyRent,
    // Use explicit rentDueDay; fall back to joinDate day for old localStorage data
    dueDay: t.rentDueDay ?? (t.joinDate ? Number(t.joinDate.slice(8, 10)) : 1),
    status: t.paymentStatus === 'Paid' ? 'paid' : 'unpaid',
    paidAt: t.paymentDate || null,
    amountCollected: null,
    deductionReason: null,
  }));
}

export async function ensurePaymentRecords(propertyId, yearMonth) {
  if (!hasSupabaseConfig) return;

  const query = supabase
    .from('occupancies')
    .select('id, property_id, tenant_id, monthly_rent, rent_due_day')
    .eq('status', 'active');
  if (propertyId) query.eq('property_id', propertyId);

  const { data: occupancies, error } = await query;
  if (error) throw error;
  if (!occupancies.length) return;

  const records = occupancies.map(occ => ({
    property_id: occ.property_id,
    tenant_id: occ.tenant_id,
    occupancy_id: occ.id,
    month: yearMonth,
    amount: occ.monthly_rent,
    due_day: occ.rent_due_day ?? 1,
    status: 'unpaid',
  }));

  const { error: upsertError } = await supabase
    .from('payment_records')
    .upsert(records, { onConflict: 'occupancy_id,month', ignoreDuplicates: true });
  if (upsertError) throw upsertError;
}

export async function fetchPaymentRecords(propertyId, yearMonth) {
  if (!hasSupabaseConfig) {
    const tenants = await fetchTenants(propertyId);
    return localRecordsFromTenants(tenants);
  }

  const query = supabase
    .from('payment_records')
    .select('*, tenant:tenants(name, phone), occupancy:occupancies(monthly_rent, rent_due_day, room:rooms(room_number), bed:beds(bed_number))')
    .eq('month', yearMonth);
  if (propertyId) query.eq('property_id', propertyId);

  const { data, error } = await query;
  if (error) throw error;

  return data.map(r => ({
    id: r.id,
    tenantId: r.tenant_id,
    name: r.tenant?.name ?? '—',
    phone: r.tenant?.phone ?? '',
    roomNumber: r.occupancy?.room?.room_number ?? '—',
    bedNumber: r.occupancy?.bed?.bed_number ?? '—',
    amount: Number(r.amount ?? 0),
    amountCollected: r.amount_collected != null ? Number(r.amount_collected) : null,
    deductionReason: r.deduction_reason ?? null,
    // due_day is stamped at record creation from rent_due_day; use it directly
    dueDay: r.due_day,
    status: r.status,
    paidAt: r.paid_at,
  }));
}

export async function markRecordPaid(recordId, amountCollected, deductionReason) {
  if (!hasSupabaseConfig) return;
  const { error } = await supabase
    .from('payment_records')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      amount_collected: amountCollected ?? null,
      deduction_reason: deductionReason || null,
    })
    .eq('id', recordId);
  if (error) throw error;
}

export async function markTenantRecordPaid(tenantId, yearMonth, amountCollected, deductionReason) {
  if (!hasSupabaseConfig) return;
  const { error } = await supabase
    .from('payment_records')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      amount_collected: amountCollected ?? null,
      deduction_reason: deductionReason || null,
    })
    .eq('tenant_id', tenantId)
    .eq('month', yearMonth);
  if (error) throw error;
}

export async function markRecordUnpaid(recordId) {
  if (!hasSupabaseConfig) return;
  const { error } = await supabase
    .from('payment_records')
    .update({ status: 'unpaid', paid_at: null, amount_collected: null, deduction_reason: null })
    .eq('id', recordId);
  if (error) throw error;
}

/**
 * Sync occupancy.payment_status when a record is marked paid/unpaid via Finance tab.
 * Keeps Dashboard counts consistent with Finance page counts.
 */
export async function fetchTenantPaymentHistory(tenantId, limit = 12) {
  if (!hasSupabaseConfig) return [];
  const { data, error } = await supabase
    .from('payment_records')
    .select('month, amount, amount_collected, deduction_reason, status, paid_at, due_day')
    .eq('tenant_id', tenantId)
    .order('month', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
}

export async function syncOccupancyPaymentStatus(tenantId, status) {
  if (!hasSupabaseConfig) return;
  const patch = status === 'Paid'
    ? { payment_status: 'Paid', payment_date: new Date().toISOString().slice(0, 10) }
    : { payment_status: 'Unpaid', payment_date: null };
  const { error } = await supabase
    .from('occupancies')
    .update(patch)
    .eq('tenant_id', tenantId)
    .eq('status', 'active');
  if (error) console.error('syncOccupancyPaymentStatus failed:', error);
}
