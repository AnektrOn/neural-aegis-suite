# Ops alerts — Stripe & backend

## Stripe
1. In Stripe Dashboard → Developers → Webhooks, confirm the live endpoint receives:
   - `checkout.session.completed`
   - `customer.subscription.updated` / `deleted`
   - `invoice.paid` / `invoice.payment_failed`
   - `charge.refunded`
2. Enable Stripe email alerts for failed payments (Settings → Customer emails).
3. Optional: configure Slack/email destination on webhook delivery failures.

## Backend (Supabase)
1. Supabase Dashboard → Project Settings → Infrastructure: enable uptime / status notifications.
2. The app already probes `/auth/v1/health` via `useBackendHealth` and shows a degraded screen after AuthBootGate timeout.
3. Cron (recommended): call `purge_sensitive_assessment_answers(365)` weekly via `pg_cron` or an Edge Function schedule.

## Application errors
Set `VITE_SENTRY_DSN` (and Edge secrets if using Sentry server-side) — see `src/lib/errorMonitoring.ts`.

## Staging
See [docs/staging.md](staging.md) and `.env.staging.example`.
