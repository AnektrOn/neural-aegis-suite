import { supabase } from "@/integrations/supabase/client";
import { dailyVoicePaths } from "./dailyVoicePaths";
import {
  LOGOS_OPENING_PATH_COUNT,
  pickWeightedPaths,
  type LogosWeightedPathCandidate,
} from "./logosPathWeights";

export type LogosAvailablePath = LogosWeightedPathCandidate & {
  category: string;
  titleFr: string;
  titleEn: string;
  openingPrompt: string;
  firstMessage: string;
  expiresAt: string;
  daysUntilExpiry: number;
};

type ListRow = {
  id: string;
  batch_id: string;
  batch_created_at: string;
  category: string;
  title_fr: string;
  title_en: string;
  opening_prompt: string;
  first_message: string;
  expires_at: string;
  is_favorited: boolean;
  days_until_expiry: number | string;
};

function mapRow(row: ListRow): LogosAvailablePath {
  return {
    id: row.id,
    batchId: row.batch_id,
    batchCreatedAt: row.batch_created_at,
    category: row.category,
    titleFr: row.title_fr,
    titleEn: row.title_en,
    openingPrompt: row.opening_prompt,
    firstMessage: row.first_message,
    expiresAt: row.expires_at,
    isFavorited: Boolean(row.is_favorited),
    daysUntilExpiry: Number(row.days_until_expiry),
  };
}

export async function listAvailableLogosPaths(): Promise<LogosAvailablePath[]> {
  try {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return [];
    const { data: source, error: sourceError } = await supabase.from("voice_prompt_sources").select("drive_folder_id").eq("user_id", session.user.id).maybeSingle();
    if (sourceError) throw sourceError;
    if (source) {
      const { error: syncError } = await supabase.functions.invoke("sync-voice-prompts", { body: {} });
      if (syncError) console.error("Voice prompt sync failed", syncError);
    }
    const { data: batches, error: batchError } = await supabase.from("daily_voice_prompts").select("id,date,synced_at,prompts").eq("user_id", session.user.id).eq("date", new Date().toISOString().slice(0, 10));
    if (batchError) throw batchError;
    const personal = dailyVoicePaths(batches ?? []);
    const { data: used, error: usedError } = await supabase.from("voice_session_feedbacks").select("prompt_id").eq("user_id", session.user.id);
    if (usedError) throw usedError;
    const usedIds = new Set((used ?? []).map(row => row.prompt_id));
    const availablePersonal = personal.filter(path => path.daysUntilExpiry > 0 && !usedIds.has(path.id));
    if (personal.length) return availablePersonal;
    const { data, error } = await supabase.rpc("logos_list_available_paths");
    if (error) {
      console.error("listAvailableLogosPaths", error.message);
      throw new Error(error.message);
    }
    return ((data as ListRow[] | null) ?? []).map(mapRow);
  } catch (err) {
    console.error("listAvailableLogosPaths critical", err);
    throw err instanceof Error ? err : new Error("Failed to list LOGOS paths");
  }
}

export async function pickOpeningLogosPaths(
  count: number = LOGOS_OPENING_PATH_COUNT,
): Promise<LogosAvailablePath[]> {
  const available = await listAvailableLogosPaths();
  return pickWeightedPaths(available, count);
}

export async function consumeLogosPath(promptId: string): Promise<void> {
  // Daily prompts are consumed by the recorded session, not by the legacy UUID RPC.
  if (promptId.includes(":")) return;
  try {
    const { error } = await supabase.rpc("logos_consume_path", {
      p_prompt_id: promptId,
    });
    if (error) {
      console.error("consumeLogosPath", error.message);
      throw new Error(error.message);
    }
  } catch (err) {
    console.error("consumeLogosPath critical", err);
    throw err instanceof Error ? err : new Error("Failed to consume LOGOS path");
  }
}

export async function favoriteLogosPath(
  promptId: string,
  extendDays = 7,
): Promise<{ expiresAt: string }> {
  try {
    const { data, error } = await supabase.rpc("logos_favorite_path", {
      p_prompt_id: promptId,
      p_extend_days: extendDays,
    });
    if (error) {
      console.error("favoriteLogosPath", error.message);
      throw new Error(error.message);
    }
    const payload = data as { expires_at?: string } | null;
    return { expiresAt: payload?.expires_at ?? "" };
  } catch (err) {
    console.error("favoriteLogosPath critical", err);
    throw err instanceof Error ? err : new Error("Failed to favorite LOGOS path");
  }
}
