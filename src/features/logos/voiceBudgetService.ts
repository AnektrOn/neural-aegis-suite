import { supabase } from "@/integrations/supabase/client";

export type VoiceUsageBudget = {
  period_start: string;
  period_end: string;
  used_seconds: number;
  limit_seconds: number;
  remaining_seconds: number;
};

function parseBudget(data: unknown): VoiceUsageBudget | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const limit = Number(o.limit_seconds);
  const used = Number(o.used_seconds);
  const remaining = Number(o.remaining_seconds);
  if (!Number.isFinite(limit) || !Number.isFinite(used) || !Number.isFinite(remaining)) {
    return null;
  }
  return {
    period_start: String(o.period_start ?? ""),
    period_end: String(o.period_end ?? ""),
    used_seconds: Math.max(0, Math.floor(used)),
    limit_seconds: Math.max(0, Math.floor(limit)),
    remaining_seconds: Math.max(0, Math.floor(remaining)),
  };
}

export async function fetchVoiceUsageBudget(userId: string): Promise<VoiceUsageBudget | null> {
  try {
    const { data, error } = await supabase.rpc("get_voice_usage_budget", {
      p_user_id: userId,
    });
    if (error) {
      console.error("fetchVoiceUsageBudget", error.message);
      return null;
    }
    return parseBudget(data);
  } catch (err) {
    console.error("fetchVoiceUsageBudget", err);
    return null;
  }
}