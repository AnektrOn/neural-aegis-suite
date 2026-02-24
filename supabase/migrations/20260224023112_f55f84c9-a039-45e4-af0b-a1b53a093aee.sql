
-- Add widget configuration columns to toolbox_assignments
-- content_type will now support: 'breathwork', 'focus_introspectif', 'body_scan', 'affirmations', 'gratitude', 'journal_prompt', 'meditation', 'visualization', 'course', 'external_link'
ALTER TABLE public.toolbox_assignments ADD COLUMN IF NOT EXISTS external_url text DEFAULT NULL;
ALTER TABLE public.toolbox_assignments ADD COLUMN IF NOT EXISTS widget_config jsonb DEFAULT NULL;

-- widget_config examples:
-- breathwork: {"total_duration_min": 10, "cycles": 4, "breath_in_sec": 4, "pause1_sec": 4, "breath_out_sec": 6, "pause2_sec": 2}
-- focus_introspectif: {"duration_min": 15, "intention": "Ancrage émotionnel"}
-- body_scan: {"duration_min": 10, "zones": ["head","shoulders","chest","abdomen","legs","feet"]}
-- affirmations: {"duration_min": 5, "affirmations": ["Je suis capable", "Je suis en paix"]}
-- gratitude: {"entries_count": 3}
-- journal_prompt: {"prompt": "Qu'est-ce qui vous a surpris aujourd'hui ?"}

-- Create table for journal prompts assigned by admin
CREATE TABLE IF NOT EXISTS public.journal_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  prompt_text text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage journal prompts"
ON public.journal_prompts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own prompts"
ON public.journal_prompts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users update own prompts"
ON public.journal_prompts FOR UPDATE
USING (auth.uid() = user_id);

-- Create table for relation quality history tracking
CREATE TABLE IF NOT EXISTS public.relation_quality_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.people_contacts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  quality integer NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.relation_quality_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quality history"
ON public.relation_quality_history FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read quality history"
ON public.relation_quality_history FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
