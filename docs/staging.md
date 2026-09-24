/*
  Staging / preview environment checklist
  =======================================

  1. Supabase project: create a separate `aegis-staging` project (never share live DB).
  2. Stripe: use test-mode keys + a dedicated webhook endpoint pointing at staging functions.
  3. Env file: copy `.env.staging.example` → `.env.staging` (never commit secrets).
  4. Build: `npm run build -- --mode staging` (Vite loads `.env.staging`).
  5. Deploy: GitHub Actions workflow_dispatch to a Pages preview branch, or a separate host.
  6. Webhooks to register in Stripe test mode:
     - checkout.session.completed
     - customer.subscription.updated / deleted
     - invoice.paid / invoice.payment_failed
     - charge.refunded
  7. Enable Stripe Tax in the Stripe Dashboard (test) before validating checkout VAT.
  8. Resend: use a sandbox/test domain or the same verified domain with a staging from-address.
*/

export {};
