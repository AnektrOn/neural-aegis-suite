-- Éditions newsletter + envoi automatique (welcome + diffusion à la publication).

CREATE TABLE IF NOT EXISTS public.newsletter_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  excerpt_fr TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  body_fr TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_editions_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_editions_status
  ON public.newsletter_editions (status, published_at DESC);

DROP TRIGGER IF EXISTS newsletter_editions_updated_at ON public.newsletter_editions;
CREATE TRIGGER newsletter_editions_updated_at
  BEFORE UPDATE ON public.newsletter_editions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.newsletter_editions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone read published newsletter editions" ON public.newsletter_editions;
CREATE POLICY "Anyone read published newsletter editions"
  ON public.newsletter_editions
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage newsletter editions" ON public.newsletter_editions;
CREATE POLICY "Admins manage newsletter editions"
  ON public.newsletter_editions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.newsletter_editions IS
  'Éditions de la newsletter (lecture publique si published).';

-- File d'envoi (welcome + édition) traitée par l'edge function send-newsletter-email
CREATE TABLE IF NOT EXISTS public.newsletter_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('welcome', 'edition')),
  recipient_email TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  edition_id UUID REFERENCES public.newsletter_editions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email_queue_pending
  ON public.newsletter_email_queue (status, created_at)
  WHERE status = 'pending';

ALTER TABLE public.newsletter_email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read newsletter email queue" ON public.newsletter_email_queue;
CREATE POLICY "Admins read newsletter email queue"
  ON public.newsletter_email_queue
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enqueue welcome après inscription
CREATE OR REPLACE FUNCTION public.enqueue_newsletter_welcome_email(
  p_email TEXT,
  p_locale TEXT DEFAULT 'fr'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _locale TEXT;
BEGIN
  _email := lower(trim(p_email));
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN;
  END IF;
  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN
    _locale := 'fr';
  END IF;

  INSERT INTO public.newsletter_email_queue (kind, recipient_email, locale)
  VALUES ('welcome', _email, _locale);
END;
$$;

-- Enqueue diffusion édition pour tous les abonnés actifs
CREATE OR REPLACE FUNCTION public.enqueue_newsletter_edition_emails(p_edition_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT := 0;
  _sub RECORD;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.newsletter_editions
    WHERE id = p_edition_id AND status = 'published'
  ) THEN
    RETURN 0;
  END IF;

  FOR _sub IN
    SELECT email, locale FROM public.newsletter_subscribers WHERE status = 'active'
  LOOP
    INSERT INTO public.newsletter_email_queue (kind, recipient_email, locale, edition_id)
    VALUES ('edition', _sub.email, _sub.locale, p_edition_id);
    _count := _count + 1;
  END LOOP;

  RETURN _count;
END;
$$;

-- Met à jour subscribe_newsletter pour enqueue welcome
CREATE OR REPLACE FUNCTION public.subscribe_newsletter(
  p_email TEXT,
  p_locale TEXT DEFAULT 'fr',
  p_source TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _locale TEXT;
  _uid UUID;
  _row public.newsletter_subscribers%ROWTYPE;
  _was_active BOOLEAN;
BEGIN
  _email := lower(trim(p_email));
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN
    _locale := 'fr';
  END IF;

  _uid := auth.uid();

  SELECT (status = 'active') INTO _was_active
  FROM public.newsletter_subscribers
  WHERE email = _email;

  INSERT INTO public.newsletter_subscribers (email, user_id, locale, status, source)
  VALUES (_email, _uid, _locale, 'active', NULLIF(trim(p_source), ''))
  ON CONFLICT (email)
  DO UPDATE SET
    status = 'active',
    locale = EXCLUDED.locale,
    source = COALESCE(EXCLUDED.source, newsletter_subscribers.source),
    user_id = COALESCE(EXCLUDED.user_id, newsletter_subscribers.user_id),
    updated_at = now()
  RETURNING * INTO _row;

  IF NOT COALESCE(_was_active, false) THEN
    PERFORM public.enqueue_newsletter_welcome_email(_email, _locale);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'status', _row.status,
    'email', _row.email
  );
END;
$$;

-- Appel edge function send-newsletter-email (pg_net, best-effort)
CREATE OR REPLACE FUNCTION public.dispatch_newsletter_email_queue(p_limit INT DEFAULT 10)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url TEXT;
  _anon TEXT;
BEGIN
  _url := current_setting('app.settings.supabase_url', true);
  _anon := current_setting('app.settings.supabase_anon_key', true);

  IF _url IS NULL OR _url = '' THEN
    _url := 'https://wjjugtdciljmuohxoqcj.supabase.co';
  END IF;
  IF _anon IS NULL OR _anon = '' THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := rtrim(_url, '/') || '/functions/v1/send-newsletter-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon,
      'apikey', _anon
    ),
    body := jsonb_build_object('action', 'process_queue', 'limit', LEAST(GREATEST(p_limit, 1), 50))
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'dispatch_newsletter_email_queue failed: %', SQLERRM;
END;
$$;

-- Publication : enqueue + dispatch
CREATE OR REPLACE FUNCTION public.publish_newsletter_edition(p_edition_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _queued INT;
  _row public.newsletter_editions%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.newsletter_editions
  SET
    status = 'published',
    published_at = COALESCE(published_at, now()),
    updated_at = now()
  WHERE id = p_edition_id
  RETURNING * INTO _row;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF _row.email_sent_at IS NULL THEN
    _queued := public.enqueue_newsletter_edition_emails(p_edition_id);
    RETURN jsonb_build_object('ok', true, 'queued', _queued, 'slug', _row.slug);
  END IF;

  RETURN jsonb_build_object('ok', true, 'queued', 0, 'slug', _row.slug, 'already_sent', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.publish_newsletter_edition(UUID) TO authenticated;
