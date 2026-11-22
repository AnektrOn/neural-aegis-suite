# LOGOS transcript export contract

Cursor webhook `logos-post-call` calls Lovable `export-to-drive` after each ElevenLabs post-call.

## Call

```ts
const response = await fetch(`${SUPABASE_URL}/functions/v1/export-to-drive`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "export_logos_transcript",
    user_id: resolvedUserId,
    elevenlabs_conversation_id: conversationId,
    date: conversationDate, // YYYY-MM-DD, stable across retries
    transcript_text: plainTranscript,
    transcript_payload: fullElevenLabsPayload,
  }),
});
```

## File choice (Lovable)

- JSON if payload has hesitation timings / `time_in_call_secs` / `words[].start`
- TXT otherwise

Destination: `{clientName}/Logos/{date}/{date}_{conversationId}_transcript.json|txt`

## Cursor LOGOS Drive root

Root: `1hAZO9p_pnM-TxW_x7P9hDVr8FWh_az7C`

```text
/{label}_{first8}/YYYY/YYYY-MM-DD/{conversationId}/
  audio.mp3
  transcript.json
  transcript.txt
  meta.json
```

- `label` = email local-part or first display-name token (max 32)
- `first8` = first 8 hex chars of `user_id` (full UUID lives in `meta.json`)
- Example: `humancatalystnote_25d80046/2026/2026-11-21/conv_…/`
- `post_call_audio` waits for / reuses the transcription tree (oldest Drive folder on name collisions) so concurrent webhooks do not leave a second empty user folder

## Env

| Secret | Role |
|--------|------|
| `ELEVENLABS_API_KEY` | Fetch conversation audio |
| `ELEVENLABS_POST_CALL_WEBHOOK_SECRET` | HMAC `ElevenLabs-Signature` |
| `LOVABLE_API_KEY` + `GOOGLE_DRIVE_API_KEY` | Gateway Drive uploads |
| `LOGOS_DRIVE_ROOT_ID` | Optional override of root folder |

## Deploy

1. Apply `20261118140000_logos_conversation_exports.sql`
2. `supabase functions deploy logos-post-call --no-verify-jwt`
3. Point ElevenLabs workspace/agent post-call webhook to  
   `https://<project>.supabase.co/functions/v1/logos-post-call`  
   events: `transcript` + `audio`
