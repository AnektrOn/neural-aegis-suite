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
  IF v_aff.id IS NULL OR v_aff.status = 'revoked' THEN RETURN jsonb_build_object('is_affiliate', false); END IF;

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
          CASE
            WHEN s.price_id IS NULL THEN NULL
            WHEN s.price_id ILIKE '%installment%' THEN 'installment'
            WHEN s.price_id ILIKE '%year%' OR s.price_id ILIKE '%annual%' THEN 'yearly'
            WHEN s.price_id ILIKE '%month%' THEN 'monthly'
            WHEN s.current_period_start IS NOT NULL AND s.current_period_end IS NOT NULL
                 AND (s.current_period_end - s.current_period_start) > interval '200 days' THEN 'yearly'
            ELSE 'monthly'
          END AS billing_cycle,
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
          SELECT s2.product_id, s2.price_id, s2.status, s2.current_period_start, s2.current_period_end, s2.cancel_at_period_end
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

CREATE OR REPLACE FUNCTION public.replace_assessment_core_catalog(p_template_slug text, p_questions jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_template_id uuid;
  q jsonb;
  o jsonb;
  v_qid uuid;
  v_meta jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'superadmin'::public.app_role)) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_template_slug <> 'archetype-v1' THEN
    RAISE EXCEPTION 'Unsupported template slug: %', p_template_slug;
  END IF;

  IF p_questions IS NULL OR jsonb_array_length(p_questions) = 0 THEN
    RAISE EXCEPTION 'Empty question payload';
  END IF;

  SELECT id INTO v_template_id
  FROM public.assessment_templates
  WHERE slug = p_template_slug AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', p_template_slug;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_template_slug));

  DELETE FROM public.assessment_options ao
  USING public.assessment_questions aq
  WHERE ao.question_id = aq.id
    AND aq.template_id = v_template_id
    AND COALESCE((aq.meta->>'is_appendix')::boolean, false) = false;

  DELETE FROM public.assessment_questions aq
  WHERE aq.template_id = v_template_id
    AND COALESCE((aq.meta->>'is_appendix')::boolean, false) = false;

  FOR q IN SELECT value FROM jsonb_array_elements(p_questions)
  LOOP
    v_meta := COALESCE(q->'meta', '{}'::jsonb);

    INSERT INTO public.assessment_questions (
      template_id, position, question_type, prompt_fr, prompt_en, helper_fr, helper_en, dimension, is_required, meta
    ) VALUES (
      v_template_id,
      (q->>'position')::int,
      (q->>'question_type')::public.assessment_question_type,
      q->>'prompt_fr',
      q->>'prompt_en',
      NULLIF(q->>'helper_fr', ''),
      NULLIF(q->>'helper_en', ''),
      NULLIF(q->>'dimension', ''),
      COALESCE((q->>'is_required')::boolean, true),
      v_meta
    )
    RETURNING id INTO v_qid;

    IF q->'options' IS NOT NULL AND jsonb_typeof(q->'options') = 'array' THEN
      FOR o IN SELECT value FROM jsonb_array_elements(q->'options')
      LOOP
        INSERT INTO public.assessment_options (
          question_id, position, label_fr, label_en, archetype_weights, shadow_weights, polarity_weights, value
        ) VALUES (
          v_qid,
          (o->>'position')::int,
          o->>'label_fr',
          o->>'label_en',
          COALESCE(o->'archetype_weights', '{}'::jsonb),
          COALESCE(o->'shadow_weights', '{}'::jsonb),
          COALESCE(o->'polarity_weights', '[]'::jsonb),
          CASE
            WHEN o->'value' IS NULL OR o->'value' = 'null'::jsonb THEN NULL
            ELSE (o->>'value')::numeric
          END
        );
      END LOOP;
    END IF;
  END LOOP;

  RETURN true;
END;
$function$;

DROP POLICY IF EXISTS "Users manage own synapse interactions" ON public.aegis_user_card_interactions;
CREATE POLICY "Users read own synapse interactions" ON public.aegis_user_card_interactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

REVOKE EXECUTE ON FUNCTION public.enqueue_newsletter_edition_emails(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_newsletter_edition_emails(uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.dispatch_newsletter_email_queue(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_newsletter_email_queue(integer) TO service_role;