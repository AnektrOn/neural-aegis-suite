-- Allow authenticated users to add/remove catalogue habits in their own tracker.

CREATE OR REPLACE FUNCTION public._user_top_archetypes(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ar.top_archetypes, '{}'::text[])
  FROM public.analysis_results ar
  JOIN public.assessment_sessions s ON s.id = ar.session_id
  WHERE s.user_id = p_user_id
  ORDER BY ar.created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.add_habit_template_to_tracker(p_template_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _tpl public.habit_templates%ROWTYPE;
  _existing public.assigned_habits%ROWTYPE;
  _new_id UUID;
  _archetypes TEXT[];
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO _tpl
  FROM public.habit_templates
  WHERE id = p_template_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'template_not_found');
  END IF;

  _archetypes := public._user_top_archetypes(_uid);
  IF COALESCE(array_length(_tpl.archetype_targets, 1), 0) > 0
     AND NOT (_tpl.archetype_targets && _archetypes) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'archetype_mismatch');
  END IF;

  SELECT * INTO _existing
  FROM public.assigned_habits
  WHERE user_id = _uid
    AND habit_template_id = p_template_id;

  IF FOUND THEN
    IF NOT _existing.is_active THEN
      UPDATE public.assigned_habits
      SET is_active = true
      WHERE id = _existing.id;
      RETURN jsonb_build_object('ok', true, 'assignment_id', _existing.id, 'reactivated', true);
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'assignment_id', _existing.id,
      'already_active', true
    );
  END IF;

  INSERT INTO public.assigned_habits (
    user_id,
    habit_template_id,
    assigned_by,
    is_active
  )
  VALUES (_uid, p_template_id, _uid, true)
  RETURNING id INTO _new_id;

  RETURN jsonb_build_object('ok', true, 'assignment_id', _new_id, 'created', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_habit_from_tracker(p_assignment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _updated INT;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  UPDATE public.assigned_habits
  SET is_active = false
  WHERE id = p_assignment_id
    AND user_id = _uid
    AND is_active = true;

  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_habit_template_to_tracker(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_habit_from_tracker(UUID) TO authenticated;
