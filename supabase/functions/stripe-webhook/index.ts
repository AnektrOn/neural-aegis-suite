import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { PLANS, isPlanKey } from '../_shared/stripe-plans.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-08-27.basil',
});

const PLAN_LABEL: Record<string, string> = {
  aegis_matrix: 'Matrice',
  aegis_ultra: 'Ultra',
};

async function notifyUser(userId: string, title: string, message: string, link: string) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type: 'info', link });
  if (error) console.error('notifyUser:', error.message);
}

async function notifyAdmins(title: string, message: string, link: string) {
  const { data: admins } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', ['superadmin', 'admin']);
  if (!admins?.length) return;
  await supabase.from('notifications').insert(
    admins.map((a: { user_id: string }) => ({
      user_id: a.user_id,
      title,
      message,
      type: 'admin_payment',
      link,
    })),
  );
}

async function recordAffiliateCommission(
  userId: string,
  transactionRef: string,
  amountCents: number,
  currency: string,
  productId: string | null,
) {
  if (!userId || !amountCents) return;
  const { error } = await supabase.rpc('record_affiliate_commission', {
    p_user_id: userId,
    p_transaction_ref: transactionRef,
    p_amount_cents: amountCents,
    p_currency: (currency || 'eur').toUpperCase(),
    p_product_id: productId,
  });
  if (error) console.error('recordAffiliateCommission:', error.message);
}

async function onPurchaseActivated(userId: string, productId: string, priceId: string) {
  const plan = PLAN_LABEL[productId] ?? productId;
  await notifyUser(
    userId,
    `Accès ${plan} activé`,
    `Votre forfait ${plan} est actif. Toutes les fonctionnalités sont débloquées.`,
    '/dashboard',
  );
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email ?? userId;
  if (productId === 'aegis_ultra') {
    await notifyAdmins(
      '🥇 Nouvelle vente ULTRA — action requise',
      `${email} a rejoint l'Inner Circle (${priceId}). Planifier l'audit.`,
      '/admin/calls',
    );
  } else {
    await notifyAdmins('🥈 Nouvelle vente Matrice', `${email} a activé ${plan} (${priceId}).`, '/admin/users');
  }
}

function months(from: Date, n: number) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

async function upsertSubscription(row: Record<string, unknown>, livemode = true) {
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      ...row,
      environment: livemode ? 'live' : 'sandbox',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'paddle_subscription_id',
    });
  if (error) console.error('subscription upsert:', error.message);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  const userId = (md.userId as string) || (session.client_reference_id ?? '');
  const priceId = md.priceId as string;
  const companyId = md.companyId as string | undefined;
  const seatQuantity = Number(md.seatQuantity ?? '');
  if (companyId && Number.isFinite(seatQuantity) && seatQuantity > 0) {
    const customerId = (session.customer as string) ?? null;
    await supabase
      .from('companies')
      .update({
        seat_limit: Math.floor(seatQuantity),
        ...(customerId ? { stripe_customer_id: customerId } : {}),
      })
      .eq('id', companyId);
  }
  if (!userId || !isPlanKey(priceId)) return;
  const plan = PLANS[priceId];
  const customerId = (session.customer as string) ?? '';

  if (session.mode === 'payment') {
    const start = new Date();
    await upsertSubscription({
      user_id: userId,
      paddle_subscription_id: `pi_${session.id}`,
      paddle_customer_id: customerId,
      product_id: plan.productId,
      price_id: priceId,
      status: 'active',
      current_period_start: start.toISOString(),
      current_period_end: months(start, 12),
    }, session.livemode !== false);
    await recordAffiliateCommission(
      userId,
      `stripe:${session.id}`,
      session.amount_total ?? plan.amount,
      session.currency ?? 'eur',
      plan.productId,
    );
    await onPurchaseActivated(userId, plan.productId, priceId);
    return;
  }

  const subId = session.subscription as string | null;
  if (!subId) return;
  const sub = await stripe.subscriptions.retrieve(subId);
  const item = sub.items.data[0];
  await upsertSubscription({
    user_id: userId,
    paddle_subscription_id: sub.id,
    paddle_customer_id: customerId,
    product_id: plan.productId,
    price_id: priceId,
    status: sub.status,
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    installments_total: plan.installments ?? null,
  }, session.livemode !== false);
  if (sub.status === 'active' || sub.status === 'trialing') {
    await onPurchaseActivated(userId, plan.productId, priceId);
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, status, price_id, product_id')
    .eq('paddle_subscription_id', sub.id)
    .maybeSingle();

  const item = sub.items.data[0];
  const newPriceId = (item?.price?.lookup_key as string | undefined)
    ?? (item?.price?.metadata?.planKey as string | undefined)
    ?? (existing?.price_id as string | undefined)
    ?? null;

  await supabase
    .from('subscriptions')
    .update({
      status: sub.status,
      ...(newPriceId ? { price_id: newPriceId } : {}),
      current_period_start: item?.current_period_start
        ? new Date(item.current_period_start * 1000).toISOString()
        : null,
      current_period_end: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', sub.id);

  const userId = existing?.user_id as string | undefined;
  if (!userId) return;

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const email = userData?.user?.email ?? userId;

  // Changement de formule
  if (newPriceId && existing?.price_id && newPriceId !== existing.price_id) {
    await notifyAdmins(
      '🔄 Changement de formule',
      `${email} est passé de ${existing.price_id} à ${newPriceId}.`,
      '/admin/users',
    );
  }

  // Résiliation programmée
  if (sub.cancel_at_period_end) {
    await notifyAdmins(
      '🛑 Résiliation programmée',
      `${email} a programmé l'arrêt de son abonnement en fin de période.`,
      '/admin/users',
    );
  }

  if (sub.status === 'past_due' && existing?.status !== 'past_due') {
    await notifyUser(
      userId,
      'Paiement échoué — accès suspendu',
      "Votre dernier paiement n'a pas abouti. Mettez à jour votre moyen de paiement.",
      '/pricing',
    );
    await notifyAdmins('⚠️ Paiement échoué', `Abonnement ${sub.id} en échec (${email}).`, '/admin/users');
  } else if (existing?.status === 'past_due' && sub.status === 'active') {
    await notifyUser(userId, 'Paiement régularisé', 'Votre accès complet est rétabli.', '/dashboard');
    await notifyAdmins('✅ Paiement régularisé', `${email} a régularisé son paiement.`, '/admin/users');
  }
}


async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, installments_total, installments_paid, current_period_end')
    .eq('paddle_subscription_id', sub.id)
    .maybeSingle();

  const settled =
    !!existing?.installments_total &&
    ((existing.installments_paid as number) ?? 0) >= (existing.installments_total as number);

  await supabase
    .from('subscriptions')
    .update({
      status: settled ? 'active' : 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', sub.id);

  if (existing?.user_id && !settled) {
    await notifyAdmins('Abonnement annulé', `Abonnement ${sub.id} annulé.`, '/admin/users');
  }
}

/** Facilité de paiement Ultra : 6 prélèvements puis arrêt automatique, accès 12 mois. */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subId = (invoice as unknown as { subscription?: string }).subscription;
  if (!subId) return;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id, product_id, installments_paid, installments_total, current_period_start')
    .eq('paddle_subscription_id', subId)
    .maybeSingle();
  if (!sub) return;

  await recordAffiliateCommission(
    sub.user_id as string,
    `stripe:${invoice.id}`,
    invoice.amount_paid ?? 0,
    invoice.currency ?? 'eur',
    (sub.product_id as string) ?? null,
  );

  {
    const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id as string);
    const email = userData?.user?.email ?? (sub.user_id as string);
    const amount = ((invoice.amount_paid ?? 0) / 100).toFixed(2);
    const currency = (invoice.currency ?? 'eur').toUpperCase();
    const reason = (invoice as unknown as { billing_reason?: string }).billing_reason;
    const isRenewal = reason === 'subscription_cycle';
    await notifyAdmins(
      isRenewal ? '🔁 Renouvellement encaissé' : '💶 Paiement encaissé',
      `${email} — ${amount} ${currency} (${PLAN_LABEL[(sub.product_id as string) ?? ''] ?? sub.product_id}).`,
      '/admin/users',
    );
  }

  const total = sub.installments_total as number | null;
  if (!total) return;

  // Atomic increment to resist webhook replays racing before event ledger insert
  const { data: incremented, error: incErr } = await supabase.rpc('increment_installments_paid' as never, {
    p_subscription_id: subId,
  } as never);

  // Fallback if RPC not yet deployed: guarded update
  let paid = ((sub.installments_paid as number) ?? 0) + 1;
  if (!incErr && incremented && typeof incremented === 'object' && 'installments_paid' in (incremented as object)) {
    paid = (incremented as { installments_paid: number }).installments_paid;
  } else {
    const { data: fresh } = await supabase
      .from('subscriptions')
      .select('installments_paid')
      .eq('paddle_subscription_id', subId)
      .maybeSingle();
    const current = (fresh?.installments_paid as number) ?? 0;
    // Only bump if still at expected previous value (best-effort without RPC)
    if (current === ((sub.installments_paid as number) ?? 0)) {
      paid = current + 1;
      await supabase
        .from('subscriptions')
        .update({ installments_paid: paid, updated_at: new Date().toISOString() })
        .eq('paddle_subscription_id', subId)
        .eq('installments_paid', current);
    } else {
      paid = current;
    }
  }

  if (paid >= total) {
    const start = sub.current_period_start ? new Date(sub.current_period_start as string) : new Date();
    const patch: Record<string, unknown> = {
      current_period_end: months(start, 12),
      updated_at: new Date().toISOString(),
    };
    try {
      await stripe.subscriptions.update(subId, { cancel_at_period_end: true });
    } catch (e) {
      console.error('installment cancel failed:', e);
      await notifyAdmins(
        '⚠️ Arrêt automatique Ultra échoué',
        `Impossible d'arrêter ${subId} après la ${total}e mensualité.`,
        '/admin/users',
      );
    }
    await supabase.from('subscriptions').update(patch).eq('paddle_subscription_id', subId);
    if (sub.user_id) {
      await notifyUser(
        sub.user_id as string,
        'Ultra intégralement réglé',
        `Votre ${total}e et dernière mensualité est réglée. Aucun autre prélèvement ne sera effectué.`,
        '/dashboard',
      );
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subId = (invoice as unknown as { subscription?: string }).subscription;
  if (!subId) return;
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, status')
    .eq('paddle_subscription_id', subId)
    .maybeSingle();
  if (!existing?.user_id) return;

  await supabase
    .from('subscriptions')
    .update({ status: 'past_due', updated_at: new Date().toISOString() })
    .eq('paddle_subscription_id', subId);

  await notifyUser(
    existing.user_id as string,
    'Paiement échoué — accès suspendu',
    "Votre dernier paiement n'a pas abouti. Mettez à jour votre moyen de paiement dans les tarifs.",
    '/pricing',
  );
  await notifyAdmins(
    '⚠️ Paiement échoué (invoice.payment_failed)',
    `Abonnement ${subId} — invoice ${invoice.id}.`,
    '/admin/users',
  );

  // Best-effort email via send-email-notification
  try {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'subscription_update',
        user_id: existing.user_id,
        data: {
          title: 'Paiement échoué — accès suspendu',
          message:
            "Votre dernier paiement Stripe n'a pas abouti. Mettez à jour votre carte sur la page Tarifs pour rétablir l'accès.",
          skip_in_app: true,
        },
      }),
    });
  } catch (e) {
    console.error('payment_failed email:', e);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const invoiceId =
    typeof charge.invoice === 'string'
      ? charge.invoice
      : (charge.invoice as { id?: string } | null)?.id;
  const txRef = invoiceId
    ? `stripe:${invoiceId}`
    : charge.payment_intent
      ? `stripe:${charge.payment_intent}`
      : null;
  if (!txRef) return;

  // Reverse affiliate commission when promised by Ambassador policy
  const { error } = await supabase
    .from('affiliate_commissions')
    .update({ status: 'reversed', note: `Refunded charge ${charge.id}` })
    .eq('transaction_ref', txRef)
    .neq('status', 'reversed');
  if (error) console.error('clawback commission:', error.message);

  await notifyAdmins(
    '↩️ Remboursement Stripe',
    `Charge ${charge.id} remboursée (${((charge.amount_refunded ?? 0) / 100).toFixed(2)}). Commission annulée si présente.`,
    '/admin/users',
  );
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (e) {
    console.error('signature verification failed:', e);
    return new Response('Invalid signature', { status: 400 });
  }

  // Idempotency: skip already-processed Stripe event ids
  const { error: ledgerErr } = await supabase.from('stripe_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
  });
  if (ledgerErr) {
    if (ledgerErr.code === '23505') {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('stripe_webhook_events insert:', ledgerErr.message);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        console.log('Unhandled event:', event.type);
    }
  } catch (e) {
    console.error('webhook handler error:', e);
    // Allow Stripe to retry: remove ledger row so next attempt reprocesses
    await supabase.from('stripe_webhook_events').delete().eq('event_id', event.id);
    return new Response('Handler error', { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
