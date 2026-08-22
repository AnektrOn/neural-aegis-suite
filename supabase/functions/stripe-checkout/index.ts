import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { PLANS, isPlanKey } from '../_shared/stripe-plans.ts';

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

    const body = await req.json().catch(() => ({}));
    const { priceId, origin } = body as { priceId?: string; origin?: string };
    if (!isPlanKey(priceId)) return json({ error: 'Invalid priceId' }, 400);
    const plan = PLANS[priceId];

    // Seules les origines officielles sont acceptées : l'iframe de preview
    // renverrait l'utilisateur sur un domaine jetable après paiement.
    const ALLOWED_ORIGINS = [
      'https://aegis.humancatalystbeacon.com',
      'https://neural-aegis-suite.lovable.app',
      'http://localhost:8080',
    ];
    const baseUrl = typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin.replace(/\/$/, ''))
      ? origin.replace(/\/$/, '')
      : 'https://aegis.humancatalystbeacon.com';

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-08-27.basil',
    });

    // Réutilise le client Stripe existant si l'email est déjà connu.
    let customerId: string | undefined;
    if (user.email) {
      const found = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = found.data[0]?.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: plan.interval ? 'subscription' : 'payment',
      customer: customerId,
      customer_email: customerId ? undefined : (user.email ?? undefined),
      client_reference_id: user.id,
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: plan.amount,
            product_data: { name: plan.label },
            ...(plan.interval ? { recurring: { interval: plan.interval } } : {}),
          },
        },
      ],
      metadata: { userId: user.id, priceId, productId: plan.productId },
      ...(plan.interval
        ? { subscription_data: { metadata: { userId: user.id, priceId, productId: plan.productId } } }
        : { payment_intent_data: { metadata: { userId: user.id, priceId, productId: plan.productId } } }),
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('stripe-checkout error:', e);
    return json({ error: (e as Error).message }, 400);
  }
});
