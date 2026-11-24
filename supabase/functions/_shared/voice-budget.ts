// deno-lint-ignore no-explicit-any
type Admin = any;

export type VoiceUsageBudget = {
  period_start: string;
  period_end: string;
  used_seconds: number;
  limit_seconds: number;
  remaining_seconds: number;
};

const MIN_SESSION_SECONDS = 30;

function parseBudgetRow(data: unknown): VoiceUsageBudget | null {
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

export async function getVoiceUsageBudget(
  admin: Admin,
  userId: string,
): Promise<VoiceUsageBudget> {
  const { data, error } = await admin.rpc("get_voice_usage_budget", {
    p_user_id: userId,
  });
  if (error) {
    console.error("get_voice_usage_budget", error.message);
    throw new Error("Impossible de lire le quota vocal");
  }
  const parsed = parseBudgetRow(data);
  if (!parsed) throw new Error("Quota vocal invalide");
  return parsed;
}

export async function assertVoiceBudgetAllowsSession(
  admin: Admin,
  userId: string,
): Promise<VoiceUsageBudget> {
  const budget = await getVoiceUsageBudget(admin, userId);
  if (budget.remaining_seconds < MIN_SESSION_SECONDS) {
    const err = new Error(
      "Quota vocal du mois épuisé. Réessayez le mois prochain ou contacte le support.",
    );
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return budget;
}