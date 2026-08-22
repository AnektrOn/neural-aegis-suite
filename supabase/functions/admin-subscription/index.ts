import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: callerData } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    const caller = callerData?.user;
    if (!caller) return json({ error: 'Unauthorized' }, 401);

    const { data: role } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!role) return json({ error: 'Admin access required' }, 403);

    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? 'list';
    const userId: string | undefined = body.user_id;
    if (!userId) return json({ error: 'user_id is required' }, 400);

    const { data: subs } = await admin
      .from('subscriptions')
      .select('id, paddle_subscription_id, product_id, price_id, status, current_period_end, cancel_at_period_end')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (action === 'list') return json({ subscriptions: subs ?? [] });

    if (action !== 'cancel' && action !== 'cancel_now') {
      return json({ error: 'Unknown action' }, 400);
    }

    const target = (subs ?? []).find(
      (s) => s.status === 'active' || s.status === 'trialing' || s.status === 'past_due',
    );
    if (!target) return json({ error: 'Aucun abonnement actif pour cet utilisateur' }, 404);

    const stripeId = target.paddle_subscription_id as string;
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-08-27.basil',
    });

    // Achat comptant (pas d'abonnement Stripe) : on coupe l'accès en base uniquement.
    if (!stripeId?.startsWith('sub_')) {
      await admin
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', target.id);
      return json({ ok: true, mode: 'db_only' });
    }

    if (action === 'cancel_now') {
      await stripe.subscriptions.cancel(stripeId);
      await admin
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', target.id);
      return json({ ok: true, mode: 'immediate' });
    }

    await stripe.subscriptions.update(stripeId, { cancel_at_period_end: true });
    await admin
      .from('subscriptions')
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq('id', target.id);
    return json({ ok: true, mode: 'period_end', period_end: target.current_period_end });
  } catch (e) {
    console.error('admin-subscription error:', e);
    return json({ error: (e as Error).message }, 400);
  }
});
