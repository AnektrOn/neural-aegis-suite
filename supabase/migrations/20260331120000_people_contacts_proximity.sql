-- Niveau de proximité pour le placement sur la carte relationnelle (NeuralMap)
ALTER TABLE public.people_contacts
  ADD COLUMN IF NOT EXISTS proximity TEXT NOT NULL DEFAULT 'employe'
  CHECK (proximity IN ('famille', 'ami', 'equipe_direction', 'prestataire', 'employe'));

COMMENT ON COLUMN public.people_contacts.proximity IS 'Proximité perçue : famille, ami, équipe de direction, prestataire, employé';
