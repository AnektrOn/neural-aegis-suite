CREATE INDEX IF NOT EXISTS idx_user_sessions_user_started_at
  ON public.user_sessions (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id
  ON public.journal_entries (user_id);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id
  ON public.habit_completions (user_id);

CREATE OR REPLACE FUNCTION public.get_affiliate_candidates_admin()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN COALESCE((
    WITH activity AS (
      SELECT user_id, count(*)::integer AS activity_count
      FROM (
        SELECT user_id FROM public.mood_entries
        UNION ALL
        SELECT user_id FROM public.decisions
        UNION ALL
        SELECT user_id FROM public.journal_entries
        UNION ALL
        SELECT user_id FROM public.habit_completions
      ) logs
      GROUP BY user_id
    ),
    latest_sessions AS (
      SELECT user_id, max(started_at) AS last_active_at
      FROM public.user_sessions
      GROUP BY user_id
    ),
    affiliate_users AS (
      SELECT DISTINCT user_id FROM public.affiliates
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', u.id,
        'email', u.email,
        'display_name', COALESCE(NULLIF(TRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), p.display_name),
        'created_at', u.created_at,
        'last_active_at', GREATEST(u.last_sign_in_at, s.last_active_at),
        'activity_count', COALESCE(a.activity_count, 0),
        'is_affiliate', af.user_id IS NOT NULL
      )
      ORDER BY GREATEST(u.last_sign_in_at, s.last_active_at) DESC NULLS LAST,
               COALESCE(a.activity_count, 0) DESC
    )
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN activity a ON a.user_id = u.id
    LEFT JOIN latest_sessions s ON s.user_id = u.id
    LEFT JOIN affiliate_users af ON af.user_id = u.id
    WHERE u.deleted_at IS NULL
  ), '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.get_affiliate_candidates_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_affiliate_candidates_admin() TO authenticated, service_role;