-- Lieux (Google Maps), tags admin, liens contacts, consentement visibilité admin
-- Admin = role dans public.user_roles (has_role)

-- ─── Référentiel tags (géré par admins) ─────────────────────────────────────
CREATE TABLE public.place_tag_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  description TEXT,
  risk_level SMALLINT NOT NULL DEFAULT 0 CHECK (risk_level >= 0 AND risk_level <= 5),
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.place_tag_definitions IS 'Tags sémantiques pour lieux (ex. contexte social) — assignables par admin sur les lieux utilisateurs.';

ALTER TABLE public.place_tag_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read active place tags"
  ON public.place_tag_definitions FOR SELECT TO authenticated
  USING (active = true);

CREATE POLICY "Admins read all place tags"
  ON public.place_tag_definitions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert place tags"
  ON public.place_tag_definitions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update place tags"
  ON public.place_tag_definitions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete place tags"
  ON public.place_tag_definitions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ─── Consentement partage lieux avec admin ───────────────────────────────────
CREATE TABLE public.user_location_admin_consent (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  share_places_with_admin BOOLEAN NOT NULL DEFAULT false,
  hide_consent_modal BOOLEAN NOT NULL DEFAULT false,
  consent_version TEXT NOT NULL DEFAULT '1',
  responded_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_location_admin_consent IS 'Si share_places_with_admin, les admins peuvent lire user_places et liaisons. hide_consent_modal = ne plus afficher le modal.';

ALTER TABLE public.user_location_admin_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own location consent"
  ON public.user_location_admin_consent FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read location consent"
  ON public.user_location_admin_consent FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_user_location_admin_consent_updated_at
  BEFORE UPDATE ON public.user_location_admin_consent
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Lieux utilisateur ───────────────────────────────────────────────────────
CREATE TABLE public.user_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  maps_url TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  maps_parsed_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_places_user ON public.user_places (user_id, created_at DESC);

ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own places"
  ON public.user_places FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read user places when sharing enabled"
  ON public.user_places FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.user_location_admin_consent c
      WHERE c.user_id = user_places.user_id AND c.share_places_with_admin = true
    )
  );

CREATE TRIGGER update_user_places_updated_at
  BEFORE UPDATE ON public.user_places
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Tags assignés à un lieu (par admin, sur données utilisateur partagées) ─
CREATE TABLE public.user_place_tag_assignments (
  user_place_id UUID NOT NULL REFERENCES public.user_places(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.place_tag_definitions(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_place_id, tag_id)
);

ALTER TABLE public.user_place_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read tags on own places"
  ON public.user_place_tag_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_places p WHERE p.id = user_place_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Admins read tags on shared places"
  ON public.user_place_tag_assignments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.user_places pl
      JOIN public.user_location_admin_consent c ON c.user_id = pl.user_id AND c.share_places_with_admin = true
      WHERE pl.id = user_place_tag_assignments.user_place_id
    )
  );

CREATE POLICY "Admins manage tags on shared places"
  ON public.user_place_tag_assignments FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.user_places pl
      JOIN public.user_location_admin_consent c ON c.user_id = pl.user_id AND c.share_places_with_admin = true
      WHERE pl.id = user_place_tag_assignments.user_place_id
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.user_places pl
      JOIN public.user_location_admin_consent c ON c.user_id = pl.user_id AND c.share_places_with_admin = true
      WHERE pl.id = user_place_tag_assignments.user_place_id
    )
  );

-- ─── Lien lieu ↔ contact (même utilisateur) ──────────────────────────────────
CREATE TABLE public.user_place_contact_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_place_id UUID NOT NULL REFERENCES public.user_places(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.people_contacts(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_place_id, contact_id)
);

CREATE INDEX idx_place_contact_user ON public.user_place_contact_links (user_id);
CREATE INDEX idx_place_contact_place ON public.user_place_contact_links (user_place_id);

ALTER TABLE public.user_place_contact_links ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enforce_place_contact_same_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_places pl
    WHERE pl.id = NEW.user_place_id AND pl.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'user_place_id does not belong to user_id';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.people_contacts pc
    WHERE pc.id = NEW.contact_id AND pc.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'contact_id does not belong to user_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_place_contact_same_user
  BEFORE INSERT OR UPDATE ON public.user_place_contact_links
  FOR EACH ROW EXECUTE FUNCTION public.enforce_place_contact_same_user();

CREATE POLICY "Users manage own place contact links"
  ON public.user_place_contact_links FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read place contact links when sharing"
  ON public.user_place_contact_links FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    AND EXISTS (
      SELECT 1 FROM public.user_location_admin_consent c
      WHERE c.user_id = user_place_contact_links.user_id AND c.share_places_with_admin = true
    )
  );

-- ─── Seeds tags (admin peut éditer ensuite) ────────────────────────────────
INSERT INTO public.place_tag_definitions (slug, label_fr, label_en, description, risk_level, sort_order)
VALUES
  ('nightlife_drinking', 'Vie nocturne / alcool', 'Nightlife / drinking', 'Lieux typiquement associés à alcoolisation ou dynamiques de groupe intenses.', 3, 10),
  ('late_night', 'Très tard le soir', 'Late night', 'Contexte horaire plutôt que géographique strict.', 2, 20),
  ('work', 'Travail', 'Work', 'Lieu de travail ou rendez-vous pro.', 0, 30),
  ('home', 'Domicile', 'Home', 'Lieu de résidence ou foyer.', 0, 40),
  ('neutral_social', 'Social neutre', 'Neutral social', 'Rencontre sociale sans signal particulier.', 0, 50)
ON CONFLICT (slug) DO NOTHING;
