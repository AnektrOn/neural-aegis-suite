import { supabase } from "@/integrations/supabase/client";
import { pickCatalogTemplateDisplayTitle, pickCatalogTemplateDescription } from "@/lib/catalog-i18n";
import type { Locale } from "@/i18n/translations";

export type PracticesHubToolboxFeatured = {
  id: string;
  title: string;
  description: string;
  contentType: string;
} | null;

const TERMINAL_STATUSES = new Set(["completed", "abandoned", "ignored"]);

function isAssignmentPending(
  userDeliveryStatus: string | null | undefined,
  completionStatus: string | undefined,
): boolean {
  if (userDeliveryStatus === "waiting") return true;
  if (!completionStatus) return true;
  return !TERMINAL_STATUSES.has(completionStatus);
}

export async function fetchPracticesHubToolboxFeatured(
  userId: string,
  locale: Locale,
): Promise<PracticesHubToolboxFeatured> {
  const [assignmentsRes, completionsRes] = await Promise.all([
    supabase
      .from("toolbox_assignments")
      .select(
        "id, title, title_i18n, description, description_i18n, content_type, user_delivery_status, assigned_at",
      )
      .eq("user_id", userId)
      .neq("user_delivery_status", "inactive")
      .order("assigned_at", { ascending: true }),
    supabase.from("toolbox_completions").select("assignment_id, status").eq("user_id", userId),
  ]);

  if (assignmentsRes.error) {
    console.error("[PracticesHub] toolbox_assignments:", assignmentsRes.error.message);
    return null;
  }

  const completionByAssignment = new Map<string, string>();
  for (const row of completionsRes.data ?? []) {
    completionByAssignment.set(row.assignment_id, row.status);
  }

  for (const row of assignmentsRes.data ?? []) {
    const status = completionByAssignment.get(row.id);
    if (!isAssignmentPending(row.user_delivery_status, status)) continue;

    const title = pickCatalogTemplateDisplayTitle(locale, row);
    const description = pickCatalogTemplateDescription(locale, row);
    const brief =
      description.length > 160 ? `${description.slice(0, 159).trimEnd()}…` : description;

    return {
      id: row.id,
      title,
      description: brief,
      contentType: row.content_type as string,
    };
  }

  return null;
}
