# Weekly LOGOS opening paths

The existing tables and chooser RPCs are already deployed; their original migration was not replayed.

- Job: `logos-opening-weekly`, every Wednesday at 00:00 UTC (08:00 Makassar).
- SQL callback: `SELECT public.create_weekly_logos_batch();`
- Optional service-role client call: `admin.rpc("create_weekly_logos_batch")` with no body parameters.
- Result: `{ batch_id, created, count: 5 }`; retries within the same UTC Monday-based week return the same batch with `created: false`.
- The database writes batch and prompts atomically with a transaction advisory lock. Exactly five distinct categories: decision, mental, intention, relation, body. Expiry is seven days after creation.
- Two authored sets alternate weekly. This is not AI generation; expanding the catalog requires updating the writer through a migration.
- Titles are bilingual; behavioral instructions and spoken openings are French, as permitted by the brief. Text and spoken first message are distinct fields.
- Members can read, but cannot insert/update/delete the shared catalog or execute its writer.
- SQL-only scheduling avoids an unnecessary HTTP callback, external provider or recurring model cost.
- Personal Drive prompts retain their existing precedence: Note may see personal paths rather than this shared catalog. The chooser, KB, sculptures and existing consume/favorite/list RPCs are untouched.

## Verification

`LOGOS_BATCH_LIVE_TEST=1 bunx vitest run src/test/logosWeeklyBatches.integration.test.ts`

Requires the sandbox database connection in `SUPABASE_DB_URL`. Tests only read the deployed initial batch after privileged server retries; the sandbox reader cannot execute the service-only writer. No credentials are stored in this document.