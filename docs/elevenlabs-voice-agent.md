# ElevenLabs voice agent (per-user)

Stack: Vite + React + Supabase Auth. The browser never receives `ELEVENLABS_API_KEY` or a client-chosen `agent_id`. Routing is server-side via the `agent-session` edge function (equivalent to `POST /api/agent/session`).

## Required secrets (Supabase project / edge functions)

| Variable | Where |
|----------|--------|
| `ELEVENLABS_API_KEY` | Edge function secrets (already used by `elevenlabs-knowledge`) |
| `ELEVENLABS_DEFAULT_AGENT_ID` | Edge function secrets — fallback when `user_agents` has no row |

Also required for the edge function: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (provided by Supabase).

## Database

- Table `user_agents` (`user_id` → `elevenlabs_agent_id`), one row per user.
- Rows are backfilled from `profiles.elevenlabs_agent_id` and kept in sync via triggers (admin KB flow unchanged).

## Client

```tsx
import { VoiceAgent } from "@/components/voice/VoiceAgent";

<VoiceAgent />
```

Uses `@elevenlabs/react` with a WebRTC `conversationToken` from `agent-session`.

## Deploy

1. Apply migration `20261107130000_user_agents_voice_session.sql`.
2. Set `ELEVENLABS_DEFAULT_AGENT_ID` in Supabase secrets (optional fallback).
3. Deploy at least one backend entrypoint:
   - **Preferred:** `npx supabase functions deploy agent-session --project-ref <ref>`
   - **Or republish** `elevenlabs-knowledge` (includes `voice_conversation_token` for signed-in members). The app tries `agent-session` first, then falls back to this action.

If the browser shows *Failed to send a request to the Edge Function*, `agent-session` is missing on the project — deploy step 3.
