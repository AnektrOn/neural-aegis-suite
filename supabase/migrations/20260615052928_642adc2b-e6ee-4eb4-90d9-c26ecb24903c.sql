
-- ============ app_releases ============
CREATE TABLE public.app_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'android' CHECK (platform IN ('android')),
  version_code int NOT NULL,
  version_name text NOT NULL,
  apk_storage_path text NOT NULL,
  apk_public_url text NOT NULL,
  release_notes text,
  force_update boolean NOT NULL DEFAULT false,
  min_version_code int,
  is_published boolean NOT NULL DEFAULT false,
  sha256 text,
  file_size_bytes bigint,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, version_code)
);

GRANT SELECT ON public.app_releases TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_releases TO authenticated;
GRANT ALL ON public.app_releases TO service_role;

ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published releases"
  ON public.app_releases FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can read all releases"
  ON public.app_releases FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert releases"
  ON public.app_releases FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update releases"
  ON public.app_releases FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete releases"
  ON public.app_releases FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_app_releases_updated_at
  BEFORE UPDATE ON public.app_releases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_app_releases_published ON public.app_releases (platform, is_published, published_at DESC);

-- ============ user_app_versions ============
CREATE TABLE public.user_app_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'android',
  version_code int NOT NULL,
  version_name text,
  device_id text,
  reported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_app_versions TO authenticated;
GRANT ALL ON public.user_app_versions TO service_role;

ALTER TABLE public.user_app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own version"
  ON public.user_app_versions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all versions"
  ON public.user_app_versions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_user_app_versions_version ON public.user_app_versions (platform, version_code);

-- ============ app_update_events ============
CREATE TABLE public.app_update_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  release_id uuid REFERENCES public.app_releases(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  version_code int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.app_update_events TO authenticated;
GRANT ALL ON public.app_update_events TO service_role;

ALTER TABLE public.app_update_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own events"
  ON public.app_update_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own events"
  ON public.app_update_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all events"
  ON public.app_update_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_app_update_events_created ON public.app_update_events (created_at DESC);
CREATE INDEX idx_app_update_events_user ON public.app_update_events (user_id, created_at DESC);

-- ============ publish_app_release RPC ============
CREATE OR REPLACE FUNCTION public.publish_app_release(p_release_id uuid)
RETURNS public.app_releases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.app_releases%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO _row FROM public.app_releases WHERE id = p_release_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'release_not_found';
  END IF;

  UPDATE public.app_releases
    SET is_published = false
    WHERE platform = _row.platform AND id <> p_release_id AND is_published = true;

  UPDATE public.app_releases
    SET is_published = true,
        published_at = COALESCE(published_at, now())
    WHERE id = p_release_id
    RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_app_release(uuid) TO authenticated;
