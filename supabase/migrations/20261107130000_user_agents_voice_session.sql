-- Per-user ElevenLabs agent mapping for server-side voice session routing (not client-selectable).

CREATE TABLE IF NOT EXISTS public.user_agents (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  elevenlabs_agent_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own user_agents" ON public.user_agents;
CREATE POLICY "Users read own user_agents"
  ON public.user_agents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.user_agents TO authenticated;
GRANT ALL ON public.user_agents TO service_role;

INSERT INTO public.user_agents (user_id, elevenlabs_agent_id, created_at, updated_at)
SELECT p.id, p.elevenlabs_agent_id, now(), now()
FROM public.profiles p
WHERE p.elevenlabs_agent_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.sync_user_agents_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.elevenlabs_agent_id IS NOT NULL THEN
      INSERT INTO public.user_agents (user_id, elevenlabs_agent_id, updated_at)
      VALUES (NEW.id, NEW.elevenlabs_agent_id, now())
      ON CONFLICT (user_id) DO UPDATE
        SET elevenlabs_agent_id = EXCLUDED.elevenlabs_agent_id, updated_at = now();
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.elevenlabs_agent_id IS DISTINCT FROM OLD.elevenlabs_agent_id THEN
    IF NEW.elevenlabs_agent_id IS NOT NULL THEN
      INSERT INTO public.user_agents (user_id, elevenlabs_agent_id, updated_at)
      VALUES (NEW.id, NEW.elevenlabs_agent_id, now())
      ON CONFLICT (user_id) DO UPDATE
        SET elevenlabs_agent_id = EXCLUDED.elevenlabs_agent_id, updated_at = now();
    ELSE
      DELETE FROM public.user_agents WHERE user_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_sync_user_agents_insert ON public.profiles;
CREATE TRIGGER trg_profiles_sync_user_agents_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_agents_from_profile();

DROP TRIGGER IF EXISTS trg_profiles_sync_user_agents_update ON public.profiles;
CREATE TRIGGER trg_profiles_sync_user_agents_update
  AFTER UPDATE OF elevenlabs_agent_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_agents_from_profile();

-- Rate limiting for edge functions (service_role only; same storage as public_rate_limits).
CREATE OR REPLACE FUNCTION public.check_service_rate_limit(
  p_bucket TEXT,
  p_limit INT DEFAULT 30,
  p_window_seconds INT DEFAULT 3600
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window TIMESTAMPTZ;
  _count INT;
BEGIN
  IF p_bucket IS NULL OR length(trim(p_bucket)) < 3 THEN
    RETURN jsonb_build_object('ok', false, 'allowed', false, 'error', 'invalid_bucket');
  END IF;

  _window := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.public_rate_limits (bucket_key, window_start, hit_count)
  VALUES (trim(p_bucket), _window, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET hit_count = public.public_rate_limits.hit_count + 1
  RETURNING hit_count INTO _count;

  IF _count > p_limit THEN
    RETURN jsonb_build_object('ok', true, 'allowed', false, 'count', _count, 'limit', p_limit);
  END IF;

  RETURN jsonb_build_object('ok', true, 'allowed', true, 'count', _count, 'limit', p_limit);
END;
$$;

REVOKE ALL ON FUNCTION public.check_service_rate_limit(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_service_rate_limit(TEXT, INT, INT) TO service_role;
