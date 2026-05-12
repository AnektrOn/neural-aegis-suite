
-- 1. ENRICHED EXPORT TRIGGERS
CREATE OR REPLACE FUNCTION public.trg_export_assessment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT; _responses TEXT; _scores TEXT; _snapshot TEXT; _template TEXT;
BEGIN
  IF NEW.status = 'submitted'::public.assessment_session_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    _ts := to_char(COALESCE(NEW.submitted_at, now()), 'YYYY-MM-DD_HH24-MI');
    SELECT COALESCE(title_fr, title_en, slug) INTO _template FROM public.assessment_templates WHERE id = NEW.template_id;

    SELECT string_agg(
      format(E'### Q%s — %s\n- **Prompt FR:** %s\n- **Prompt EN:** %s\n- **House:** %s\n- **Dimension:** %s\n- **Selected options:**\n%s\n- **Text:** %s\n- **Numeric:** %s\n- **Raw:** `%s`\n',
        q.position, q.id, COALESCE(q.prompt_fr,'-'), COALESCE(q.prompt_en,'-'),
        COALESCE(q.house::TEXT,'-'), COALESCE(q.dimension,'-'),
        COALESCE((SELECT string_agg(format(E'  - [%s] %s / %s · weights=`%s` shadow=`%s` value=%s',
          o.position, COALESCE(o.label_fr,'-'), COALESCE(o.label_en,'-'),
          o.archetype_weights::TEXT, o.shadow_weights::TEXT, COALESCE(o.value::TEXT,'-')), E'\n')
          FROM public.assessment_options o WHERE o.id = ANY(r.selected_option_ids)), '  - (none)'),
        COALESCE(r.text_value,'-'), COALESCE(r.numeric_value::TEXT,'-'), r.raw_payload::TEXT),
      E'\n\n' ORDER BY q.position)
    INTO _responses
    FROM public.assessment_responses r
    JOIN public.assessment_questions q ON q.id = r.question_id
    WHERE r.session_id = NEW.id;

    SELECT string_agg(format('| %s | %s | %s | %s |', rank, archetype_key, raw_score::TEXT, normalized_score::TEXT),
      E'\n' ORDER BY rank) INTO _scores FROM public.archetype_scores WHERE session_id = NEW.id;

    SELECT format(E'- **Computed at:** %s\n- **Trigger:** %s\n- **Top:** `%s`\n- **Dimensions:** `%s`\n- **All:** `%s`\n- **Shadow:** `%s`\n- **Principle:** %s\n- **Body:** %s\n',
      computed_at::TEXT, trigger_event, top_archetypes::TEXT, dimension_scores::TEXT,
      all_scores::TEXT, shadow_scores::TEXT, COALESCE(active_principle,'-'), COALESCE(dominant_body,'-'))
    INTO _snapshot FROM public.archetype_profile_snapshots
    WHERE user_id = NEW.user_id AND (session_id = NEW.id OR session_id IS NULL)
    ORDER BY computed_at DESC LIMIT 1;

    _md := format(E'# Évaluation Archétype — Complète\n\n## Métadonnées\n- **Session:** %s\n- **Template:** %s (%s)\n- **User:** %s\n- **Statut:** %s\n- **Démarrée:** %s\n- **Soumise:** %s\n- **Durée:** %s s\n- **Confiance:** %s\n- **Client meta:** `%s`\n\n## Réponses\n\n%s\n\n## Scores Archétype\n\n| Rang | Archétype | Brut | Normalisé |\n| --- | --- | --- | --- |\n%s\n\n## Snapshot\n\n%s\n',
      NEW.id, COALESCE(_template,'-'), NEW.template_id, NEW.user_id, NEW.status,
      COALESCE(NEW.started_at::TEXT,'-'), COALESCE(NEW.submitted_at::TEXT,'-'),
      COALESCE(NEW.duration_seconds::TEXT,'-'), COALESCE(NEW.confidence_score::TEXT,'-'),
      NEW.client_meta::TEXT,
      COALESCE(_responses,'_(aucune)_'), COALESCE(_scores,'_(aucun)_'), COALESCE(_snapshot,'_(aucun)_'));
    PERFORM public.export_to_drive_async(NEW.user_id, 'Quiz', _ts || '_assessment_' || NEW.id || '.md', _md);
  END IF;
  RETURN NEW;
END $f$;

CREATE OR REPLACE FUNCTION public.trg_export_deepdive()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(NEW.created_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Deep Dive — Réponse\n\n- **ID:** %s\n- **User:** %s\n- **Question:** %s\n- **Options:** %s\n- **Text:** %s\n- **Numeric:** %s\n- **Créée:** %s\n- **MAJ:** %s\n',
    NEW.id, NEW.user_id, NEW.question_code,
    COALESCE(array_to_string(NEW.option_codes,', '),'-'),
    COALESCE(NEW.text_value,'-'), COALESCE(NEW.numeric_value::TEXT,'-'),
    NEW.created_at::TEXT, NEW.updated_at::TEXT);
  PERFORM public.export_to_drive_async(NEW.user_id, 'DeepDive', _ts || '_deepdive_' || NEW.question_code || '_' || NEW.id || '.md', _md);
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS export_deepdive_to_drive ON public.deepdive_responses;
CREATE TRIGGER export_deepdive_to_drive AFTER INSERT OR UPDATE ON public.deepdive_responses
FOR EACH ROW EXECUTE FUNCTION public.trg_export_deepdive();

CREATE OR REPLACE FUNCTION public.trg_export_archetype_snapshot()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(NEW.computed_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Snapshot Archétype\n\n- **ID:** %s\n- **User:** %s\n- **Session:** %s\n- **Trigger:** %s\n- **Version:** %s\n- **Calculé:** %s\n- **Principle:** %s\n- **Body:** %s\n- **Notes:** %s\n\n## Top\n```json\n%s\n```\n\n## Dimensions\n```json\n%s\n```\n\n## All scores\n```json\n%s\n```\n\n## Shadow scores\n```json\n%s\n```\n',
    NEW.id, NEW.user_id, COALESCE(NEW.session_id::TEXT,'-'),
    NEW.trigger_event, NEW.snapshot_version, NEW.computed_at::TEXT,
    COALESCE(NEW.active_principle,'-'), COALESCE(NEW.dominant_body,'-'),
    COALESCE(NEW.admin_notes,'-'),
    NEW.top_archetypes::TEXT, NEW.dimension_scores::TEXT,
    NEW.all_scores::TEXT, NEW.shadow_scores::TEXT);
  PERFORM public.export_to_drive_async(NEW.user_id, 'Quiz', _ts || '_snapshot_' || NEW.id || '.md', _md);
  RETURN NEW;
END $f$;
DROP TRIGGER IF EXISTS export_archetype_snapshot_to_drive ON public.archetype_profile_snapshots;
CREATE TRIGGER export_archetype_snapshot_to_drive AFTER INSERT ON public.archetype_profile_snapshots
FOR EACH ROW EXECUTE FUNCTION public.trg_export_archetype_snapshot();

CREATE OR REPLACE FUNCTION public.trg_export_mood()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(NEW.logged_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Mood entry\n\n- **ID:** %s\n- **User:** %s\n- **Date:** %s\n- **Humeur:** %s\n- **Sommeil:** %s\n- **Stress:** %s\n- **Repas:** %s\n- **Détail:** `%s`\n',
    NEW.id, NEW.user_id, NEW.logged_at::TEXT,
    COALESCE(NEW.value::TEXT,'-'), COALESCE(NEW.sleep::TEXT,'-'),
    COALESCE(NEW.stress::TEXT,'-'), COALESCE(NEW.meals_count::TEXT,'-'),
    COALESCE(NEW.meals::TEXT,'-'));
  PERFORM public.export_to_drive_async(NEW.user_id, 'Mood', _ts || '_mood_' || NEW.id || '.md', _md);
  RETURN NEW;
END $f$;

CREATE OR REPLACE FUNCTION public.trg_export_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(NEW.created_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Décision\n\n- **ID:** %s\n- **User:** %s\n- **Nom:** %s\n- **Priorité:** %s\n- **Responsabilité:** %s\n- **Statut:** %s\n- **Délai:** %s\n- **Décidée:** %s\n- **Reportée:** %s\n- **Créée:** %s\n',
    NEW.id, NEW.user_id, COALESCE(NEW.name,'-'),
    COALESCE(NEW.priority::TEXT,'-'), COALESCE(NEW.responsibility::TEXT,'-'),
    COALESCE(NEW.status,'-'), COALESCE(NEW.time_to_decide,'-'),
    COALESCE(NEW.decided_at::TEXT,'-'), COALESCE(NEW.deferred_until::TEXT,'-'),
    NEW.created_at::TEXT);
  PERFORM public.export_to_drive_async(NEW.user_id, 'Decisions', _ts || '_decision_' || NEW.id || '.md', _md);
  RETURN NEW;
END $f$;

CREATE OR REPLACE FUNCTION public.trg_export_journal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT;
BEGIN
  _ts := to_char(NEW.created_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# %s\n\n- **ID:** %s\n- **User:** %s\n- **Créée:** %s\n- **MAJ:** %s\n- **Mood:** %s\n- **Tags:** %s\n\n---\n\n%s\n',
    COALESCE(NULLIF(NEW.title,''),'Entrée journal'),
    NEW.id, NEW.user_id, NEW.created_at::TEXT, NEW.updated_at::TEXT,
    COALESCE(NEW.mood_score::TEXT,'-'),
    COALESCE(array_to_string(NEW.tags,', '),'-'),
    COALESCE(NEW.content,''));
  PERFORM public.export_to_drive_async(NEW.user_id, 'Journal', _ts || '_journal_' || NEW.id || '.md', _md);
  RETURN NEW;
END $f$;

CREATE OR REPLACE FUNCTION public.trg_export_habit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT; _name TEXT; _cat TEXT; _desc TEXT; _arch TEXT; _shadow TEXT;
BEGIN
  SELECT ht.name, ht.category, ht.description,
         array_to_string(ht.archetype_targets,', '),
         array_to_string(ht.shadow_targets,', ')
  INTO _name, _cat, _desc, _arch, _shadow
  FROM public.assigned_habits ah
  JOIN public.habit_templates ht ON ht.id = ah.habit_template_id
  WHERE ah.id = NEW.assigned_habit_id;
  _ts := to_char(NEW.created_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Habitude complétée\n\n- **ID:** %s\n- **User:** %s\n- **Habitude:** %s\n- **Catégorie:** %s\n- **Description:** %s\n- **Archétypes:** %s\n- **Ombres:** %s\n- **Date:** %s\n- **Créée:** %s\n',
    NEW.id, NEW.user_id, COALESCE(_name,'-'), COALESCE(_cat,'-'),
    COALESCE(_desc,'-'), COALESCE(_arch,'-'), COALESCE(_shadow,'-'),
    NEW.completed_date::TEXT, NEW.created_at::TEXT);
  PERFORM public.export_to_drive_async(NEW.user_id, 'Habits', _ts || '_habit_' || NEW.id || '.md', _md);
  RETURN NEW;
END $f$;

CREATE OR REPLACE FUNCTION public.trg_export_toolbox()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT; _t RECORD;
BEGIN
  SELECT title, description, content_type, widget_config, external_url, duration
  INTO _t FROM public.toolbox_assignments WHERE id = NEW.assignment_id;
  _ts := to_char(NEW.completed_at, 'YYYY-MM-DD_HH24-MI');
  _md := format(E'# Toolbox — %s\n\n- **ID:** %s\n- **User:** %s\n- **Outil:** %s\n- **Description:** %s\n- **Type:** %s\n- **Durée:** %s\n- **URL:** %s\n- **Widget:** `%s`\n- **Statut:** %s\n- **Date:** %s\n\n## Feedback\n%s\n',
    COALESCE(_t.title,'Outil'), NEW.id, NEW.user_id,
    COALESCE(_t.title,'-'), COALESCE(_t.description,'-'),
    COALESCE(_t.content_type,'-'), COALESCE(_t.duration,'-'),
    COALESCE(_t.external_url,'-'), COALESCE(_t.widget_config::TEXT,'-'),
    NEW.status, NEW.completed_at::TEXT,
    COALESCE(NEW.feedback,'_(aucun feedback)_'));
  PERFORM public.export_to_drive_async(NEW.user_id, 'Toolbox', _ts || '_toolbox_' || NEW.id || '.md', _md);
  RETURN NEW;
END $f$;

CREATE OR REPLACE FUNCTION public.trg_export_contact()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE _md TEXT; _ts TEXT; _hist TEXT;
BEGIN
  _ts := to_char(COALESCE(NEW.updated_at, NEW.created_at, now()), 'YYYY-MM-DD_HH24-MI');
  SELECT string_agg(format('- %s · q=%s · %s', recorded_at::TEXT, quality::TEXT, COALESCE(note,'-')),
    E'\n' ORDER BY recorded_at DESC) INTO _hist
  FROM public.relation_quality_history WHERE contact_id = NEW.id;
  _md := format(E'# Contact — %s\n\n- **ID:** %s\n- **User:** %s\n- **Nom:** %s\n- **Rôle:** %s\n- **Proximité:** %s\n- **Qualité:** %s\n- **Insight:** %s\n- **Créé:** %s\n- **MAJ:** %s\n\n## Historique\n%s\n',
    COALESCE(NEW.name,'Contact'), NEW.id, NEW.user_id,
    COALESCE(NEW.name,'-'), COALESCE(NEW.role,'-'),
    COALESCE(NEW.proximity,'-'), COALESCE(NEW.quality::TEXT,'-'),
    COALESCE(NEW.insight,'-'),
    COALESCE(NEW.created_at::TEXT,'-'), COALESCE(NEW.updated_at::TEXT,'-'),
    COALESCE(_hist,'_(aucun historique)_'));
  PERFORM public.export_to_drive_async(NEW.user_id, 'People', _ts || '_contact_' || NEW.id || '.md', _md);
  RETURN NEW;
END $f$;

-- 2. BACKFILL — re-export everything
DO $$
DECLARE r RECORD; _resp TEXT; _scores TEXT; _snap TEXT; _tpl TEXT;
BEGIN
  -- Quiz sessions
  FOR r IN SELECT * FROM public.assessment_sessions WHERE status = 'submitted' LOOP
    SELECT COALESCE(title_fr,title_en,slug) INTO _tpl FROM public.assessment_templates WHERE id = r.template_id;
    SELECT string_agg(
      format(E'### Q%s — %s\n- **FR:** %s\n- **EN:** %s\n- **House:** %s\n- **Options:**\n%s\n- **Text:** %s\n- **Num:** %s\n',
        q.position, q.id, COALESCE(q.prompt_fr,'-'), COALESCE(q.prompt_en,'-'),
        COALESCE(q.house::TEXT,'-'),
        COALESCE((SELECT string_agg(format(E'  - [%s] %s / %s · w=`%s` s=`%s`',
          o.position, COALESCE(o.label_fr,'-'), COALESCE(o.label_en,'-'),
          o.archetype_weights::TEXT, o.shadow_weights::TEXT), E'\n')
          FROM public.assessment_options o WHERE o.id = ANY(ar.selected_option_ids)), '  - (none)'),
        COALESCE(ar.text_value,'-'), COALESCE(ar.numeric_value::TEXT,'-')),
      E'\n\n' ORDER BY q.position) INTO _resp
    FROM public.assessment_responses ar
    JOIN public.assessment_questions q ON q.id = ar.question_id
    WHERE ar.session_id = r.id;

    SELECT string_agg(format('| %s | %s | %s | %s |', rank, archetype_key, raw_score::TEXT, normalized_score::TEXT),
      E'\n' ORDER BY rank) INTO _scores FROM public.archetype_scores WHERE session_id = r.id;

    SELECT format(E'- **Computed:** %s\n- **Top:** `%s`\n- **All:** `%s`\n- **Shadow:** `%s`\n',
      computed_at::TEXT, top_archetypes::TEXT, all_scores::TEXT, shadow_scores::TEXT)
    INTO _snap FROM public.archetype_profile_snapshots
    WHERE user_id = r.user_id AND (session_id = r.id OR session_id IS NULL)
    ORDER BY computed_at DESC LIMIT 1;

    PERFORM public.export_to_drive_async(r.user_id, 'Quiz',
      to_char(COALESCE(r.submitted_at,now()),'YYYY-MM-DD_HH24-MI') || '_assessment_' || r.id || '.md',
      format(E'# Évaluation Archétype — Complète\n\n## Métadonnées\n- **Session:** %s\n- **Template:** %s\n- **User:** %s\n- **Soumise:** %s\n- **Durée:** %s s\n- **Confiance:** %s\n\n## Réponses\n\n%s\n\n## Scores\n\n| Rang | Arch | Brut | Norm |\n| --- | --- | --- | --- |\n%s\n\n## Snapshot\n\n%s\n',
        r.id, COALESCE(_tpl,'-'), r.user_id,
        COALESCE(r.submitted_at::TEXT,'-'),
        COALESCE(r.duration_seconds::TEXT,'-'),
        COALESCE(r.confidence_score::TEXT,'-'),
        COALESCE(_resp,'_(aucune)_'),
        COALESCE(_scores,'_(aucun)_'),
        COALESCE(_snap,'_(aucun)_')));
  END LOOP;

  -- Snapshots
  FOR r IN SELECT * FROM public.archetype_profile_snapshots LOOP
    PERFORM public.export_to_drive_async(r.user_id, 'Quiz',
      to_char(r.computed_at,'YYYY-MM-DD_HH24-MI') || '_snapshot_' || r.id || '.md',
      format(E'# Snapshot Archétype\n\n- **ID:** %s\n- **Trigger:** %s\n- **Calculé:** %s\n\n## Top\n```json\n%s\n```\n\n## Dimensions\n```json\n%s\n```\n\n## All\n```json\n%s\n```\n\n## Shadow\n```json\n%s\n```\n',
        r.id, r.trigger_event, r.computed_at::TEXT,
        r.top_archetypes::TEXT, r.dimension_scores::TEXT,
        r.all_scores::TEXT, r.shadow_scores::TEXT));
  END LOOP;

  -- Deep dive
  FOR r IN SELECT * FROM public.deepdive_responses LOOP
    PERFORM public.export_to_drive_async(r.user_id, 'DeepDive',
      to_char(r.created_at,'YYYY-MM-DD_HH24-MI') || '_deepdive_' || r.question_code || '_' || r.id || '.md',
      format(E'# Deep Dive\n\n- **ID:** %s\n- **Question:** %s\n- **Options:** %s\n- **Text:** %s\n- **Num:** %s\n- **Créée:** %s\n',
        r.id, r.question_code, COALESCE(array_to_string(r.option_codes,', '),'-'),
        COALESCE(r.text_value,'-'), COALESCE(r.numeric_value::TEXT,'-'), r.created_at::TEXT));
  END LOOP;

  -- Mood
  FOR r IN SELECT * FROM public.mood_entries LOOP
    PERFORM public.export_to_drive_async(r.user_id, 'Mood',
      to_char(r.logged_at,'YYYY-MM-DD_HH24-MI') || '_mood_' || r.id || '.md',
      format(E'# Mood entry\n\n- **ID:** %s\n- **Date:** %s\n- **Humeur:** %s\n- **Sommeil:** %s\n- **Stress:** %s\n- **Repas:** %s\n- **Détail:** `%s`\n',
        r.id, r.logged_at::TEXT, COALESCE(r.value::TEXT,'-'),
        COALESCE(r.sleep::TEXT,'-'), COALESCE(r.stress::TEXT,'-'),
        COALESCE(r.meals_count::TEXT,'-'), COALESCE(r.meals::TEXT,'-')));
  END LOOP;

  -- Decisions
  FOR r IN SELECT * FROM public.decisions LOOP
    PERFORM public.export_to_drive_async(r.user_id, 'Decisions',
      to_char(r.created_at,'YYYY-MM-DD_HH24-MI') || '_decision_' || r.id || '.md',
      format(E'# Décision\n\n- **Nom:** %s\n- **Priorité:** %s\n- **Responsabilité:** %s\n- **Statut:** %s\n- **Délai:** %s\n- **Décidée:** %s\n- **Reportée:** %s\n',
        COALESCE(r.name,'-'), r.priority::TEXT, r.responsibility::TEXT,
        r.status, COALESCE(r.time_to_decide,'-'),
        COALESCE(r.decided_at::TEXT,'-'), COALESCE(r.deferred_until::TEXT,'-')));
  END LOOP;

  -- Journal
  FOR r IN SELECT * FROM public.journal_entries LOOP
    PERFORM public.export_to_drive_async(r.user_id, 'Journal',
      to_char(r.created_at,'YYYY-MM-DD_HH24-MI') || '_journal_' || r.id || '.md',
      format(E'# %s\n\n- **Créée:** %s\n- **Mood:** %s\n- **Tags:** %s\n\n---\n\n%s\n',
        COALESCE(NULLIF(r.title,''),'Entrée'), r.created_at::TEXT,
        COALESCE(r.mood_score::TEXT,'-'),
        COALESCE(array_to_string(r.tags,', '),'-'),
        COALESCE(r.content,'')));
  END LOOP;

  -- Habits
  FOR r IN SELECT hc.id, hc.user_id, hc.assigned_habit_id, hc.completed_date, hc.created_at,
                  ht.name AS hname, ht.category AS hcat, ht.description AS hdesc
           FROM public.habit_completions hc
           LEFT JOIN public.assigned_habits ah ON ah.id = hc.assigned_habit_id
           LEFT JOIN public.habit_templates ht ON ht.id = ah.habit_template_id LOOP
    PERFORM public.export_to_drive_async(r.user_id, 'Habits',
      to_char(r.created_at,'YYYY-MM-DD_HH24-MI') || '_habit_' || r.id || '.md',
      format(E'# Habitude complétée\n\n- **Habitude:** %s\n- **Catégorie:** %s\n- **Description:** %s\n- **Date:** %s\n',
        COALESCE(r.hname,'-'), COALESCE(r.hcat,'-'),
        COALESCE(r.hdesc,'-'), r.completed_date::TEXT));
  END LOOP;

  -- Toolbox
  FOR r IN SELECT tc.id, tc.user_id, tc.assignment_id, tc.status, tc.feedback, tc.completed_at,
                  ta.title AS ttitle, ta.description AS tdesc, ta.content_type AS tctype,
                  ta.widget_config AS twc, ta.duration AS tdur
           FROM public.toolbox_completions tc
           LEFT JOIN public.toolbox_assignments ta ON ta.id = tc.assignment_id LOOP
    PERFORM public.export_to_drive_async(r.user_id, 'Toolbox',
      to_char(r.completed_at,'YYYY-MM-DD_HH24-MI') || '_toolbox_' || r.id || '.md',
      format(E'# Toolbox — %s\n\n- **Outil:** %s\n- **Description:** %s\n- **Type:** %s\n- **Durée:** %s\n- **Widget:** `%s`\n- **Statut:** %s\n- **Date:** %s\n\n## Feedback\n%s\n',
        COALESCE(r.ttitle,'-'), COALESCE(r.ttitle,'-'),
        COALESCE(r.tdesc,'-'), COALESCE(r.tctype,'-'),
        COALESCE(r.tdur,'-'), COALESCE(r.twc::TEXT,'-'),
        r.status, r.completed_at::TEXT,
        COALESCE(r.feedback,'_(aucun)_')));
  END LOOP;

  -- People
  FOR r IN SELECT * FROM public.people_contacts LOOP
    PERFORM public.export_to_drive_async(r.user_id, 'People',
      to_char(COALESCE(r.updated_at, r.created_at, now()),'YYYY-MM-DD_HH24-MI') || '_contact_' || r.id || '.md',
      format(E'# Contact — %s\n\n- **Nom:** %s\n- **Rôle:** %s\n- **Proximité:** %s\n- **Qualité:** %s\n- **Insight:** %s\n- **Créé:** %s\n\n## Historique\n%s\n',
        COALESCE(r.name,'-'), COALESCE(r.name,'-'),
        COALESCE(r.role,'-'), COALESCE(r.proximity,'-'),
        r.quality::TEXT, COALESCE(r.insight,'-'),
        r.created_at::TEXT,
        COALESCE((SELECT string_agg(format('- %s · q=%s · %s', recorded_at::TEXT, quality::TEXT, COALESCE(note,'-')),
          E'\n' ORDER BY recorded_at DESC) FROM public.relation_quality_history WHERE contact_id = r.id),'_(aucun)_')));
  END LOOP;
END $$;
