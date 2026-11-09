-- JUNG_AME collection: Jung / Âme partielle runes for Pulse / Grimoire.

INSERT INTO public.aegis_rune_collections (code, name_i18n, description_i18n, icon_key, sort_order)
VALUES (
  'JUNG_AME',
  '{"fr": "Jung · Âme", "en": "Jung · Soul"}'::jsonb,
  '{"fr": "Runes jungiennes — complexes autonomes, rêves et structure de l''inconscient.", "en": "Jungian runes — autonomous complexes, dreams, and unconscious structure."}'::jsonb,
  'sparkles',
  5
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
  SELECT id INTO _coll_id FROM public.aegis_rune_collections WHERE code = 'JUNG_AME';

  INSERT INTO public.aegis_rune_principles (
    code, name_i18n, quote_i18n, bg_class, text_class,
    sort_order, pulses_to_unlock, is_active, collection_id,
    description_i18n, icon_key
  )
  VALUES
    (
      'DYNAMIQUE_COMPLEXES',
      '{"fr":"Dynamique des Complexes","en":"Complex Dynamics"}'::jsonb,
      '{"fr":"Ce n''est pas toi qui as un complexe — c''est le complexe qui s''empare de toi.","en":"You do not have a complex — the complex takes hold of you."}'::jsonb,
      'from-indigo-950 to-black', 'text-indigo-100', 1, 3, true, _coll_id,
      '{"fr":"Nommer et désidentifier les complexes à tonalité affective avant qu''ils usurpent le Moi.","en":"Name and disidentify feeling-toned complexes before they usurp the Ego."}'::jsonb,
      'orbit'
    ),
    (
      'MORPHOLOGIE_REVES',
      '{"fr":"Morphologie des Rêves","en":"Dream Morphology"}'::jsonb,
      '{"fr":"Le rêve parle en images — lire sa forme, c''est lire l''âme.","en":"The dream speaks in images — reading its form is reading the soul."}'::jsonb,
      'from-violet-950 to-black', 'text-violet-100', 2, 3, true, _coll_id,
      '{"fr":"Décoder la structure et le langage symbolique des rêves comme message de l''inconscient.","en":"Decode dream structure and symbolic language as messages from the unconscious."}'::jsonb,
      'moon'
    ),
    (
      'STRUCTURE_INCONSCIENT',
      '{"fr":"Structure de l''Inconscient","en":"Structure of the Unconscious"}'::jsonb,
      '{"fr":"L''inconscient a une architecture — la cartographier, c''est se libérer.","en":"The unconscious has an architecture — mapping it is liberation."}'::jsonb,
      'from-slate-950 to-black', 'text-slate-100', 3, 3, true, _coll_id,
      '{"fr":"Cartographier les couches de l''inconscient personnel et collectif pour restaurer l''autonomie du Moi.","en":"Map personal and collective unconscious layers to restore Ego autonomy."}'::jsonb,
      'layers'
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
END $$;
