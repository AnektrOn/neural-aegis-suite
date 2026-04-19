-- Shared helper: one in-app notification per admin (recipient user_id = admin account).
CREATE OR REPLACE FUNCTION public.notify_all_admins(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  FOR _admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.app_role
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (_admin_id, p_title, p_message, p_type, p_link);
  END LOOP;
END;
$$;

-- Toolbox: delegate to notify_all_admins (same messages as before).
CREATE OR REPLACE FUNCTION public.notify_admin_toolbox_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_name TEXT;
  _tool_title TEXT;
  _status_label TEXT;
  _notif_type TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT title INTO _tool_title FROM public.toolbox_assignments WHERE id = NEW.assignment_id;

  CASE NEW.status
    WHEN 'completed' THEN _status_label := 'terminé';
    WHEN 'abandoned' THEN _status_label := 'abandonné';
    WHEN 'ignored' THEN _status_label := 'ignoré';
  END CASE;

  _notif_type := CASE WHEN NEW.status = 'completed' THEN 'success' ELSE 'info' END;

  PERFORM public.notify_all_admins(
    'Outil ' || _status_label,
    COALESCE(_user_name, 'Utilisateur') || ' a ' || _status_label || ' l''outil "' || COALESCE(_tool_title, '?') || '"',
    _notif_type,
    '/admin/toolbox'
  );

  RETURN NEW;
END;
$$;

-- Journal
CREATE OR REPLACE FUNCTION public.notify_admin_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_name TEXT;
  _preview TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  _preview := LEFT(COALESCE(NEW.content, ''), 160);

  PERFORM public.notify_all_admins(
    'Nouvelle entrée journal',
    COALESCE(_user_name, 'Utilisateur')
      || ' — « '
      || COALESCE(NULLIF(TRIM(NEW.title), ''), 'Sans titre')
      || ' » · '
      || _preview,
    'admin_journal',
    '/admin/analytics'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_journal_entry_notify_admin
  AFTER INSERT ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_journal_entry();

-- Mood
CREATE OR REPLACE FUNCTION public.notify_admin_mood_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_name TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;

  PERFORM public.notify_all_admins(
    'Nouvelle humeur',
    COALESCE(_user_name, 'Utilisateur')
      || ' a enregistré une humeur (score '
      || COALESCE(NEW.value::TEXT, '?')
      || ').',
    'admin_mood',
    '/admin/analytics'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_mood_entry_notify_admin
  AFTER INSERT ON public.mood_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_mood_entry();

-- Habits
CREATE OR REPLACE FUNCTION public.notify_admin_habit_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_name TEXT;
  _habit_name TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT ht.name INTO _habit_name
  FROM public.assigned_habits ah
  JOIN public.habit_templates ht ON ht.id = ah.habit_template_id
  WHERE ah.id = NEW.assigned_habit_id;

  PERFORM public.notify_all_admins(
    'Habitude complétée',
    COALESCE(_user_name, 'Utilisateur')
      || ' a complété « '
      || COALESCE(_habit_name, 'habitude')
      || ' » le '
      || COALESCE(NEW.completed_date::TEXT, '?')
      || '.',
    'admin_habit',
    '/admin/habits'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_habit_completion_notify_admin
  AFTER INSERT ON public.habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_habit_completion();

-- Decisions
CREATE OR REPLACE FUNCTION public.notify_admin_decision_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_name TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;

  PERFORM public.notify_all_admins(
    'Nouvelle décision',
    COALESCE(_user_name, 'Utilisateur')
      || ' a ajouté la décision « '
      || COALESCE(NEW.name, '?')
      || ' ».',
    'admin_decision',
    '/admin/decisions'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_decision_created_notify_admin
  AFTER INSERT ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_decision_created();

-- People: new contact
CREATE OR REPLACE FUNCTION public.notify_admin_people_contact_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_name TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;

  PERFORM public.notify_all_admins(
    'Nouveau contact',
    COALESCE(_user_name, 'Utilisateur')
      || ' a ajouté le contact « '
      || COALESCE(NEW.name, '?')
      || ' ».',
    'admin_contact',
    '/admin/analytics'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_people_contact_notify_admin
  AFTER INSERT ON public.people_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_people_contact_created();

-- Relation quality history
CREATE OR REPLACE FUNCTION public.notify_admin_relation_quality_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_name TEXT;
  _contact_name TEXT;
BEGIN
  SELECT display_name INTO _user_name FROM public.profiles WHERE id = NEW.user_id;
  SELECT name INTO _contact_name FROM public.people_contacts WHERE id = NEW.contact_id;

  PERFORM public.notify_all_admins(
    'Mise à jour relation',
    COALESCE(_user_name, 'Utilisateur')
      || ' — contact « '
      || COALESCE(_contact_name, '?')
      || ' » (qualité '
      || COALESCE(NEW.quality::TEXT, '?')
      || ').',
    'admin_relation',
    '/admin/analytics'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_relation_quality_notify_admin
  AFTER INSERT ON public.relation_quality_history
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_relation_quality_entry();

-- Realtime: badge updates without full page reload
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
