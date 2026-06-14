-- Admin: reset T1 (onboarding assessment) and/or T2 (70Q deep dive) results for one user.

CREATE OR REPLACE FUNCTION public.reset_user_archetype_results(
  p_user_id UUID,
  p_reset_t1 BOOLEAN DEFAULT TRUE,
  p_reset_t2 BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _session_ids UUID[];
  _sessions_deleted INT := 0;
  _snapshots_deleted INT := 0;
  _deepdive_deleted INT := 0;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'admin_required');
  END IF;

  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_id_required');
  END IF;

  IF NOT p_reset_t1 AND NOT p_reset_t2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'nothing_to_reset');
  END IF;

  IF p_reset_t1 THEN
    SELECT COALESCE(array_agg(id), '{}')
    INTO _session_ids
    FROM public.assessment_sessions
    WHERE user_id = p_user_id;

    IF cardinality(_session_ids) > 0 THEN
      DELETE FROM public.recommendation_tools
      WHERE user_id = p_user_id
         OR session_id = ANY(_session_ids);

      DELETE FROM public.archetype_scores
      WHERE user_id = p_user_id
         OR session_id = ANY(_session_ids);

      DELETE FROM public.analysis_results
      WHERE user_id = p_user_id
         OR session_id = ANY(_session_ids);

      DELETE FROM public.assessment_responses
      WHERE user_id = p_user_id
         OR session_id = ANY(_session_ids);

      DELETE FROM public.assessment_sessions
      WHERE user_id = p_user_id;

      GET DIAGNOSTICS _sessions_deleted = ROW_COUNT;
    END IF;

    DELETE FROM public.archetype_profile_snapshots
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS _snapshots_deleted = ROW_COUNT;
  END IF;

  IF p_reset_t2 THEN
    DELETE FROM public.deepdive_responses
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS _deepdive_deleted = ROW_COUNT;
  END IF;

  BEGIN
    PERFORM public.refresh_archetype_scores_by_user();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', p_user_id,
    't1_sessions_deleted', _sessions_deleted,
    't1_snapshots_deleted', _snapshots_deleted,
    't2_responses_deleted', _deepdive_deleted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_user_archetype_results(UUID, BOOLEAN, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.reset_user_archetype_results(UUID, BOOLEAN, BOOLEAN) IS
  'Admin only — wipe T1 onboarding (sessions, responses, scores, snapshots) and/or T2 deep-dive responses for one user.';

NOTIFY pgrst, 'reload schema';
