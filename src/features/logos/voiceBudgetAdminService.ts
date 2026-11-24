import { supabase } from "@/integrations/supabase/client";
import type { VoiceUsageBudget } from "./voiceBudgetService";

export type LogosVoiceQuotaAdminRow = {
  user_id: string;
  display_name: string | null;
  elevenlabs_agent_id: string;
  used_seconds: number;
  limit_seconds: number;
  remaining_seconds: number;
  profile_limit_seconds: number | null;
  last_feedback_at: string | null;
};

export type LogosVoiceQuotaAdminOverview = {
  users: LogosVoiceQuotaAdminRow[];
  period_start: string;
  period_end: string;
  default_limit_seconds: number;
};

function parseOverview(data: unknown): LogosVoiceQuotaAdminOverview | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (o.ok !== true || !Array.isArray(o.users)) return null;
  const users: LogosVoiceQuotaAdminRow[] = [];
  for (const raw of o.users) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const userId = String(r.user_id ?? "");
    const agentId = String(r.elevenlabs_agent_id ?? "");
    if (!userId || !agentId) continue;
    users.push({
      user_id: userId,
      display_name: r.display_name != null ? String(r.display_name) : null,
      elevenlabs_agent_id: agentId,
      used_seconds: Math.max(0, Math.floor(Number(r.used_seconds) || 0)),
      limit_seconds: Math.max(0, Math.floor(Number(r.limit_seconds) || 0)),
      remaining_seconds: Math.max(0, Math.floor(Number(r.remaining_seconds) || 0)),
      profile_limit_seconds:
        r.profile_limit_seconds == null || r.profile_limit_seconds === ""
          ? null
          : Math.max(0, Math.floor(Number(r.profile_limit_seconds))),
      last_feedback_at:
        r.last_feedback_at != null ? String(r.last_feedback_at) : null,
    });
  }
  return {
    users,
    period_start: String(o.period_start ?? ""),
    period_end: String(o.period_end ?? ""),
    default_limit_seconds: Math.max(0, Math.floor(Number(o.default_limit_seconds) || 0)),
  };
}

export async function fetchLogosVoiceQuotaOverview(
  search?: string,
): Promise<LogosVoiceQuotaAdminOverview | null> {
  const { data, error } = await supabase.rpc("list_logos_voice_usage_budgets", {
    p_search: search?.trim() || null,
  });
  if (error) {
    console.error("list_logos_voice_usage_budgets", error.message);
    return null;
  }
  return parseOverview(data);
}

export async function updateProfileVoiceLimit(
  userId: string,
  limitSeconds: number | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .update({ voice_monthly_limit_seconds: limitSeconds })
    .eq("id", userId);
  return { error: error?.message ?? null };
}

export async function updateDefaultVoiceLimit(
  limitSeconds: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("elevenlabs_settings")
    .update({ voice_monthly_limit_seconds: limitSeconds })
    .eq("id", true);
  return { error: error?.message ?? null };
}

export async function syncVoiceUsageFromElevenLabs(
  userId?: string | null,
): Promise<{ ok: boolean; error: string | null; results?: unknown[] }> {
  const { data, error } = await supabase.functions.invoke("elevenlabs-knowledge", {
    body: {
      action: "sync_voice_usage",
      ...(userId ? { user_id: userId } : {}),
    },
  });
  if (error) return { ok: false, error: error.message };
  const payload = data as { ok?: boolean; error?: string; results?: unknown[] } | null;
  if (payload?.error) return { ok: false, error: payload.error };
  if (payload?.ok !== true) return { ok: false, error: "Sync quota vocal échouée" };
  return { ok: true, error: null, results: payload.results };
}

export function voiceBudgetFromAdminRow(row: LogosVoiceQuotaAdminRow): VoiceUsageBudget {
  return {
    period_start: "",
    period_end: "",
    used_seconds: row.used_seconds,
    limit_seconds: row.limit_seconds,
    remaining_seconds: row.remaining_seconds,
  };
}