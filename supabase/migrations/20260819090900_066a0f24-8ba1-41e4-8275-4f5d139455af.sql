ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS installments_paid integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS installments_total integer;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select
    exists (
      select 1 from public.profiles p
      where p.id = user_uuid and p.plan_override in ('matrix','ultra')
    )
    or exists (
      select 1 from public.subscriptions s
      where s.user_id = user_uuid
        and s.environment = check_env
        and (
          (s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end > now()))
          or (s.status = 'canceled' and s.current_period_end > now())
        )
    );
$$;