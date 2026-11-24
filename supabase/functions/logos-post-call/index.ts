import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders as sdkCorsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  conversationDateFromPayload,
  extractCallDurationSecs,
  extractOpeningMeta,
  logosConversationFolderParts,
  plainTranscriptFromTurns,
  resolveWebhookUserId,
  sleep,
  verifyElevenLabsSignature,
  type TranscriptTurn,
} from "./helpers.ts";
import {
  ensureLogosConversationFolder,
  resolveLogosConversationFolder,
  upsertDriveBytes,
  upsertDriveText,
} from "./drive.ts";

const corsHeaders = {
  ...sdkCorsHeaders,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, elevenlabs-signature",
};

const EL = "https://api.elevenlabs.io/v1";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function elHeaders(): HeadersInit {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");
  return { "xi-api-key": key };
}

async function fetchConversationSummary(conversationId: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(`${EL}/convai/conversations/${encodeURIComponent(conversationId)}`, {
    headers: elHeaders(),
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`ElevenLabs conversation ${r.status}: ${await r.text()}`);
  return (await r.json()) as Record<string, unknown>;
}

async function resolveCallDurationSeconds(
  conversationId: string,
  data: Record<string, unknown>,
): Promise<number | null> {
  const fromWebhook = extractCallDurationSecs(data as Parameters<typeof extractCallDurationSecs>[0]);
  if (fromWebhook != null) return fromWebhook;
  try {
    const summary = await fetchConversationSummary(conversationId);
    return summary ? extractCallDurationSecs(summary as Parameters<typeof extractCallDurationSecs>[0]) : null;
  } catch (err) {
    console.warn("resolveCallDurationSeconds:", conversationId, err);
    return null;
  }
}

async function syncVoiceCallDuration(
  admin: ReturnType<typeof createClient>,
  userId: string,
  conversationId: string,
  callDurationSeconds: number,
) {
  await admin
    .from("logos_conversation_exports")
    .update({
      call_duration_seconds: callDurationSeconds,
      updated_at: new Date().toISOString(),
    })
    .eq("elevenlabs_conversation_id", conversationId);

  const { data: rows } = await admin
    .from("voice_session_feedbacks")
    .select("id, duration_seconds")
    .eq("user_id", userId)
    .eq("elevenlabs_conversation_id", conversationId);

  for (const row of rows ?? []) {
    const merged = Math.max(row.duration_seconds ?? 0, callDurationSeconds);
    if (merged !== (row.duration_seconds ?? 0)) {
      await admin.from("voice_session_feedbacks").update({ duration_seconds: merged }).eq("id", row.id);
    }
  }
}

async function fetchConversationAudio(conversationId: string): Promise<Uint8Array | null> {
  const r = await fetch(`${EL}/convai/conversations/${encodeURIComponent(conversationId)}/audio`, {
    headers: elHeaders(),
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`ElevenLabs audio ${r.status}: ${await r.text()}`);
  return new Uint8Array(await r.arrayBuffer());
}

async function resolveUserIdFromAgent(
  admin: ReturnType<typeof createClient>,
  agentId: string | null | undefined,
): Promise<string | null> {
  if (!agentId) return null;
  const { data: mapped } = await admin
    .from("user_agents")
    .select("user_id")
    .eq("elevenlabs_agent_id", agentId)
    .maybeSingle();
  if (mapped?.user_id) return mapped.user_id;
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("elevenlabs_agent_id", agentId)
    .maybeSingle();
  return profile?.id ?? null;
}

async function exportLogosTranscript(input: {
  userId: string;
  conversationId: string;
  date: string;
  transcriptText: string;
  transcriptPayload: unknown;
}): Promise<{ success: boolean; path?: string; format?: string; status: number; body: unknown }> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Configuration Cloud manquante");

  let lastStatus = 0;
  let lastBody: unknown = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await fetch(`${url}/functions/v1/export-to-drive`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "export_logos_transcript",
        user_id: input.userId,
        elevenlabs_conversation_id: input.conversationId,
        date: input.date,
        transcript_text: input.transcriptText || undefined,
        transcript_payload: input.transcriptPayload,
      }),
    });
    lastStatus = response.status;
    lastBody = await response.json().catch(() => ({}));
    if (response.ok) {
      return { success: true, status: response.status, body: lastBody, ...(lastBody as object) };
    }
    const retryable =
      response.status === 409 &&
      typeof lastBody === "object" &&
      lastBody !== null &&
      (lastBody as { retryable?: boolean }).retryable === true;
    if (!retryable) break;
    await sleep(400 * (attempt + 1));
  }
  return { success: false, status: lastStatus, body: lastBody };
}

async function handleTranscription(
  admin: ReturnType<typeof createClient>,
  data: Record<string, unknown>,
) {
  const conversationId = String(data.conversation_id ?? "");
  if (!conversationId) throw new Error("conversation_id missing");

  let userId =
    resolveWebhookUserId(data as Parameters<typeof resolveWebhookUserId>[0]) ??
    (await resolveUserIdFromAgent(admin, data.agent_id as string | undefined));
  if (!userId) throw new Error("Unable to resolve AEGIS user for conversation");

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const date = conversationDateFromPayload({
    metadata: data.metadata as { start_time_unix_secs?: number } | null,
  });
  const turns = (data.transcript as TranscriptTurn[] | undefined) ?? [];
  const transcriptText = plainTranscriptFromTurns(turns);
  const opening = extractOpeningMeta(data as Parameters<typeof extractOpeningMeta>[0]);
  const parts = logosConversationFolderParts({
    userId,
    displayName: profile?.display_name,
    date,
    conversationId,
  });

  const { data: existing } = await admin
    .from("logos_conversation_exports")
    .select("id, logos_drive_done, user_export_done")
    .eq("elevenlabs_conversation_id", conversationId)
    .maybeSingle();

  if (existing?.logos_drive_done && existing?.user_export_done) {
    return {
      ok: true,
      skipped: true,
      conversation_id: conversationId,
      user_id: userId,
    };
  }

  const callDurationSeconds = await resolveCallDurationSeconds(conversationId, data);

  await admin.from("logos_conversation_exports").upsert(
    {
      elevenlabs_conversation_id: conversationId,
      user_id: userId,
      agent_id: (data.agent_id as string) ?? null,
      conversation_date: date,
      prompt_id: opening.promptId,
      session_mode: opening.sessionMode,
      ...(callDurationSeconds != null ? { call_duration_seconds: callDurationSeconds } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "elevenlabs_conversation_id" },
  );

  if (callDurationSeconds != null) {
    await syncVoiceCallDuration(admin, userId, conversationId, callDurationSeconds);
  }

  const { folderId, path } = await ensureLogosConversationFolder(parts);

  // Stamp path early so a concurrent post_call_audio webhook reuses this tree.
  await admin
    .from("logos_conversation_exports")
    .update({
      logos_drive_path: path,
      updated_at: new Date().toISOString(),
    })
    .eq("elevenlabs_conversation_id", conversationId);

  await upsertDriveText(
    folderId,
    "transcript.json",
    JSON.stringify(data, null, 2),
    "application/json",
  );
  await upsertDriveText(
    folderId,
    "transcript.txt",
    transcriptText || "(empty transcript)",
    "text/plain; charset=UTF-8",
  );
  await upsertDriveText(
    folderId,
    "meta.json",
    JSON.stringify(
      {
        user_id: userId,
        conversation_id: conversationId,
        conversation_date: date,
        prompt_id: opening.promptId,
        session_mode: opening.sessionMode,
        opening_prompt: opening.openingPrompt,
        agent_id: data.agent_id ?? null,
        logos_path: path,
      },
      null,
      2,
    ),
    "application/json",
  );

  let audioUploaded = false;
  if (data.has_audio !== false) {
    const audio = await fetchConversationAudio(conversationId);
    if (audio && audio.byteLength > 0) {
      await upsertDriveBytes(folderId, "audio.mp3", audio, "audio/mpeg");
      audioUploaded = true;
    }
  }

  await admin
    .from("logos_conversation_exports")
    .update({
      logos_drive_done: true,
      logos_drive_path: path,
      audio_uploaded: audioUploaded,
      updated_at: new Date().toISOString(),
    })
    .eq("elevenlabs_conversation_id", conversationId);

  const exported = await exportLogosTranscript({
    userId,
    conversationId,
    date,
    transcriptText,
    transcriptPayload: data,
  });

  if (!exported.success) {
    throw new Error(
      `export_logos_transcript failed [${exported.status}]: ${JSON.stringify(exported.body)}`,
    );
  }

  await admin
    .from("logos_conversation_exports")
    .update({
      user_export_done: true,
      user_export_path:
        typeof exported.body === "object" && exported.body && "path" in exported.body
          ? String((exported.body as { path: string }).path)
          : null,
      user_export_format:
        typeof exported.body === "object" && exported.body && "format" in exported.body
          ? String((exported.body as { format: string }).format)
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq("elevenlabs_conversation_id", conversationId);

  // Best-effort sync into legacy voice_session_feedbacks row if present.
  await admin
    .from("voice_session_feedbacks")
    .update({
      transcript: transcriptText || null,
      elevenlabs_conversation_id: conversationId,
      exported_to_drive: true,
      drive_file_path: path,
    })
    .eq("user_id", userId)
    .eq("elevenlabs_conversation_id", conversationId);

  return {
    ok: true,
    conversation_id: conversationId,
    user_id: userId,
    logos_path: path,
    audio_uploaded: audioUploaded,
    user_export: exported.body,
  };
}

async function waitForExportAnchor(
  admin: ReturnType<typeof createClient>,
  conversationId: string,
): Promise<{
  user_id: string | null;
  conversation_date: string | null;
  logos_drive_path: string | null;
  audio_uploaded: boolean;
} | null> {
  let last: {
    user_id: string | null;
    conversation_date: string | null;
    logos_drive_path: string | null;
    audio_uploaded: boolean;
  } | null = null;
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data } = await admin
      .from("logos_conversation_exports")
      .select("user_id, conversation_date, logos_drive_path, audio_uploaded")
      .eq("elevenlabs_conversation_id", conversationId)
      .maybeSingle();
    last = data ?? null;
    if (data?.audio_uploaded || data?.logos_drive_path) return data;
    await sleep(350 * (attempt + 1));
  }
  return last;
}

async function handleAudioWebhook(
  admin: ReturnType<typeof createClient>,
  data: Record<string, unknown>,
) {
  const conversationId = String(data.conversation_id ?? "");
  if (!conversationId) throw new Error("conversation_id missing");
  const fullAudio = typeof data.full_audio === "string" ? data.full_audio : "";
  if (!fullAudio) return { ok: true, skipped: true, reason: "no_audio" };

  let userId =
    resolveWebhookUserId(data as Parameters<typeof resolveWebhookUserId>[0]) ??
    (await resolveUserIdFromAgent(admin, data.agent_id as string | undefined));

  // Prefer the transcription handler's tree (avoids duplicate same-name Drive folders).
  const exportRow = await waitForExportAnchor(admin, conversationId);

  userId = userId ?? exportRow?.user_id ?? null;
  if (!userId) throw new Error("Unable to resolve AEGIS user for audio webhook");
  if (exportRow?.audio_uploaded) {
    return { ok: true, skipped: true, conversation_id: conversationId, reason: "audio_already" };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  const date = exportRow?.conversation_date ?? new Date().toISOString().slice(0, 10);
  const parts = logosConversationFolderParts({
    userId,
    displayName: profile?.display_name,
    date,
    conversationId,
  });

  // If transcription already stamped a path, resolve it (no create). Else ensure once.
  const resolved =
    (await resolveLogosConversationFolder(parts)) ??
    (await ensureLogosConversationFolder(parts));
  const { folderId, path } = resolved;

  const binary = Uint8Array.from(atob(fullAudio), (c) => c.charCodeAt(0));
  await upsertDriveBytes(folderId, "audio.mp3", binary, "audio/mpeg");

  await admin.from("logos_conversation_exports").upsert(
    {
      elevenlabs_conversation_id: conversationId,
      user_id: userId,
      agent_id: (data.agent_id as string) ?? null,
      conversation_date: date,
      audio_uploaded: true,
      logos_drive_path: path,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "elevenlabs_conversation_id" },
  );

  return { ok: true, conversation_id: conversationId, logos_path: path, audio_uploaded: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = Deno.env.get("ELEVENLABS_POST_CALL_WEBHOOK_SECRET");
    if (!url || !service) return json({ error: "Server misconfigured" }, 500);

    const rawBody = await req.text();
    if (!webhookSecret) {
      console.error("logos-post-call: webhook secret not configured — request rejected");
      return json({ error: "Webhook not configured" }, 503);
    }
    {
      const ok = await verifyElevenLabsSignature(
        rawBody,
        req.headers.get("elevenlabs-signature") ?? req.headers.get("ElevenLabs-Signature"),
        webhookSecret,
      );
      if (!ok) return json({ error: "Invalid signature" }, 401);
    }

    const payload = JSON.parse(rawBody) as { type?: string; data?: Record<string, unknown> };
    const admin = createClient(url, service);
    const type = payload.type ?? "";
    const data = payload.data ?? {};

    if (type === "post_call_transcription") {
      const result = await handleTranscription(admin, data);
      return json(result);
    }
    if (type === "post_call_audio") {
      const result = await handleAudioWebhook(admin, data);
      return json(result);
    }

    return json({ ok: true, ignored: true, type });
  } catch (error) {
    console.error("logos-post-call", error);
    return json(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
