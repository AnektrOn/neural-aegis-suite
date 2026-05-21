-- Newsletter : inscriptions (guests, membres, anonymes via RPC).

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  locale TEXT NOT NULL DEFAULT 'fr' CHECK (locale IN ('fr', 'en')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_user
  ON public.newsletter_subscribers (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status
  ON public.newsletter_subscribers (status);

DROP TRIGGER IF EXISTS newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_updated_at
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Lecture : soi-même ou admin
DROP POLICY IF EXISTS "Users read own newsletter subscription" ON public.newsletter_subscribers;
CREATE POLICY "Users read own newsletter subscription"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins read all newsletter subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.newsletter_subscribers IS
  'Abonnés newsletter Neural Aegis (inscription via RPC subscribe_newsletter).';

-- Inscription / réinscription (public + connecté)
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

  RETURN jsonb_build_object(
    'ok', true,
    'status', _row.status,
    'email', _row.email
  );
END;
$$;

-- Désabonnement
CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email TEXT;
  _updated INT;
BEGIN
  _email := lower(trim(p_email));
  IF _email IS NULL OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_email');
  END IF;

  UPDATE public.newsletter_subscribers
  SET status = 'unsubscribed', updated_at = now()
  WHERE lower(trim(email)) = _email;

  GET DIAGNOSTICS _updated = ROW_COUNT;

  RETURN jsonb_build_object('ok', _updated > 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.subscribe_newsletter(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unsubscribe_newsletter(TEXT) TO anon, authenticated;
