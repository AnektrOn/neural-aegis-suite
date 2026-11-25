-- Dossier Drive Obsidian (flow onboarding user / username), distinct du Vault LOGOS quotidien si besoin.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_drive_folder_id TEXT;

COMMENT ON COLUMN public.profiles.onboarding_drive_folder_id IS
  'Google Drive folder ID du dossier membre (Obsidian onboarding user). Prioritaire sur drive_folder_id pour le débrief vocal onboarding.';