
-- Table légère pour persister les réponses au questionnaire approfondi (70 questions)
-- en utilisant les codes stables (A1, A1A) définis dans questions70.ts
CREATE TABLE IF NOT EXISTS public.deepdive_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_code text NOT NULL,
  option_codes text[] NOT NULL DEFAULT '{}',
  numeric_value numeric,
  text_value text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_code)
);

ALTER TABLE public.deepdive_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own deepdive responses"
  ON public.deepdive_responses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read deepdive responses"
  ON public.deepdive_responses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_deepdive_responses_updated_at
  BEFORE UPDATE ON public.deepdive_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_deepdive_responses_user ON public.deepdive_responses(user_id);
