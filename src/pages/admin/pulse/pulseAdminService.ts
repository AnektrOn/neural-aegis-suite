import { supabase } from "@/integrations/supabase/client";

export interface PulseCardRow {
  id: string;
  external_key: string | null;
  principle_id: string;
  principle_code?: string;
  principle_name?: string;
  title_i18n: Record<string, string>;
  problem_i18n: Record<string, string>;
  bullets_i18n: Record<string, string[]>;
  format_i18n: Record<string, string>;
  course_content_i18n: Record<string, { hook?: string; concept?: string; action?: string }>;
  archetype_targets: string[];
  target_user_ids: string[];
  content_type: string;
  time_label: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface PulseCardImportPayload {
  external_key: string;
  principle: string;
  archetype_targets: string[];
  target_user_ids: string[];
  content_type: string;
  sort_order: number;
  time_label: string;
  is_active: boolean;
  title: Record<string, string>;
  format: Record<string, string>;
  problem: Record<string, string>;
  bullets: Record<string, string[]>;
  course_content: Record<string, { hook?: string; concept?: string; action?: string }>;
}

export interface ImportPreview {
  total: number;
  valid: number;
  errors: string[];
  cards: PulseCardImportPayload[];
}

const VALID_PRINCIPLES = [
  "MENTALISM", "CORRESPONDENCE", "VIBRATION",
  "POLARITY", "RHYTHM", "CAUSE_EFFECT", "GENDER",
];

const VALID_ARCHETYPES = [
  "sage", "warrior", "lover", "sovereign", "magician", "healer",
  "creator", "rebel", "caregiver", "explorer", "mystic", "jester",
];

export async function listPulseCards(): Promise<PulseCardRow[]> {
  const { data, error } = await supabase
    .from("aegis_synapse_cards" as never)
    .select("*, aegis_rune_principles!inner(code, name_i18n)" as never)
    .order("sort_order" as never, { ascending: true });

  if (error) {
    console.error("listPulseCards:", error.message);
    return [];
  }

  return ((data as never[]) ?? []).map((row: never) => {
    const r = row as Record<string, unknown>;
    const p = r.aegis_rune_principles as Record<string, unknown> | undefined;
    return {
      ...r,
      principle_code: p?.code as string,
      principle_name: ((p?.name_i18n as Record<string, string>) ?? {}).fr ?? "",
    } as PulseCardRow;
  });
}

export function parseAndPreviewImport(jsonText: string): ImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { total: 0, valid: 0, errors: ["JSON invalide"], cards: [] };
  }

  const items = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>)?.cards;
  if (!Array.isArray(items)) {
    return { total: 0, valid: 0, errors: ["Le JSON doit être un tableau ou { cards: [...] }"], cards: [] };
  }

  const errors: string[] = [];
  const cards: PulseCardImportPayload[] = [];

  items.forEach((obj: Record<string, unknown>, idx: number) => {
    const label = (obj.external_key as string) || `[${idx}]`;

    if (!obj.external_key || typeof obj.external_key !== "string") {
      errors.push(`${label}: external_key manquant`);
      return;
    }
    if (!VALID_PRINCIPLES.includes(obj.principle as string)) {
      errors.push(`${label}: principle invalide`);
      return;
    }

    const title = obj.title as Record<string, string> | undefined;
    const problem = obj.problem as Record<string, string> | undefined;
    const format = obj.format as Record<string, string> | undefined;
    const bullets = obj.bullets as Record<string, string[]> | undefined;
    const course = obj.course_content as Record<string, { hook?: string; concept?: string; action?: string }> | undefined;

    if (!title?.fr || !title?.en) { errors.push(`${label}: title.fr/en manquant`); return; }
    if (!problem?.fr || !problem?.en) { errors.push(`${label}: problem.fr/en manquant`); return; }

    const archetypes = Array.isArray(obj.archetype_targets) ? obj.archetype_targets as string[] : [];
    for (const a of archetypes) {
      if (!VALID_ARCHETYPES.includes(a)) {
        errors.push(`${label}: archetype invalide '${a}'`);
        return;
      }
    }

    const userId = typeof obj.user_id === "string" ? obj.user_id.trim() : "";
    const targetUserIds = userId ? [userId] : (Array.isArray(obj.target_user_ids) ? obj.target_user_ids as string[] : []);
    const contentType = typeof obj.user === "string" ? obj.user : (typeof obj.content_type === "string" ? obj.content_type : "card");

    cards.push({
      external_key: obj.external_key as string,
      principle: obj.principle as string,
      archetype_targets: archetypes,
      target_user_ids: targetUserIds,
      content_type: contentType,
      sort_order: (obj.sort_order as number) ?? 0,
      time_label: (obj.time_label as string) ?? "2 MIN",
      is_active: true,
      title: title ?? { fr: "", en: "" },
      format: format ?? { fr: "MICRO-CONCEPT", en: "MICRO-CONCEPT" },
      problem: problem ?? { fr: "", en: "" },
      bullets: bullets ?? { fr: [], en: [] },
      course_content: course ?? {},
    });
  });

  return { total: items.length, valid: cards.length, errors, cards };
}

export async function runPulseImport(
  cards: PulseCardImportPayload[],
): Promise<{ ok: boolean; inserted: number; updated: number; errors: string[] }> {
  let inserted = 0;
  let updated = 0;
  const errors: string[] = [];

  const { data: principles } = await supabase
    .from("aegis_rune_principles" as never)
    .select("id, code" as never);

  const principleMap = new Map<string, string>();
  for (const p of (principles as { id: string; code: string }[]) ?? []) {
    principleMap.set(p.code, p.id);
  }

  for (const card of cards) {
    const principleId = principleMap.get(card.principle);
    if (!principleId) {
      errors.push(`${card.external_key}: principe '${card.principle}' introuvable`);
      continue;
    }

    const payload = {
      principle_id: principleId,
      external_key: card.external_key,
      title_i18n: card.title,
      problem_i18n: card.problem,
      bullets_i18n: card.bullets,
      format_i18n: card.format,
      course_content_i18n: card.course_content,
      time_label: card.time_label,
      archetype_targets: card.archetype_targets,
      target_user_ids: card.target_user_ids,
      content_type: card.content_type,
      is_active: card.is_active,
      sort_order: card.sort_order,
    };

    const { data: existing } = await supabase
      .from("aegis_synapse_cards" as never)
      .select("id" as never)
      .eq("external_key" as never, card.external_key as never)
      .maybeSingle();

    if ((existing as { id: string } | null)?.id) {
      const { error } = await supabase
        .from("aegis_synapse_cards" as never)
        .update(payload as never)
        .eq("id" as never, (existing as { id: string }).id as never);

      if (error) errors.push(`${card.external_key}: update échoué — ${error.message}`);
      else updated++;
    } else {
      const { error } = await supabase
        .from("aegis_synapse_cards" as never)
        .insert(payload as never);

      if (error) errors.push(`${card.external_key}: insert échoué — ${error.message}`);
      else inserted++;
    }
  }

  return { ok: errors.length === 0, inserted, updated, errors };
}

export async function toggleCardActive(cardId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("aegis_synapse_cards" as never)
    .update({ is_active: isActive } as never)
    .eq("id" as never, cardId as never);

  if (error) {
    console.error("toggleCardActive:", error.message);
    return false;
  }
  return true;
}

export type DriveFileEntry = { fileName: string; content: string; format: string };

export type DriveResult =
  | { mode: "file"; fileName: string; content: string; format: string }
  | { mode: "folder"; folderFileCount: number; files: DriveFileEntry[] };

export async function fetchFromDrive(driveUrl: string): Promise<DriveResult> {
  const { data, error } = await supabase.functions.invoke("read-drive-json", {
    body: { url: driveUrl },
  });

  if (error) throw new Error(error.message ?? "Drive fetch failed");
  if (data?.error) throw new Error(data.error);
  return data as DriveResult;
}

export interface PulseCardSwipeStats {
  card_id: string;
  external_key: string | null;
  yes_count: number;
  no_count: number;
  total_swipes: number;
}

export async function fetchPulseCardStats(): Promise<Map<string, PulseCardSwipeStats>> {
  try {
    const { data, error } = await supabase.rpc("get_pulse_admin_card_stats" as never);

    if (error) {
      console.error("get_pulse_admin_card_stats:", error.message);
      return new Map();
    }

    const result = data as { ok: boolean; stats?: PulseCardSwipeStats[] } | null;
    if (!result?.ok) return new Map();

    const map = new Map<string, PulseCardSwipeStats>();
    for (const s of result.stats ?? []) {
      map.set(s.card_id, s);
    }
    return map;
  } catch {
    return new Map();
  }
}

export interface ProfileOption {
  id: string;
  display_name: string | null;
}

export async function fetchProfileOptions(): Promise<ProfileOption[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name")
    .order("display_name", { ascending: true })
    .limit(1000);

  if (error) {
    console.error("fetchProfileOptions:", error.message);
    return [];
  }
  return (data ?? []) as ProfileOption[];
}

export interface PulseSwipeLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  card_id: string;
  external_key: string | null;
  card_title: string;
  principle_code: string;
  principle_name: string;
  action: "assimilated" | "ignored";
  swiped_at: string;
  completed_at: string | null;
}

export interface UserRuneProgress {
  principle_code: string;
  principle_name: string;
  pulses_to_unlock: number;
  pulses_count: number;
  total_cards: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

export async function fetchPulseSwipeLog(
  userId?: string | null,
  cardId?: string | null,
): Promise<PulseSwipeLogEntry[]> {
  try {
    const { data, error } = await supabase.rpc("get_pulse_admin_swipe_log" as never, {
      p_user_id: userId ?? null,
      p_card_id: cardId ?? null,
      p_limit: 200,
    } as never);

    if (error) {
      console.error("get_pulse_admin_swipe_log:", error.message);
      return [];
    }

    const result = data as { ok: boolean; entries?: PulseSwipeLogEntry[] } | null;
    return result?.ok ? (result.entries ?? []) : [];
  } catch {
    return [];
  }
}

export async function fetchUserRuneProgress(userId: string): Promise<{
  runes: UserRuneProgress[];
  swipes: { assimilated: number; ignored: number; completed: number; total: number };
} | null> {
  try {
    const { data, error } = await supabase.rpc("get_pulse_admin_user_runes" as never, {
      p_user_id: userId,
    } as never);

    if (error) {
      console.error("get_pulse_admin_user_runes:", error.message);
      return null;
    }

    const result = data as {
      ok: boolean;
      runes?: UserRuneProgress[];
      swipes?: { assimilated: number; ignored: number; completed: number; total: number };
    } | null;

    if (!result?.ok) return null;
    return {
      runes: result.runes ?? [],
      swipes: result.swipes ?? { assimilated: 0, ignored: 0, completed: 0, total: 0 },
    };
  } catch {
    return null;
  }
}

export async function activateAllDrafts(): Promise<number> {
  const { data, error } = await supabase
    .from("aegis_synapse_cards" as never)
    .update({ is_active: true } as never)
    .eq("is_active" as never, false as never)
    .select("id" as never);

  if (error) {
    console.error("activateAllDrafts:", error.message);
    return 0;
  }
  return (data as unknown[])?.length ?? 0;
}

export async function bulkActivateCards(cardIds: string[]): Promise<number> {
  if (cardIds.length === 0) return 0;
  const { data, error } = await supabase
    .from("aegis_synapse_cards" as never)
    .update({ is_active: true } as never)
    .in("id" as never, cardIds as never)
    .select("id" as never);

  if (error) {
    console.error("bulkActivateCards:", error.message);
    return 0;
  }
  return (data as unknown[])?.length ?? 0;
}

export async function bulkClearUserAssignment(cardIds: string[]): Promise<number> {
  if (cardIds.length === 0) return 0;
  const { data, error } = await supabase
    .from("aegis_synapse_cards" as never)
    .update({ target_user_ids: [] } as never)
    .in("id" as never, cardIds as never)
    .select("id" as never);

  if (error) {
    console.error("bulkClearUserAssignment:", error.message);
    return 0;
  }
  return (data as unknown[])?.length ?? 0;
}
export async function bulkAssignUsers(cardIds: string[], userIds: string[]): Promise<number> {
  if (cardIds.length === 0) return 0;
  const { data, error } = await supabase
    .from("aegis_synapse_cards" as never)
    .update({ target_user_ids: userIds } as never)
    .in("id" as never, cardIds as never)
    .select("id" as never);

  if (error) {
    console.error("bulkAssignUsers:", error.message);
    return 0;
  }
  return (data as unknown[])?.length ?? 0;
}

export async function deleteCard(cardId: string): Promise<boolean> {
  const { error } = await supabase
    .from("aegis_synapse_cards" as never)
    .delete()
    .eq("id" as never, cardId as never);

  if (error) {
    console.error("deleteCard:", error.message);
    return false;
  }
  return true;
}
