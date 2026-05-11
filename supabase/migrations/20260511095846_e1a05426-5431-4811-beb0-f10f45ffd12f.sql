
-- Ensure pg_net is available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper: async POST to export-to-drive edge function
CREATE OR REPLACE FUNCTION public.export_to_drive_async(
  p_user_id UUID,
  p_category TEXT,
  p_filename TEXT,
  p_content_md TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _url TEXT := 'https://wjjugtdciljmuohxoqcj.supabase.co/functions/v1/export-to-drive';
  _anon TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqanVndGRjaWxqbXVvaHhvcWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjU4MDEsImV4cCI6MjA4NzMwMTgwMX0.EWW63Pv6lquhiCKH8-zvy_sz7nNLWdsovBo2tseo-Ps';
BEGIN
  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _anon,
      'apikey', _anon,
      'x-internal-call', '1'
    ),
    body := jsonb_build_object(
      'user_id', p_user_id,
      'category', p_category,
      'filename', p_filename,
      'content_md', p_content_md
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'export_to_drive_async failed: %', SQLERRM;
END;
$$;

-- ===== Triggers =====

-- Assessments: on submission
CREATE OR REPLACE FUNCTION public.trg_export_assessment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  IF NEW.status = 'submitted'::public.assessment_session_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    _ts := to_char(COALESCE(NEW.submitted_at, now()), 'YYYY-MM-DD_HH24-MI');
    _md := format(E'# Évaluation Archetype\n\n- Session: %s\n- Soumis le: %s\n- Durée: %s s\n- Confiance: %s\n',
      NEW.id, COALESCE(NEW.submitted_at::TEXT,'-'), COALESCE(NEW.duration_seconds::TEXT,'-'), COALESCE(NEW.confidence_score::TEXT,'-'));
    PERFORM public.export_to_drive_async(NEW.user_id, 'Quiz', _ts || '_assessment_' || NEW.id || '.md', _md);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_export_assessment_submitted ON public.assessment_sessions;
CREATE TRIGGER trg_export_assessment_submitted
AFTER INSERT OR UPDATE OF status ON public.assessment_sessions
FOR EACH ROW EXECUTE FUNCTION public.trg_export_assessment();

-- Mood entries
CREATE OR REPLACE FUNCTION public.trg_export_mood()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(now(), 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Mood entry\n\n- ID: %s\n- Valeur: %s\n- Date: %s\n', NEW.id, COALESCE(NEW.value::TEXT,'-'), now()::TEXT);
  PERFORM public.export_to_drive_async(NEW.user_id, 'Mood', _ts || '_mood_' || NEW.id || '.md', _md);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_export_mood_insert ON public.mood_entries;
CREATE TRIGGER trg_export_mood_insert
AFTER INSERT ON public.mood_entries
FOR EACH ROW EXECUTE FUNCTION public.trg_export_mood();

-- Decisions
CREATE OR REPLACE FUNCTION public.trg_export_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(NEW.created_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Décision\n\n- Nom: %s\n- Priorité: %s\n- Responsabilité: %s\n- Statut: %s\n- Délai: %s\n',
    COALESCE(NEW.name,'-'), NEW.priority, NEW.responsibility, NEW.status, COALESCE(NEW.time_to_decide,'-'));
  PERFORM public.export_to_drive_async(NEW.user_id, 'Decisions', _ts || '_decision_' || NEW.id || '.md', _md);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_export_decision_insert ON public.decisions;
CREATE TRIGGER trg_export_decision_insert
AFTER INSERT ON public.decisions
FOR EACH ROW EXECUTE FUNCTION public.trg_export_decision();

-- Journal
CREATE OR REPLACE FUNCTION public.trg_export_journal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(NEW.created_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# %s\n\n*%s*\n\n%s\n\n---\nMood: %s · Tags: %s\n',
    COALESCE(NULLIF(NEW.title,''), 'Journal entry'),
    NEW.created_at::TEXT,
    COALESCE(NEW.content,''),
    COALESCE(NEW.mood_score::TEXT,'-'),
    COALESCE(array_to_string(NEW.tags, ', '), '-'));
  PERFORM public.export_to_drive_async(NEW.user_id, 'Journal', _ts || '_journal_' || NEW.id || '.md', _md);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_export_journal_insert ON public.journal_entries;
CREATE TRIGGER trg_export_journal_insert
AFTER INSERT ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.trg_export_journal();

-- Habit completions
CREATE OR REPLACE FUNCTION public.trg_export_habit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _md TEXT; _ts TEXT; _name TEXT;
BEGIN
  SELECT ht.name INTO _name FROM public.assigned_habits ah
    JOIN public.habit_templates ht ON ht.id = ah.habit_template_id
    WHERE ah.id = NEW.assigned_habit_id;
  _ts := to_char(NEW.created_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Habitude complétée\n\n- Habitude: %s\n- Date: %s\n', COALESCE(_name,'-'), NEW.completed_date::TEXT);
  PERFORM public.export_to_drive_async(NEW.user_id, 'Habits', _ts || '_habit_' || NEW.id || '.md', _md);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_export_habit_insert ON public.habit_completions;
CREATE TRIGGER trg_export_habit_insert
AFTER INSERT ON public.habit_completions
FOR EACH ROW EXECUTE FUNCTION public.trg_export_habit();

-- Toolbox completions
CREATE OR REPLACE FUNCTION public.trg_export_toolbox()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _md TEXT; _ts TEXT; _title TEXT;
BEGIN
  SELECT title INTO _title FROM public.toolbox_assignments WHERE id = NEW.assignment_id;
  _ts := to_char(NEW.completed_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Outil Toolbox\n\n- Outil: %s\n- Statut: %s\n- Date: %s\n- Feedback: %s\n',
    COALESCE(_title,'-'), NEW.status, NEW.completed_at::TEXT, COALESCE(NEW.feedback,'-'));
  PERFORM public.export_to_drive_async(NEW.user_id, 'Toolbox', _ts || '_toolbox_' || NEW.id || '.md', _md);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_export_toolbox_insert ON public.toolbox_completions;
CREATE TRIGGER trg_export_toolbox_insert
AFTER INSERT ON public.toolbox_completions
FOR EACH ROW EXECUTE FUNCTION public.trg_export_toolbox();

-- People contacts
CREATE OR REPLACE FUNCTION public.trg_export_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(now(), 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Contact People\n\n- Nom: %s\n- Proximité: %s\n- ID: %s\n', COALESCE(NEW.name,'-'), COALESCE(NEW.proximity,'-'), NEW.id);
  PERFORM public.export_to_drive_async(NEW.user_id, 'People', _ts || '_contact_' || NEW.id || '.md', _md);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_export_contact_insert ON public.people_contacts;
CREATE TRIGGER trg_export_contact_insert
AFTER INSERT ON public.people_contacts
FOR EACH ROW EXECUTE FUNCTION public.trg_export_contact();
