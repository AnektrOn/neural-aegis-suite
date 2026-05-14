-- User-configurable shortcuts for the mobile radial dock (JSON array of string ids).
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS mobile_radial_menu jsonb;

COMMENT ON COLUMN public.profiles.mobile_radial_menu IS
  'Ordered JSON array of mobile radial shortcut ids; NULL uses app defaults.';
