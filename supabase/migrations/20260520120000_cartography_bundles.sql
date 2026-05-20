-- Cartographie archétypale : bundles par utilisateur × pôle × mode, sections en Markdown.

CREATE TABLE IF NOT EXISTS public.cartography_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pole TEXT NOT NULL CHECK (pole IN ('balance', 'light', 'shadow')),
  mode TEXT NOT NULL CHECK (mode IN ('analyse', 'clinique')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cartography_bundles_user_pole_mode_unique UNIQUE (user_id, pole, mode)
);

CREATE INDEX IF NOT EXISTS idx_cartography_bundles_user ON public.cartography_bundles (user_id);
CREATE INDEX IF NOT EXISTS idx_cartography_bundles_status ON public.cartography_bundles (status);
CREATE INDEX IF NOT EXISTS idx_cartography_bundles_pole_mode ON public.cartography_bundles (pole, mode);

CREATE TABLE IF NOT EXISTS public.cartography_bundle_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.cartography_bundles(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL CHECK (
    section_key IN ('cartographie', 'guardians', 'synthesis', 'detailed')
  ),
  report_code TEXT NOT NULL DEFAULT '',
  title TEXT,
  markdown TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  source_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cartography_bundle_sections_unique UNIQUE (bundle_id, section_key, report_code)
);

CREATE INDEX IF NOT EXISTS idx_cartography_sections_bundle ON public.cartography_bundle_sections (bundle_id);
CREATE INDEX IF NOT EXISTS idx_cartography_sections_sort ON public.cartography_bundle_sections (bundle_id, sort_order);

DROP TRIGGER IF EXISTS cartography_bundles_updated_at ON public.cartography_bundles;
CREATE TRIGGER cartography_bundles_updated_at
  BEFORE UPDATE ON public.cartography_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS cartography_bundle_sections_updated_at ON public.cartography_bundle_sections;
CREATE TRIGGER cartography_bundle_sections_updated_at
  BEFORE UPDATE ON public.cartography_bundle_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cartography_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cartography_bundle_sections ENABLE ROW LEVEL SECURITY;

-- Admins : gestion complète
DROP POLICY IF EXISTS "Admins manage cartography bundles" ON public.cartography_bundles;
CREATE POLICY "Admins manage cartography bundles"
  ON public.cartography_bundles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage cartography sections" ON public.cartography_bundle_sections;
CREATE POLICY "Admins manage cartography sections"
  ON public.cartography_bundle_sections
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Utilisateur : lecture de ses bundles publiés
DROP POLICY IF EXISTS "Users read own published cartography bundles" ON public.cartography_bundles;
CREATE POLICY "Users read own published cartography bundles"
  ON public.cartography_bundles
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'published'
  );

DROP POLICY IF EXISTS "Users read own published cartography sections" ON public.cartography_bundle_sections;
CREATE POLICY "Users read own published cartography sections"
  ON public.cartography_bundle_sections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cartography_bundles b
      WHERE b.id = bundle_id
        AND b.user_id = auth.uid()
        AND b.status = 'published'
    )
  );

COMMENT ON TABLE public.cartography_bundles IS
  'Rapport cartographie par utilisateur, pôle (balance/light/shadow) et mode (analyse/clinique).';
COMMENT ON TABLE public.cartography_bundle_sections IS
  'Sections Markdown du bundle (cartographie, gardiens, synthèse, rapports P01–P05).';
