-- Atomically replace archetype-v1 core (non-appendix) questions from app payload.
-- Fixes duplicate key on (template_id, position) when resyncing V4 catalog.

CREATE OR REPLACE FUNCTION public.replace_assessment_core_catalog(
  p_template_slug text,
  p_questions jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      template_id,
      position,
      question_type,
      prompt_fr,
      prompt_en,
      helper_fr,
      helper_en,
      dimension,
      is_required,
      meta
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
          question_id,
          position,
          label_fr,
          label_en,
          archetype_weights,
          shadow_weights,
          polarity_weights,
          value
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
$$;

REVOKE ALL ON FUNCTION public.replace_assessment_core_catalog(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_assessment_core_catalog(text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.replace_assessment_core_catalog(text, jsonb) IS
  'Replace archetype-v1 core questions (non-appendix) from app payload. Used for V4 catalog resync.';
