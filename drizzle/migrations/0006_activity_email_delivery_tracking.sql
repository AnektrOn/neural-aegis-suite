CREATE TABLE public.activity_email_deliveries (event_key text NOT NULL, recipient_email text NOT NULL, status text NOT NULL DEFAULT 'sending', created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, error_message text, PRIMARY KEY(event_key,recipient_email));
GRANT SELECT ON public.activity_email_deliveries TO authenticated;
GRANT ALL ON public.activity_email_deliveries TO service_role;
ALTER TABLE public.activity_email_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Platform operators read activity delivery history" ON public.activity_email_deliveries FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));