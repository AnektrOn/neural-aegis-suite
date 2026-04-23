
-- =====================================================================
-- ARCHETYPE ASSESSMENT MODULE
-- =====================================================================

-- 1. Templates: a versioned assessment definition
CREATE TABLE public.assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_fr TEXT,
  description_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Questions
CREATE TYPE public.assessment_question_type AS ENUM (
  'single_choice', 'multiple_choice', 'likert_scale', 'ranking', 'short_text'
);

CREATE TABLE public.assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  question_type public.assessment_question_type NOT NULL,
  prompt_fr TEXT NOT NULL,
  prompt_en TEXT NOT NULL,
  helper_fr TEXT,
  helper_en TEXT,
  dimension TEXT, -- learning_style | relational_style | activation_style | regulation_need | self_trust | expression_need | structure_need
  is_required BOOLEAN NOT NULL DEFAULT true,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "min": 1, "max": 7, "maxSelect": 3 }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, position)
);
CREATE INDEX idx_questions_template ON public.assessment_questions(template_id);

-- 3. Options (for choice/likert/ranking)
CREATE TABLE public.assessment_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  -- archetype keys this option contributes to + weights, e.g. {"queen": 2, "advocate": 1}
  archetype_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- shadow signal weights, e.g. {"control": 1}
  shadow_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- numeric value for likert/ranking
  value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, position)
);
CREATE INDEX idx_options_question ON public.assessment_options(question_id);

-- 4. Sessions (one per user attempt)
CREATE TYPE public.assessment_session_status AS ENUM ('in_progress', 'submitted', 'archived');

CREATE TABLE public.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.assessment_templates(id) ON DELETE RESTRICT,
  status public.assessment_session_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  client_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sessions_user ON public.assessment_sessions(user_id);
CREATE INDEX idx_sessions_template ON public.assessment_sessions(template_id);

-- 5. Responses (one row per answered question)
CREATE TABLE public.assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  -- selected_option_ids for choice/ranking; numeric_value for likert; text_value for short_text
  selected_option_ids UUID[] NOT NULL DEFAULT '{}',
  numeric_value NUMERIC,
  text_value TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, question_id)
);
CREATE INDEX idx_responses_session ON public.assessment_responses(session_id);
CREATE INDEX idx_responses_user ON public.assessment_responses(user_id);

-- 6. Archetype scores (per session, one row per archetype)
CREATE TABLE public.archetype_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  archetype_key TEXT NOT NULL,
  raw_score NUMERIC NOT NULL DEFAULT 0,
  normalized_score NUMERIC NOT NULL DEFAULT 0, -- 0..1
  rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, archetype_key)
);
CREATE INDEX idx_scores_session ON public.archetype_scores(session_id);

-- 7. Analysis result (one per session)
CREATE TABLE public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  top_archetypes TEXT[] NOT NULL DEFAULT '{}', -- e.g. ['queen','visionary','advocate']
  dimension_scores JSONB NOT NULL DEFAULT '{}'::jsonb, -- { learning_style: 0.7, ... }
  shadow_signals JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { control: 0.4, withdrawal: 0.2 }
  strengths_fr TEXT[] NOT NULL DEFAULT '{}',
  strengths_en TEXT[] NOT NULL DEFAULT '{}',
  watchouts_fr TEXT[] NOT NULL DEFAULT '{}',
  watchouts_en TEXT[] NOT NULL DEFAULT '{}',
  summary_fr TEXT,
  summary_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analysis_user ON public.analysis_results(user_id);

-- 8. Recommendation tools attached to a session
CREATE TYPE public.assessment_tool_type AS ENUM (
  'meditation', 'breathwork', 'journal_prompt', 'micro_practice'
);

CREATE TABLE public.recommendation_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tool_key TEXT NOT NULL,
  tool_type public.assessment_tool_type NOT NULL,
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  duration_fr TEXT,
  duration_en TEXT,
  rationale_fr TEXT NOT NULL,
  rationale_en TEXT NOT NULL,
  rule_key TEXT,
  widget_key TEXT, -- maps to existing Toolbox widget when applicable
  rank INTEGER NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recos_session ON public.recommendation_tools(session_id);
CREATE INDEX idx_recos_user ON public.recommendation_tools(user_id);

-- =====================================================================
-- updated_at triggers
-- =====================================================================
CREATE TRIGGER trg_assessment_templates_updated
  BEFORE UPDATE ON public.assessment_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_assessment_sessions_updated
  BEFORE UPDATE ON public.assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- RLS
-- =====================================================================
ALTER TABLE public.assessment_templates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_options         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archetype_scores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_tools       ENABLE ROW LEVEL SECURITY;

-- Templates / Questions / Options: readable by any authenticated user when active; admins manage.
CREATE POLICY "Authenticated read active templates" ON public.assessment_templates
  FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage templates" ON public.assessment_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read questions" ON public.assessment_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage questions" ON public.assessment_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read options" ON public.assessment_options
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage options" ON public.assessment_options
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sessions: user owns; admins read all.
CREATE POLICY "Users manage own sessions" ON public.assessment_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all sessions" ON public.assessment_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Responses: user owns; admins read all.
CREATE POLICY "Users manage own responses" ON public.assessment_responses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all responses" ON public.assessment_responses
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Scores / Analysis / Recommendations: user reads own + inserts own; admins read all.
CREATE POLICY "Users manage own scores" ON public.archetype_scores
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all scores" ON public.archetype_scores
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users manage own analysis" ON public.analysis_results
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all analysis" ON public.analysis_results
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users manage own recommendations" ON public.recommendation_tools
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all recommendations" ON public.recommendation_tools
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================================
-- Seed: default template (questions/options will be inserted via app code from domain seed
-- to keep a single source of truth in TypeScript).
-- =====================================================================
INSERT INTO public.assessment_templates (slug, version, title_fr, title_en, description_fr, description_en, is_active)
VALUES (
  'archetype-v1', 1,
  'Évaluation des Archétypes',
  'Archetype Assessment',
  'Découvrez vos 3 archétypes dominants et vos pratiques recommandées.',
  'Discover your 3 dominant archetypes and your recommended practices.',
  true
);
