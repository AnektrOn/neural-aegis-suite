import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPaddleClient, gatewayFetch, type PaddleEnv } from '../_shared/paddle.ts';

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

async function resolvePaddlePriceId(priceId: string, env: PaddleEnv): Promise<string> {
  const res = await gatewayFetch(env, `/prices?external_id=${encodeURIComponent(priceId)}`);
  const data = await res.json();
  if (!data.data?.length) throw new Error(`Price not found: ${priceId}`);
  return data.data[0].id as string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) return json({ error: 'Unauthorized' }, 401);

    const { action, priceId } = await req.json();

    // L'environnement n'est jamais pris du client : il vient de l'abonnement stocké.
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('paddle_subscription_id, paddle_customer_id, status, product_id, environment')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return json({ error: 'No subscription found' }, 404);

    const env: PaddleEnv = sub.environment === 'live' ? 'live' : 'sandbox';


    const paddle = getPaddleClient(env);

    // Manage / cancel / update payment method — Paddle hosted portal.
    if (action === 'portal') {
      const subIds = sub.paddle_subscription_id.startsWith('txn_')
        ? []
        : [sub.paddle_subscription_id];
      const session = await paddle.customerPortalSessions.create(sub.paddle_customer_id, subIds);
      return json({ url: session.urls.general.overview });
    }

    // Upgrade / downgrade — immediate, charged pro rata.
    if (action === 'change_plan') {
      if (!priceId) return json({ error: 'priceId is required' }, 400);
      if (sub.paddle_subscription_id.startsWith('txn_')) {
        return json({ error: 'ONE_TIME_PURCHASE' }, 400);
      }
      const paddlePriceId = await resolvePaddlePriceId(priceId, env);
      const updated = await paddle.subscriptions.update(sub.paddle_subscription_id, {
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        prorationBillingMode: 'prorated_immediately',
      });
      return json({ ok: true, status: updated.status });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('manage-subscription error:', e);
    return json({ error: (e as Error).message }, 400);
  }
});
