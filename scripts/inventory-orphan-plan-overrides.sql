-- Inventory: profiles with plan_override but no active Stripe-backed subscription.
-- Run in SQL editor (service role / dashboard) after deploying 20260922120000.
--
-- SELECT * FROM public.v_orphan_plan_overrides ORDER BY profile_created_at;
--
-- Optional cleanup (review first):
-- UPDATE public.profiles SET plan_override = NULL
-- WHERE id IN (SELECT user_id FROM public.v_orphan_plan_overrides);

SELECT
  user_id,
  display_name,
  plan_override,
  profile_created_at,
  subscription_status,
  product_id,
  stripe_subscription_id
FROM public.v_orphan_plan_overrides
ORDER BY profile_created_at;
