import { hasSupabaseConfig, supabase } from '../lib/supabase';

const STORAGE_KEY = 'stayb-tenants';

const starterTenants = [
  {
    id: 'sample-1',
    name: 'Aarav Nair',
    phone: '919876543210',
    roomNumber: '01',
    bedNumber: '1',
    monthlyRent: 6500,
    joinDate: '2026-05-01',
    paymentStatus: 'Paid',
    paymentDate: '2026-06-03',
    depositAmount: 6500,
    depositStatus: 'held',
  },
  {
    id: 'sample-2',
    name: 'Meera Khan',
    phone: '919812345678',
    roomNumber: '02',
    bedNumber: '2',
    monthlyRent: 7000,
    joinDate: '2026-04-18',
    paymentStatus: 'Unpaid',
    paymentDate: '',
    depositAmount: 0,
    depositStatus: 'none',
  },
];

function readLocalTenants() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(starterTenants));
    return starterTenants;
  }
  return JSON.parse(saved);
}

function writeLocalTenants(tenants) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
}

function toUiTenant(occupancy) {
  return {
    id: occupancy.tenant.id,
    occupancyId: occupancy.id,
    propertyId: occupancy.property_id,
    roomId: occupancy.room_id,
    bedId: occupancy.bed_id,
    name: occupancy.tenant.name,
    phone: occupancy.tenant.phone,
    roomNumber: occupancy.room?.room_number ?? 'Unassigned',
    bedNumber: occupancy.bed?.bed_number ?? '-',
    monthlyRent: Number(occupancy.monthly_rent ?? 0),
    joinDate: occupancy.tenant.join_date,
    rentDueDay: occupancy.rent_due_day ?? null,
    paymentStatus: occupancy.payment_status,
    paymentDate: occupancy.payment_date ?? '',
    depositAmount: Number(occupancy.deposit_amount ?? 0),
    depositStatus: occupancy.deposit_status ?? 'none',
    admissionFee: Number(occupancy.admission_fee ?? 0),
    moveInCollection: Number(occupancy.move_in_collection ?? 0),
    id_photo_url: occupancy.tenant.id_photo_url ?? null,
  };
}

async function fetchOccupancyByTenantId(tenantId) {
  const { data, error } = await supabase
    .from('occupancies')
    .select(`
      *,
      tenant:tenants(*),
      room:rooms(room_number),
      bed:beds(bed_number)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();
  if (error) throw error;
  return data;
}

async function setBedStatus(bedId, status) {
  const { error } = await supabase.from('beds').update({ status }).eq('id', bedId);
  if (error) throw error;
}

export async function fetchTenants(propertyId) {
  if (!hasSupabaseConfig) return readLocalTenants();

  const query = supabase
    .from('occupancies')
    .select(`
      *,
      tenant:tenants!inner(*),
      room:rooms(room_number),
      bed:beds(bed_number)
    `)
    .eq('status', 'active')
    .eq('tenant.status', 'active')
    .order('created_at', { ascending: false });

  if (propertyId) query.eq('property_id', propertyId);

  const { data, error } = await query;
  if (error) throw error;
  return data.map(toUiTenant);
}

export async function createTenant(tenant) {
  if (!hasSupabaseConfig) {
    const tenants = readLocalTenants();
    const newTenant = { ...tenant, id: crypto.randomUUID() };
    writeLocalTenants([newTenant, ...tenants]);
    return newTenant;
  }

  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, organization_id')
    .eq('id', tenant.propertyId)
    .single();
  if (propError) throw propError;

  const { data: createdTenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      organization_id: property.organization_id,
      property_id: tenant.propertyId,
      name: tenant.name,
      phone: tenant.phone,
      join_date: tenant.joinDate,
      status: 'active',
    })
    .select()
    .single();
  if (tenantError) throw tenantError;

  const depositAmt = tenant.depositAmount ?? 0;

  // rent_due_day defaults to the day from joinDate — operator can correct it later
  const rentDueDay = tenant.rentDueDay
    ?? (tenant.joinDate ? Number(tenant.joinDate.slice(8, 10)) : 1);

  const { data: occupancy, error: occupancyError } = await supabase
    .from('occupancies')
    .insert({
      tenant_id: createdTenant.id,
      property_id: tenant.propertyId,
      room_id: tenant.roomId,
      bed_id: tenant.bedId,
      monthly_rent: tenant.monthlyRent,
      payment_status: tenant.paymentStatus ?? 'Unpaid',
      payment_date: tenant.paymentDate || null,
      start_date: tenant.joinDate,
      rent_due_day: rentDueDay,
      status: 'active',
      deposit_amount: depositAmt,
      deposit_status: depositAmt > 0 ? 'held' : 'none',
      admission_fee: tenant.admissionFee ?? 0,
      move_in_collection: tenant.moveInCollection ?? (tenant.monthlyRent + (tenant.admissionFee ?? 0) + depositAmt),
    })
    .select(`
      *,
      tenant:tenants(*),
      room:rooms(room_number),
      bed:beds(bed_number)
    `)
    .single();
  if (occupancyError) throw occupancyError;

  await setBedStatus(tenant.bedId, 'occupied');
  return toUiTenant(occupancy);
}

export async function updateTenant(id, patch) {
  if (!hasSupabaseConfig) {
    const tenants = readLocalTenants();
    const updated = tenants.map((t) => (t.id === id ? { ...t, ...patch } : t));
    writeLocalTenants(updated);
    return updated.find((t) => t.id === id);
  }

  const currentOccupancy = await fetchOccupancyByTenantId(id);
  const tenantPatch = {};
  const occupancyPatch = {};

  if (patch.name !== undefined) tenantPatch.name = patch.name;
  if (patch.phone !== undefined) tenantPatch.phone = patch.phone;
  if (patch.joinDate !== undefined) {
    tenantPatch.join_date = patch.joinDate;
    occupancyPatch.start_date = patch.joinDate;
  }
  if (patch.monthlyRent !== undefined) occupancyPatch.monthly_rent = patch.monthlyRent;
  if (patch.rentDueDay !== undefined) occupancyPatch.rent_due_day = Number(patch.rentDueDay);
  if (patch.paymentStatus !== undefined) occupancyPatch.payment_status = patch.paymentStatus;
  if (patch.paymentDate !== undefined) occupancyPatch.payment_date = patch.paymentDate || null;
  if (patch.depositAmount !== undefined) occupancyPatch.deposit_amount = patch.depositAmount;
  if (patch.depositStatus !== undefined) occupancyPatch.deposit_status = patch.depositStatus;
  if (patch.admissionFee !== undefined) occupancyPatch.admission_fee = patch.admissionFee;
  if (patch.moveInCollection !== undefined) occupancyPatch.move_in_collection = patch.moveInCollection;

  if (patch.bedId && patch.bedId !== currentOccupancy.bed_id) {
    occupancyPatch.room_id = patch.roomId;
    occupancyPatch.bed_id = patch.bedId;
    await setBedStatus(currentOccupancy.bed_id, 'available');
    await setBedStatus(patch.bedId, 'occupied');
  }

  if (Object.keys(tenantPatch).length > 0) {
    const { error } = await supabase.from('tenants').update(tenantPatch).eq('id', id);
    if (error) throw error;
  }

  if (Object.keys(occupancyPatch).length > 0) {
    const { error } = await supabase
      .from('occupancies')
      .update(occupancyPatch)
      .eq('id', currentOccupancy.id);
    if (error) throw error;
  }

  return toUiTenant(await fetchOccupancyByTenantId(id));
}

export async function returnDeposit(id) {
  return updateTenant(id, { depositStatus: 'returned' });
}

export async function forfeitDeposit(id) {
  return updateTenant(id, { depositStatus: 'forfeited' });
}

export async function moveTenant(tenantId, { roomId, bedId }) {
  return updateTenant(tenantId, { roomId, bedId });
}

export async function fetchVacatedTenants(propertyId) {
  if (!hasSupabaseConfig) return [];
  const query = supabase
    .from('occupancies')
    .select(`
      *,
      tenant:tenants!inner(*),
      room:rooms(room_number),
      bed:beds(bed_number)
    `)
    .eq('status', 'ended')
    .neq('tenant.status', 'deleted')
    .order('end_date', { ascending: false })
    .limit(50);
  if (propertyId) query.eq('property_id', propertyId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(o => ({
    ...toUiTenant(o),
    endDate: o.end_date ?? null,
    status: 'vacated',
  }));
}

// P4: Vacated tenants with deposit still pending
export async function fetchPendingDeposits(propertyId) {
  if (!hasSupabaseConfig) return [];
  const query = supabase
    .from('occupancies')
    .select(`*, tenant:tenants!inner(*), room:rooms(room_number), bed:beds(bed_number)`)
    .eq('status', 'ended')
    .eq('deposit_status', 'held')
    .gt('deposit_amount', 0)
    .neq('tenant.status', 'deleted')
    .order('end_date', { ascending: false })
    .limit(20);
  if (propertyId) query.eq('property_id', propertyId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(o => ({ ...toUiTenant(o), endDate: o.end_date ?? null, status: 'vacated' }));
}

// P1: Tenants who vacated in the current calendar month
export async function fetchMovedOutThisMonth(propertyId) {
  if (!hasSupabaseConfig) return [];
  const ym = new Date().toISOString().slice(0, 7);
  const start = `${ym}-01`;
  const [y, m] = ym.split('-').map(Number);
  const end = new Date(y, m, 0).toISOString().slice(0, 10);
  const query = supabase
    .from('occupancies')
    .select(`*, tenant:tenants!inner(*), room:rooms(room_number), bed:beds(bed_number)`)
    .eq('status', 'ended')
    .neq('tenant.status', 'deleted')
    .gte('end_date', start)
    .lte('end_date', end)
    .order('end_date', { ascending: false });
  if (propertyId) query.eq('property_id', propertyId);
  const { data, error } = await query;
  if (error) throw error;
  return data.map(o => ({ ...toUiTenant(o), endDate: o.end_date ?? null, status: 'vacated' }));
}

// Proper vacate: set end date + settle deposit in one step
export async function vacateTenant(id, { endDate, depositAction = 'later' } = {}) {
  if (!hasSupabaseConfig) {
    writeLocalTenants(readLocalTenants().filter(t => t.id !== id));
    return id;
  }
  const occupancy = await fetchOccupancyByTenantId(id);
  const patch = { status: 'ended', end_date: endDate || new Date().toISOString().slice(0, 10) };
  if (depositAction === 'returned') patch.deposit_status = 'returned';
  if (depositAction === 'forfeited') patch.deposit_status = 'forfeited';

  const { error: occErr } = await supabase.from('occupancies').update(patch).eq('id', occupancy.id);
  if (occErr) throw occErr;
  const { error: tenErr } = await supabase.from('tenants').update({ status: 'archived' }).eq('id', id);
  if (tenErr) throw tenErr;
  await setBedStatus(occupancy.bed_id, 'available');
  return id;
}

export async function deleteTenant(id) {
  if (!hasSupabaseConfig) {
    writeLocalTenants(readLocalTenants().filter((t) => t.id !== id));
    return id;
  }

  // For ex-tenants the occupancy is already ended — just archive the tenant record.
  // For active tenants end the occupancy and free the bed first.
  const { data: activeOcc } = await supabase
    .from('occupancies')
    .select('id, bed_id')
    .eq('tenant_id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (activeOcc) {
    const today = new Date().toISOString().slice(0, 10);
    const { error: occupancyError } = await supabase
      .from('occupancies')
      .update({ status: 'ended', end_date: today })
      .eq('id', activeOcc.id);
    if (occupancyError) throw occupancyError;
    await setBedStatus(activeOcc.bed_id, 'available');
  }

  const { error: tenantError } = await supabase
    .from('tenants')
    .update({ status: 'deleted' })
    .eq('id', id);
  if (tenantError) throw tenantError;

  return id;
}