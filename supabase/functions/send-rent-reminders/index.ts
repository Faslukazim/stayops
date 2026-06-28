import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

async function sendSms(apiKey: string, phone: string, message: string): Promise<string> {
  const digits = String(phone).replace(/\D/g, '').slice(-10);
  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: { 'authorization': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      flash: 0,
      numbers: digits,
    }),
  });
  const json = await res.json();
  return json.return ? 'sent' : (json.message?.[0] ?? 'failed');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const fast2smsKey = Deno.env.get('FAST2SMS_API_KEY');

  const today = new Date();
  const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Fetch all unpaid records for current month with tenant + org info
  const { data: records, error } = await supabase
    .from('payment_records')
    .select(`
      amount, due_day,
      tenant:tenants(name, phone),
      occupancy:occupancies(
        property:properties(
          name,
          organization_id,
          organization:organizations(name)
        ),
        room:rooms(room_number),
        bed:beds(bed_number)
      )
    `)
    .eq('month', ym)
    .eq('status', 'unpaid');

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  // Filter to actually overdue (due_day has passed)
  const overdue = (records ?? []).filter(r => today.getDate() > (r.due_day ?? 1));

  // Group by org — send one summary SMS to the operator
  const byOrg: Record<string, { orgName: string; orgId: string; items: typeof overdue }> = {};
  for (const r of overdue) {
    const prop = (r.occupancy as any)?.property;
    const orgId = prop?.organization_id;
    if (!orgId) continue;
    if (!byOrg[orgId]) {
      byOrg[orgId] = { orgName: prop?.organization?.name ?? 'Property', orgId, items: [] };
    }
    byOrg[orgId].items.push(r);
  }

  const results: string[] = [];

  for (const { orgName, orgId, items } of Object.values(byOrg)) {
    // Fetch org owner's phone via memberships → auth user metadata
    const { data: memberships } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('role', 'owner');

    if (!memberships?.length) continue;

    for (const m of memberships) {
      const { data: userData } = await supabase.auth.admin.getUserById(m.user_id);
      const ownerPhone = userData?.user?.phone ?? userData?.user?.user_metadata?.phone;
      if (!ownerPhone) {
        results.push(`org ${orgId}: no phone on file`);
        continue;
      }

      const total = items.reduce((s, r) => s + Number(r.amount), 0);
      const names = items.slice(0, 3).map(r => (r.tenant as any)?.name ?? 'Tenant').join(', ');
      const more = items.length > 3 ? ` +${items.length - 3} more` : '';
      const msg = `NivaOps: ${items.length} overdue rent${items.length !== 1 ? 's' : ''} for ${orgName}. Total: Rs.${total}. Tenants: ${names}${more}. Open app to collect.`;

      if (fast2smsKey) {
        const status = await sendSms(fast2smsKey, ownerPhone, msg);
        results.push(`${ownerPhone}: ${status}`);
      } else {
        console.log(`[reminder] ${ownerPhone} — ${msg}`);
        results.push(`${ownerPhone}: logged (no FAST2SMS_API_KEY)`);
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, processed: overdue.length, sent: results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
