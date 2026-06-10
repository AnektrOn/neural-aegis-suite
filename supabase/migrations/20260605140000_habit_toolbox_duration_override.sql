-- Per-habit duration override for toolbox-linked routine items.

ALTER TABLE public.assigned_habits
  ADD COLUMN IF NOT EXISTS duration_override_min INTEGER
    CHECK (
      duration_override_min IS NULL
      OR (duration_override_min >= 1 AND duration_override_min <= 180)
    );

COMMENT ON COLUMN public.assigned_habits.duration_override_min IS
  'User-chosen exercise duration (minutes) for toolbox-linked habits. NULL = use assignment default.';

CREATE OR REPLACE FUNCTION public.set_habit_duration_override(
  p_assignment_id UUID,
  p_duration_min INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _row public.assigned_habits%ROWTYPE;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_duration_min IS NOT NULL AND (p_duration_min < 1 OR p_duration_min > 180) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_duration');
  END IF;

  SELECT * INTO _row
  FROM public.assigned_habits
  WHERE id = p_assignment_id
    AND user_id = _uid
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF _row.toolbox_assignment_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_toolbox_habit');
  END IF;

  UPDATE public.assigned_habits
  SET duration_override_min = p_duration_min
  WHERE id = p_assignment_id;

  RETURN jsonb_build_object('ok', true, 'duration_override_min', p_duration_min);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_habit_duration_override(UUID, INTEGER) TO authenticated;
