import { supabase } from "@/integrations/supabase/client";
import { isValidPrinciple } from "./pulsePrinciples";

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
    if (!isValidPrinciple(obj.principle as string)) {
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
    const explicitType =
      typeof obj.content_type === "string" ? obj.content_type.trim().toLowerCase() : "";
    const legacyUserType = typeof obj.user === "string" ? obj.user.trim().toLowerCase() : "";
    const knownContentTypes = new Set(["card", "note", "exercise", "course"]);
    const contentType =
      (explicitType && knownContentTypes.has(explicitType) && explicitType) ||
      (legacyUserType && knownContentTypes.has(legacyUserType) && legacyUserType) ||
      "card";

    cards.push({
      external_key: obj.external_key as string,
      principle: obj.principle as string,
      archetype_targets: archetypes,
      target_user_ids: targetUserIds,
      content_type: contentType,
      sort_order: (obj.sort_order as number) ?? 0,
      time_label: (obj.time_label as string) ?? "2 MIN",
      is_active: obj.is_active !== false,
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

export interface PulseUserOverviewRow {
  user_id: string;
  user_name: string;
  assimilated: number;
  ignored: number;
  completed: number;
  total_swipes: number;
  runes_unlocked: number;
  last_swipe_at: string | null;
}

export interface PulseUsersOverviewFilters {
  search?: string;
  activity?: "all" | "active" | "inactive";
  principleCode?: string | null;
  cardId?: string | null;
  minAssimilated?: number;
  minRunesUnlocked?: number;
  sort?: "last_activity_desc" | "assimilated_desc" | "runes_desc" | "name_asc";
  limit?: number;
  offset?: number;
}

export interface PulseUsersOverviewResult {
  users: PulseUserOverviewRow[];
  total: number;
  limit: number;
  offset: number;
  source?: "rpc" | "fallback";
  warning?: string;
}

async function fetchPulseUsersOverviewFallback(
  filters: PulseUsersOverviewFilters,
): Promise<PulseUsersOverviewResult> {
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;
  const principleCode = filters.principleCode?.trim() || null;
  const cardId = filters.cardId ?? null;
  const searchQ = filters.search?.trim().toLowerCase() || "";
  const activity = filters.activity ?? "all";
  const minAssimilated = filters.minAssimilated ?? 0;
  const minRunes = filters.minRunesUnlocked ?? 0;
  const sort = filters.sort ?? "last_activity_desc";

  const [profiles, swipeEntries] = await Promise.all([
    fetchProfileOptions(),
    fetchPulseSwipeLog(null, cardId),
  ]);

  const filteredSwipes = principleCode
    ? swipeEntries.filter((e) => e.principle_code === principleCode)
    : swipeEntries;

  type SwipeAgg = {
    assimilated: number;
    ignored: number;
    completed: number;
    total_swipes: number;
    last_swipe_at: string | null;
  };

  const swipeByUser = new Map<string, SwipeAgg>();
  for (const entry of filteredSwipes) {
    const agg = swipeByUser.get(entry.user_id) ?? {
      assimilated: 0,
      ignored: 0,
      completed: 0,
      total_swipes: 0,
      last_swipe_at: null,
    };
    if (entry.action === "assimilated") agg.assimilated += 1;
    else agg.ignored += 1;
    if (entry.completed_at) agg.completed += 1;
    agg.total_swipes += 1;
    if (!agg.last_swipe_at || entry.swiped_at > agg.last_swipe_at) {
      agg.last_swipe_at = entry.swiped_at;
    }
    swipeByUser.set(entry.user_id, agg);
  }

  const runeByUser = new Map<string, number>();
  const { data: runeRows, error: runeError } = await supabase
    .from("aegis_user_rune_progress" as never)
    .select(
      "user_id, pulses_count, unlocked_at, aegis_rune_principles!inner(pulses_to_unlock, is_active)" as never,
    );

  if (runeError) {
    console.error("fetchPulseUsersOverviewFallback runes:", runeError.message);
  } else {
    for (const row of (runeRows as {
      user_id: string;
      pulses_count: number | null;
      unlocked_at: string | null;
      aegis_rune_principles: { pulses_to_unlock: number; is_active: boolean } | null;
    }[]) ?? []) {
      const principle = row.aegis_rune_principles;
      if (!principle?.is_active) continue;
      const unlocked =
        row.unlocked_at != null ||
        (row.pulses_count ?? 0) >= (principle.pulses_to_unlock ?? 0);
      if (unlocked) {
        runeByUser.set(row.user_id, (runeByUser.get(row.user_id) ?? 0) + 1);
      }
    }
  }

  let rows: PulseUserOverviewRow[] = profiles.map((profile) => {
    const swipes = swipeByUser.get(profile.id);
    return {
      user_id: profile.id,
      user_name: profile.display_name?.trim() || profile.id,
      assimilated: swipes?.assimilated ?? 0,
      ignored: swipes?.ignored ?? 0,
      completed: swipes?.completed ?? 0,
      total_swipes: swipes?.total_swipes ?? 0,
      runes_unlocked: runeByUser.get(profile.id) ?? 0,
      last_swipe_at: swipes?.last_swipe_at ?? null,
    };
  });

  if (searchQ) {
    rows = rows.filter(
      (row) =>
        row.user_name.toLowerCase().includes(searchQ) ||
        row.user_id.toLowerCase().includes(searchQ),
    );
  }
  if (activity === "active") rows = rows.filter((row) => row.total_swipes > 0);
  if (activity === "inactive") rows = rows.filter((row) => row.total_swipes === 0);
  if (cardId) rows = rows.filter((row) => row.total_swipes > 0);
  rows = rows.filter(
    (row) => row.assimilated >= minAssimilated && row.runes_unlocked >= minRunes,
  );

  rows.sort((a, b) => {
    if (sort === "name_asc") return a.user_name.localeCompare(b.user_name);
    if (sort === "assimilated_desc") {
      return b.assimilated - a.assimilated || a.user_name.localeCompare(b.user_name);
    }
    if (sort === "runes_desc") {
      return b.runes_unlocked - a.runes_unlocked || a.user_name.localeCompare(b.user_name);
    }
    const aTime = a.last_swipe_at ?? "";
    const bTime = b.last_swipe_at ?? "";
    return bTime.localeCompare(aTime) || a.user_name.localeCompare(b.user_name);
  });

  const total = rows.length;
  return {
    users: rows.slice(offset, offset + limit),
    total,
    limit,
    offset,
    source: "fallback",
    warning:
      "Mode dégradé : historique limité aux 200 derniers swipes. Appliquez la migration get_pulse_admin_users_overview pour des stats complètes.",
  };
}

export async function fetchPulseUsersOverview(
  filters: PulseUsersOverviewFilters = {},
): Promise<PulseUsersOverviewResult> {
  const empty: PulseUsersOverviewResult = { users: [], total: 0, limit: 100, offset: 0 };
  try {
    const { data, error } = await supabase.rpc("get_pulse_admin_users_overview" as never, {
      p_search: filters.search?.trim() || null,
      p_activity: filters.activity ?? "all",
      p_principle_code: filters.principleCode?.trim() || null,
      p_card_id: filters.cardId ?? null,
      p_min_assimilated: filters.minAssimilated ?? 0,
      p_min_runes_unlocked: filters.minRunesUnlocked ?? 0,
      p_sort: filters.sort ?? "last_activity_desc",
      p_limit: filters.limit ?? 100,
      p_offset: filters.offset ?? 0,
    } as never);

    if (error) {
      console.error("get_pulse_admin_users_overview:", error.message);
      return fetchPulseUsersOverviewFallback(filters);
    }

    const result = data as {
      ok: boolean;
      error?: string;
      users?: PulseUserOverviewRow[];
      total?: number;
      limit?: number;
      offset?: number;
    } | null;

    if (!result?.ok) {
      console.error("get_pulse_admin_users_overview:", result?.error ?? "unknown");
      return fetchPulseUsersOverviewFallback(filters);
    }

    return {
      users: result.users ?? [],
      total: result.total ?? 0,
      limit: result.limit ?? 100,
      offset: result.offset ?? 0,
      source: "rpc",
    };
  } catch (err) {
    console.error("fetchPulseUsersOverview:", err);
    return fetchPulseUsersOverviewFallback(filters);
  }
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
