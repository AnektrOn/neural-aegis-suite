-- 0021_rich_onboarding_harvest.sql
-- Executive mobile-first onboarding harvest table & cockpit population RPC.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.user_executive_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title TEXT,
  company_stage TEXT,
  team_size TEXT,
  annual_revenue_bracket TEXT,
  governance_structure TEXT,
  primary_stakeholders JSONB NOT NULL DEFAULT '[]'::jsonb,
  urgent_decision_title TEXT,
  urgent_decision_stakes TEXT,
  urgent_decision_horizon TEXT,
  dominant_decision_friction TEXT,
  raw_dilemma_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  peak_focus_time TEXT,
  stress_symptoms TEXT[] NOT NULL DEFAULT '{}'::text[],
  onboarding_step_reached INT NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_executive_profiles TO authenticated;
GRANT ALL ON public.user_executive_profiles TO service_role;

ALTER TABLE public.user_executive_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own executive profile" ON public.user_executive_profiles;
CREATE POLICY "Users can manage their own executive profile"
  ON public.user_executive_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_executive_profiles_updated_at ON public.user_executive_profiles;
CREATE TRIGGER update_user_executive_profiles_updated_at
  BEFORE UPDATE ON public.user_executive_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Preserve existing notification trigger behavior while allowing silent starter seeding during onboarding.
CREATE OR REPLACE FUNCTION public.notify_user_on_toolbox_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  _should BOOLEAN := false;
  _title TEXT;
BEGIN
  IF current_setting('aegis.skip_toolbox_notify', true) = '1' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    _should := NEW.user_delivery_status IN ('active', 'assigned');
  ELSIF TG_OP = 'UPDATE' THEN
    _should := NEW.user_delivery_status IN ('active', 'assigned')
      AND COALESCE(OLD.user_delivery_status, '') NOT IN ('active', 'assigned');
  END IF;

  IF NOT _should OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  _title := COALESCE(
    NULLIF(BTRIM(NEW.title_i18n->>'fr'), ''),
    NULLIF(BTRIM(NEW.title), ''),
    'Un nouvel outil vous a été assigné.'
  );

  PERFORM public.notify_end_user(
    NEW.user_id,
    'Nouvel outil ajouté à votre Toolbox',
    _title,
    'toolbox_assignment',
    '/toolbox',
    'subscription_update',
    'toolbox-' || NEW.id::text
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_user_on_toolbox_assignment() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.finalize_onboarding_and_populate_cockpit()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile public.user_executive_profiles%ROWTYPE;
  v_stakeholder JSONB;
  v_name TEXT;
  v_tension TEXT;
  v_quality INTEGER;
  v_role_key TEXT;
  v_role_label TEXT;
  v_proximity TEXT;
  v_contact_id UUID;
  v_decision_title TEXT;
  v_symptom_count INTEGER := 0;
  v_mood_val INTEGER := 7;
  v_stress_val NUMERIC(3,1) := 4.0;
  v_existing_tools INTEGER := 0;
  v_needed_tools INTEGER := 0;
  v_avg_quality NUMERIC := 6.5;
  v_mood_score NUMERIC(5,2);
  v_decision_score NUMERIC(5,2) := 72.00;
  v_relation_score NUMERIC(5,2);
  v_habit_score NUMERIC(5,2) := 60.00;
  v_journal_score NUMERIC(5,2) := 50.00;
  v_archetype_coherence NUMERIC(5,2) := 78.00;
  v_log_regularity NUMERIC(5,2) := 70.00;
  v_overall_score NUMERIC(5,2);
  v_today DATE := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO v_profile
  FROM public.user_executive_profiles
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
  END IF;

  -- 1. Inject urgent P1 decision into public.decisions (idempotent by trimmed name).
  v_decision_title := NULLIF(BTRIM(v_profile.urgent_decision_title), '');
  IF v_decision_title IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.decisions d
      WHERE d.user_id = v_user_id
        AND lower(btrim(d.name)) = lower(v_decision_title)
    ) THEN
      INSERT INTO public.decisions (
        user_id, name, priority, responsibility, status, created_at
      ) VALUES (
        v_user_id, v_decision_title, 5, 8, 'pending', now()
      );
    END IF;
  END IF;

  -- 2. Inject 1-3 primary stakeholders into public.people_contacts + baseline history.
  IF v_profile.primary_stakeholders IS NOT NULL
     AND jsonb_typeof(v_profile.primary_stakeholders) = 'array'
     AND jsonb_array_length(v_profile.primary_stakeholders) > 0 THEN
    FOR v_stakeholder IN SELECT * FROM jsonb_array_elements(v_profile.primary_stakeholders)
    LOOP
      v_name := NULLIF(BTRIM(v_stakeholder->>'name'), '');
      IF v_name IS NULL THEN
        CONTINUE;
      END IF;

      v_tension := COALESCE(NULLIF(UPPER(BTRIM(v_stakeholder->>'tension_level')), ''), 'MEDIUM');
      v_quality := CASE v_tension
        WHEN 'LOW' THEN 9
        WHEN 'MEDIUM' THEN 6
        WHEN 'HIGH' THEN 4
        WHEN 'CRITICAL' THEN 2
        ELSE 6
      END;

      v_role_key := COALESCE(UPPER(BTRIM(v_stakeholder->>'role')), '');
      v_role_label := COALESCE(
        NULLIF(BTRIM(v_stakeholder->>'role_label'), ''),
        NULLIF(BTRIM(v_stakeholder->>'role'), '')
      );
      v_proximity := CASE v_role_key
        WHEN 'SPOUSE' THEN 'famille'
        WHEN 'LEAD_INVESTOR' THEN 'prestataire'
        ELSE 'equipe_direction'
      END;

      SELECT c.id INTO v_contact_id
      FROM public.people_contacts c
      WHERE c.user_id = v_user_id
        AND lower(btrim(c.name)) = lower(v_name)
      LIMIT 1;

      IF v_contact_id IS NULL THEN
        INSERT INTO public.people_contacts (
          user_id, name, role, quality, proximity, insight
        ) VALUES (
          v_user_id,
          v_name,
          v_role_label,
          v_quality,
          v_proximity,
          'Tension onboarding : ' || v_tension
        )
        RETURNING id INTO v_contact_id;

        INSERT INTO public.relation_quality_history (
          user_id, contact_id, quality, note
        ) VALUES (
          v_user_id,
          v_contact_id,
          v_quality,
          'Initialisation cockpit (' || v_tension || ')'
        );
      END IF;
    END LOOP;
  END IF;

  -- 3. Insert baseline mood_entries row if none exists for today.
  v_symptom_count := COALESCE(cardinality(v_profile.stress_symptoms), 0);
  v_mood_val := GREATEST(3, LEAST(9, 8 - v_symptom_count));
  v_stress_val := GREATEST(2.0, LEAST(9.0, 3.0 + v_symptom_count * 1.5))::numeric(3,1);

  IF NOT EXISTS (
    SELECT 1 FROM public.mood_entries m
    WHERE m.user_id = v_user_id
      AND (m.logged_at AT TIME ZONE 'UTC')::date = v_today
  ) THEN
    INSERT INTO public.mood_entries (user_id, value, stress, logged_at)
    VALUES (v_user_id, v_mood_val, v_stress_val, now());
  END IF;

  -- 4. Seed up to 5 starter active Toolbox assignments silently.
  PERFORM set_config('aegis.skip_toolbox_notify', '1', true);

  SELECT count(*)::int INTO v_existing_tools
  FROM public.toolbox_assignments
  WHERE user_id = v_user_id
    AND COALESCE(user_delivery_status, 'active') <> 'inactive';

  v_needed_tools := GREATEST(0, 5 - v_existing_tools);
  IF v_needed_tools > 0 THEN
    INSERT INTO public.toolbox_assignments (
      user_id,
      template_id,
      content_type,
      title,
      title_i18n,
      description,
      description_i18n,
      duration,
      external_url,
      widget_config,
      assigned_by,
      user_delivery_status
    )
    SELECT
      v_user_id,
      t.id,
      t.content_type,
      t.title,
      t.title_i18n,
      t.description,
      t.description_i18n,
      t.duration,
      t.external_url,
      t.widget_config,
      v_user_id,
      'active'
    FROM public.toolbox_templates t
    WHERE t.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.toolbox_assignments ta
        WHERE ta.user_id = v_user_id
          AND ta.template_id = t.id
      )
    ORDER BY
      CASE
        WHEN v_profile.dominant_decision_friction IS NOT NULL
         AND lower(v_profile.dominant_decision_friction) = ANY(t.shadow_targets)
        THEN 0
        ELSE 1
      END,
      t.created_at DESC
    LIMIT v_needed_tools;
  END IF;

  -- 5. Compute and upsert today's Clarity / Health Score in public.aegis_health_scores.
  SELECT COALESCE(AVG(c.quality), 6.5) INTO v_avg_quality
  FROM public.people_contacts c
  WHERE c.user_id = v_user_id;

  v_mood_score := GREATEST(35, LEAST(90, ROUND(v_mood_val * 10.0, 2)));
  v_relation_score := GREATEST(40, LEAST(95, ROUND(v_avg_quality * 10.0, 2)));
  v_overall_score := ROUND(
    (v_mood_score + v_decision_score + v_relation_score + v_habit_score + v_journal_score + v_archetype_coherence + v_log_regularity) / 7.0,
    2
  );

  INSERT INTO public.aegis_health_scores (
    user_id,
    score_date,
    overall_score,
    mood_score,
    decision_score,
    habit_score,
    journal_score,
    relation_score,
    archetype_coherence,
    log_regularity,
    computed_at
  ) VALUES (
    v_user_id,
    v_today,
    v_overall_score,
    v_mood_score,
    v_decision_score,
    v_habit_score,
    v_journal_score,
    v_relation_score,
    v_archetype_coherence,
    v_log_regularity,
    now()
  )
  ON CONFLICT (user_id, score_date) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    mood_score = EXCLUDED.mood_score,
    decision_score = EXCLUDED.decision_score,
    habit_score = EXCLUDED.habit_score,
    journal_score = EXCLUDED.journal_score,
    relation_score = EXCLUDED.relation_score,
    archetype_coherence = EXCLUDED.archetype_coherence,
    log_regularity = EXCLUDED.log_regularity,
    computed_at = now();

  -- 6. Mark onboarding completed across profiles, executive profile, and guardian state.
  UPDATE public.profiles
  SET onboarding_completed = true,
      updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.user_executive_profiles
  SET completed_at = COALESCE(completed_at, now()),
      onboarding_step_reached = 5,
      updated_at = now()
  WHERE user_id = v_user_id;

  INSERT INTO public.guardian_onboarding (
    user_id, status, step, completed_at, state
  ) VALUES (
    v_user_id,
    'completed',
    4,
    now(),
    jsonb_build_object(
      'status', 'completed',
      'step', 4,
      'decisionDone', true,
      'awaitingPostQuiz', false
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status = 'completed',
    step = 4,
    completed_at = COALESCE(guardian_onboarding.completed_at, now()),
    updated_at = now();

  RETURN jsonb_build_object(
    'success', true,
    'clarity_score', v_overall_score
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_onboarding_and_populate_cockpit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_onboarding_and_populate_cockpit() TO authenticated, service_role;
