-- Admin ambassador tracking: richer KPIs, 30-day series, funnel, landing paths.
-- Also allow authenticated admins to SELECT click/referral rows (RLS already gates by role).

GRANT SELECT ON public.affiliate_clicks TO authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT SELECT ON public.affiliate_commissions TO authenticated;

CREATE OR REPLACE FUNCTION public.get_affiliates_admin_tracking(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer := GREATEST(1, LEAST(COALESCE(p_days, 30), 90));
  v_since timestamptz := now() - make_interval(days => v_days);
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN jsonb_build_object(
    'days', v_days,
    'kpis', jsonb_build_object(
      'affiliates', (SELECT count(*) FROM public.affiliates),
      'active', (SELECT count(*) FROM public.affiliates WHERE status = 'active'),
      'clicks', (SELECT count(*) FROM public.affiliate_clicks),
      'signups', (SELECT count(*) FROM public.referrals),
      'conversions', (SELECT count(*) FROM public.referrals WHERE status = 'converted'),
      'pending_cents', COALESCE((
        SELECT sum(commission_cents) FROM public.affiliate_commissions
        WHERE status IN ('pending', 'approved')
      ), 0),
      'paid_cents', COALESCE((
        SELECT sum(commission_cents) FROM public.affiliate_commissions WHERE status = 'paid'
      ), 0),
      'clicks_30d', (SELECT count(*) FROM public.affiliate_clicks WHERE created_at >= v_since),
      'signups_30d', (SELECT count(*) FROM public.referrals WHERE created_at >= v_since),
      'conversions_30d', (
        SELECT count(*) FROM public.referrals
        WHERE COALESCE(converted_at, created_at) >= v_since AND status = 'converted'
      ),
      'gross_30d_cents', COALESCE((
        SELECT sum(amount_cents) FROM public.affiliate_commissions WHERE occurred_at >= v_since
      ), 0),
      'commission_30d_cents', COALESCE((
        SELECT sum(commission_cents) FROM public.affiliate_commissions WHERE occurred_at >= v_since
      ), 0)
    ),
    'funnel', jsonb_build_object(
      'clicks', (SELECT count(*) FROM public.affiliate_clicks),
      'signups', (SELECT count(*) FROM public.referrals),
      'conversions', (SELECT count(*) FROM public.referrals WHERE status = 'converted')
    ),
    'daily', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'day', g.day::date,
        'clicks', COALESCE(c.n, 0),
        'signups', COALESCE(s.n, 0),
        'conversions', COALESCE(v.n, 0)
      ) ORDER BY g.day)
      FROM generate_series(
        ((now() AT TIME ZONE 'utc')::date - (v_days - 1)),
        (now() AT TIME ZONE 'utc')::date,
        interval '1 day'
      ) AS g(day)
      LEFT JOIN (
        SELECT created_at::date AS day, count(*)::int AS n
        FROM public.affiliate_clicks
        WHERE created_at >= v_since
        GROUP BY 1
      ) c ON c.day = g.day::date
      LEFT JOIN (
        SELECT created_at::date AS day, count(*)::int AS n
        FROM public.referrals
        WHERE created_at >= v_since
        GROUP BY 1
      ) s ON s.day = g.day::date
      LEFT JOIN (
        SELECT COALESCE(converted_at, created_at)::date AS day, count(*)::int AS n
        FROM public.referrals
        WHERE status = 'converted' AND COALESCE(converted_at, created_at) >= v_since
        GROUP BY 1
      ) v ON v.day = g.day::date
    ), '[]'::jsonb),
    'landing_paths', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('path', t.path, 'clicks', t.clicks) ORDER BY t.clicks DESC)
      FROM (
        SELECT
          COALESCE(NULLIF(btrim(landing_path), ''), '/pricing') AS path,
          count(*)::int AS clicks
        FROM public.affiliate_clicks
        GROUP BY 1
        ORDER BY count(*) DESC
        LIMIT 12
      ) t
    ), '[]'::jsonb),
    'affiliates', COALESCE((
      SELECT jsonb_agg(row_data ORDER BY (row_data->>'created_at') DESC)
      FROM (
        SELECT jsonb_build_object(
          'id', a.id,
          'user_id', a.user_id,
          'email', u.email,
          'display_name', p.display_name,
          'code', a.code,
          'status', a.status,
          'commission_rate', a.commission_rate,
          'notes', a.notes,
          'created_at', a.created_at,
          'clicks', (SELECT count(*) FROM public.affiliate_clicks c WHERE c.affiliate_id = a.id),
          'signups', (SELECT count(*) FROM public.referrals r WHERE r.affiliate_id = a.id),
          'conversions', (
            SELECT count(*) FROM public.referrals r
            WHERE r.affiliate_id = a.id AND r.status = 'converted'
          ),
          'pending_cents', COALESCE((
            SELECT sum(commission_cents) FROM public.affiliate_commissions x
            WHERE x.affiliate_id = a.id AND x.status IN ('pending', 'approved')
          ), 0),
          'paid_cents', COALESCE((
            SELECT sum(commission_cents) FROM public.affiliate_commissions x
            WHERE x.affiliate_id = a.id AND x.status = 'paid'
          ), 0),
          'clicks_30d', (
            SELECT count(*) FROM public.affiliate_clicks c
            WHERE c.affiliate_id = a.id AND c.created_at >= v_since
          ),
          'signups_30d', (
            SELECT count(*) FROM public.referrals r
            WHERE r.affiliate_id = a.id AND r.created_at >= v_since
          ),
          'conversions_30d', (
            SELECT count(*) FROM public.referrals r
            WHERE r.affiliate_id = a.id
              AND r.status = 'converted'
              AND COALESCE(r.converted_at, r.created_at) >= v_since
          ),
          'last_click_at', (
            SELECT max(c.created_at) FROM public.affiliate_clicks c WHERE c.affiliate_id = a.id
          ),
          'top_paths', COALESCE((
            SELECT jsonb_agg(jsonb_build_object('path', t.path, 'clicks', t.clicks) ORDER BY t.clicks DESC)
            FROM (
              SELECT
                COALESCE(NULLIF(btrim(c.landing_path), ''), '/pricing') AS path,
                count(*)::int AS clicks
              FROM public.affiliate_clicks c
              WHERE c.affiliate_id = a.id
              GROUP BY 1
              ORDER BY count(*) DESC
              LIMIT 5
            ) t
          ), '[]'::jsonb),
          'recent_referrals', COALESCE((
            SELECT jsonb_agg(ref_row ORDER BY (ref_row->>'created_at') DESC)
            FROM (
              SELECT jsonb_build_object(
                'id', r.id,
                'email', ru.email,
                'label', COALESCE(NULLIF(split_part(COALESCE(rp.display_name, rp.first_name, ''), ' ', 1), ''), 'Filleul'),
                'status', r.status,
                'created_at', r.created_at,
                'converted_at', r.converted_at,
                'plan', COALESCE(sub.product_id, rp.plan_override, 'free')
              ) AS ref_row
              FROM public.referrals r
              LEFT JOIN auth.users ru ON ru.id = r.referred_user_id
              LEFT JOIN public.profiles rp ON rp.id = r.referred_user_id
              LEFT JOIN LATERAL (
                SELECT s2.product_id
                FROM public.subscriptions s2
                WHERE s2.user_id = r.referred_user_id
                ORDER BY s2.created_at DESC
                LIMIT 1
              ) sub ON true
              WHERE r.affiliate_id = a.id
              ORDER BY r.created_at DESC
              LIMIT 8
            ) refs
          ), '[]'::jsonb)
        ) AS row_data
        FROM public.affiliates a
        LEFT JOIN auth.users u ON u.id = a.user_id
        LEFT JOIN public.profiles p ON p.id = a.user_id
      ) listed
    ), '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_affiliates_admin_tracking(integer) TO authenticated;
