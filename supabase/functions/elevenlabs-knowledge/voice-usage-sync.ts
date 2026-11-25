// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

export type ElConvListRow = {
  conversation_id?: string;
  start_time_unix_secs?: number;
  call_duration_secs?: number;
};

type FetchConversations = (path: string) => Promise<Record<string, unknown>>;

export function utcMonthUnixBounds(now = new Date()): { start: number; end: number } {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return {
    start: Math.floor(Date.UTC(y, m, 1) / 1000),
    end: Math.floor(Date.UTC(y, m + 1, 1) / 1000),
  };
}

export async function listAgentConversationsForMonth(
  elJson: FetchConversations,
  agentId: string,
  monthStartUnix: number,
  monthEndUnix: number,
): Promise<ElConvListRow[]> {
  const out: ElConvListRow[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 40; page++) {
    const params = new URLSearchParams({
      agent_id: agentId,
      page_size: "100",
      call_start_after_unix: String(monthStartUnix),
      call_start_before_unix: String(monthEndUnix),
    });
    if (cursor) params.set("cursor", cursor);
    const data = await elJson(`/convai/conversations?${params}`);
    const convs = Array.isArray(data.conversations) ? (data.conversations as ElConvListRow[]) : [];
    out.push(...convs);
    const hasMore = data.has_more === true;
    const next =
      typeof data.next_cursor === "string"
        ? data.next_cursor
        : typeof data.cursor === "string"
          ? data.cursor
          : null;
    if (!hasMore || !next) break;
    cursor = next;
  }
  return out;
}

export async function persistConversationDuration(
  admin: SupabaseClient,
  userId: string,
  agentId: string,
  conv: ElConvListRow,
): Promise<{ synced: boolean; duration_seconds?: number; skipped_reason?: string }> {
  const conversationId = String(conv.conversation_id ?? "").trim();
  const duration = Math.max(0, Math.round(Number(conv.call_duration_secs) || 0));
  if (!conversationId) return { synced: false, skipped_reason: "no_id" };
  if (duration <= 0) return { synced: false, skipped_reason: "no_duration" };

  const unix = Number(conv.start_time_unix_secs);
  const date =
    Number.isFinite(unix) && unix > 0
      ? new Date(unix * 1000).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const { error: upsertError } = await admin.from("logos_conversation_exports").upsert(
    {
      elevenlabs_conversation_id: conversationId,
      user_id: userId,
      agent_id: agentId,
      conversation_date: date,
      call_duration_seconds: duration,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "elevenlabs_conversation_id" },
  );
  if (upsertError) throw upsertError;

  const { data: rows, error: selectError } = await admin
    .from("voice_session_feedbacks")
    .select("id, duration_seconds")
    .eq("user_id", userId)
    .eq("elevenlabs_conversation_id", conversationId);
  if (selectError) throw selectError;

  for (const row of rows ?? []) {
    const merged = Math.max(row.duration_seconds ?? 0, duration);
    if (merged !== (row.duration_seconds ?? 0)) {
      const { error } = await admin
        .from("voice_session_feedbacks")
        .update({ duration_seconds: merged })
        .eq("id", row.id);
      if (error) throw error;
    }
  }

  return { synced: true, duration_seconds: duration };
}

export async function syncVoiceUsageForUser(
  admin: SupabaseClient,
  elJson: FetchConversations,
  userId: string,
  agentId: string,
  bounds = utcMonthUnixBounds(),
): Promise<{
  user_id: string;
  agent_id: string;
  conversations: number;
  synced: number;
  skipped: number;
  total_seconds: number;
  period_start_unix: number;
  period_end_unix: number;
}> {
  const list = await listAgentConversationsForMonth(elJson, agentId, bounds.start, bounds.end);
  let synced = 0;
  let skipped = 0;
  let totalSeconds = 0;

  for (const conv of list) {
    const r = await persistConversationDuration(admin, userId, agentId, conv);
    if (r.synced && r.duration_seconds) {
      synced++;
      totalSeconds += r.duration_seconds;
    } else {
      skipped++;
    }
  }

  return {
    user_id: userId,
    agent_id: agentId,
    conversations: list.length,
    synced,
    skipped,
    total_seconds: totalSeconds,
    period_start_unix: bounds.start,
    period_end_unix: bounds.end,
  };
}