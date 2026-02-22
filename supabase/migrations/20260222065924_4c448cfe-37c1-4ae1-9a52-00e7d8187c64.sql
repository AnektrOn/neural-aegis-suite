
-- 1. Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage companies" ON public.companies FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN company_id uuid REFERENCES public.companies(id),
  ADD COLUMN country text,
  ADD COLUMN is_disabled boolean NOT NULL DEFAULT false;

-- 3. Policy for users to see own company
CREATE POLICY "Users can view own company" ON public.companies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.company_id = companies.id
  ));

-- 4. User sessions table
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer DEFAULT 0,
  page text
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.user_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all sessions" ON public.user_sessions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Input hesitation tracking
CREATE TABLE public.input_hesitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page text NOT NULL,
  input_name text NOT NULL,
  hesitation_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.input_hesitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own hesitations" ON public.input_hesitations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all hesitations" ON public.input_hesitations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Realtime for sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
