-- Allow any authenticated user to bootstrap archetype-v1 questions when the core bank is empty.
-- Client seeds from TypeScript (single source of truth); RLS blocks direct multi-row INSERT for non-admins.

CREATE OR REPLACE FUNCTION public.seed_assessment_catalog_if_empty(
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
  v_core_count int;
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

  SELECT id INTO v_template_id
  FROM public.assessment_templates
  WHERE slug = p_template_slug AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', p_template_slug;
  END IF;

  SELECT count(*)::int INTO v_core_count
  FROM public.assessment_questions q
  WHERE q.template_id = v_template_id
    AND COALESCE((q.meta->>'is_appendix')::boolean, false) = false;

  IF v_core_count > 0 THEN
    RETURN false;
  END IF;

  IF p_questions IS NULL OR jsonb_array_length(p_questions) = 0 THEN
    RAISE EXCEPTION 'Empty question payload';
  END IF;

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
      q->>'question_type',
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

REVOKE ALL ON FUNCTION public.seed_assessment_catalog_if_empty(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_assessment_catalog_if_empty(text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.seed_assessment_catalog_if_empty(text, jsonb) IS
  'Bootstrap archetype-v1 core questions from app payload when catalog is empty. Idempotent.';
