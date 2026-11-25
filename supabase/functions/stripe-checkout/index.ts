import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { PUBLIC_PAID_PLANS } from '../_shared/payment-first.ts';
import { PLANS, isPlanKey, type PlanDef, type PlanKey } from '../_shared/stripe-plans.ts';
import {
  countActiveFounders,
  FOUNDERS_LIFETIME_MAX,
  FOUNDERS_PRODUCT_ID,
} from '../_shared/founders-lifetime.ts';
import {
  countActiveLogosAmbassador,
  LOGOS_AMBASSADOR_MAX,
  LOGOS_AMBASSADOR_PRODUCT_ID,
} from '../_shared/logos-ambassador.ts';

function catalogStripePriceId(
  planKey: PlanKey,
  plan: PlanDef,
  stripeSecretKey: string,
): string | undefined {
  const fromPlanEnv = Deno.env.get(`STRIPE_PRICE_ID_${planKey.toUpperCase()}`)?.trim();
  if (fromPlanEnv) return fromPlanEnv;

  const fromProductEnv = Deno.env.get(`STRIPE_PRICE_${plan.productId.toUpperCase()}`)?.trim();
  if (fromProductEnv) return fromProductEnv;

  const isTest = stripeSecretKey.startsWith('sk_test_');
  const isLive = stripeSecretKey.startsWith('sk_live_');
  if (isTest && plan.stripePriceIdTest) return plan.stripePriceIdTest;
  if (isLive && plan.stripePriceIdLive) return plan.stripePriceIdLive;
  return undefined;
}

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
    const backendUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!backendUrl || !serviceKey) throw new Error('Backend not configured');
    const supabase = createClient(
      backendUrl,
      serviceKey,
    );
    const user = authHeader
      ? (await supabase.auth.getUser(authHeader.replace('Bearer ', ''))).data?.user
      : null;

    const body = await req.json().catch(() => ({}));
    const { priceId, origin, companyId, seatQuantity } = body as {
      priceId?: string;
      origin?: string;
      companyId?: string;
      seatQuantity?: number;
    };
    if (!isPlanKey(priceId)) return json({ error: 'Invalid priceId' }, 400);
    const plan = PLANS[priceId];
    if (!user && !PUBLIC_PAID_PLANS.includes(priceId)) return json({ error: 'Unauthorized' }, 401);
    if (!user && (companyId || (seatQuantity != null && seatQuantity !== 1))) {
      return json({ error: 'Public checkout is single-user only' }, 400);
    }

    if (priceId === 'aegis_logos_ambassador_monthly') {
      const sold = await countActiveLogosAmbassador(supabase);
      if (sold >= LOGOS_AMBASSADOR_MAX) {
        return json({ error: 'LOGOS_AMBASSADOR_SOLD_OUT' }, 409);
      }
      if (user) {
        const { data: existingLogos } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', LOGOS_AMBASSADOR_PRODUCT_ID)
          .in('status', ['active', 'trialing'])
          .maybeSingle();
        if (existingLogos) {
          return json({ error: 'LOGOS_ALREADY_OWNED' }, 409);
        }
      }
    }

    if (priceId === 'aegis_founders_lifetime') {
      const sold = await countActiveFounders(supabase);
      if (sold >= FOUNDERS_LIFETIME_MAX) {
        return json({ error: 'FOUNDERS_SOLD_OUT' }, 409);
      }
      const { data: existingFounder } = user ? await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', FOUNDERS_PRODUCT_ID)
        .in('status', ['active', 'trialing'])
        .maybeSingle() : { data: null };
      if (existingFounder) {
        return json({ error: 'FOUNDERS_ALREADY_OWNED' }, 409);
      }
    }

    if (typeof companyId === 'string' && companyId.length > 0) {
      const { data: canManage } = await supabase.rpc('is_company_admin_of', { _uid: user!.id, _company_id: companyId });
      if (canManage !== true) return json({ error: 'Forbidden' }, 403);
    }

    const seats =
      typeof seatQuantity === 'number' && Number.isFinite(seatQuantity) && seatQuantity > 0
        ? Math.floor(seatQuantity)
        : 1;
    const companyMeta: Record<string, string> =
      typeof companyId === 'string' && companyId.length > 0
        ? { companyId, seatQuantity: String(seats) }
        : {};

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

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) throw new Error('Stripe not configured');
    const stripe = new Stripe(stripeSecretKey, {
      // stripe@17 only types its own latest API version; the account runs Basil.
      apiVersion: '2025-08-27.basil' as unknown as Stripe.StripeConfig['apiVersion'],
    });
    const catalogPriceId = catalogStripePriceId(priceId, plan, stripeSecretKey);

    // Réutilise le client Stripe existant si l'email est déjà connu.
    let customerId: string | undefined;
    if (user?.email) {
      const found = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = found.data[0]?.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: plan.interval ? 'subscription' : 'payment',
      customer: customerId,
      customer_email: customerId ? undefined : (user?.email ?? undefined),
      client_reference_id: user?.id,
      ...(!user ? { payment_method_types: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[] } : {}),
      ...(plan.interval ? {} : { customer_creation: 'always' as const }),
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: true },
      ...(customerId
        ? { customer_update: { address: 'auto', name: 'auto' } }
        : {}),
      line_items: [
        catalogPriceId
          ? { quantity: seats, price: catalogPriceId }
          : {
              quantity: seats,
              price_data: {
                currency: plan.currency,
                unit_amount: plan.amount,
                tax_behavior: 'exclusive',
                product_data: { name: plan.label },
                ...(plan.interval ? { recurring: { interval: plan.interval } } : {}),
              },
            },
      ],
      metadata: { ...(user ? { userId: user.id } : { accountFlow: 'payment_first' }), priceId, productId: plan.productId, ...companyMeta },
      ...(plan.interval
        ? {
            subscription_data: {
              metadata: { ...(user ? { userId: user.id } : {}), priceId, productId: plan.productId, ...companyMeta },
            },
          }
        : {
            payment_intent_data: {
              metadata: { ...(user ? { userId: user.id } : {}), priceId, productId: plan.productId, ...companyMeta },
            },
          }),
      invoice_creation: plan.interval ? undefined : { enabled: true },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return json({ url: session.url });
  } catch (e) {
    console.error('stripe-checkout error:', e);
    return json({ error: (e as Error).message }, 400);
  }
});
