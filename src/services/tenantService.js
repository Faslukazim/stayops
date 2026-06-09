import { hasSupabaseConfig, supabase } from '../lib/supabase';

const STORAGE_KEY = 'stayb-tenants';

const starterTenants = [
  {
    id: 'sample-1',
    name: 'Aarav Nair',
    phone: '919876543210',
    roomNumber: '101-A',
    monthlyRent: 6500,
    joinDate: '2026-05-01',
    paymentStatus: 'Paid',
    paymentDate: '2026-06-03',
  },
  {
    id: 'sample-2',
    name: 'Meera Khan',
    phone: '919812345678',
    roomNumber: '102-B',
    monthlyRent: 7000,
    joinDate: '2026-04-18',
    paymentStatus: 'Unpaid',
    paymentDate: '',
  },
  {
    id: 'sample-3',
    name: 'Rohan Das',
    phone: '919900112233',
    roomNumber: '103-A',
    monthlyRent: 6800,
    joinDate: '2026-06-01',
    paymentStatus: 'Unpaid',
    paymentDate: '',
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

export async function fetchTenants() {
  if (!hasSupabaseConfig) {
    return readLocalTenants();
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTenant(tenant) {
  if (!hasSupabaseConfig) {
    const tenants = readLocalTenants();
    const newTenant = { ...tenant, id: crypto.randomUUID() };
    writeLocalTenants([newTenant, ...tenants]);
    return newTenant;
  }

  const { data, error } = await supabase
    .from('tenants')
    .insert(tenant)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTenant(id, patch) {
  if (!hasSupabaseConfig) {
    const tenants = readLocalTenants();
    const updated = tenants.map((tenant) =>
      tenant.id === id ? { ...tenant, ...patch } : tenant,
    );
    writeLocalTenants(updated);
    return updated.find((tenant) => tenant.id === id);
  }

  const { data, error } = await supabase
    .from('tenants')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTenant(id) {
  if (!hasSupabaseConfig) {
    const tenants = readLocalTenants().filter((tenant) => tenant.id !== id);
    writeLocalTenants(tenants);
    return id;
  }

  const { error } = await supabase.from('tenants').delete().eq('id', id);

  if (error) throw error;
  return id;
}
