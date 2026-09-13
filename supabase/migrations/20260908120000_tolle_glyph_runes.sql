-- TOLLE collection: Eckhart Tolle presence teachings for Pulse / Grimoire.

INSERT INTO public.aegis_rune_collections (code, name_i18n, description_i18n, icon_key, sort_order)
VALUES (
  'TOLLE',
  '{"fr": "Tolle · Présence", "en": "Tolle · Presence"}'::jsonb,
  '{"fr": "Les 5 runes de la conscience du moment présent — sortir du mental, habiter le corps, accueillir ce qui est.", "en": "The 5 runes of present-moment awareness — leave the mind, inhabit the body, allow what is."}'::jsonb,
  'sun',
  4
) ON CONFLICT (code) DO UPDATE SET
  name_i18n = EXCLUDED.name_i18n,
  description_i18n = EXCLUDED.description_i18n,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

DO $$
DECLARE
  _coll_id UUID;
BEGIN
  SELECT id INTO _coll_id FROM public.aegis_rune_collections WHERE code = 'TOLLE';

  INSERT INTO public.aegis_rune_principles (
    code, name_i18n, quote_i18n, bg_class, text_class,
    sort_order, pulses_to_unlock, is_active, collection_id,
    description_i18n, icon_key
  )
  VALUES
    (
      'PRESENCE',
      '{"fr":"La Présence","en":"Presence"}'::jsonb,
      '{"fr":"Le seul moment où la vie existe vraiment est maintenant.","en":"The only moment life truly exists is now."}'::jsonb,
      'from-amber-950 to-black', 'text-amber-100', 1, 3, true, _coll_id,
      '{"fr":"Habiter le moment présent — sortir de la projection mentale passé/futur.","en":"Inhabit the present moment — step out of mental past/future projection."}'::jsonb,
      'sun'
    ),
    (
      'PAIN_BODY',
      '{"fr":"Le Corps de Douleur","en":"The Pain-Body"}'::jsonb,
      '{"fr":"L''émotion accumulée n''est pas ton identité — elle attend d''être vue.","en":"Accumulated emotion is not your identity — it waits to be seen."}'::jsonb,
      'from-rose-950 to-black', 'text-rose-200', 2, 3, true, _coll_id,
      '{"fr":"Détecter et désidentifier les charges émotionnelles récurrentes avant qu''elles prennent le contrôle.","en":"Detect and disidentify recurring emotional charges before they take over."}'::jsonb,
      'flame'
    ),
    (
      'WATCHER',
      '{"fr":"L''Observateur","en":"The Watcher"}'::jsonb,
      '{"fr":"Tu n''es pas tes pensées — tu es la conscience qui les observe.","en":"You are not your thoughts — you are the awareness that watches them."}'::jsonb,
      'from-violet-950 to-black', 'text-violet-200', 3, 3, true, _coll_id,
      '{"fr":"La conscience témoin — créer de l''espace entre le stimulus et la réaction.","en":"Witness consciousness — create space between stimulus and reaction."}'::jsonb,
      'eye'
    ),
    (
      'ACCEPTANCE',
      '{"fr":"L''Acceptation","en":"Acceptance"}'::jsonb,
      '{"fr":"Résister à ce qui est, c''est nourrir ce qui souffre.","en":"Resisting what is feeds what suffers."}'::jsonb,
      'from-teal-950 to-black', 'text-teal-200', 4, 3, true, _coll_id,
      '{"fr":"Accueillir le réel tel qu''il est — la porte d''entrée vers le changement authentique.","en":"Welcome reality as it is — the gateway to authentic change."}'::jsonb,
      'hand-heart'
    ),
    (
      'STILLNESS',
      '{"fr":"Le Silence","en":"Stillness"}'::jsonb,
      '{"fr":"Sous le bruit du mental, un espace sans forme attend toujours.","en":"Beneath the noise of the mind, a formless space always waits."}'::jsonb,
      'from-slate-900 to-black', 'text-slate-200', 5, 3, true, _coll_id,
      '{"fr":"Le repos intérieur — l''état de fond au-delà des pensées et des émotions.","en":"Inner rest — the background state beyond thoughts and emotions."}'::jsonb,
      'moon'
    )
  ON CONFLICT (code) DO UPDATE SET
    name_i18n = EXCLUDED.name_i18n,
    quote_i18n = EXCLUDED.quote_i18n,
    bg_class = EXCLUDED.bg_class,
    text_class = EXCLUDED.text_class,
    sort_order = EXCLUDED.sort_order,
    pulses_to_unlock = EXCLUDED.pulses_to_unlock,
    is_active = EXCLUDED.is_active,
    collection_id = EXCLUDED.collection_id,
    description_i18n = EXCLUDED.description_i18n,
    icon_key = EXCLUDED.icon_key,
    updated_at = now();
END;
$$;

NOTIFY pgrst, 'reload schema';
