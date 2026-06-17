import { supabase } from "@/integrations/supabase/client";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { pickLocalizedText } from "@/lib/content-i18n";
import type { Locale } from "@/i18n/translations";

export interface AssignedHabitDisplayRow {
  id: string;
  habit_template_id: string | null;
  toolbox_assignment_id: string | null;
}

export interface ResolvedAssignedHabit {
  id: string;
  name: string;
  category: string;
}

interface HabitTemplateRow {
  id: string;
  name: string;
  name_i18n?: unknown;
  category: string | null;
}

interface ToolboxAssignmentTitleRow {
  id: string;
  title: string;
  title_i18n?: unknown;
}

export async function resolveAssignedHabitDisplays(
  rows: AssignedHabitDisplayRow[],
  userId: string,
  locale: Locale,
  toolboxCategoryLabel: string,
): Promise<ResolvedAssignedHabit[]> {
  if (rows.length === 0) return [];

  const templateIds = [
    ...new Set(rows.map((r) => r.habit_template_id).filter(Boolean)),
  ] as string[];
  const toolboxIds = [
    ...new Set(rows.map((r) => r.toolbox_assignment_id).filter(Boolean)),
  ] as string[];

  const [templatesRes, toolboxRes] = await Promise.all([
    templateIds.length
      ? supabase
          .from("habit_templates" as never)
          .select("id, name, name_i18n, category")
          .in("id", templateIds)
      : Promise.resolve({ data: [] as HabitTemplateRow[], error: null }),
    toolboxIds.length
      ? supabase
          .from("toolbox_assignments" as never)
          .select("id, title, title_i18n")
          .eq("user_id", userId)
          .in("id", toolboxIds)
      : Promise.resolve({ data: [] as ToolboxAssignmentTitleRow[], error: null }),
  ]);

  const tplMap = new Map(
    ((templatesRes.data || []) as HabitTemplateRow[]).map((tpl) => [tpl.id, tpl]),
  );
  const toolboxMap = new Map(
    ((toolboxRes.data || []) as ToolboxAssignmentTitleRow[]).map((tb) => [tb.id, tb]),
  );

  return rows.map((row) => {
    if (row.toolbox_assignment_id) {
      const toolbox = toolboxMap.get(row.toolbox_assignment_id);
      return {
        id: row.id,
        name: toolbox
          ? pickCatalogTemplateDisplayTitle(locale, toolbox)
          : toolboxCategoryLabel,
        category: toolboxCategoryLabel,
      };
    }

    const tpl = row.habit_template_id ? tplMap.get(row.habit_template_id) : undefined;
    return {
      id: row.id,
      name: tpl ? pickLocalizedText(locale, tpl.name_i18n as never, tpl.name) : "—",
      category: tpl?.category ?? "",
    };
  });
}
