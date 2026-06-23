import { hasSupabaseConfig, supabase } from '../lib/supabase';

const LOCAL_KEY = 'stayops_activity';
const MAX_LOCAL = 50;

export async function logActivity(propertyId, organizationId, type, description) {
  if (!propertyId) return;
  const entry = { id: crypto.randomUUID(), propertyId, type, description, at: new Date().toISOString() };

  // Always write to localStorage as fast local cache
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    localStorage.setItem(LOCAL_KEY, JSON.stringify([entry, ...existing].slice(0, MAX_LOCAL)));
  } catch (_) {}

  // Write to Supabase async (fire and forget)
  if (hasSupabaseConfig && organizationId) {
    supabase.from('activity_log').insert({
      property_id: propertyId,
      organization_id: organizationId,
      type,
      description,
    }).then(({ error }) => { if (error) console.error('logActivity:', error); });
  }
}

export async function fetchRecentActivity(propertyId, limit = 15) {
  if (hasSupabaseConfig && propertyId) {
    const { data, error } = await supabase
      .from('activity_log')
      .select('id, type, description, at')
      .eq('property_id', propertyId)
      .order('at', { ascending: false })
      .limit(limit);
    if (!error && data?.length) return data.map(e => ({ ...e, propertyId }));
  }
  // Fallback to localStorage
  try {
    const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return (propertyId ? all.filter(e => e.propertyId === propertyId) : all).slice(0, limit);
  } catch (_) { return []; }
}
