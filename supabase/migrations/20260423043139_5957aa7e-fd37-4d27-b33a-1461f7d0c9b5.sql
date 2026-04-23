-- 1) Catégories
CREATE TABLE public.appendix_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label_fr text NOT NULL,
  label_en text NOT NULL,
  description_fr text,
  description_en text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appendix_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read active categories"
  ON public.appendix_categories FOR SELECT TO authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage categories"
  ON public.appendix_categories FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) Questions
CREATE TABLE public.appendix_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.appendix_categories(id) ON DELETE CASCADE,
  position integer NOT NULL,
  question_type public.assessment_question_type NOT NULL,
  prompt_fr text NOT NULL,
  prompt_en text NOT NULL,
  helper_fr text,
  helper_en text,
  dimension text,
  is_required boolean NOT NULL DEFAULT false,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appendix_questions_category ON public.appendix_questions(category_id, position);

ALTER TABLE public.appendix_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read questions"
  ON public.appendix_questions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage appendix questions"
  ON public.appendix_questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) Options
CREATE TABLE public.appendix_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.appendix_questions(id) ON DELETE CASCADE,
  position integer NOT NULL,
  label_fr text NOT NULL,
  label_en text NOT NULL,
  archetype_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  shadow_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  value numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_appendix_options_question ON public.appendix_options(question_id, position);

ALTER TABLE public.appendix_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read appendix options"
  ON public.appendix_options FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage appendix options"
  ON public.appendix_options FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) Réponses
CREATE TABLE public.appendix_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid REFERENCES public.assessment_sessions(id) ON DELETE SET NULL,
  question_id uuid NOT NULL REFERENCES public.appendix_questions(id) ON DELETE CASCADE,
  selected_option_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  numeric_value numeric,
  text_value text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

CREATE INDEX idx_appendix_responses_user ON public.appendix_responses(user_id);
CREATE INDEX idx_appendix_responses_session ON public.appendix_responses(session_id);

ALTER TABLE public.appendix_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own appendix responses"
  ON public.appendix_responses FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all appendix responses"
  ON public.appendix_responses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_appendix_responses_updated_at
  BEFORE UPDATE ON public.appendix_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();