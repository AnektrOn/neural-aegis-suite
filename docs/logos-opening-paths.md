# LOGOS opening paths

## Product rules

- Cron / Lovable creates **batches of 5** prompts in `logos_prompt_batches` + `logos_path_prompts`.
- On agent open, the app shows **3** paths drawn with weights:
  - newest batch: **1**
  - older unused: **0.5**
  - favorited (“garder en mémoire”): **2**
- Plus **blank**: “Je connais mon propre chemin” → `session_mode=open`, empty `opening_prompt`.
- Choosing a path **consumes** it (`logos_consume_path`) and starts ElevenLabs with:
  - `dynamicVariables.session_mode` / `opening_prompt`
  - `overrides.agent.firstMessage` (guided only)
- Knowledge base is **not** modified; only opening behavior + first spoken line.
- Default prompt TTL ≈ **7 days**. Favorite extends TTL (+7 days) and raises weight; still expires if unused.

## Apply

1. Run migration `20261118120000_logos_path_prompts.sql`.
2. Ensure ElevenLabs agent Security allows **first_message** conversation overrides.
3. Re-run `install_logos_workflow` so placeholders include `session_mode` + `opening_prompt`.
4. Insert batches via service_role (Lovable cron) — example:

```sql
INSERT INTO logos_prompt_batches (source, note)
VALUES ('cron', 'seed')
RETURNING id;

-- then 5 rows into logos_path_prompts with expires_at = now() + interval '7 days'
```

## Client entry

`/welcome/voice-agent` → Start → path chooser → `startSession` with injection.
