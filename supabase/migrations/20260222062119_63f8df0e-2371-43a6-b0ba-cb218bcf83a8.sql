
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (roles MUST be separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles, admins can read all
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS: only admins can manage roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Audit calls table (admin records first audit call data per user)
CREATE TABLE public.audit_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conducted_by UUID NOT NULL REFERENCES auth.users(id),
  call_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  leadership_score INTEGER CHECK (leadership_score BETWEEN 1 AND 10),
  emotional_baseline INTEGER CHECK (emotional_baseline BETWEEN 1 AND 10),
  decision_style TEXT,
  key_challenges TEXT,
  goals TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit calls"
ON public.audit_calls FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own audit"
ON public.audit_calls FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Habit templates (admin creates, assigns to users)
CREATE TABLE public.habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.habit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage habit templates"
ON public.habit_templates FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view habit templates"
ON public.habit_templates FOR SELECT
TO authenticated
USING (true);

-- Assigned habits (links templates to specific users)
CREATE TABLE public.assigned_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_template_id UUID NOT NULL REFERENCES public.habit_templates(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_template_id)
);

ALTER TABLE public.assigned_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assigned habits"
ON public.assigned_habits FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own assigned habits"
ON public.assigned_habits FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Toolbox content assignments (admin assigns content per user)
CREATE TABLE public.toolbox_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('meditation', 'visualization', 'course')),
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.toolbox_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage toolbox assignments"
ON public.toolbox_assignments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own toolbox"
ON public.toolbox_assignments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to read all profiles for user management
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
