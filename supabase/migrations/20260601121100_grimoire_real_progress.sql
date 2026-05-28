-- Fix grimoire RPC: return total_cards per rune so the UI shows real progress
-- (assimilated / total) instead of the static pulses_to_unlock threshold.
-- Also seed the MYSS_ARCHETYPE collection and all 16 archetype principles.

-- ─── Card-level completion tracking ──────────────────────────────────

ALTER TABLE public.aegis_user_card_interactions
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.complete_aegis_card(p_card_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  UPDATE public.aegis_user_card_interactions
  SET completed_at = COALESCE(completed_at, now())
  WHERE user_id = _uid AND card_id = p_card_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'interaction_not_found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'completed_at', now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_aegis_card(UUID) TO authenticated;

-- ─── Fix grimoire RPC ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_aegis_synapse_grimoire(
  p_locale TEXT DEFAULT 'fr'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid     UUID;
  _locale  TEXT;
  _library JSONB;
  _runes   JSONB;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  _locale := lower(trim(COALESCE(p_locale, 'fr')));
  IF _locale NOT IN ('fr', 'en') THEN _locale := 'fr'; END IF;

  -- Assimilated cards with course completion status
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.swiped_at DESC), '[]'::jsonb)
  INTO _library
  FROM (
    SELECT
      c.id,
      c.external_key,
      c.course_id,
      p.code AS principle_code,
      public.resolve_i18n(p.name_i18n, _locale) AS principle_name,
      public.resolve_i18n(p.quote_i18n, _locale) AS principle_quote,
      p.bg_class AS principle_bg_class,
      p.text_class AS principle_text_class,
      c.time_label,
      public.resolve_i18n(c.title_i18n, _locale) AS title,
      public.resolve_i18n(c.problem_i18n, _locale) AS problem,
      public.resolve_i18n_array(c.bullets_i18n, _locale) AS bullets,
      public.resolve_i18n(c.format_i18n, _locale) AS format,
      public.resolve_course_content(c.course_content_i18n, _locale) AS course_content,
      i.created_at AS swiped_at,
      (i.completed_at IS NOT NULL) AS is_course_completed
    FROM public.aegis_user_card_interactions i
    JOIN public.aegis_synapse_cards c ON c.id = i.card_id
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    WHERE i.user_id = _uid
      AND i.action = 'assimilated'
    ORDER BY i.created_at DESC
  ) t;

  -- Rune progress with real card counts
  SELECT COALESCE(jsonb_agg(row_to_json(r)::jsonb ORDER BY r.collection_sort, r.sort_order), '[]'::jsonb)
  INTO _runes
  FROM (
    SELECT
      p.code                                              AS principle_code,
      public.resolve_i18n(p.name_i18n, _locale)           AS principle_name,
      p.pulses_to_unlock,
      COALESCE(urp.pulses_count, 0)                       AS pulses_count,
      (COALESCE(urp.pulses_count, 0) >= p.pulses_to_unlock) AS is_unlocked,
      urp.unlocked_at,
      p.bg_class,
      p.text_class,
      p.glyph_svg,
      coll.code                                           AS collection_code,
      public.resolve_i18n(coll.name_i18n, _locale)        AS collection_name,
      COALESCE(coll.sort_order, 999)                      AS collection_sort,
      p.sort_order,
      (SELECT COUNT(*)::int
       FROM public.aegis_synapse_cards sc
       WHERE sc.principle_id = p.id
         AND sc.is_active = true)                         AS total_cards
    FROM public.aegis_rune_principles p
    LEFT JOIN public.aegis_user_rune_progress urp
      ON urp.user_id = _uid AND urp.principle_id = p.id
    LEFT JOIN public.aegis_rune_collections coll
      ON coll.id = p.collection_id
    WHERE p.is_active = true
    ORDER BY COALESCE(coll.sort_order, 999), p.sort_order
  ) r;

  RETURN jsonb_build_object(
    'ok',      true,
    'library', _library,
    'runes',   _runes,
    'locale',  _locale
  );
END;
$$;

-- ─── MYSS_ARCHETYPE collection ───────────────────────────────────────

INSERT INTO public.aegis_rune_collections (code, name_i18n, description_i18n, icon_key, sort_order)
VALUES (
  'MYSS_ARCHETYPE',
  '{"fr": "Archétypes de Myss", "en": "Myss Archetypes"}'::jsonb,
  '{"fr": "Les 12 archétypes de Caroline Myss — cartographie de l''inconscient collectif.", "en": "Caroline Myss'' 12 archetypes — mapping the collective unconscious."}'::jsonb,
  'crown',
  2
) ON CONFLICT (code) DO NOTHING;

-- ─── Clean up legacy RULER (replaced by SOVEREIGN) ──────────────────

DELETE FROM public.aegis_rune_principles WHERE code = 'RULER';

-- ─── 16 Myss Archetype principles ────────────────────────────────────

DO $$
DECLARE
  _coll_id UUID;
BEGIN
  SELECT id INTO _coll_id FROM public.aegis_rune_collections WHERE code = 'MYSS_ARCHETYPE';

  -- Survival archetypes (1-4)
  INSERT INTO public.aegis_rune_principles (code, name_i18n, quote_i18n, bg_class, text_class, sort_order, pulses_to_unlock, is_active, collection_id, description_i18n, icon_key)
  VALUES
    ('CHILD',
     '{"fr":"L''Enfant","en":"The Child"}'::jsonb,
     '{"fr":"Le noyau protégé porte en lui l''infini du potentiel.","en":"The protected core carries within it the infinite of potential."}'::jsonb,
     'from-sky-950 to-black', 'text-sky-200', 1, 3, true, _coll_id,
     '{"fr":"Noyau protégé et potentiel en expansion — l''innocence comme force première.","en":"Protected core and expanding potential — innocence as a primal force."}'::jsonb,
     'baby'),
    ('VICTIM',
     '{"fr":"La Victime","en":"The Victim"}'::jsonb,
     '{"fr":"La fracture révèle la lumière qui traverse la faille.","en":"The fracture reveals the light passing through the crack."}'::jsonb,
     'from-rose-950 to-black', 'text-rose-200', 2, 3, true, _coll_id,
     '{"fr":"Fracture, trauma, limite brisée — transformer la blessure en conscience.","en":"Fracture, trauma, broken boundary — transforming the wound into awareness."}'::jsonb,
     'shield-alert'),
    ('PROSTITUTE',
     '{"fr":"La Prostituée","en":"The Prostitute"}'::jsonb,
     '{"fr":"Chaque compromis mesure le prix de ton intégrité.","en":"Every compromise measures the price of your integrity."}'::jsonb,
     'from-purple-950 to-black', 'text-purple-200', 3, 3, true, _coll_id,
     '{"fr":"Négociation et compromis énergétique — gardien de l''intégrité personnelle.","en":"Negotiation and energetic compromise — guardian of personal integrity."}'::jsonb,
     'scale'),
    ('SABOTEUR',
     '{"fr":"Le Saboteur","en":"The Saboteur"}'::jsonb,
     '{"fr":"L''interférence est le test ultime de la volonté consciente.","en":"Interference is the ultimate test of conscious will."}'::jsonb,
     'from-slate-900 to-black', 'text-slate-300', 4, 3, true, _coll_id,
     '{"fr":"Interférences et disruption de l''ordre — miroir des peurs inconscientes.","en":"Interference and disruption of order — mirror of unconscious fears."}'::jsonb,
     'alert-triangle')
  ON CONFLICT (code) DO NOTHING;

  -- Personality archetypes (5-16)
  INSERT INTO public.aegis_rune_principles (code, name_i18n, quote_i18n, bg_class, text_class, sort_order, pulses_to_unlock, is_active, collection_id, description_i18n, icon_key)
  VALUES
    ('MYSTIC',
     '{"fr":"Le Mystique","en":"The Mystic"}'::jsonb,
     '{"fr":"L''œil qui voit au-delà n''a besoin d''aucune preuve.","en":"The eye that sees beyond needs no proof."}'::jsonb,
     'from-indigo-950 to-black', 'text-indigo-200', 5, 3, true, _coll_id,
     '{"fr":"L''œil intérieur — connexion directe au divin et à l''invisible.","en":"The inner eye — direct connection to the divine and the invisible."}'::jsonb,
     'eye'),
    ('SAGE',
     '{"fr":"Le Sage","en":"The Sage"}'::jsonb,
     '{"fr":"La vérité n''a pas besoin de volume, elle a besoin de profondeur.","en":"Truth does not need volume, it needs depth."}'::jsonb,
     'from-amber-950 to-black', 'text-amber-200', 6, 3, true, _coll_id,
     '{"fr":"La connaissance ancienne — vérité, sagesse et transmission.","en":"Ancient knowledge — truth, wisdom, and transmission."}'::jsonb,
     'book-open'),
    ('HEALER',
     '{"fr":"Le Guérisseur","en":"The Healer"}'::jsonb,
     '{"fr":"Guérir l''autre commence par l''union de ses propres fragments.","en":"Healing another begins by uniting your own fragments."}'::jsonb,
     'from-emerald-950 to-black', 'text-emerald-200', 7, 3, true, _coll_id,
     '{"fr":"Vesica Piscis — l''union sacrée qui restaure et soigne.","en":"Vesica Piscis — the sacred union that restores and heals."}'::jsonb,
     'heart-pulse'),
    ('WARRIOR',
     '{"fr":"Le Guerrier","en":"The Warrior"}'::jsonb,
     '{"fr":"La lance ne détruit pas — elle trace la direction.","en":"The spear does not destroy — it traces the direction."}'::jsonb,
     'from-red-950 to-black', 'text-red-200', 8, 3, true, _coll_id,
     '{"fr":"Direction, pénétration, limite stricte — la force au service de la conscience.","en":"Direction, penetration, strict boundary — strength in service of consciousness."}'::jsonb,
     'sword'),
    ('SOVEREIGN',
     '{"fr":"Le Souverain","en":"The Sovereign"}'::jsonb,
     '{"fr":"Celui qui ordonne le chaos crée un trône dans l''invisible.","en":"The one who orders chaos creates a throne in the invisible."}'::jsonb,
     'from-amber-950 to-black', 'text-amber-100', 9, 3, true, _coll_id,
     '{"fr":"Ordre, fondation, trône, ancrage — maîtrise de soi et responsabilité du pouvoir.","en":"Order, foundation, throne, grounding — self-mastery and the responsibility of power."}'::jsonb,
     'crown'),
    ('CREATOR',
     '{"fr":"Le Créateur","en":"The Creator"}'::jsonb,
     '{"fr":"L''étincelle ne demande pas la permission de brûler.","en":"The spark does not ask permission to burn."}'::jsonb,
     'from-violet-950 to-black', 'text-violet-200', 10, 3, true, _coll_id,
     '{"fr":"Expansion, genèse, étincelle géométrique — la force créatrice pure.","en":"Expansion, genesis, geometric spark — pure creative force."}'::jsonb,
     'sparkles'),
    ('EXPLORER',
     '{"fr":"L''Explorateur","en":"The Explorer"}'::jsonb,
     '{"fr":"La boussole intérieure pointe toujours vers l''inconnu nécessaire.","en":"The inner compass always points toward the necessary unknown."}'::jsonb,
     'from-teal-950 to-black', 'text-teal-200', 11, 3, true, _coll_id,
     '{"fr":"La boussole — franchir les limites du connu vers l''expansion.","en":"The compass — crossing the boundaries of the known toward expansion."}'::jsonb,
     'compass'),
    ('REBEL',
     '{"fr":"Le Rebelle","en":"The Rebel"}'::jsonb,
     '{"fr":"L''inversion du triangle est le premier acte de souveraineté.","en":"Inverting the triangle is the first act of sovereignty."}'::jsonb,
     'from-orange-950 to-black', 'text-orange-200', 12, 3, true, _coll_id,
     '{"fr":"Anticonformisme, inversion, éclatement — la destruction créatrice.","en":"Nonconformity, inversion, shattering — creative destruction."}'::jsonb,
     'flame'),
    ('LOVER',
     '{"fr":"L''Amant","en":"The Lover"}'::jsonb,
     '{"fr":"La gravité entre deux âmes est le langage du cosmos.","en":"The gravity between two souls is the language of the cosmos."}'::jsonb,
     'from-pink-950 to-black', 'text-pink-200', 13, 3, true, _coll_id,
     '{"fr":"Gravité, attraction, résonance magnétique — l''amour comme force universelle.","en":"Gravity, attraction, magnetic resonance — love as a universal force."}'::jsonb,
     'heart'),
    ('CAREGIVER',
     '{"fr":"Le Protecteur","en":"The Caregiver"}'::jsonb,
     '{"fr":"Le bouclier le plus puissant est celui qui enveloppe sans étouffer.","en":"The most powerful shield is the one that envelops without suffocating."}'::jsonb,
     'from-green-950 to-black', 'text-green-200', 14, 3, true, _coll_id,
     '{"fr":"Bouclier, contenant, enveloppement protecteur — la force du soin.","en":"Shield, container, protective embrace — the strength of care."}'::jsonb,
     'shield'),
    ('MAGICIAN',
     '{"fr":"Le Magicien","en":"The Magician"}'::jsonb,
     '{"fr":"L''infini n''est pas un lieu — c''est un état de maîtrise.","en":"Infinity is not a place — it is a state of mastery."}'::jsonb,
     'from-purple-950 to-black', 'text-purple-100', 15, 3, true, _coll_id,
     '{"fr":"Alchimie et lemniscate — la loi de cause à effet maîtrisée.","en":"Alchemy and lemniscate — the mastered law of cause and effect."}'::jsonb,
     'wand'),
    ('JESTER',
     '{"fr":"Le Bouffon","en":"The Jester"}'::jsonb,
     '{"fr":"Le zigzag est la trajectoire de celui qui refuse la ligne droite.","en":"The zigzag is the trajectory of those who refuse the straight line."}'::jsonb,
     'from-yellow-950 to-black', 'text-yellow-200', 16, 3, true, _coll_id,
     '{"fr":"Asymétrie, disruption joyeuse — le chaos comme sagesse.","en":"Asymmetry, joyful disruption — chaos as wisdom."}'::jsonb,
     'laugh')
  ON CONFLICT (code) DO NOTHING;
END;
$$;

NOTIFY pgrst, 'reload schema';
