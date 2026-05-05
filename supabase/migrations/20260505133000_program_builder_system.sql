-- Program Builder system: unified catalog + assignments support.

-- 1) Extend existing habit templates with catalog metadata.
ALTER TABLE public.habit_templates
  ADD COLUMN IF NOT EXISTS external_key TEXT,
  ADD COLUMN IF NOT EXISTS archetype_targets TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shadow_targets TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'habit_templates_external_key_unique'
  ) THEN
    ALTER TABLE public.habit_templates
      ADD CONSTRAINT habit_templates_external_key_unique UNIQUE (external_key);
  END IF;
END $$;

-- 2) Toolbox templates catalog (create now, assign later).
CREATE TABLE IF NOT EXISTS public.toolbox_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key TEXT UNIQUE,
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  duration TEXT,
  description TEXT,
  external_url TEXT,
  widget_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  archetype_targets TEXT[] NOT NULL DEFAULT '{}',
  shadow_targets TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Journal prompt templates catalog.
CREATE TABLE IF NOT EXISTS public.journal_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key TEXT UNIQUE,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  duration TEXT,
  archetype_targets TEXT[] NOT NULL DEFAULT '{}',
  shadow_targets TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Link assignments to template origin where applicable.
ALTER TABLE public.toolbox_assignments
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.toolbox_templates(id) ON DELETE SET NULL;

ALTER TABLE public.journal_prompts
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.journal_prompt_templates(id) ON DELETE SET NULL;

-- 5) Unified lifecycle observability.
CREATE TABLE IF NOT EXISTS public.program_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  user_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_import_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  dry_run BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'completed',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Indexes.
CREATE INDEX IF NOT EXISTS idx_habit_templates_external_key ON public.habit_templates(external_key);
CREATE INDEX IF NOT EXISTS idx_habit_templates_is_active ON public.habit_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_toolbox_templates_content_type ON public.toolbox_templates(content_type);
CREATE INDEX IF NOT EXISTS idx_toolbox_templates_is_active ON public.toolbox_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_journal_prompt_templates_is_active ON public.journal_prompt_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_toolbox_assignments_template_id ON public.toolbox_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_journal_prompts_template_id ON public.journal_prompts(template_id);
CREATE INDEX IF NOT EXISTS idx_program_events_user_id_created_at ON public.program_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_events_event_type_created_at ON public.program_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_import_runs_created_by_created_at ON public.admin_import_runs(created_by, created_at DESC);

-- 7) updated_at triggers for catalog tables.
DROP TRIGGER IF EXISTS trg_toolbox_templates_updated_at ON public.toolbox_templates;
CREATE TRIGGER trg_toolbox_templates_updated_at
  BEFORE UPDATE ON public.toolbox_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_journal_prompt_templates_updated_at ON public.journal_prompt_templates;
CREATE TRIGGER trg_journal_prompt_templates_updated_at
  BEFORE UPDATE ON public.journal_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8) RLS and policies.
ALTER TABLE public.toolbox_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_import_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Toolbox templates readable by authenticated users" ON public.toolbox_templates;
CREATE POLICY "Toolbox templates readable by authenticated users"
  ON public.toolbox_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Toolbox templates admin manage" ON public.toolbox_templates;
CREATE POLICY "Toolbox templates admin manage"
  ON public.toolbox_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Journal prompt templates readable by authenticated users" ON public.journal_prompt_templates;
CREATE POLICY "Journal prompt templates readable by authenticated users"
  ON public.journal_prompt_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Journal prompt templates admin manage" ON public.journal_prompt_templates;
CREATE POLICY "Journal prompt templates admin manage"
  ON public.journal_prompt_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Program events admin read" ON public.program_events;
CREATE POLICY "Program events admin read"
  ON public.program_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Program events users read own" ON public.program_events;
CREATE POLICY "Program events users read own"
  ON public.program_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Program events admin insert" ON public.program_events;
CREATE POLICY "Program events admin insert"
  ON public.program_events
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admin import runs read admin" ON public.admin_import_runs;
CREATE POLICY "Admin import runs read admin"
  ON public.admin_import_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admin import runs insert admin" ON public.admin_import_runs;
CREATE POLICY "Admin import runs insert admin"
  ON public.admin_import_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
