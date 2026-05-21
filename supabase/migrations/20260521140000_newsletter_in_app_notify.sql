-- Notifications in-app à la publication / inscription newsletter.

CREATE OR REPLACE FUNCTION public.notify_newsletter_edition_in_app(p_edition_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ed public.newsletter_editions%ROWTYPE;
  _sub RECORD;
  _uid UUID;
  _title TEXT;
  _message TEXT;
  _link TEXT;
  _count INT := 0;
BEGIN
  SELECT * INTO _ed
  FROM public.newsletter_editions
  WHERE id = p_edition_id AND status = 'published';

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  _link := '/newsletter/' || _ed.slug;

  FOR _sub IN
    SELECT DISTINCT ON (resolved_id) resolved_id, locale
    FROM (
      SELECT COALESCE(s.user_id, u.id) AS resolved_id, s.locale
      FROM public.newsletter_subscribers s
      LEFT JOIN auth.users u ON lower(u.email) = s.email
      WHERE s.status = 'active'
        AND (s.user_id IS NOT NULL OR u.id IS NOT NULL)
    ) t
    WHERE resolved_id IS NOT NULL
  LOOP
    _uid := _sub.resolved_id;
    IF _sub.locale = 'en' THEN
      _title := 'New Neural Letter';
      _message := COALESCE(NULLIF(trim(_ed.excerpt_en), ''), _ed.title_en);
    ELSE
      _title := 'Nouvelle Lettre Neural';
      _message := COALESCE(NULLIF(trim(_ed.excerpt_fr), ''), _ed.title_fr);
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (_uid, _title, _message, 'newsletter', _link);

    _count := _count + 1;
  END LOOP;

  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_newsletter_welcome_in_app(
  p_user_id UUID,
  p_locale TEXT DEFAULT 'fr'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _title TEXT;
  _message TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  IF lower(trim(COALESCE(p_locale, 'fr'))) = 'en' THEN
    _title := 'Newsletter subscribed';
    _message := 'New editions will appear in the app. Read the full letter in the Newsletter hub.';
  ELSE
    _title := 'Inscription newsletter';
    _message := 'Les prochaines éditions apparaîtront dans l''app. Lisez la lettre complète dans l''espace newsletter.';
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, _title, _message, 'newsletter', '/newsletter');
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_newsletter_edition(p_edition_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _queued INT;
  _notified INT;
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

  _notified := public.notify_newsletter_edition_in_app(p_edition_id);

  IF _row.email_sent_at IS NULL THEN
    _queued := public.enqueue_newsletter_edition_emails(p_edition_id);
    RETURN jsonb_build_object(
      'ok', true,
      'queued', _queued,
      'notified', _notified,
      'slug', _row.slug
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'queued', 0,
    'notified', _notified,
    'slug', _row.slug,
    'already_sent', true
  );
END;
$$;

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
    IF _uid IS NOT NULL THEN
      PERFORM public.notify_newsletter_welcome_in_app(_uid, _locale);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'status', _row.status,
    'email', _row.email
  );
END;
$$;
