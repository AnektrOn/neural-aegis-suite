# Monitoring fixes

## Solo live catalogue deployment — 16 November 2026
- [x] Confirm the existing Cloud binding and deploy founders-availability, stripe-checkout, stripe-webhook and agent-session without rewriting application logic.
- [x] Save the three supplied live price-ID environment overrides; Stripe and ElevenLabs credentials already exist. Stripe readback confirms active live EUR prices at 3500 / 11000 monthly and 35000 one-time, tax-exclusive.
- [x] Authenticated Pricing opens all three real Stripe checkout pages with HTTP 200 and correct amounts, without purchase; LOGOS shows the subscription-required dialog. Public availability reports 20/20 remaining, unsigned webhook returns 400, existing live webhook retains its six enabled events. Seven Stripe/LOGOS regression tests pass.
- [x] Request publication on the unchanged primary custom domain; served Pricing responds HTTP 200 and displays all three offers. Deployment scheduling confirmed, exact release completion not independently identified. Agent-session returns 403 for the authenticated non-LOGOS account.

## Post-exercise feeling — 16 November 2026
- [x] Persist post-exercise selections independently of completion counts in both toolbox views; live post_state column confirmed, completion timestamp and counters untouched by feedback updates.
- [x] Four regression tests verify two feeling selections keep both counters at one, a genuine repeat counts twice, scoped updates and save failures. Authenticated browser check reached Toolbox but the requesting account has no assignments and Initiation-only access, so an actual exercise could not be completed without changing account access or data.

## Preview build and backend type checks — 15 November 2026
- [x] Rename the lowercase guide-panel wrapper component so the preview build compiles; build OK.
- [x] Clear every backend type-check error across all 24 functions: Stripe API-version typing (5 files), newsletter queue client typing, web-push import typing, Deep Dive query result typing, playback signature buffer typing; Stripe library installed locally so the payment functions resolve it during checks.
- [x] Make the body nebula guard state its deliberate content-type route and the level-pack test self-contained (its fixture lived in gitignored exports/); full suite passes, one import test only needs isolation under load.

## Live Stripe webhook — 15 November 2026
- [x] Subscribe the live Aegis endpoint to payment-failure and refund events; final six-event list read back from Stripe.
- [x] Normalize subscription periods and invoice subscription references across legacy and Basil payloads; five tests pass, deployed and preview build OK.
- [x] Verify a Stripe-signed live customer.created delivery against the saved signing secret; signature log and Stripe delivery_success=true agree. Temporary customer.created subscription removed; no payment or email, only a diagnostic customer record created.
- [x] Clarify email change: checkout verification already used conesaleo@gmail.com; changing email alone does not change the Stripe account credentials or webhook.

## Requested deployment — 15 November 2026
- [x] Deploy founders-availability, stripe-checkout, stripe-webhook and agent-session with existing configuration and unchanged logic; public availability returns 200, protected endpoints reject unauthenticated requests and webhook rejects an unsigned request.
- [x] Resolve existing frontend compilation blockers; build OK, four LOGOS tests pass and Pricing renders without browser errors. Security verification completed with six informational findings and no critical finding.
- [x] Publication requested for the existing Pricing / LOGOS app on the primary custom domain; scheduling confirmed, deployment completion not yet verified.

## Page access and mobile width
- [x] Restore clickable dialogs above their overlays; authenticated Maisons dismissal and mobile dock navigation verified, no runtime errors.
- [x] Remove full-page mobile dock clearance from member scaffolds; fourteen pages checked at 393px and 1280px without horizontal overflow; six scaffold tests pass and build OK.

## Complete Drive re-export
- [x] Include 62 retained per-user data sections, including Maisons answers and report sections, with pagination and explicit failures; four tests pass.
- [x] Send all 32 user exports under USER AEGIS RAW DATA and verify destination and byte size; read Massimiliano's file back through Drive: 119 choices, 48 questions, eight houses. Existing automatic Maisons exports remain outside this backfill request.

## Activity email alerts
- [x] Send 73 individual retained alerts from 17 October 2026 onward to the owner: 70 tracked visits clearly distinguished from logins, two quizzes and one tool; each accepted by SMTP and recorded sent.
- [x] Restore login, completed quiz and completed tool emails with event/recipient deduplication; resolve superadmin recipients and defer auth callback work.
- [x] Establish last recorded login alert (17 October 2026 16:37 UTC); send the owner a historical summary of 70 tracked visits, 22 retained quizzes and 28 retained tool completions, clearly noting missing delivery evidence and deleted history.
- [x] Verify SMTP acceptance and persisted sent state from an authenticated owner session; five rule tests pass. New real member quiz/tool completion has not been exercised during this task.

## Public access presentation
- [x] Hide Google, guest and newsletter entry buttons and bottom newsletter link on auth.
- [x] Add free signup on the landing and replace its paid price with quote-only presentation in French and English.
- [x] Verify signup navigation to the account form and simplified auth at 1280px and 393px; no page errors, payment and provider settings unchanged.

## Application logos
- [x] Replace all existing application logo images and the member welcome shortcut with supplied light/dark variants; update favicon, home-screen and notification icons.
- [x] Verify light/dark rendering at 1280px and 393px, five menu tests and build OK; hosted CDN returns image/webp (localhost rendering checked with downloaded CDN bytes).

- [x] Restore member logout through the shared dock and existing confirmation.
- [x] Keep saved V2 menu choices authoritative, report save errors, and preserve legacy migration.
- [x] Verify practice pin finding: stale; hosted column and types exist, current hub has no pin control.
- [x] Run regression tests and connected mobile/desktop checks: eight tests pass; journal restore survives reload; cancel and logout verified at 393px and 1280px.

## Release storage security
- [x] Remove direct member access to release storage, preserving published signed downloads and admin management.
- [x] Verify applied admin-only/non-guest policy, live admin access, unauthenticated denial, and signed APK download; security rescan has no critical finding.
- [x] Repair pre-existing preview compile errors; eight menu regressions and three live release checks pass, installation page renders, build OK.

## ElevenLabs Drive sync
- [x] Install and read back the personal LOGOS workflow without placeholder document IDs; nine nodes, eleven edges and seven empty KB overrides confirmed through ElevenLabs; two tests pass.
- [x] Attach the personal Drive root folder to the agent, including resumed batches; nine tests pass and a live authenticated batch confirms the folder locator by reading the agent back from ElevenLabs.
- [x] Preserve real per-user ElevenLabs folders and reclassify unchanged documents; seven tests pass, function deployed, ten folders and one unchanged document verified in ElevenLabs, repeated batch reuses folders.
- [x] Include Markdown from nested folders using the linked Drive connection and report empty syncs as errors.
- [x] Four regression tests pass; real admin sync reaches the personal agent in batches with RAG (349 files discovered, first 55 processed).
- [ ] Complete the existing 349-document import via the admin sync; not launched in this task, which verifies only small batches as approved.
- [x] Export Drive : fichier supplémentaire avec le barème du quiz Maisons (Quizz/)
- [x] Envoi automatique au Drive des réponses Maisons + barème
