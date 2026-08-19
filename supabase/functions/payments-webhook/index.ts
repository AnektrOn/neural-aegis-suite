import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, EventName, type PaddleEnv } from '../_shared/paddle.ts';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }
  return _supabase;
}

const PLAN_LABEL: Record<string, string> = {
  aegis_matrix: 'Matrice',
  aegis_ultra: 'Ultra',
};

async function notifyUser(userId: string, title: string, message: string, link: string) {
  const { error } = await getSupabase()
    .from('notifications')
    .insert({ user_id: userId, title, message, type: 'info', link });
  if (error) console.error('notifyUser:', error.message);
}

async function notifyAdmins(title: string, message: string, link: string) {
  const supabase = getSupabase();
  const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
  if (!admins?.length) return;
  const { error } = await supabase.from('notifications').insert(
    admins.map((a: { user_id: string }) => ({
      user_id: a.user_id,
      title,
      message,
      type: 'admin_payment',
      link,
    })),
  );
  if (error) console.error('notifyAdmins:', error.message);
}

async function sendEmail(userId: string, subject: string, message: string) {
  try {
    await getSupabase().functions.invoke('send-email-notification', {
      body: { type: 'subscription_update', user_id: userId, data: { message, title: subject } },
    });
  } catch (e) {
    console.error('sendEmail:', e);
  }
}

/** Purchase business logic: unlock app, notify user + admins, flag Ultra for the coach. */
async function onPurchaseActivated(userId: string, productId: string, priceId: string) {
  const plan = PLAN_LABEL[productId] ?? productId;

  await notifyUser(
    userId,
    `Accès ${plan} activé`,
    `Votre forfait ${plan} est actif. Toutes les fonctionnalités sont débloquées — commencez par votre Deep Dive.`,
    '/dashboard',
  );

  await sendEmail(
    userId,
    `Bienvenue dans AEGIS ${plan}`,
    `Votre forfait ${plan} est activé. Connectez-vous pour accéder à votre espace complet.`,
  );

  const { data: userData } = await getSupabase().auth.admin.getUserById(userId);
  const email = userData?.user?.email ?? userId;

  if (productId === 'aegis_ultra') {
    await notifyAdmins(
      '🥇 Nouvelle vente ULTRA — action requise',
      `${email} a rejoint l'Inner Circle (${priceId}). Planifier l'audit et l'accompagnement individuel.`,
      '/admin/calls',
    );
  } else {
    await notifyAdmins(
      '🥈 Nouvelle vente Matrice',
      `${email} a activé le forfait ${plan} (${priceId}).`,
      '/admin/users',
    );
  }
}

/** Ultra en mensualités : 6 prélèvements de 1 500 €, puis arrêt automatique. */
const INSTALLMENT_PLANS: Record<string, number> = { aegis_ultra_monthly: 6 };

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;

  const userId = customData?.userId;
  if (!userId) {
    console.error('No userId in customData');
    return;
  }

  const item = items[0];
  const priceId = item.price?.importMeta?.externalId;
  const productId = item.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn('Skipping subscription: missing importMeta.externalId', {
      rawPriceId: item.price?.id,
      rawProductId: item.product?.id,
    });
    return;
  }

  const total = INSTALLMENT_PLANS[priceId] ?? null;

  const { error } = await getSupabase().from('subscriptions').upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      environment: env,
      installments_total: total,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'paddle_subscription_id' },
  );
  if (error) {
    console.error('subscription upsert:', error.message);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    await onPurchaseActivated(userId, productId, priceId);
  }
}


async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, items } = data;
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, product_id, price_id, status')
    .eq('paddle_subscription_id', id)
    .eq('environment', env)
    .maybeSingle();

  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId ?? existing?.price_id;
  const productId = item?.product?.importMeta?.externalId ?? existing?.product_id;

  await supabase
    .from('subscriptions')
    .update({
      status,
      product_id: productId,
      price_id: priceId,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === 'cancel',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', id)
    .eq('environment', env);

  const userId = existing?.user_id as string | undefined;
  if (!userId) return;

  // Payment failure → access restricted immediately.
  if (status === 'past_due' && existing?.status !== 'past_due') {
    await notifyUser(
      userId,
      'Paiement échoué — accès suspendu',
      "Votre dernier paiement n'a pas abouti. Mettez à jour votre moyen de paiement pour retrouver l'accès.",
      '/pricing',
    );
    await sendEmail(
      userId,
      'Paiement échoué — AEGIS',
      "Votre dernier paiement n'a pas abouti et votre accès est suspendu. Mettez à jour votre moyen de paiement.",
    );
    await notifyAdmins('⚠️ Paiement échoué', `Abonnement ${id} en échec de paiement.`, '/admin/users');
    return;
  }

  // Payment recovered.
  if (existing?.status === 'past_due' && (status === 'active' || status === 'trialing')) {
    await notifyUser(userId, 'Paiement régularisé', 'Votre accès complet est rétabli.', '/dashboard');
    return;
  }

  // Plan change (upgrade / downgrade).
  if (productId && existing?.product_id && productId !== existing.product_id) {
    const plan = PLAN_LABEL[productId] ?? productId;
    await notifyUser(
      userId,
      `Forfait mis à jour — ${plan}`,
      `Votre forfait est désormais ${plan}. Le changement est effectif immédiatement.`,
      '/dashboard',
    );
    if (productId === 'aegis_ultra') {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      await notifyAdmins(
        '🥇 Passage en ULTRA — action requise',
        `${userData?.user?.email ?? userId} est passé en Ultra. Planifier l'audit.`,
        '/admin/calls',
      );
    }
  }

  // Cancellation scheduled → keeps access until period end.
  if (scheduledChange?.action === 'cancel') {
    const end = currentBillingPeriod?.endsAt
      ? new Date(currentBillingPeriod.endsAt).toLocaleDateString('fr-FR')
      : null;
    await notifyUser(
      userId,
      'Annulation enregistrée',
      end
        ? `Votre abonnement prendra fin le ${end}. Vous conservez l'accès complet jusqu'à cette date.`
        : "Votre abonnement prendra fin à l'échéance. Vous conservez l'accès jusque-là.",
      '/pricing',
    );
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, installments_total, installments_paid, current_period_end')
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env)
    .maybeSingle();

  // Plan échelonné soldé : l'annulation est volontaire côté plateforme,
  // l'accès reste ouvert jusqu'à la date déjà provisionnée (12 mois).
  const settled =
    !!existing?.installments_total &&
    (existing.installments_paid as number) >= (existing.installments_total as number);

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      current_period_end: settled
        ? existing?.current_period_end
        : (data.currentBillingPeriod?.endsAt ?? data.canceledAt),
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', data.id)
    .eq('environment', env);

  if (existing?.user_id && !settled) {
    await notifyAdmins('Abonnement annulé', `Abonnement ${data.id} annulé.`, '/admin/users');
  }
}

/** Compte les mensualités Ultra et stoppe le prélèvement après la 6e. */
async function handleInstallmentPayment(subscriptionId: string, env: PaddleEnv) {
  const supabase = getSupabase();
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('user_id, installments_paid, installments_total, current_period_start')
    .eq('paddle_subscription_id', subscriptionId)
    .eq('environment', env)
    .maybeSingle();

  const total = sub?.installments_total as number | null;
  if (!sub || !total) return;

  const paid = ((sub.installments_paid as number) ?? 0) + 1;
  const patch: Record<string, unknown> = {
    installments_paid: paid,
    updated_at: new Date().toISOString(),
  };

  if (paid >= total) {
    // Accès Ultra garanti 12 mois à partir du 1er prélèvement.
    const start = sub.current_period_start ? new Date(sub.current_period_start as string) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 12);
    patch.current_period_end = end.toISOString();

    try {
      const paddle = getPaddleClient(env);
      await paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: 'next_billing_period' });
    } catch (e) {
      console.error('installment cancel failed:', e);
      await notifyAdmins(
        '⚠️ Arrêt automatique Ultra échoué',
        `Impossible d'annuler ${subscriptionId} après la ${total}e mensualité. Annuler manuellement.`,
        '/admin/users',
      );
    }

    if (sub.user_id) {
      await notifyUser(
        sub.user_id as string,
        'Ultra intégralement réglé',
        `Votre ${total}e et dernière mensualité est réglée. Aucun autre prélèvement ne sera effectué.`,
        '/dashboard',
      );
    }
  }

  await supabase
    .from('subscriptions')
    .update(patch)
    .eq('paddle_subscription_id', subscriptionId)
    .eq('environment', env);
}

/** One-time purchases (e.g. Ultra upfront) have no subscription entity. */
async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  if (data.subscriptionId) {
    await handleInstallmentPayment(data.subscriptionId, env);
    return;
  }

  const userId = data.customData?.userId;
  const item = data.items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  if (!userId || !priceId) {
    console.warn('Skipping one-time transaction: missing userId or externalId');
    return;
  }

  const productId = priceId.startsWith('aegis_ultra') ? 'aegis_ultra' : 'aegis_matrix';
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 12); // Ultra comptant : 12 mois d'accès

  const { error } = await getSupabase().from('subscriptions').upsert(
    {
      user_id: userId,
      paddle_subscription_id: `txn_${data.id}`,
      paddle_customer_id: data.customerId ?? '',
      product_id: productId,
      price_id: priceId,
      status: 'active',
      current_period_start: start.toISOString(),
      current_period_end: end.toISOString(),
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'paddle_subscription_id' },
  );
  if (error) {
    console.error('one-time upsert:', error.message);
    return;
  }

  await onPurchaseActivated(userId, productId, priceId);
}

/** Échec de paiement isolé — l'accès n'est coupé qu'au passage en past_due. */
async function handleTransactionPaymentFailed(data: any, env: PaddleEnv) {
  if (!data.subscriptionId) return;
  const { data: sub } = await getSupabase()
    .from('subscriptions')
    .select('user_id')
    .eq('paddle_subscription_id', data.subscriptionId)
    .eq('environment', env)
    .maybeSingle();
  if (!sub?.user_id) return;
  await notifyUser(
    sub.user_id as string,
    'Prélèvement refusé',
    "Votre banque a refusé le dernier prélèvement. Mettez à jour votre moyen de paiement pour éviter la suspension.",
    '/pricing',
  );
}


async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
      await handleSubscriptionUpdated(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event.data, env);
      break;
    default:
      console.log('Unhandled event:', event.eventType);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const url = new URL(req.url);
  const env = (url.searchParams.get('env') || 'sandbox') as PaddleEnv;
  try {
    await handleWebhook(req, env);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Webhook error:', e);
    return new Response('Webhook error', { status: 400 });
  }
});
