CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
 event_id TEXT PRIMARY KEY,
 event_type TEXT NOT NULL,
 processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 livemode BOOLEAN NOT NULL DEFAULT true
);
GRANT ALL ON public.stripe_webhook_events TO service_role;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;