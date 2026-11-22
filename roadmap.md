# Monitoring fixes

## Admin subscription access — 22 November 2026
- [x] Align subscription authorization with platform admin/superadmin roles; deployed, eleven tests pass, authenticated admin UI reads a real subscription (HTTP 200), unsigned calls return 401. No billing or account changes performed.
- [x] Repair the existing blog prerender router-context build blocker; preview build OK and admin page has no runtime errors.

## Published blank pages — 20 November 2026
- [x] Restore public build-time connection settings, preserve the primary custom domain, and publish; live release confirmed 20 November 2026 04:04 UTC, preview build OK and thirteen regression tests pass.
- [x] Live desktop/mobile homepage and sign-in form render without runtime errors; invalid password returns the expected error, private restored session loads the real dashboard and assessment question 1. Three signed-out Stripe paths display €35/month, €110/month and €350 once. No card charged, no assessment answers submitted; successful password/OAuth sign-in and full assessment submission not exercised.

## Weekly LOGOS opening batches — 18 November 2026
- [x] Add an atomic service-only batch writer, exactly five distinct categories, seven-day expiry and weekly retry deduplication; preserve chooser, personal Drive prompts and existing RPCs. Thirteen live/rule regression tests pass; preview build OK.
- [x] Schedule Wednesday 00:00 UTC execution and seed the initial batch; authenticated RPC reads five bilingual paths, privileged retries retain the same batch. Two authored sets alternate; no model calls.
- [ ] Complete live guided-call verification: existing agent allows first_message overrides but lacks session_mode/opening_prompt placeholders. Welcome initially shows loading; later browser captures time out. No chooser or agent workflow modified, per brief; needs Cursor's existing workflow setup before an actual guided call.

## Cursor LOGOS post-call transcript contract — 18 November 2026
- [x] Add and deploy service-only export_logos_transcript, complete JSON for user timing data otherwise TXT, inside existing client/Logos/date folders; Cursor audio root untouched.
- [x] Implement conversation-keyed lease ledger and crash-recovery Drive property; five contract tests pass, browser/anonymous call returns 403, preview build OK; exact server signature saved in docs/logos-transcript-export-contract.md.
- [ ] Verify a real service-originated post-call export and concurrent retry against Drive; awaits Cursor's signed webhook invocation (server credential is unavailable to local tests).

## Voice Drive connection — 18 November 2026
- [x] Connect caller-owned prompt batches and completed feedback to verified per-user Voice exports; legacy LOGOS tables untouched. Technical transcript saved and read back through Drive, not a real call.
- [x] Read personal daily prompts in the chooser and wire the SDK recorder; twenty tests pass. Desktop chooser shows real prompts; mobile page has no overflow, loaded mobile chooser verification interrupted.
- [x] Import five real Note prompts from mapped VOICE_PROMPTS/LATEST_BATCH.json into the private daily batch and verify its export to the user folder. No actual ElevenLabs call performed; post-call responsibility is now explicitly assigned to Cursor.

## Voice schema application — 18 November 2026
- [x] Compare uploaded SQL against existing LOGOS tables; apply only the two new tables with explicit grants, profile references and non-guest caller ownership. Existing LOGOS tables untouched.
- [x] Confirm both tables, RLS policies and member/date/time uniqueness in the live schema; this request applies schema only, not Drive synchronization or voice UI wiring.

## Promotion profile — 18 November 2026
- [x] Create the dedicated promotion account protocolenomosclient@gmail.com without touching existing member data.
- [x] Populate 12 fictional contacts, 6 linked places, 14 days of mood/health/scoreboard history, 7 decisions, 6 journals, 3 habits, 9 practice assignments (3 pending), 70 Deep Dive and 72 Maisons answers, assessment/profile displays and 2 demonstration messages. Grant the existing Solo override, no Stripe purchase or LOGOS entitlement; no existing accounts changed.
- [x] Real password sign-in verified; dashboard, contacts, places, habits, journal, practices, messages, analytics and loaded Persona/Deep Dive read back in the UI. Desktop/mobile People Board checked without runtime errors or mobile overflow; five access tests pass. Password-setup email request accepted for the chosen address; inbox delivery not independently verified. No videos/meditation tracks available in the existing catalog to assign.

## Founders lifetime access — 18 November 2026
- [x] Confirm that the newest expired LOGOS row masks the independent lifetime purchase; select the strongest valid base-access grant without changing Stripe purchases or LOGOS cancellation rules.
- [x] Fifteen regression tests pass and preview build OK; signed-in browser with simulated expired LOGOS + active founder rows shows Founders as the current plan and renders the dashboard without runtime errors. No live purchases or subscriptions changed; publication remains required.

## AppSumo test reset and confirmation emails — 18 November 2026
- [x] Remove only the lifetime activation associated with the supplied test code and restore that code for reuse, preserving the account and other data.
- [x] Set up managed sender infrastructure, scaffold AEGIS auth templates and deploy auth-email-hook; sender verification proceeds in More → Emails.
- [x] Implement and deploy AppSumo member confirmation and operator notices with member email and actual account creation date, trusted recipients and stable event keys. Eleven regression tests pass; signed-in invalid-code submission verified on desktop/mobile without consuming a valid code; preview build OK.
- [ ] Verify successful welcome/admin email delivery after DNS verification and a fresh activation. Sender still verifying; frontend trigger requires publication. Pending confirmation can be retried without re-granting access.

## AppSumo redemption and language — 17 November 2026
- [x] Import 999 supplied codes as valid plus one newly generated code; grant Solo lifetime without LOGOS through authenticated, atomic redemption.
- [x] Add redemption at /redeem, /appsumo, auth, Pricing and Settings, preserving redemption destination across signup; unify landing and application language persistence.
- [x] Verify real authenticated redemption at 1280px and 393px, safe retries, unknown-code rejection, single activation per account and lifetime Solo row without LOGOS; English survives auth return, reload and homepage navigation. Nine selected tests pass, build OK. Reset temporary redemption so all 1,000 delivered codes remain available. Actual signup/email confirmation not exercised; shared logo CDN unavailable in sandbox screenshots. Frontend changes still require publication.

## Payment-first access — 16 November 2026
- [x] Open Solo Stripe checkout without a prior account; signed paid events resolve/invite the Stripe email owner, preserving existing accounts. Return page checks payment status without exposing credentials; restore the missing service-only event ledger.
- [x] Thirteen regression tests pass, three functions deployed and checked; all three signed-out buttons open real Stripe checkout (200), no purchase. Unverified return URL does not claim payment. Paid-account creation and invitation delivery have not been exercised with a real purchase.

## Homepage pricing — 16 November 2026
- [x] Point desktop and mobile Pricing navigation to /pricing and replace the individual homepage pricing card with Solo, Solo + LOGOS and Founders offers; preserve enterprise quotes and existing checkout.
- [x] Three amount tests pass; mobile (393px) and desktop (1280px) pricing cards and navigation to /pricing verified; update the mobile pricing shortcut to remove the obsolete Lecture price.

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
