import Stripe from 'npm:stripe@17';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { canProvisionPaidAccount } from '../_shared/payment-first.ts';

Deno.serve(async (req) => {
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const body = await req.json();
    if (typeof body.sessionId !== 'string' || !/^cs_(live|test)_[A-Za-z0-9]{10,250}$/.test(body.sessionId)) {
      return json({ error: 'Invalid session' }, 400);
    }
    const key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!key) return json({ error: 'Not configured' }, 503);
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(body.sessionId);
    return json({
      paid: canProvisionPaidAccount(session),
      accountReady: canProvisionPaidAccount(session) && Boolean(session.metadata?.userId),
    });
  } catch {
    return json({ error: 'Unable to verify checkout' }, 400);
  }
});