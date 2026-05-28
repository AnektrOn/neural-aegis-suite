-- Rune Collections: group runes into expandable collections beyond Kybalion.
-- Adds a parent "collection" table and enriches rune_principles for admin management.

-- ─── Collection catalogue ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aegis_rune_collections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,
  name_i18n    JSONB NOT NULL DEFAULT '{}'::jsonb,
  description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon_key     TEXT NOT NULL DEFAULT 'sparkles',
  sort_order   INT  NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_aegis_rune_collections_updated_at ON public.aegis_rune_collections;
CREATE TRIGGER trg_aegis_rune_collections_updated_at
  BEFORE UPDATE ON public.aegis_rune_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the first collection
INSERT INTO public.aegis_rune_collections (code, name_i18n, description_i18n, icon_key, sort_order)
VALUES (
  'KYBALION',
  '{"fr": "Le Kybalion", "en": "The Kybalion"}'::jsonb,
  '{"fr": "Les 7 principes hermétiques — la base de toute transmutation mentale.", "en": "The 7 Hermetic principles — the foundation of all mental transmutation."}'::jsonb,
  'scroll-text',
  1
) ON CONFLICT (code) DO NOTHING;

-- ─── Enrich rune_principles ──────────────────────────────────────────

ALTER TABLE public.aegis_rune_principles
  ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.aegis_rune_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS icon_key TEXT NOT NULL DEFAULT 'sparkles',
  ADD COLUMN IF NOT EXISTS glyph_svg TEXT;

COMMENT ON COLUMN public.aegis_rune_principles.collection_id IS 'Parent collection (Kybalion, Alchimie, Tarot, etc.)';
COMMENT ON COLUMN public.aegis_rune_principles.description_i18n IS 'Extended description of the rune principle (bilingual).';
COMMENT ON COLUMN public.aegis_rune_principles.icon_key IS 'Lucide icon name for UI display.';
COMMENT ON COLUMN public.aegis_rune_principles.glyph_svg IS 'Optional raw SVG string for custom glyph rendering.';

CREATE INDEX IF NOT EXISTS idx_aegis_rune_principles_collection
  ON public.aegis_rune_principles (collection_id, sort_order)
  WHERE is_active = true;

-- Link existing Kybalion runes to their collection
UPDATE public.aegis_rune_principles
SET collection_id = (SELECT id FROM public.aegis_rune_collections WHERE code = 'KYBALION')
WHERE collection_id IS NULL;

-- RLS for collections
ALTER TABLE public.aegis_rune_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rune collections readable" ON public.aegis_rune_collections;
CREATE POLICY "Rune collections readable"
  ON public.aegis_rune_collections
  FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Rune collections admin manage" ON public.aegis_rune_collections;
CREATE POLICY "Rune collections admin manage"
  ON public.aegis_rune_collections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

NOTIFY pgrst, 'reload schema';
