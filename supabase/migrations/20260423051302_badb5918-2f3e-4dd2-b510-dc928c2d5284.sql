ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC;