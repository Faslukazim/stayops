import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ADMIN_UID = '06d41f5f-07c6-4922-9456-3e935eef72e7';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

Deno.serve(async (req) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    // Verify caller is Faslu
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (caller?.id !== ADMIN_UID) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), { status: 403, headers: cors });
    }

    const { email, password, org_name, property_name, total_beds } = await req.json();

    if (!email || !password || !org_name) {
      return new Response(JSON.stringify({ error: 'email, password and org_name are required' }), { status: 400, headers: cors });
    }

    // Create auth user (email pre-confirmed — no verification email needed)
    const { data: created, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (userErr) return new Response(JSON.stringify({ error: userErr.message }), { status: 400, headers: cors });

    const userId = created.user.id;

    // Create org (approved immediately)
    const { data: org, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .insert({ name: org_name, approved: true })
      .select()
      .single();
    if (orgErr) return new Response(JSON.stringify({ error: orgErr.message }), { status: 400, headers: cors });

    // Create membership
    await supabaseAdmin.from('memberships').insert({
      user_id: userId,
      organization_id: org.id,
      role: 'owner',
    });

    // Optionally create first property
    if (property_name) {
      await supabaseAdmin.from('properties').insert({
        organization_id: org.id,
        name: property_name,
        total_beds: total_beds || 0,
        status: 'active',
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId, org_id: org.id }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
