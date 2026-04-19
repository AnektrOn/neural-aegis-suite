CREATE TABLE public.native_fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_native_fcm_user ON public.native_fcm_tokens(user_id);

ALTER TABLE public.native_fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own native_fcm_tokens"
ON public.native_fcm_tokens FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all native_fcm_tokens"
ON public.native_fcm_tokens FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));