-- Enable pg_net for outbound HTTP from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper: fire-and-forget push to all admins via send-push edge function
CREATE OR REPLACE FUNCTION public.send_admin_push(
  p_title TEXT,
  p_message TEXT,
  p_url TEXT DEFAULT '/admin/analytics',
  p_tag TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url TEXT := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/send-push';
  _anon TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqanVndGRjaWxqbXVvaHhvcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjU4MDEsImV4cCI6MjA4NzMwMTgwMX0.EWW63Pv6lquhiCKH8-zvy_sz7nNLWdsovBo2tseo-Ps';
BEGIN
  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon,
      'apikey', _anon
    ),
    body := jsonb_build_object(
      'target', 'admins',
      'title', p_title,
      'message', p_message,
      'url', p_url,
      'tag', COALESCE(p_tag, p_title)
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Never break the source insert because of push delivery
  RAISE WARNING 'send_admin_push failed: %', SQLERRM;
END;
$$;

-- ── Update each notify_admin_* trigger function to also push ──

CREATE OR REPLACE FUNCTION public.notify_admin_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name TEXT;
  _preview TEXT;
  _msg TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  _preview := LEFT(COALESCE(NEW.content, ''), 160);
  _msg := COALESCE(_user_name, 'Utilisateur')
    || ' — « ' || COALESCE(NULLIF(TRIM(NEW.title), ''), 'Sans titre')
    || ' » · ' || _preview;

  PERFORM public.notify_all_admins('Nouvelle entrée journal', _msg, 'admin_journal', '/admin/analytics');
  PERFORM public.send_admin_push('Nouvelle entrée journal', _msg, '/admin/analytics', 'journal-' || NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_mood_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name TEXT;
  _msg TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  _msg := COALESCE(_user_name, 'Utilisateur')
    || ' a enregistré une humeur (score ' || COALESCE(NEW.value::TEXT, '?') || ').';

  PERFORM public.notify_all_admins('Nouvelle humeur', _msg, 'admin_mood', '/admin/analytics');
  PERFORM public.send_admin_push('Nouvelle humeur', _msg, '/admin/analytics', 'mood-' || NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_decision_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name TEXT;
  _msg TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  _msg := COALESCE(_user_name, 'Utilisateur')
    || ' a ajouté la décision « ' || COALESCE(NEW.name, '?') || ' ».';

  PERFORM public.notify_all_admins('Nouvelle décision', _msg, 'admin_decision', '/admin/decisions');
  PERFORM public.send_admin_push('Nouvelle décision', _msg, '/admin/decisions', 'decision-' || NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_people_contact_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name TEXT;
  _msg TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  _msg := COALESCE(_user_name, 'Utilisateur')
    || ' a ajouté le contact « ' || COALESCE(NEW.name, '?') || ' ».';

  PERFORM public.notify_all_admins('Nouveau contact', _msg, 'admin_contact', '/admin/analytics');
  PERFORM public.send_admin_push('Nouveau contact', _msg, '/admin/analytics', 'contact-' || NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_habit_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name TEXT;
  _habit_name TEXT;
  _msg TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT ht.name INTO _habit_name
  FROM public.assigned_habits ah
  JOIN public.habit_templates ht ON ht.id = ah.habit_template_id
  WHERE ah.id = NEW.assigned_habit_id;
  _msg := COALESCE(_user_name, 'Utilisateur')
    || ' a complété « ' || COALESCE(_habit_name, 'habitude')
    || ' » le ' || COALESCE(NEW.completed_date::TEXT, '?') || '.';

  PERFORM public.notify_all_admins('Habitude complétée', _msg, 'admin_habit', '/admin/habits');
  PERFORM public.send_admin_push('Habitude complétée', _msg, '/admin/habits', 'habit-' || NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_relation_quality_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name TEXT;
  _contact_name TEXT;
  _msg TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT name INTO _contact_name FROM public.people_contacts WHERE id = NEW.contact_id;
  _msg := COALESCE(_user_name, 'Utilisateur')
    || ' — contact « ' || COALESCE(_contact_name, '?')
    || ' » (qualité ' || COALESCE(NEW.quality::TEXT, '?') || ').';

  PERFORM public.notify_all_admins('Mise à jour relation', _msg, 'admin_relation', '/admin/analytics');
  PERFORM public.send_admin_push('Mise à jour relation', _msg, '/admin/analytics', 'relation-' || NEW.id::text);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_toolbox_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_name TEXT;
  _tool_title TEXT;
  _status_label TEXT;
  _notif_type TEXT;
  _msg TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT title INTO _tool_title FROM public.toolbox_assignments WHERE id = NEW.assignment_id;

  CASE NEW.status
    WHEN 'completed' THEN _status_label := 'terminé';
    WHEN 'abandoned' THEN _status_label := 'abandonné';
    WHEN 'ignored' THEN _status_label := 'ignoré';
  END CASE;

  _notif_type := CASE WHEN NEW.status = 'completed' THEN 'success' ELSE 'info' END;
  _msg := COALESCE(_user_name, 'Utilisateur') || ' a ' || _status_label
    || ' l''outil "' || COALESCE(_tool_title, '?') || '"';

  PERFORM public.notify_all_admins('Outil ' || _status_label, _msg, _notif_type, '/admin/toolbox');
  PERFORM public.send_admin_push('Outil ' || _status_label, _msg, '/admin/toolbox', 'toolbox-' || NEW.id::text);
  RETURN NEW;
END;
$$;