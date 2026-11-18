-- Weekly LOGOS catalog: server-owned, atomic, retry-safe; existing reader RPCs unchanged.
CREATE OR REPLACE FUNCTION public.create_weekly_logos_batch()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_now timestamptz := now();
  v_week date := date_trunc('week', now() AT TIME ZONE 'UTC')::date;
  v_note text;
  v_batch uuid;
  v_catalog jsonb := $catalog$[[{"category": "decision", "title_fr": "La décision en suspens", "title_en": "The pending decision", "opening_prompt": "Aide à nommer une décision concrète, comparer deux options et identifier un prochain pas réversible. Pose une question à la fois, sans décider à la place de la personne.", "first_message": "Quelle décision te prend le plus de place aujourd’hui ?"}, {"category": "mental", "title_fr": "Faire de la place", "title_en": "Make some room", "opening_prompt": "Aide à distinguer les faits des anticipations dans une préoccupation actuelle. Invite à choisir ce qui peut être traité maintenant et ce qui peut attendre.", "first_message": "Quelle pensée revient en boucle en ce moment ?"}, {"category": "intention", "title_fr": "Le cap de la semaine", "title_en": "This week’s direction", "opening_prompt": "Accompagne la formulation d’une intention réaliste pour la semaine. Relie cette intention à une action observable et à une limite à protéger.", "first_message": "À la fin de cette semaine, qu’aimerais-tu avoir vraiment fait avancer ?"}, {"category": "relation", "title_fr": "Une conversation importante", "title_en": "An important conversation", "opening_prompt": "Aide à préparer une conversation précise en distinguant faits, ressenti et demande. Encourage une formulation respectueuse, sans prêter d’intentions à l’autre.", "first_message": "Avec qui as-tu besoin d’avoir une vraie conversation ?"}, {"category": "body", "title_fr": "Retrouver un appui", "title_en": "Find your footing", "opening_prompt": "Invite à remarquer les sensations corporelles sans les interpréter médicalement. Propose un appui simple et facultatif, sans imposer une respiration ou un exercice.", "first_message": "Si tu prends un instant, où sens-tu le plus de tension ?"}], [{"category": "decision", "title_fr": "Choisir sans tout savoir", "title_en": "Choose with uncertainty", "opening_prompt": "Aide à séparer les informations indispensables de celles qui peuvent manquer avant une décision. Cherche un petit test réversible plutôt qu’une certitude parfaite.", "first_message": "Qu’est-ce que tu attends encore de savoir avant de choisir ?"}, {"category": "mental", "title_fr": "Sortir du trop-plein", "title_en": "Step out of overload", "opening_prompt": "Aide à nommer les sujets qui saturent l’attention puis à en sélectionner un seul. Distingue une action concrète d’un besoin de repos ou de soutien.", "first_message": "Qu’est-ce qui encombre le plus ton attention aujourd’hui ?"}, {"category": "intention", "title_fr": "Protéger l’essentiel", "title_en": "Protect what matters", "opening_prompt": "Aide à identifier une priorité personnelle et une limite réaliste qui la protège. Vérifie que le prochain geste dépend de la personne plutôt que des autres.", "first_message": "Qu’as-tu envie de protéger dans ta semaine ?"}, {"category": "relation", "title_fr": "Poser une limite", "title_en": "Set a boundary", "opening_prompt": "Accompagne la préparation d’une limite claire et respectueuse dans une situation concrète. Explore ce que la personne accepte et ce qu’elle souhaite refuser sans culpabilisation.", "first_message": "Dans quelle relation as-tu besoin de dire les choses plus clairement ?"}, {"category": "body", "title_fr": "Écouter son rythme", "title_en": "Listen to your pace", "opening_prompt": "Invite à observer le niveau d’énergie du moment sans jugement ni diagnostic. Explore une adaptation légère et librement choisie du rythme de la journée.", "first_message": "Ton corps te demande plutôt de ralentir ou de bouger aujourd’hui ?"}]]$catalog$::jsonb;
  v_prompts jsonb;
BEGIN
  v_note := 'weekly-' || v_week::text;
  PERFORM pg_advisory_xact_lock(hashtextextended('logos-opening-' || v_note, 0));
  SELECT id INTO v_batch FROM public.logos_prompt_batches
    WHERE source = 'cron' AND note = v_note ORDER BY created_at LIMIT 1;
  IF v_batch IS NOT NULL THEN
    IF (SELECT count(*) FROM public.logos_path_prompts WHERE batch_id = v_batch) <> 5 THEN
      RAISE EXCEPTION 'Existing weekly LOGOS batch is incomplete';
    END IF;
    RETURN jsonb_build_object('batch_id', v_batch, 'created', false, 'count', 5);
  END IF;
  v_prompts := v_catalog -> (mod((v_week - DATE '2026-11-16') / 7, jsonb_array_length(v_catalog))::int);
  IF jsonb_array_length(v_prompts) <> 5 OR
      (SELECT count(DISTINCT p->>'category') FROM jsonb_array_elements(v_prompts) p) <> 5 THEN
    RAISE EXCEPTION 'LOGOS requires exactly five distinct categories';
  END IF;
  INSERT INTO public.logos_prompt_batches(source, note) VALUES ('cron', v_note) RETURNING id INTO v_batch;
  INSERT INTO public.logos_path_prompts(batch_id, category, title_fr, title_en, opening_prompt, first_message, expires_at, created_at)
    SELECT v_batch, p->>'category', p->>'title_fr', p->>'title_en', p->>'opening_prompt', p->>'first_message',
      v_now + interval '7 days', v_now FROM jsonb_array_elements(v_prompts) p;
  RETURN jsonb_build_object('batch_id', v_batch, 'created', true, 'count', 5);
END;
$function$;
REVOKE ALL ON FUNCTION public.create_weekly_logos_batch() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_weekly_logos_batch() TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.logos_prompt_batches, public.logos_path_prompts FROM anon, authenticated;
GRANT SELECT ON public.logos_prompt_batches, public.logos_path_prompts TO authenticated;
GRANT ALL ON public.logos_prompt_batches, public.logos_path_prompts TO service_role;
