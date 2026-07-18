
-- 1) User report created
CREATE OR REPLACE FUNCTION public.notify_user_on_report_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    'Nouveau rapport disponible',
    COALESCE(NEW.title, 'Un nouveau rapport vous a été partagé.'),
    'user_report',
    '/persona'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_on_report_insert ON public.user_reports;
CREATE TRIGGER trg_notify_user_on_report_insert
AFTER INSERT ON public.user_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_report_insert();

-- 2) App release published (INSERT with is_published=true OR UPDATE flipping to true)
CREATE OR REPLACE FUNCTION public.notify_users_on_app_release_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_notify boolean := false;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_published THEN
    should_notify := true;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_published AND COALESCE(OLD.is_published, false) = false THEN
    should_notify := true;
  END IF;

  IF should_notify THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT
      p.id,
      'Nouvelle mise à jour disponible',
      'Version ' || NEW.version_name || ' de l''application Android est disponible.',
      'app_release',
      '/install-android'
    FROM public.profiles p;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_users_on_app_release_published ON public.app_releases;
CREATE TRIGGER trg_notify_users_on_app_release_published
AFTER INSERT OR UPDATE OF is_published ON public.app_releases
FOR EACH ROW EXECUTE FUNCTION public.notify_users_on_app_release_published();

-- 3) Toolbox assignment created
CREATE OR REPLACE FUNCTION public.notify_user_on_toolbox_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.user_id,
    'Nouvel outil ajouté à votre Toolbox',
    COALESCE(NEW.title, 'Un nouvel outil vous a été assigné.'),
    'toolbox_assignment',
    '/toolbox'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_on_toolbox_assignment ON public.toolbox_assignments;
CREATE TRIGGER trg_notify_user_on_toolbox_assignment
AFTER INSERT ON public.toolbox_assignments
FOR EACH ROW EXECUTE FUNCTION public.notify_user_on_toolbox_assignment();

-- 4) Aegis synapse card created (targeted or global if active)
CREATE OR REPLACE FUNCTION public.notify_users_on_synapse_card_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  card_title text;
BEGIN
  IF NOT NEW.is_active THEN
    RETURN NEW;
  END IF;

  card_title := COALESCE(
    NEW.title_i18n->>'fr',
    NEW.title_i18n->>'en',
    'Nouvelle carte Pulse'
  );

  IF array_length(NEW.target_user_ids, 1) IS NOT NULL THEN
    -- Targeted: notify each target user
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT
      uid,
      'Nouvelle carte Aegis Pulse',
      card_title,
      'pulse_card',
      '/pulse'
    FROM unnest(NEW.target_user_ids) AS uid;
  ELSE
    -- Global card: notify all users
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT
      p.id,
      'Nouvelle carte Aegis Pulse',
      card_title,
      'pulse_card',
      '/pulse'
    FROM public.profiles p;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_users_on_synapse_card_insert ON public.aegis_synapse_cards;
CREATE TRIGGER trg_notify_users_on_synapse_card_insert
AFTER INSERT ON public.aegis_synapse_cards
FOR EACH ROW EXECUTE FUNCTION public.notify_users_on_synapse_card_insert();
