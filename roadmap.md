# Monitoring fixes

- [x] Restore member logout through the shared dock and existing confirmation.
- [x] Keep saved V2 menu choices authoritative, report save errors, and preserve legacy migration.
- [x] Verify practice pin finding: stale; hosted column and types exist, current hub has no pin control.
- [x] Run regression tests and connected mobile/desktop checks: eight tests pass; journal restore survives reload; cancel and logout verified at 393px and 1280px.

## Release storage security
- [x] Remove direct member access to release storage, preserving published signed downloads and admin management.
- [x] Verify applied admin-only/non-guest policy, live admin access, unauthenticated denial, and signed APK download; security rescan has no critical finding.
- [x] Repair pre-existing preview compile errors; eight menu regressions and three live release checks pass, installation page renders, build OK.

## ElevenLabs Drive sync
- [x] Include Markdown from nested folders using the linked Drive connection and report empty syncs as errors.
- [x] Four regression tests pass; real admin sync reaches the personal agent in batches with RAG (349 files discovered, first 55 processed).
- [ ] Verify all 349 files: full-run verification exceeds this session's available time; rerun the admin sync to finish (unchanged files skipped).