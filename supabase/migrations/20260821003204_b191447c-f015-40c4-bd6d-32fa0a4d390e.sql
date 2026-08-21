CREATE OR REPLACE FUNCTION public.get_affiliate_candidates_admin()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(x ORDER BY (x->>'last_active_at') DESC NULLS LAST, (x->>'activity_count')::int DESC)
    FROM (
      SELECT jsonb_build_object(
        'user_id', u.id,
        'email', u.email,
        'display_name', COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), p.display_name),
        'created_at', u.created_at,
        'last_active_at', GREATEST(
          u.last_sign_in_at,
          (SELECT max(s.started_at) FROM public.user_sessions s WHERE s.user_id = u.id)
        ),
        'activity_count',
          (SELECT count(*) FROM public.mood_entries m WHERE m.user_id = u.id)
          + (SELECT count(*) FROM public.decisions d WHERE d.user_id = u.id)
          + (SELECT count(*) FROM public.journal_entries j WHERE j.user_id = u.id)
          + (SELECT count(*) FROM public.habit_completions h WHERE h.user_id = u.id),
        'is_affiliate', EXISTS (SELECT 1 FROM public.affiliates a WHERE a.user_id = u.id)
      ) AS x
      FROM auth.users u
      LEFT JOIN public.profiles p ON p.id = u.id
      WHERE u.deleted_at IS NULL
    ) t
  ), '[]'::jsonb);
END; $$;
GRANT EXECUTE ON FUNCTION public.get_affiliate_candidates_admin() TO authenticated;