-- =========================
-- Smart Admin Alerts System
-- =========================

-- Alerts table
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title_fr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_user_unresolved
  ON public.admin_alerts (user_id, alert_type, created_at DESC)
  WHERE is_resolved = false;

CREATE INDEX IF NOT EXISTS idx_admin_alerts_severity_created
  ON public.admin_alerts (severity, created_at DESC);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read admin_alerts"
  ON public.admin_alerts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert admin_alerts"
  ON public.admin_alerts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update admin_alerts"
  ON public.admin_alerts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete admin_alerts"
  ON public.admin_alerts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Rules table
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  severity TEXT NOT NULL,
  threshold_value NUMERIC,
  threshold_days INTEGER,
  description_fr TEXT,
  description_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read alert_rules"
  ON public.alert_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage alert_rules"
  ON public.alert_rules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default rules (idempotent)
INSERT INTO public.alert_rules (rule_key, severity, threshold_value, threshold_days, description_fr, description_en) VALUES
  ('low_mood_streak',    'critical', 4,    3,  'Humeur moyenne < 4 pendant 3 jours consécutifs',         'Average mood < 4 for 3+ consecutive days'),
  ('no_log',             'high',     NULL, 5,  'Aucun log depuis 5 jours ou plus',                        'No logs for 5+ days'),
  ('high_shadow',        'medium',   2.5,  NULL, 'Intensité d''ombre > 2.5 sur au moins 2 dimensions',    'Shadow intensity > 2.5 on 2+ dimensions'),
  ('pending_decisions',  'medium',   NULL, 7,  'Décisions ouvertes depuis plus de 7 jours',               'Decisions open for more than 7 days'),
  ('no_relations',       'low',      NULL, 14, 'Aucun log PeopleBoard depuis 14 jours',                   'No PeopleBoard log for 14+ days'),
  ('score_drop',         'high',     20,   3,  'Score AEGIS chute de plus de 20 points en 3 jours',       'AEGIS health score drops > 20 pts in 3 days')
ON CONFLICT (rule_key) DO NOTHING;
