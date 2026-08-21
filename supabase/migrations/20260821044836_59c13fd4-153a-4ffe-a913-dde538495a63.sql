CREATE TABLE IF NOT EXISTS public.guardian_onboarding (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  step INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guardian_onboarding TO authenticated;
GRANT ALL ON public.guardian_onboarding TO service_role;

ALTER TABLE public.guardian_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own guardian onboarding" ON public.guardian_onboarding;
CREATE POLICY "Users manage their own guardian onboarding"
ON public.guardian_onboarding FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_guardian_onboarding_updated_at ON public.guardian_onboarding;
CREATE TRIGGER update_guardian_onboarding_updated_at
BEFORE UPDATE ON public.guardian_onboarding
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();