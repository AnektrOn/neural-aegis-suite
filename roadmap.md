# Monitoring fixes

- [x] Restore member logout through the shared dock and existing confirmation.
- [x] Keep saved V2 menu choices authoritative, report save errors, and preserve legacy migration.
- [x] Verify practice pin finding: stale; hosted column and types exist, current hub has no pin control.
- [x] Run regression tests and connected mobile/desktop checks: eight tests pass; journal restore survives reload; cancel and logout verified at 393px and 1280px.

## Release storage security
- [x] Remove direct member access to release storage, preserving published signed downloads and admin management.
- [x] Verify applied admin-only/non-guest policy, live admin access, unauthenticated denial, and signed APK download; security rescan has no critical finding.
- [x] Repair pre-existing preview compile errors; eight menu regressions and three live release checks pass, installation page renders, build OK.