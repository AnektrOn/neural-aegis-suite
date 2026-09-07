
CREATE TABLE IF NOT EXISTS public.email_alert_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  alert_id text,
  language text NOT NULL DEFAULT 'fr',
  subject text,
  body text,
  link text,
  send_hour_utc integer NOT NULL DEFAULT 8,
  last_sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.email_alert_settings TO authenticated;
GRANT ALL ON public.email_alert_settings TO service_role;
ALTER TABLE public.email_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email alert settings"
ON public.email_alert_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_alert_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.email_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id text,
  language text,
  subject text,
  audience text,
  recipients integer NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_alert_log TO authenticated;
GRANT ALL ON public.email_alert_log TO service_role;
ALTER TABLE public.email_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read email alert log"
ON public.email_alert_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
