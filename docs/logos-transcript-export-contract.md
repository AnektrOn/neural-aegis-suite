# LOGOS post-call → export-to-drive

Server-only POST action: `export_logos_transcript`.

```ts
const url = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceKey) throw new Error("Cloud runtime configuration missing");

const response = await fetch(`${url}/functions/v1/export-to-drive`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    action: "export_logos_transcript",
    user_id: resolvedUserId,
    elevenlabs_conversation_id: conversationId,
    date: conversationDate, // YYYY-MM-DD, same value on every retry
    transcript_text: plainTranscript, // optional if payload.transcript supplies messages
    transcript_payload: fullElevenLabsPayload, // optional JSON object
  }),
});
const result = await response.json();
if (!response.ok) throw new Error(`[${response.status}] ${JSON.stringify(result)}`);
```

`user_id` must be resolved by the signed webhook handler from the conversation's trusted user/agent association. Never infer it from user-editable voice text.

JSON is selected when `transcript_payload.user_hesitation_timings` is a nonempty array, or a user turn in `transcript_payload.transcript` has numeric `time_in_call_secs`, timestamped `words[].start`, or nonempty `hesitation_timings`. The complete supplied payload is retained. Otherwise TXT is selected: `transcript_text`, or text derived from `transcript_payload.transcript[].message/text`.

Response: `{ success: true, verified: true, fileId, path, format: "json" | "txt", elevenlabs_conversation_id }`.

Destination: existing USER AEGIS RAW DATA root, `{clientName}/Logos/{date}/{date}_{conversationId}_transcript.{format}`. Client name comes from the stored profile, not the request. No audio-root access, no audio downloads, no webhook parsing in this function.

Conversation ID is the unique export key. Same ID + same user/date updates the same Drive file, including TXT→JSON upgrades. A conflicting user/date returns 409. Simultaneous execution returns 409 `{error:"Export in progress",retryable:true}` with Retry-After; retry with the unchanged ID/user/date. A service-only lease and Drive appProperty recover uploads after crashes. A successful response follows destination, MIME and byte-size readback.