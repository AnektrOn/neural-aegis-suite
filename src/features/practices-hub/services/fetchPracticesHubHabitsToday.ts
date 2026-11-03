import { supabase } from "@/integrations/supabase/client";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { pickLocalizedText } from "@/lib/content-i18n";
import type { Locale } from "@/i18n/translations";

export type PracticesHubHabitTodayItem = {
  id: string;
  name: string;
  completed: boolean;
};

export type PracticesHubHabitsToday = {
  done: number;
  total: number;
  /** Active habits not completed today (display order). */
  pending: PracticesHubHabitTodayItem[];
};

type AssignedRow = {
  id: string;
  habit_template_id: string | null;
  toolbox_assignment_id: string | null;
  is_active: boolean;
};

export async function fetchPracticesHubHabitsToday(
  userId: string,
  locale: Locale,
  dateKey: string,
): Promise<PracticesHubHabitsToday> {
  const { data: assignedRaw, error } = await supabase
    .from("assigned_habits")
    .select("id, habit_template_id, toolbox_assignment_id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    console.error("[PracticesHub] assigned_habits:", error.message);
    return { done: 0, total: 0, pending: [] };
  }

  const assigned = (assignedRaw ?? []) as AssignedRow[];
  if (assigned.length === 0) {
    return { done: 0, total: 0, pending: [] };
  }

  const { data: completionsRaw } = await supabase
    .from("habit_completions")
    .select("assigned_habit_id")
    .eq("user_id", userId)
    .eq("completed_date", dateKey);

  const completedIds = new Set(
    (completionsRaw ?? []).map((c) => c.assigned_habit_id as string),
  );

  const templateIds = [...new Set(assigned.map((a) => a.habit_template_id).filter(Boolean))] as string[];
  const toolboxIds = [...new Set(assigned.map((a) => a.toolbox_assignment_id).filter(Boolean))] as string[];

  const [templatesRes, toolboxRes] = await Promise.all([
    templateIds.length
      ? supabase.from("habit_templates").select("id, name, name_i18n").in("id", templateIds)
      : Promise.resolve({ data: [] as { id: string; name: string; name_i18n?: unknown }[] }),
    toolboxIds.length
      ? supabase
          .from("toolbox_assignments")
          .select("id, title, title_i18n, content_type")
          .in("id", toolboxIds)
      : Promise.resolve({ data: [] as { id: string; title: string; title_i18n?: unknown; content_type: string }[] }),
  ]);

  const templateMap = new Map((templatesRes.data ?? []).map((t) => [t.id, t]));
  const toolboxMap = new Map((toolboxRes.data ?? []).map((t) => [t.id, t]));

  const items: PracticesHubHabitTodayItem[] = assigned.map((a) => {
    let name = "—";
    if (a.toolbox_assignment_id) {
      const tb = toolboxMap.get(a.toolbox_assignment_id);
      name = tb ? pickCatalogTemplateDisplayTitle(locale, tb) : "—";
    } else if (a.habit_template_id) {
      const tpl = templateMap.get(a.habit_template_id);
      name = tpl
        ? pickLocalizedText(locale, tpl.name_i18n as Partial<Record<Locale, string>>, tpl.name)
        : "—";
    }
    return {
      id: a.id,
      name,
      completed: completedIds.has(a.id),
    };
  });

  const pending = items.filter((i) => !i.completed);
  const done = items.filter((i) => i.completed).length;

  return {
    done,
    total: items.length,
    pending,
  };
}
