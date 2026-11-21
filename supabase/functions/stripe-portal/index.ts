import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: userData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    const user = userData?.user;
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('paddle_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const customerId = sub?.paddle_customer_id as string | undefined;
    if (!customerId) return json({ error: 'No customer found' }, 404);

    const { origin } = await req.json().catch(() => ({ origin: undefined }));
    const ALLOWED_ORIGINS = new Set([
      'https://aegis.humancatalystbeacon.com',
      'https://neural-aegis-suite.lovable.app',
      'https://id-preview--7e055f5e-19d7-4fcc-af86-05590e0fc958.lovable.app',
    ]);
    let baseUrl = 'https://aegis.humancatalystbeacon.com';
    if (typeof origin === 'string') {
      try {
        const parsed = new URL(origin).origin;
        if (ALLOWED_ORIGINS.has(parsed)) baseUrl = parsed;
      } catch { /* keep default */ }
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      // stripe@17 only types its own latest API version; the account runs Basil.
      apiVersion: '2025-08-27.basil' as unknown as Stripe.StripeConfig['apiVersion'],
    });
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/pricing`,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('stripe-portal error:', e);
    return json({ error: (e as Error).message }, 400);
  }
});
