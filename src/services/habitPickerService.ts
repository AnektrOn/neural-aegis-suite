import { supabase } from "@/integrations/supabase/client";

export interface HabitCatalogTemplate {
  id: string;
  name: string;
  name_i18n: unknown;
  category: string;
  description: string | null;
  description_i18n: unknown;
  archetype_targets: string[];
}

type RpcResult = { ok: boolean; error?: string };

function matchesArchetype(targets: string[], userArchetypes: string[]): boolean {
  if (!targets.length) return true;
  if (!userArchetypes.length) return true;
  return targets.some((t) => userArchetypes.includes(t));
}

export async function fetchUserArchetypes(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("analysis_results" as never)
      .select("top_archetypes")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("fetchUserArchetypes:", error.message);
      return [];
    }
    return ((data as { top_archetypes?: string[] } | null)?.top_archetypes ?? []) as string[];
  } catch (err) {
    console.error("fetchUserArchetypes:", err);
    return [];
  }
}

export async function fetchHabitCatalog(userArchetypes: string[]): Promise<HabitCatalogTemplate[]> {
  try {
    const { data, error } = await supabase
      .from("habit_templates" as never)
      .select("id, name, name_i18n, category, description, description_i18n, archetype_targets")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) {
      console.error("fetchHabitCatalog:", error.message);
      return [];
    }
    return ((data as HabitCatalogTemplate[]) ?? []).filter((row) =>
      matchesArchetype(row.archetype_targets ?? [], userArchetypes),
    );
  } catch (err) {
    console.error("fetchHabitCatalog:", err);
    return [];
  }
}

export async function addHabitToTracker(templateId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("add_habit_template_to_tracker" as never, {
      p_template_id: templateId,
    } as never);
    if (error) {
      console.error("addHabitToTracker:", error.message);
      return { ok: false, error: error.message };
    }
    const res = data as RpcResult;
    if (!res?.ok) return { ok: false, error: res?.error ?? "unknown" };
    return { ok: true };
  } catch (err) {
    console.error("addHabitToTracker:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function removeHabitFromTracker(assignmentId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("remove_habit_from_tracker" as never, {
      p_assignment_id: assignmentId,
    } as never);
    if (error) {
      console.error("removeHabitFromTracker:", error.message);
      return { ok: false, error: error.message };
    }
    const res = data as RpcResult;
    if (!res?.ok) return { ok: false, error: res?.error ?? "unknown" };
    return { ok: true };
  } catch (err) {
    console.error("removeHabitFromTracker:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
