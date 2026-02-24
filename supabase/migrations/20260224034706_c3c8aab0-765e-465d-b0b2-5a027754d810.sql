
-- Scoreboard criteria: admin defines scoring factors per user
CREATE TABLE public.scoreboard_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  criteria_type TEXT NOT NULL, -- 'mood_above', 'habits_completed', 'journal_written', 'sleep_above', 'stress_below', 'decision_made', 'toolbox_completed', 'relation_updated'
  criteria_label TEXT NOT NULL, -- human-readable label
  target_value NUMERIC NOT NULL DEFAULT 1, -- threshold value
  points INTEGER NOT NULL DEFAULT 1, -- points awarded
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scoreboard_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scoreboard criteria"
  ON public.scoreboard_criteria FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own criteria"
  ON public.scoreboard_criteria FOR SELECT
  USING (auth.uid() = user_id);

-- Daily computed scoreboards
CREATE TABLE public.daily_scoreboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score_date DATE NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{criteria_id, label, earned, max, met}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, score_date)
);

ALTER TABLE public.daily_scoreboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scoreboards"
  ON public.daily_scoreboards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users view own scoreboards"
  ON public.daily_scoreboards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System insert scoreboards"
  ON public.daily_scoreboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add timezone to profiles for local 8am scheduling
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';

-- Enable pg_cron and pg_net for scheduled scoreboard computation
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
