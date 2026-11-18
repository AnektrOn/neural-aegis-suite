-- LOGOS opening paths: cron batches (5 prompts) + per-user consume / favorite / expiry.

CREATE TABLE IF NOT EXISTS public.logos_prompt_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'cron',
  note TEXT
);

COMMENT ON TABLE public.logos_prompt_batches IS
  'Batches of LOGOS opening prompts (typically 5), created by Lovable cron / edge jobs.';

CREATE TABLE IF NOT EXISTS public.logos_path_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.logos_prompt_batches (id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  opening_prompt TEXT NOT NULL,
  first_message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT logos_path_prompts_category_nonempty CHECK (length(trim(category)) > 0),
  CONSTRAINT logos_path_prompts_opening_nonempty CHECK (length(trim(opening_prompt)) > 0),
  CONSTRAINT logos_path_prompts_first_message_nonempty CHECK (length(trim(first_message)) > 0)
);

COMMENT ON TABLE public.logos_path_prompts IS
  'Shared LOGOS opening paths. Injected at session start (behavior + first message); KB unchanged.';

CREATE INDEX IF NOT EXISTS logos_path_prompts_batch_idx
  ON public.logos_path_prompts (batch_id);

CREATE INDEX IF NOT EXISTS logos_path_prompts_expires_idx
  ON public.logos_path_prompts (expires_at);

CREATE TABLE IF NOT EXISTS public.logos_user_path_state (
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES public.logos_path_prompts (id) ON DELETE CASCADE,
  consumed_at TIMESTAMPTZ,
  favorited_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, prompt_id)
);

COMMENT ON TABLE public.logos_user_path_state IS
  'Per-user consume / favorite / extended expiry for LOGOS opening paths.';

CREATE INDEX IF NOT EXISTS logos_user_path_state_user_idx
  ON public.logos_user_path_state (user_id);

CREATE INDEX IF NOT EXISTS logos_user_path_state_user_consumed_idx
  ON public.logos_user_path_state (user_id, consumed_at);

ALTER TABLE public.logos_prompt_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logos_path_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logos_user_path_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read logos_prompt_batches" ON public.logos_prompt_batches;
CREATE POLICY "authenticated read logos_prompt_batches"
  ON public.logos_prompt_batches FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated read logos_path_prompts" ON public.logos_path_prompts;
CREATE POLICY "authenticated read logos_path_prompts"
  ON public.logos_path_prompts FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "users manage own logos_user_path_state" ON public.logos_user_path_state;
CREATE POLICY "users manage own logos_user_path_state"
  ON public.logos_user_path_state FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT ON public.logos_prompt_batches TO authenticated;
GRANT SELECT ON public.logos_path_prompts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.logos_user_path_state TO authenticated;
GRANT ALL ON public.logos_prompt_batches TO service_role;
GRANT ALL ON public.logos_path_prompts TO service_role;
GRANT ALL ON public.logos_user_path_state TO service_role;

-- Effective expiry: user override if set, else prompt default.
CREATE OR REPLACE FUNCTION public.logos_path_effective_expires_at(
  p_prompt_expires TIMESTAMPTZ,
  p_user_expires TIMESTAMPTZ
)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_user_expires, p_prompt_expires);
$$;

CREATE OR REPLACE FUNCTION public.logos_list_available_paths(
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  id UUID,
  batch_id UUID,
  batch_created_at TIMESTAMPTZ,
  category TEXT,
  title_fr TEXT,
  title_en TEXT,
  opening_prompt TEXT,
  first_message TEXT,
  expires_at TIMESTAMPTZ,
  is_favorited BOOLEAN,
  days_until_expiry NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF auth.uid() IS DISTINCT FROM p_user_id AND auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.batch_id,
    b.created_at AS batch_created_at,
    p.category,
    p.title_fr,
    p.title_en,
    p.opening_prompt,
    p.first_message,
    public.logos_path_effective_expires_at(p.expires_at, s.expires_at) AS expires_at,
    (s.favorited_at IS NOT NULL) AS is_favorited,
    EXTRACT(
      EPOCH FROM (
        public.logos_path_effective_expires_at(p.expires_at, s.expires_at) - now()
      )
    ) / 86400.0 AS days_until_expiry
  FROM public.logos_path_prompts p
  INNER JOIN public.logos_prompt_batches b ON b.id = p.batch_id
  LEFT JOIN public.logos_user_path_state s
    ON s.prompt_id = p.id AND s.user_id = p_user_id
  WHERE COALESCE(s.consumed_at, NULL) IS NULL
    AND public.logos_path_effective_expires_at(p.expires_at, s.expires_at) > now()
  ORDER BY b.created_at DESC, p.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.logos_list_available_paths(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.logos_list_available_paths(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.logos_list_available_paths(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.logos_consume_path(
  p_prompt_id UUID
)
RETURNS Json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_prompt_expires TIMESTAMPTZ;
  v_user_expires TIMESTAMPTZ;
  v_expires TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT p.expires_at, s.expires_at
    INTO v_prompt_expires, v_user_expires
  FROM public.logos_path_prompts p
  LEFT JOIN public.logos_user_path_state s
    ON s.prompt_id = p.id AND s.user_id = v_user
  WHERE p.id = p_prompt_id;

  IF v_prompt_expires IS NULL THEN
    RAISE EXCEPTION 'prompt not found';
  END IF;

  v_expires := public.logos_path_effective_expires_at(v_prompt_expires, v_user_expires);
  IF v_expires <= now() THEN
    RAISE EXCEPTION 'prompt expired';
  END IF;

  INSERT INTO public.logos_user_path_state (user_id, prompt_id, consumed_at, updated_at)
  VALUES (v_user, p_prompt_id, now(), now())
  ON CONFLICT (user_id, prompt_id) DO UPDATE
    SET consumed_at = COALESCE(public.logos_user_path_state.consumed_at, EXCLUDED.consumed_at),
        updated_at = now();

  RETURN json_build_object('ok', true, 'prompt_id', p_prompt_id);
END;
$$;

REVOKE ALL ON FUNCTION public.logos_consume_path(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.logos_consume_path(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.logos_favorite_path(
  p_prompt_id UUID,
  p_extend_days INT DEFAULT 7
)
RETURNS Json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_prompt_expires TIMESTAMPTZ;
  v_user_expires TIMESTAMPTZ;
  v_consumed TIMESTAMPTZ;
  v_prev TIMESTAMPTZ;
  v_new TIMESTAMPTZ;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_extend_days IS NULL OR p_extend_days < 1 THEN
    RAISE EXCEPTION 'invalid extend days';
  END IF;

  SELECT p.expires_at, s.expires_at, s.consumed_at
    INTO v_prompt_expires, v_user_expires, v_consumed
  FROM public.logos_path_prompts p
  LEFT JOIN public.logos_user_path_state s
    ON s.prompt_id = p.id AND s.user_id = v_user
  WHERE p.id = p_prompt_id;

  IF v_prompt_expires IS NULL THEN
    RAISE EXCEPTION 'prompt not found';
  END IF;
  IF v_consumed IS NOT NULL THEN
    RAISE EXCEPTION 'prompt already consumed';
  END IF;

  v_prev := public.logos_path_effective_expires_at(v_prompt_expires, v_user_expires);
  IF v_prev <= now() THEN
    RAISE EXCEPTION 'prompt expired';
  END IF;

  v_new := GREATEST(v_prev, now()) + make_interval(days => p_extend_days);

  INSERT INTO public.logos_user_path_state (user_id, prompt_id, favorited_at, expires_at, updated_at)
  VALUES (v_user, p_prompt_id, now(), v_new, now())
  ON CONFLICT (user_id, prompt_id) DO UPDATE
    SET favorited_at = COALESCE(public.logos_user_path_state.favorited_at, now()),
        expires_at = EXCLUDED.expires_at,
        updated_at = now();

  RETURN json_build_object(
    'ok', true,
    'prompt_id', p_prompt_id,
    'expires_at', v_new
  );
END;
$$;

REVOKE ALL ON FUNCTION public.logos_favorite_path(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.logos_favorite_path(UUID, INT) TO authenticated;
