import { hasSupabaseConfig, supabase } from '../lib/supabase';

// ─── Session ──────────────────────────────────────────────────────────────────

/** Current session (or null). Returns null when Supabase isn't configured. */
export async function getSession() {
  if (!hasSupabaseConfig) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

/**
 * Subscribe to auth changes. Returns an unsubscribe function.
 * Callback receives the new session (or null on sign-out).
 */
export function onAuthChange(callback) {
  if (!hasSupabaseConfig) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ?? null);
  });
  return () => data.subscription.unsubscribe();
}

// ─── Email / password ─────────────────────────────────────────────────────────

export async function signUp(email, password) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  // session is null when email confirmation is required
  return { session: data.session ?? null, needsConfirmation: !data.session };
}

export async function signIn(email, password) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (!hasSupabaseConfig) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── Organizations / memberships ───────────────────────────────────────────────

/**
 * Orgs the signed-in user belongs to.
 * Returns [{ organizationId, role, name }] sorted by name.
 */
export async function fetchMemberships() {
  if (!hasSupabaseConfig) return [];
  const { data, error } = await supabase
    .from('memberships')
    .select('organization_id, role, organization:organizations(name)')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(m => ({
    organizationId: m.organization_id,
    role: m.role,
    name: m.organization?.name ?? 'Organization',
  }));
}

/**
 * Create an organization (and optional first property) for the current user,
 * who becomes its owner. Returns the new organization id.
 */
export async function createOrganization({ orgName, propertyName, totalBeds }) {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.rpc('create_organization', {
    org_name: orgName,
    property_name: propertyName || null,
    total_beds: Number(totalBeds) || 0,
  });
  if (error) throw error;
  return data; // new organization id (uuid)
}
