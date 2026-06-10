-- Link toolbox assignments to daily habits + auto-complete habit when toolbox exercise is done.

ALTER TABLE public.assigned_habits
  ADD COLUMN IF NOT EXISTS toolbox_assignment_id UUID
    REFERENCES public.toolbox_assignments(id) ON DELETE CASCADE;

ALTER TABLE public.assigned_habits
  ALTER COLUMN habit_template_id DROP NOT NULL;

ALTER TABLE public.assigned_habits
  DROP CONSTRAINT IF EXISTS assigned_habits_source_check;

ALTER TABLE public.assigned_habits
  ADD CONSTRAINT assigned_habits_source_check
  CHECK (habit_template_id IS NOT NULL OR toolbox_assignment_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assigned_habits_toolbox_unique
  ON public.assigned_habits (user_id, toolbox_assignment_id)
  WHERE toolbox_assignment_id IS NOT NULL;

COMMENT ON COLUMN public.assigned_habits.toolbox_assignment_id IS
  'When set, this habit row tracks a toolbox exercise in the user daily routine.';

CREATE OR REPLACE FUNCTION public.add_toolbox_assignment_to_habits(p_toolbox_assignment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _toolbox public.toolbox_assignments%ROWTYPE;
  _existing public.assigned_habits%ROWTYPE;
  _new_id UUID;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO _toolbox
  FROM public.toolbox_assignments
  WHERE id = p_toolbox_assignment_id
    AND user_id = _uid
    AND user_delivery_status <> 'inactive';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'toolbox_not_found');
  END IF;

  SELECT * INTO _existing
  FROM public.assigned_habits
  WHERE user_id = _uid
    AND toolbox_assignment_id = p_toolbox_assignment_id;

  IF FOUND THEN
    IF NOT _existing.is_active THEN
      UPDATE public.assigned_habits
      SET is_active = true
      WHERE id = _existing.id;
      RETURN jsonb_build_object('ok', true, 'assignment_id', _existing.id, 'reactivated', true);
    END IF;
    RETURN jsonb_build_object('ok', true, 'assignment_id', _existing.id, 'already_active', true);
  END IF;

  INSERT INTO public.assigned_habits (
    user_id,
    habit_template_id,
    toolbox_assignment_id,
    assigned_by,
    is_active
  )
  VALUES (_uid, NULL, p_toolbox_assignment_id, _uid, true)
  RETURNING id INTO _new_id;

  RETURN jsonb_build_object('ok', true, 'assignment_id', _new_id, 'created', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_toolbox_assignment_from_habits(p_toolbox_assignment_id UUID)
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
  WHERE user_id = _uid
    AND toolbox_assignment_id = p_toolbox_assignment_id
    AND is_active = true;

  GET DIAGNOSTICS _updated = ROW_COUNT;
  IF _updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_complete_linked_habit_on_toolbox()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.habit_completions (user_id, assigned_habit_id, completed_date)
    SELECT NEW.user_id, ah.id, CURRENT_DATE
    FROM public.assigned_habits ah
    WHERE ah.toolbox_assignment_id = NEW.assignment_id
      AND ah.user_id = NEW.user_id
      AND ah.is_active = true
    ON CONFLICT (user_id, assigned_habit_id, completed_date) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_complete_linked_habit_on_toolbox ON public.toolbox_completions;
CREATE TRIGGER trg_auto_complete_linked_habit_on_toolbox
  AFTER INSERT OR UPDATE OF status ON public.toolbox_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_linked_habit_on_toolbox();

GRANT EXECUTE ON FUNCTION public.add_toolbox_assignment_to_habits(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_toolbox_assignment_from_habits(UUID) TO authenticated;
