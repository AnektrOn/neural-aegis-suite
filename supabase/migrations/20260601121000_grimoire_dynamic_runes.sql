-- Enriches the grimoire RPC to return collection info, bg_class, text_class, glyph_svg
-- so the user-facing UI can render dynamic runes beyond the original 7 Kybalion.

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

  -- Assimilated cards (unchanged)
  SELECT COALESCE(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.swiped_at DESC), '[]'::jsonb)
  INTO _library
  FROM (
    SELECT
      c.id,
      c.external_key,
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
      i.created_at AS swiped_at
    FROM public.aegis_user_card_interactions i
    JOIN public.aegis_synapse_cards c ON c.id = i.card_id
    JOIN public.aegis_rune_principles p ON p.id = c.principle_id
    WHERE i.user_id = _uid
      AND i.action = 'assimilated'
    ORDER BY i.created_at DESC
  ) t;

  -- Rune progress with collection info + visuals
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
      p.sort_order
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

NOTIFY pgrst, 'reload schema';
