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
    dueDay: t.joinDate ? new Date(t.joinDate).getDate() : 1,
    status: t.paymentStatus === 'Paid' ? 'paid' : 'unpaid',
    paidAt: t.paymentDate || null,
  }));
}

export async function ensurePaymentRecords(propertyId, yearMonth) {
  if (!hasSupabaseConfig) return;

  const query = supabase
    .from('occupancies')
    .select('*, tenant:tenants!inner(id, name, join_date)')
    .eq('status', 'active')
    .eq('tenant.status', 'active');
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
    due_day: occ.tenant.join_date ? new Date(occ.tenant.join_date).getDate() : 1,
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
    .select('*, tenant:tenants(name, phone), occupancy:occupancies(monthly_rent, room:rooms(room_number), bed:beds(bed_number))')
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
    dueDay: r.due_day,
    status: r.status,
    paidAt: r.paid_at,
  }));
}

export async function markRecordPaid(recordId, amountCollected, deductionReason) {
  if (!hasSupabaseConfig) return;
  const patch = {
    status: 'paid',
    paid_at: new Date().toISOString(),
    amount_collected: amountCollected ?? null,
    deduction_reason: deductionReason || null,
  };
  const { error } = await supabase
    .from('payment_records')
    .update(patch)
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
    .update({ status: 'unpaid', paid_at: null })
    .eq('id', recordId);
  if (error) throw error;
}
