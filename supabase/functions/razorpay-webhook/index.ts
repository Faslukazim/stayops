import { createClient } from 'jsr:@supabase/supabase-js@2';

// Verifies Razorpay webhook signature and marks rent paid on payment.captured event.
Deno.serve(async (req: Request) => {
  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

  // Razorpay sends payment captured events as POST with JSON body
  if (req.method === 'POST') {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';

    // Fail closed: reject all webhook calls if secret is not configured
    if (!webhookSecret) {
      return new Response('Webhook secret not configured', { status: 500 });
    }

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (expected !== signature) {
      return new Response('Invalid signature', { status: 400 });
    }

    const event = JSON.parse(body);
    if (event.event === 'payment_link.paid') {
      const linkId = event.payload?.payment_link?.entity?.id;
      if (linkId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        await supabase
          .from('payment_records')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('payment_link_id', linkId);
      }
    }
    return new Response('ok');
  }

  // GET callback from Razorpay redirect after payment — redirect user to app
  const appUrl = Deno.env.get('APP_URL') ?? 'https://nivaops.com';
  return new Response(null, { status: 302, headers: { Location: `${appUrl}?payment=done` } });
});
