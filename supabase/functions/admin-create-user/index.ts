import { createClient } from 'jsr:@supabase/supabase-js@2';

const ADMIN_UID = '06d41f5f-07c6-4922-9456-3e935eef72e7';

function getUidFromToken(token: string): string | null {
  try {
    const part = token.split('.')[1];
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(atob(padded)).sub ?? null;
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    if (getUidFromToken(token) !== ADMIN_UID) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { email, password, org_name, property_name } = await req.json();
    if (!email || !password || !org_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: corsHeaders });
    }

    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr) throw new Error(createErr.message);

    const { data: org, error: orgErr } = await supabaseAdmin
      .from('organizations').insert({ name: org_name, approved: true }).select().single();
    if (orgErr) throw new Error(orgErr.message);

    const { error: memErr } = await supabaseAdmin
      .from('memberships').insert({ user_id: newUser.user.id, organization_id: org.id, role: 'owner' });
    if (memErr) throw new Error(memErr.message);

    if (property_name) {
      await supabaseAdmin.from('properties').insert({ name: property_name, organization_id: org.id, status: 'active' });
    }

    // Save credentials keyed by user_id
    await supabaseAdmin.from('admin_credentials')
      .upsert({ user_id: newUser.user.id, org_id: org.id, email, password, updated_at: new Date().toISOString() });

    return new Response(JSON.stringify({ success: true, user_id: newUser.user.id, org_id: org.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
});
