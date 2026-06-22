import { hasSupabaseConfig, supabase } from '../lib/supabase';

// Seeds a labelled "Sample Hostel" demo workspace into the signed-in user's org
// via the seed_sample_workspace() RPC (SECURITY DEFINER, org-scoped). Returns the
// new property id.
export async function seedSampleWorkspace() {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.rpc('seed_sample_workspace');
  if (error) throw error;
  return data;
}

// Removes all demo (is_demo) properties and their data from the user's orgs.
export async function clearSampleWorkspace() {
  if (!hasSupabaseConfig) throw new Error('Supabase is not configured');
  const { error } = await supabase.rpc('clear_sample_workspace');
  if (error) throw error;
}
