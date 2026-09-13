-- Lovable / Supabase SQL
-- À chaque ajout admin d'un outil Toolbox ou d'une carte Pulse :
--   1) notification in-app (cloche + toast / popup dans l'app)
--   2) push téléphone (Web Push + FCM natif via send-push)
--   3) email (Resend via send-email-notification)
--
-- Coller ce fichier dans l'éditeur SQL Lovable, puis Run.
-- Les fonctions edge send-push et send-email-notification doivent déjà être déployées.
-- RESEND_API_KEY doit être configurée pour que le mail parte vraiment.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper : in-app + email + push vers UN utilisateur (jamais bloquant).
CREATE OR REPLACE FUNCTION public.notify_end_user(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT,
  p_email_type TEXT DEFAULT 'subscription_update',
  p_push_tag TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $$
DECLARE
  _url TEXT;
  _anon TEXT;
  _eligible BOOLEAN := false;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT true
  INTO _eligible
  FROM public.profiles
  WHERE id = p_user_id
    AND COALESCE(is_disabled, false) = false
    AND COALESCE(account_type, 'member') <> 'guest';

  IF NOT COALESCE(_eligible, false) THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);

  _url := COALESCE(
    NULLIF(current_setting('app.settings.supabase_url', true), ''),
    'https://wjjugtdciljmuohxoqcj.supabase.co'
  );
  _anon := COALESCE(
    NULLIF(current_setting('app.settings.supabase_anon_key', true), ''),
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqanVndGRjaWxqbXVvaHhvcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjU4MDEsImV4cCI6MjA4NzMwMTgwMX0.EWW63Pv6lquhiCKH8-zvy_sz7nNLWdsovBo2tseo-Ps'
  );

  -- Popup téléphone (app fermée / background)
  BEGIN
    PERFORM net.http_post(
      url := rtrim(_url, '/') || '/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _anon,
        'apikey', _anon
      ),
      body := jsonb_build_object(
        'target', 'user',
        'user_id', p_user_id,
        'title', p_title,
        'message', p_message,
        'url', COALESCE(p_link, '/'),
        'tag', COALESCE(p_push_tag, p_type)
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_end_user push failed: %', SQLERRM;
  END;

  -- Email. Type subscription_update = email seul (pas de 2e notif in-app).
  BEGIN
    PERFORM net.http_post(
      url := rtrim(_url, '/') || '/functions/v1/send-email-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _anon,
        'apikey', _anon
      ),
      body := jsonb_build_object(
        'type', p_email_type,
        'user_id', p_user_id,
        'data', jsonb_build_object(
          'title', p_title,
          'message', p_message,
          'skip_in_app', true
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_end_user email failed: %', SQLERRM;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_end_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ── Toolbox : notify quand l'outil devient visible pour l'utilisateur ──
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

DROP TRIGGER IF EXISTS trg_notify_user_on_toolbox_assignment ON public.toolbox_assignments;
CREATE TRIGGER trg_notify_user_on_toolbox_assignment
AFTER INSERT OR UPDATE OF user_delivery_status ON public.toolbox_assignments
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_on_toolbox_assignment();

REVOKE ALL ON FUNCTION public.notify_user_on_toolbox_assignment() FROM PUBLIC, anon, authenticated;

-- ── Pulse : notify les utilisateurs ciblés, ou tout le monde si carte globale ──
CREATE OR REPLACE FUNCTION public.notify_users_on_synapse_card_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  _should BOOLEAN := false;
  _card_title TEXT;
  _uid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _should := NEW.is_active;
  ELSIF TG_OP = 'UPDATE' THEN
    _should := NEW.is_active AND COALESCE(OLD.is_active, false) = false;
  END IF;

  IF NOT _should THEN
    RETURN NEW;
  END IF;

  _card_title := COALESCE(
    NULLIF(BTRIM(NEW.title_i18n->>'fr'), ''),
    NULLIF(BTRIM(NEW.title_i18n->>'en'), ''),
    'Nouvelle carte Pulse'
  );

  IF array_length(NEW.target_user_ids, 1) IS NOT NULL THEN
    FOREACH _uid IN ARRAY NEW.target_user_ids
    LOOP
      PERFORM public.notify_end_user(
        _uid,
        'Nouvelle carte Aegis Pulse',
        _card_title,
        'pulse_card',
        '/pulse',
        'subscription_update',
        'pulse-' || NEW.id::text
      );
    END LOOP;
  ELSE
    FOR _uid IN
      SELECT p.id
      FROM public.profiles p
      WHERE COALESCE(p.is_disabled, false) = false
        AND COALESCE(p.account_type, 'member') <> 'guest'
    LOOP
      PERFORM public.notify_end_user(
        _uid,
        'Nouvelle carte Aegis Pulse',
        _card_title,
        'pulse_card',
        '/pulse',
        'subscription_update',
        'pulse-' || NEW.id::text
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_users_on_synapse_card_insert ON public.aegis_synapse_cards;
CREATE TRIGGER trg_notify_users_on_synapse_card_insert
AFTER INSERT OR UPDATE OF is_active ON public.aegis_synapse_cards
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_on_synapse_card_insert();

REVOKE ALL ON FUNCTION public.notify_users_on_synapse_card_insert() FROM PUBLIC, anon, authenticated;
