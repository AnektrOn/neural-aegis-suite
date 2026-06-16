-- ECHOLS collection: clinical high-resolution runes for Pulse / Grimoire.

INSERT INTO public.aegis_rune_collections (code, name_i18n, description_i18n, icon_key, sort_order)
VALUES (
  'ECHOLS',
  '{"fr": "Echols · Haute Résolution", "en": "Echols · High Resolution"}'::jsonb,
  '{"fr": "Les 5 runes cliniques Echols — régulation somatique, bouclier cognitif et souveraineté attentionnelle.", "en": "The 5 Echols clinical runes — somatic regulation, cognitive shielding, and attentional sovereignty."}'::jsonb,
  'activity',
  3
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
  SELECT id INTO _coll_id FROM public.aegis_rune_collections WHERE code = 'ECHOLS';

  INSERT INTO public.aegis_rune_principles (
    code, name_i18n, quote_i18n, bg_class, text_class,
    sort_order, pulses_to_unlock, is_active, collection_id,
    description_i18n, icon_key
  )
  VALUES
    (
      'ENERGY',
      '{"fr":"L''Énergie","en":"Energy"}'::jsonb,
      '{"fr":"Le flux vital se régule avant de se dépenser.","en":"Vital flow is regulated before it is spent."}'::jsonb,
      'from-cyan-950 to-black', 'text-cyan-200', 1, 3, true, _coll_id,
      '{"fr":"Charge, décharge et budget énergétique — lire et orienter le flux somatique.","en":"Charge, discharge, and energy budget — read and steer somatic flow."}'::jsonb,
      'zap'
    ),
    (
      'GROUNDING',
      '{"fr":"L''Ancrage","en":"Grounding"}'::jsonb,
      '{"fr":"Le corps devient le socle avant que l''esprit ne décide.","en":"The body becomes the foundation before the mind decides."}'::jsonb,
      'from-stone-900 to-black', 'text-stone-200', 2, 3, true, _coll_id,
      '{"fr":"Connexion terre, posture et présence — stabiliser le système nerveux.","en":"Earth connection, posture, and presence — stabilize the nervous system."}'::jsonb,
      'mountain'
    ),
    (
      'SHIELDING',
      '{"fr":"Le Bouclier","en":"Shielding"}'::jsonb,
      '{"fr":"L''attention souveraine se ferme aux intrusions triviales.","en":"Sovereign attention closes to trivial intrusions."}'::jsonb,
      'from-slate-900 to-black', 'text-slate-200', 3, 3, true, _coll_id,
      '{"fr":"Pare-feu cognitif — protéger l''actif attentionnel le plus cher.","en":"Cognitive firewall — protect the most expensive attentional asset."}'::jsonb,
      'shield'
    ),
    (
      'DIRECTING',
      '{"fr":"La Direction","en":"Directing"}'::jsonb,
      '{"fr":"Un seul faisceau traverse le brouillard opérationnel.","en":"A single beam cuts through operational fog."}'::jsonb,
      'from-sky-950 to-black', 'text-sky-200', 4, 3, true, _coll_id,
      '{"fr":"Focus laser — canaliser l''intention vers une cause unique à la fois.","en":"Laser focus — channel intention into one cause at a time."}'::jsonb,
      'crosshair'
    ),
    (
      'CENTERING',
      '{"fr":"Le Centrage","en":"Centering"}'::jsonb,
      '{"fr":"Le pendule revient au milieu entre excès et effondrement.","en":"The pendulum returns to the middle between excess and collapse."}'::jsonb,
      'from-indigo-950 to-black', 'text-indigo-200', 5, 3, true, _coll_id,
      '{"fr":"Équilibre dynamique — retrouver l''axe entre sprint et repos.","en":"Dynamic balance — recover the axis between sprint and rest."}'::jsonb,
      'circle-dot'
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
