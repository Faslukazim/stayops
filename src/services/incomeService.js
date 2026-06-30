import { supabase } from '../lib/supabase';

export const INCOME_CATEGORIES = ['Food', 'Laundry', 'Guest Stay', 'Parking', 'Miscellaneous'];

export async function fetchIncomeRecords(propertyId, month) {
  const start = `${month}-01`;
  const [y, m] = month.split('-').map(Number);
  const end = new Date(y, m, 0).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('income_records')
    .select('*')
    .eq('property_id', propertyId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addIncomeRecord(propertyId, organizationId, record) {
  const { data, error } = await supabase
    .from('income_records')
    .insert({ ...record, property_id: propertyId, organization_id: organizationId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteIncomeRecord(id) {
  const { error } = await supabase.from('income_records').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadIdPhoto(orgId, entityId, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${orgId}/${entityId}.${ext}`;
  const { error } = await supabase.storage.from('tenant-photos').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: signed, error: signErr } = await supabase.storage
    .from('tenant-photos')
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr) throw signErr;
  return { path, signedUrl: signed.signedUrl };
}

export async function getIdPhotoUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from('tenant-photos')
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function saveTenantIdPhoto(tenantId, photoPath) {
  const { error } = await supabase
    .from('tenants')
    .update({ id_photo_url: photoPath })
    .eq('id', tenantId);
  if (error) throw error;
}
