CREATE TABLE public.account_pauses (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  paused_by uuid,
  paused_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_pauses TO authenticated;
GRANT ALL ON public.account_pauses TO service_role;
ALTER TABLE public.account_pauses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own pause" ON public.account_pauses FOR SELECT TO authenticated USING (user_id = auth.uid());