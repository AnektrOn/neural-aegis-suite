
-- 1) Coherent demo data ------------------------------------------------------

-- Maxime (3 mois Matrice payés manuellement) : la commission doit refléter 3 x 39 EUR
UPDATE public.affiliate_commissions
SET amount_cents = 11700,
    commission_cents = 2340,
    product_id = 'aegis_matrix_3m',
    note = 'demo: 3 mois Matrice (39 EUR x 3)'
WHERE transaction_ref = 'demo_txn_003';

-- Test1 : 2 prelevements Matrice mensuels -> lui donner un vrai abonnement
INSERT INTO public.subscriptions (user_id, paddle_subscription_id, paddle_customer_id, product_id, price_id, status, environment,
                                  current_period_start, current_period_end, cancel_at_period_end)
SELECT '0461df6a-d6a3-4f24-84a5-6b1f328336b2', 'demo_sub_test1', 'demo_cus_test1', 'aegis_matrix', 'aegis_matrix_monthly', 'active', 'sandbox',
       now() - interval '5 days', now() + interval '25 days', false
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = '0461df6a-d6a3-4f24-84a5-6b1f328336b2');

UPDATE public.profiles SET plan_override = NULL
WHERE id = '0461df6a-d6a3-4f24-84a5-6b1f328336b2';

-- Djanan33 : Ultra 2 echeances sur 6 -> vrai abonnement Ultra
INSERT INTO public.subscriptions (user_id, paddle_subscription_id, paddle_customer_id, product_id, price_id, status, environment,
                                  current_period_start, current_period_end, cancel_at_period_end,
                                  installments_paid, installments_total)
SELECT '9ca20e9d-a623-4aa4-b61a-5aa1c3aed4b4', 'demo_sub_djanan', 'demo_cus_djanan', 'aegis_ultra', 'aegis_ultra_installment', 'active', 'sandbox',
       now() - interval '4 days', now() + interval '26 days', false, 2, 6
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = '9ca20e9d-a623-4aa4-b61a-5aa1c3aed4b4');

UPDATE public.profiles SET plan_override = NULL
WHERE id = '9ca20e9d-a623-4aa4-b61a-5aa1c3aed4b4';

-- Kevinmehler89 : simple inscription sans abonnement -> pas de plan Matrice affiche
UPDATE public.profiles SET plan_override = NULL
WHERE id = '9bae7ec1-177c-444c-89e8-a9ba5dffeb73';

-- 2) Dashboard RPC : exposer le montant encaisse ------------------------------
CREATE OR REPLACE FUNCTION public.get_my_affiliate_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_aff public.affiliates%ROWTYPE; v_uid uuid := auth.uid(); v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('is_affiliate', false); END IF;
  SELECT * INTO v_aff FROM public.affiliates WHERE user_id = v_uid;
  IF v_aff.id IS NULL THEN RETURN jsonb_build_object('is_affiliate', false); END IF;

  SELECT jsonb_build_object(
    'is_affiliate', true,
    'code', v_aff.code,
    'status', v_aff.status,
    'commission_rate', v_aff.commission_rate,
    'clicks', (SELECT count(*) FROM public.affiliate_clicks c WHERE c.affiliate_id = v_aff.id),
    'signups', (SELECT count(*) FROM public.referrals r WHERE r.affiliate_id = v_aff.id),
    'conversions', (SELECT count(*) FROM public.referrals r WHERE r.affiliate_id = v_aff.id AND r.status = 'converted'),
    'pending_cents', COALESCE((SELECT sum(commission_cents) FROM public.affiliate_commissions x WHERE x.affiliate_id = v_aff.id AND x.status IN ('pending','approved')), 0),
    'paid_cents', COALESCE((SELECT sum(commission_cents) FROM public.affiliate_commissions x WHERE x.affiliate_id = v_aff.id AND x.status = 'paid'), 0),
    'referrals', COALESCE((
      SELECT jsonb_agg(t ORDER BY t.created_at DESC) FROM (
        SELECT
          r.id,
          COALESCE(NULLIF(split_part(COALESCE(p.display_name, p.first_name, ''), ' ', 1), ''),
                   'Filleul') || ' ' || upper(substr(r.referred_user_id::text, 1, 4)) AS label,
          r.status,
          r.created_at,
          r.converted_at,
          COALESCE(s.product_id, p.plan_override, 'free') AS plan,
          COALESCE(s.status, CASE WHEN p.plan_override IS NOT NULL THEN 'override' ELSE 'none' END) AS plan_status,
          s.current_period_end,
          s.cancel_at_period_end,
          COALESCE((SELECT sum(x.commission_cents) FROM public.affiliate_commissions x
                    WHERE x.referral_id = r.id), 0)::int AS commission_cents,
          COALESCE((SELECT sum(x.amount_cents) FROM public.affiliate_commissions x
                    WHERE x.referral_id = r.id), 0)::int AS gross_cents,
          (SELECT count(*) FROM public.affiliate_commissions x WHERE x.referral_id = r.id)::int AS payments_count,
          (SELECT max(x.occurred_at) FROM public.affiliate_commissions x WHERE x.referral_id = r.id) AS last_payment_at
        FROM public.referrals r
        LEFT JOIN public.profiles p ON p.id = r.referred_user_id
        LEFT JOIN LATERAL (
          SELECT s2.product_id, s2.status, s2.current_period_end, s2.cancel_at_period_end
          FROM public.subscriptions s2
          WHERE s2.user_id = r.referred_user_id
          ORDER BY s2.created_at DESC LIMIT 1
        ) s ON true
        WHERE r.affiliate_id = v_aff.id
      ) t
    ), '[]'::jsonb),
    'commissions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', x.id,
        'commission_cents', x.commission_cents,
        'amount_cents', x.amount_cents,
        'currency', x.currency,
        'status', x.status,
        'product_id', x.product_id,
        'occurred_at', x.occurred_at
      ) ORDER BY x.occurred_at DESC)
      FROM public.affiliate_commissions x WHERE x.affiliate_id = v_aff.id
    ), '[]'::jsonb)
  ) INTO v_result;
  RETURN v_result;
END; $function$;
