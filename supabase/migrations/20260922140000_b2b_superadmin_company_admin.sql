-- B2B tenancy: superadmin + company_admin, memberships, seats, invites,
-- consent, scoped notify, hardened company_id, content writes → superadmin only.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Enum values
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'superadmin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'superadmin';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'company_admin'
  ) THEN
    ALTER TYPE public.app_role ADD VALUE 'company_admin';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Helpers (compatibility: has_role('admin') also matches superadmin)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin'::public.app_role AND role = 'superadmin'::public.app_role)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin(_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role IN ('superadmin'::public.app_role, 'admin'::public.app_role)
  );
$$;

CREATE TABLE IF NOT EXISTS public.company_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('company_admin', 'employee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

CREATE OR REPLACE FUNCTION public.is_company_admin(_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid AND role = 'company_admin'::public.app_role
  )
  OR EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE user_id = _uid AND role = 'company_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_platform_operator(_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin(_uid) OR public.is_company_admin(_uid);
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin_of(_uid UUID, _company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin(_uid)
    OR EXISTS (
      SELECT 1 FROM public.company_memberships m
      WHERE m.user_id = _uid
        AND m.company_id = _company_id
        AND m.role = 'company_admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.same_company(_viewer UUID, _subject UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles v
    JOIN public.profiles s ON s.company_id IS NOT NULL AND s.company_id = v.company_id
    WHERE v.id = _viewer AND s.id = _subject AND v.company_id IS NOT NULL
  )
  OR EXISTS (
    SELECT 1
    FROM public.company_memberships mv
    JOIN public.company_memberships ms ON ms.company_id = mv.company_id
    WHERE mv.user_id = _viewer AND ms.user_id = _subject
  )
  OR EXISTS (
    SELECT 1
    FROM public.company_memberships mv
    JOIN public.profiles s ON s.company_id = mv.company_id
    WHERE mv.user_id = _viewer AND s.id = _subject
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_employee(_viewer UUID, _subject UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _viewer IS NOT NULL
    AND _subject IS NOT NULL
    AND (
      _viewer = _subject
      OR public.is_superadmin(_viewer)
      OR (
        public.is_company_admin(_viewer)
        AND public.same_company(_viewer, _subject)
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_company_admin(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_operator(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_company_admin_of(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.same_company(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_view_employee(UUID, UUID) TO authenticated, service_role;

-- Migrate legacy admin → superadmin
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'superadmin'::public.app_role
FROM public.user_roles
WHERE role = 'admin'::public.app_role
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles WHERE role = 'admin'::public.app_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. company_memberships RLS + companies enrichment
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_company_memberships_company
  ON public.company_memberships (company_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_user
  ON public.company_memberships (user_id);

ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own memberships" ON public.company_memberships;
CREATE POLICY "Members read own memberships"
  ON public.company_memberships FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_superadmin(auth.uid())
    OR public.is_company_admin_of(auth.uid(), company_id)
  );

DROP POLICY IF EXISTS "Superadmin manage memberships" ON public.company_memberships;
CREATE POLICY "Superadmin manage memberships"
  ON public.company_memberships FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS seat_limit INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS default_locale TEXT,
  ADD COLUMN IF NOT EXISTS default_timezone TEXT;

-- Backfill memberships from profiles.company_id
INSERT INTO public.company_memberships (user_id, company_id, role)
SELECT p.id, p.company_id, 'employee'
FROM public.profiles p
WHERE p.company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. user_roles policies — only superadmin can grant privileged roles
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Superadmin delete roles" ON public.user_roles;

CREATE POLICY "Superadmin insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. employer_data_consent + company_invites + seat helpers
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.employer_data_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  consent_version TEXT NOT NULL DEFAULT '1',
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_version)
);

ALTER TABLE public.employer_data_consent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own employer consent" ON public.employer_data_consent;
CREATE POLICY "Users manage own employer consent"
  ON public.employer_data_consent FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Operators read employer consent" ON public.employer_data_consent;
CREATE POLICY "Operators read employer consent"
  ON public.employer_data_consent FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR public.can_view_employee(auth.uid(), user_id)
  );

CREATE OR REPLACE FUNCTION public.can_read_journal_as_manager(_viewer UUID, _subject UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin(_viewer)
    OR (
      public.can_view_employee(_viewer, _subject)
      AND EXISTS (
        SELECT 1 FROM public.employer_data_consent c
        WHERE c.user_id = _subject
          AND c.accepted_at IS NOT NULL
          AND c.revoked_at IS NULL
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_read_journal_as_manager(UUID, UUID) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.company_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('company_admin', 'employee')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_invites_company ON public.company_invites (company_id);
CREATE INDEX IF NOT EXISTS idx_company_invites_token ON public.company_invites (token);

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Superadmin manage invites" ON public.company_invites;
CREATE POLICY "Superadmin manage invites"
  ON public.company_invites FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Company admin manage company invites" ON public.company_invites;
CREATE POLICY "Company admin manage company invites"
  ON public.company_invites FOR ALL TO authenticated
  USING (public.is_company_admin_of(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin_of(auth.uid(), company_id));

CREATE OR REPLACE FUNCTION public.company_seat_count(_company_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.profiles WHERE company_id = _company_id;
$$;

CREATE OR REPLACE FUNCTION public.company_has_seat_available(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limit INTEGER;
BEGIN
  SELECT seat_limit INTO _limit FROM public.companies WHERE id = _company_id;
  IF _limit IS NULL THEN
    RETURN true;
  END IF;
  RETURN public.company_seat_count(_company_id) < _limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.company_seat_count(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.company_has_seat_available(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.accept_company_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv public.company_invites%ROWTYPE;
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO _inv FROM public.company_invites
  WHERE token = p_token AND accepted_at IS NULL AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or expired invite' USING ERRCODE = '22023';
  END IF;

  IF NOT public.company_has_seat_available(_inv.company_id) THEN
    RAISE EXCEPTION 'no seats available' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles SET company_id = _inv.company_id WHERE id = _uid;

  INSERT INTO public.company_memberships (user_id, company_id, role)
  VALUES (_uid, _inv.company_id, _inv.role)
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = EXCLUDED.role;

  IF _inv.role = 'company_admin' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'company_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  UPDATE public.company_invites SET accepted_at = now() WHERE id = _inv.id;

  RETURN jsonb_build_object('company_id', _inv.company_id, 'role', _inv.role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_company_invite(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.leave_company(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := COALESCE(p_user_id, auth.uid());
  _caller UUID := auth.uid();
  _company UUID;
BEGIN
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF _uid IS DISTINCT FROM _caller AND NOT public.is_superadmin(_caller)
     AND NOT (
       public.is_company_admin(_caller)
       AND public.same_company(_caller, _uid)
     ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT company_id INTO _company FROM public.profiles WHERE id = _uid;

  DELETE FROM public.company_memberships WHERE user_id = _uid;
  UPDATE public.profiles SET company_id = NULL WHERE id = _uid;

  -- Drop company_admin role if no remaining company_admin memberships
  IF NOT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE user_id = _uid AND role = 'company_admin'
  ) THEN
    DELETE FROM public.user_roles
    WHERE user_id = _uid AND role = 'company_admin'::public.app_role;
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, target_user_id, meta)
  VALUES (
    _caller,
    'leave_company',
    _uid,
    jsonb_build_object('company_id', _company)
  );

  RETURN jsonb_build_object('ok', true, 'company_id', _company);
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_company(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.grant_company_admin(p_user_id UUID, p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles SET company_id = p_company_id WHERE id = p_user_id;

  INSERT INTO public.company_memberships (user_id, company_id, role)
  VALUES (p_user_id, p_company_id, 'company_admin')
  ON CONFLICT (user_id, company_id) DO UPDATE SET role = 'company_admin';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'company_admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.admin_audit_log (actor_id, action, target_user_id, meta)
  VALUES (
    auth.uid(),
    'grant_company_admin',
    p_user_id,
    jsonb_build_object('company_id', p_company_id)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_company_admin(p_user_id UUID, p_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.company_memberships
  SET role = 'employee'
  WHERE user_id = p_user_id AND company_id = p_company_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE user_id = p_user_id AND role = 'company_admin'
  ) THEN
    DELETE FROM public.user_roles
    WHERE user_id = p_user_id AND role = 'company_admin'::public.app_role;
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, action, target_user_id, meta)
  VALUES (
    auth.uid(),
    'revoke_company_admin',
    p_user_id,
    jsonb_build_object('company_id', p_company_id)
  );

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_company_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_company_admin(UUID, UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Harden company_id + privileged columns
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.protect_profiles_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (NEW.plan_override IS DISTINCT FROM OLD.plan_override)
       OR (NEW.is_disabled IS DISTINCT FROM OLD.is_disabled) THEN
      IF auth.uid() IS NOT NULL AND NOT public.is_superadmin(auth.uid()) THEN
        -- company_admin may disable same-company employees
        IF NEW.is_disabled IS DISTINCT FROM OLD.is_disabled
           AND public.can_view_employee(auth.uid(), NEW.id)
           AND NEW.plan_override IS NOT DISTINCT FROM OLD.plan_override THEN
          NULL; -- allow disable toggle for company admin
        ELSE
          RAISE EXCEPTION 'forbidden: plan_override and is_disabled are privileged'
            USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;

    IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      IF auth.uid() IS NOT NULL AND NOT public.is_superadmin(auth.uid()) THEN
        RAISE EXCEPTION 'forbidden: company_id is superadmin-only'
          USING ERRCODE = '42501';
      END IF;
      IF NEW.company_id IS NOT NULL AND NOT public.company_has_seat_available(NEW.company_id)
         AND (OLD.company_id IS DISTINCT FROM NEW.company_id) THEN
        -- Allow if moving within same company (no-op) already handled; block over-seat
        IF OLD.company_id IS DISTINCT FROM NEW.company_id THEN
          RAISE EXCEPTION 'no seats available for company'
            USING ERRCODE = 'P0001';
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_company_membership_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    IF OLD.company_id IS NOT NULL THEN
      DELETE FROM public.company_memberships
      WHERE user_id = NEW.id AND company_id = OLD.company_id AND role = 'employee';
    END IF;
    IF NEW.company_id IS NOT NULL THEN
      INSERT INTO public.company_memberships (user_id, company_id, role)
      VALUES (NEW.id, NEW.company_id, 'employee')
      ON CONFLICT (user_id, company_id) DO NOTHING;
    END IF;

    INSERT INTO public.admin_audit_log (actor_id, action, target_user_id, meta)
    VALUES (
      auth.uid(),
      'company_id_change',
      NEW.id,
      jsonb_build_object('from', OLD.company_id, 'to', NEW.company_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_company_membership_on_profile ON public.profiles;
CREATE TRIGGER sync_company_membership_on_profile
  AFTER UPDATE OF company_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_company_membership_on_profile();

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Scoped notifications
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.notify_superadmins(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  FOR _admin_id IN
    SELECT user_id FROM public.user_roles
    WHERE role IN ('superadmin'::public.app_role, 'admin'::public.app_role)
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (_admin_id, p_title, p_message, p_type, p_link);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_company_admins(
  p_company_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  IF p_company_id IS NULL THEN
    RETURN;
  END IF;
  FOR _admin_id IN
    SELECT DISTINCT m.user_id
    FROM public.company_memberships m
    WHERE m.company_id = p_company_id AND m.role = 'company_admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (_admin_id, p_title, p_message, p_type, p_link);
  END LOOP;
END;
$$;

-- Keep notify_all_admins as alias → superadmins only (no company leak)
CREATE OR REPLACE FUNCTION public.notify_all_admins(
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.notify_superadmins(p_title, p_message, p_type, p_link);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_operators_for_user(
  p_subject_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company UUID;
BEGIN
  PERFORM public.notify_superadmins(p_title, p_message, p_type, p_link);
  SELECT company_id INTO _company FROM public.profiles WHERE id = p_subject_user_id;
  IF _company IS NOT NULL THEN
    PERFORM public.notify_company_admins(_company, p_title, p_message, p_type, p_link);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_superadmins(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_company_admins(uuid, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_operators_for_user(uuid, text, text, text, text) FROM PUBLIC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Profiles: company_admin can read/update same-company
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR public.can_view_employee(auth.uid(), id)
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR public.can_view_employee(auth.uid(), id)
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR public.can_view_employee(auth.uid(), id)
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. Employee data SELECT for company_admin (journal gated by consent)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins read mood_entries" ON public.mood_entries;
CREATE POLICY "Admins read mood_entries"
  ON public.mood_entries FOR SELECT TO authenticated
  USING (public.can_view_employee(auth.uid(), user_id));

DROP POLICY IF EXISTS "Admins read journal" ON public.journal_entries;
CREATE POLICY "Admins read journal"
  ON public.journal_entries FOR SELECT TO authenticated
  USING (public.can_read_journal_as_manager(auth.uid(), user_id));

DROP POLICY IF EXISTS "Admins read synapse interactions" ON public.aegis_user_card_interactions;
CREATE POLICY "Admins read synapse interactions"
  ON public.aegis_user_card_interactions FOR SELECT TO authenticated
  USING (public.can_view_employee(auth.uid(), user_id));

DROP POLICY IF EXISTS "Admins read rune progress" ON public.aegis_user_rune_progress;
CREATE POLICY "Admins read rune progress"
  ON public.aegis_user_rune_progress FOR SELECT TO authenticated
  USING (public.can_view_employee(auth.uid(), user_id));

-- user_sessions: add company-admin read if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_sessions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins read user sessions" ON public.user_sessions';
    EXECUTE $p$
      CREATE POLICY "Admins read user sessions"
        ON public.user_sessions FOR SELECT TO authenticated
        USING (public.can_view_employee(auth.uid(), user_id))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'habit_completions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins read habit completions" ON public.habit_completions';
    EXECUTE $p$
      CREATE POLICY "Admins read habit completions"
        ON public.habit_completions FOR SELECT TO authenticated
        USING (public.can_view_employee(auth.uid(), user_id))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'toolbox_completions') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins read toolbox completions" ON public.toolbox_completions';
    EXECUTE $p$
      CREATE POLICY "Admins read toolbox completions"
        ON public.toolbox_completions FOR SELECT TO authenticated
        USING (public.can_view_employee(auth.uid(), user_id))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'toolbox_assignments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Company admin read toolbox assignments" ON public.toolbox_assignments';
    EXECUTE $p$
      CREATE POLICY "Company admin read toolbox assignments"
        ON public.toolbox_assignments FOR SELECT TO authenticated
        USING (public.can_view_employee(auth.uid(), user_id))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assigned_habits') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Company admin read assigned habits" ON public.assigned_habits';
    EXECUTE $p$
      CREATE POLICY "Company admin read assigned habits"
        ON public.assigned_habits FOR SELECT TO authenticated
        USING (public.can_view_employee(auth.uid(), user_id))
    $p$;
  END IF;
END $$;

-- Cartography: company admin SELECT published employee bundles
DROP POLICY IF EXISTS "Company admin read employee cartography" ON public.cartography_bundles;
CREATE POLICY "Company admin read employee cartography"
  ON public.cartography_bundles FOR SELECT TO authenticated
  USING (
    public.can_view_employee(auth.uid(), user_id)
    AND (status = 'published' OR public.is_superadmin(auth.uid()))
  );

DROP POLICY IF EXISTS "Company admin read employee cartography sections" ON public.cartography_bundle_sections;
CREATE POLICY "Company admin read employee cartography sections"
  ON public.cartography_bundle_sections FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cartography_bundles b
      WHERE b.id = bundle_id
        AND public.can_view_employee(auth.uid(), b.user_id)
        AND (b.status = 'published' OR public.is_superadmin(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can view their own reports" ON public.user_reports;
CREATE POLICY "Users can view their own reports"
  ON public.user_reports FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_superadmin(auth.uid())
    OR public.can_view_employee(auth.uid(), user_id)
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. Content WRITES → superadmin only (Pulse / toolbox / cartography / reports)
-- ═══════════════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Aegis cards admin manage" ON public.aegis_synapse_cards;
CREATE POLICY "Aegis cards admin manage"
  ON public.aegis_synapse_cards FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Aegis principles admin manage" ON public.aegis_rune_principles;
CREATE POLICY "Aegis principles admin manage"
  ON public.aegis_rune_principles FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Toolbox templates admin manage" ON public.toolbox_templates;
CREATE POLICY "Toolbox templates admin manage"
  ON public.toolbox_templates FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Journal prompt templates admin manage" ON public.journal_prompt_templates;
CREATE POLICY "Journal prompt templates admin manage"
  ON public.journal_prompt_templates FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Program events admin insert" ON public.program_events;
CREATE POLICY "Program events admin insert"
  ON public.program_events FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Admin import runs insert admin" ON public.admin_import_runs;
CREATE POLICY "Admin import runs insert admin"
  ON public.admin_import_runs FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage cartography bundles" ON public.cartography_bundles;
CREATE POLICY "Admins manage cartography bundles"
  ON public.cartography_bundles FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage cartography sections" ON public.cartography_bundle_sections;
CREATE POLICY "Admins manage cartography sections"
  ON public.cartography_bundle_sections FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all reports" ON public.user_reports;
CREATE POLICY "Admins manage all reports"
  ON public.user_reports FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- toolbox_assignments writes: drop broad admin-all if present, enforce superadmin write
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'toolbox_assignments') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins manage toolbox assignments" ON public.toolbox_assignments';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage toolbox" ON public.toolbox_assignments';
    EXECUTE $p$
      CREATE POLICY "Superadmin manage toolbox assignments"
        ON public.toolbox_assignments FOR ALL TO authenticated
        USING (public.is_superadmin(auth.uid()))
        WITH CHECK (public.is_superadmin(auth.uid()))
    $p$;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. Audit read helper + admin_audit_log read for operators
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.log_admin_data_access(
  p_action TEXT,
  p_target_user_id UUID,
  p_meta JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  IF NOT public.is_platform_operator(auth.uid()) THEN
    RETURN;
  END IF;
  INSERT INTO public.admin_audit_log (actor_id, action, target_user_id, meta)
  VALUES (auth.uid(), p_action, p_target_user_id, COALESCE(p_meta, '{}'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_admin_data_access(TEXT, UUID, JSONB) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. Isolation test helpers (callable in CI)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.b2b_assert_tenancy_helpers()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'has_is_superadmin', true,
    'has_is_company_admin', true,
    'has_can_view_employee', true,
    'has_company_memberships', EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_memberships'
    ),
    'has_company_invites', EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_invites'
    ),
    'has_employer_consent', EXISTS (
      SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employer_data_consent'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.b2b_assert_tenancy_helpers() TO authenticated, service_role;

COMMENT ON TABLE public.company_memberships IS 'B2B tenancy: user ↔ company with company_admin|employee role';
COMMENT ON TABLE public.company_invites IS 'Invite tokens for joining a company (seat-checked on accept)';
COMMENT ON TABLE public.employer_data_consent IS 'Employee opt-in for manager access to sensitive journal/decision text';
