-- Extensible toolbox content types + waiting confirmation queue.

CREATE TABLE IF NOT EXISTS public.content_type_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  icon TEXT NOT NULL DEFAULT 'zap',
  renderer_kind TEXT NOT NULL DEFAULT 'composed_v1'
    CHECK (renderer_kind = ANY (ARRAY['native', 'composed_v1', 'external_link'])),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status = ANY (ARRAY['draft', 'pending_review', 'published', 'deprecated'])),
  config_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  ui_blueprint JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_title_fr TEXT NOT NULL DEFAULT '',
  default_title_en TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.widget_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type_slug TEXT NOT NULL REFERENCES public.content_type_definitions(slug) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  title_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  description_i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  widget_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  external_url TEXT,
  source TEXT NOT NULL DEFAULT 'admin',
  reasoning TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status = ANY (ARRAY['pending_review', 'approved', 'rejected', 'published'])),
  suggested_user_ids UUID[] NOT NULL DEFAULT '{}',
  selected_user_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  published_template_id UUID REFERENCES public.toolbox_templates(id) ON DELETE SET NULL,
  published_assignment_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_type_definitions_status
  ON public.content_type_definitions(status);
CREATE INDEX IF NOT EXISTS idx_widget_proposals_status
  ON public.widget_proposals(status);
CREATE INDEX IF NOT EXISTS idx_widget_proposals_type
  ON public.widget_proposals(content_type_slug);

DROP TRIGGER IF EXISTS trg_content_type_definitions_updated_at
  ON public.content_type_definitions;
CREATE TRIGGER trg_content_type_definitions_updated_at
  BEFORE UPDATE ON public.content_type_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_widget_proposals_updated_at
  ON public.widget_proposals;
CREATE TRIGGER trg_widget_proposals_updated_at
  BEFORE UPDATE ON public.widget_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.content_type_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage content type definitions" ON public.content_type_definitions;
CREATE POLICY "Admins manage content type definitions"
  ON public.content_type_definitions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated read published content types" ON public.content_type_definitions;
CREATE POLICY "Authenticated read published content types"
  ON public.content_type_definitions
  FOR SELECT
  TO authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage widget proposals" ON public.widget_proposals;
CREATE POLICY "Admins manage widget proposals"
  ON public.widget_proposals
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.toolbox_assignments
  DROP CONSTRAINT IF EXISTS toolbox_assignments_content_type_check;

ALTER TABLE public.toolbox_assignments
  ADD CONSTRAINT toolbox_assignments_content_type_check
  CHECK (length(trim(content_type)) > 0);
