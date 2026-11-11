# Monitoring fixes

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