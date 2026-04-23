CREATE TABLE IF NOT EXISTS public.aegis_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  mood_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  decision_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  habit_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  journal_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  relation_score NUMERIC(5,2) NOT NULL DEFAULT 50,
  archetype_coherence NUMERIC(5,2) NOT NULL DEFAULT 50,
  log_regularity NUMERIC(5,2) NOT NULL DEFAULT 50,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, score_date)
);

CREATE INDEX IF NOT EXISTS idx_aegis_health_scores_user_date
  ON public.aegis_health_scores (user_id, score_date DESC);

ALTER TABLE public.aegis_health_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own health scores"
  ON public.aegis_health_scores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all health scores"
  ON public.aegis_health_scores
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow authenticated users to upsert their own score (client-side computation)
CREATE POLICY "Users insert own health scores"
  ON public.aegis_health_scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own health scores"
  ON public.aegis_health_scores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
