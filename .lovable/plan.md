# Restore daily scores and archetype history safely

## Review outcome
- **Mood panel fixed:** QuickLogModal now preserves its positioning, background and scrolling when LOGOS adds stacking overrides. The signed-in LOGOS workflow lab opened and dismissed the real panel on desktop and mobile; dismissal returned `quick_log:dismissed`. No actual call was started and no mood entry was saved. Nine existing tests pass and the preview build is healthy.
- **Score/history issue confirmed, not yet changed:** current database policies deny the browser's daily score upsert and profile snapshot insert. Restoring direct member write access would undo deliberate security hardening; a trusted writer is required.

## Rules and checked paths
Members must be able to save their own daily score and assessment history without being allowed to forge protected computed results. Mood entry must remain visible and dismissible wherever it opens.

| Paths read | Finding |
| --- | --- |
| Daily health service and useAegisHealthScore, Dashboard desktop/mobile, AegisHealthSection | Missing-today and refresh paths still use the blocked browser writer; display paths share this service. |
| snapshotService and assessmentService core submission, appendix completion, manual refresh | All three invoke the blocked insert; failures are swallowed. |
| Member ProfileEvolutionSection/useSnapshotHistory, admin snapshot history and guest preview | Reads remain allowed; these screens cannot show snapshots that were never saved. |
| Live finalize_onboarding_and_populate_cockpit | Has a trusted initial score writer, but its onboarding-specific formula and side effects do not implement daily refresh. Leave it unchanged. |
| Live trg_export_assessment and reset_user_archetype_results | Export/reset functions, not replacement snapshot creators. Leave existing exports and resets unchanged. |
| LOGOS tool registrar, host, workflow lab and development modal panel | All use the same repaired QuickLogModal through openQuickLogAndWait. |
| DashboardMobile desktop/mobile branches and development executive dashboard | Use QuickLogModal without overrides; base layout preserved. |
| Shared Radix dialog | Already merges overrides with base classes; no change needed. |

## Implementation
1. Add authenticated, trusted writers for daily health computation and assessment snapshots. Derive the caller's identity from authentication; validate session ownership on the server. Retain existing calculation rules and snapshot fields, append-only history, and the existing Drive export triggers.
2. Change the two browser services to call these writers instead of writing protected result tables. Preserve the existing UI and each assessment trigger.
3. Keep direct member writes blocked. Do not modify existing scores, snapshots, accounts, subscriptions, sent emails or unrelated permissions.
4. Add concrete regression tests for owner-only access, rejection of another member's session, unchanged score calculations, daily upsert behavior and snapshot creation for each of the three triggers.
5. Verify signed-in daily creation/refresh and assessment snapshot readback, including the existing export dispatch, before resolving the remaining monitoring finding.

## Technical details
- Use an additive Lovable Cloud migration and/or an authenticated function consistent with existing project conventions; never re-enable unrestricted client writes.
- Reuse existing assessment calculation logic in a server-compatible module rather than trusting submitted computed scores. Inspect the persisted response/analysis dependencies before selecting the writer's exact shape.
- Preserve auth-derived tenancy and explicit execution grants. Apply schema changes through the migration tool, deploy any new function, and update generated types only through platform tooling.
- The high-severity finding stays open until the writer and signed-in readback are verified. Frontend drawer changes still require publishing to reach the published site.