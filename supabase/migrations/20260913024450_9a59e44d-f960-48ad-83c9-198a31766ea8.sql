ALTER TABLE public.email_alert_settings ADD COLUMN IF NOT EXISTS subject_en text;
ALTER TABLE public.email_alert_settings ADD COLUMN IF NOT EXISTS body_en text;