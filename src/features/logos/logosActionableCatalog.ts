import { supabase } from "@/integrations/supabase/client";
import { isLikelyVideoUrl } from "@/lib/video-links";
import { fetchPulseDeck } from "@/features/aegis-pulse/services/pulseService";
import type { Locale } from "@/i18n/translations";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";

export type LogosToolboxCandidate = {
  assignment_id: string;
  title: string;
  content_type: string;
  duration: string | null;
};

export type LogosPulseCandidate = {
  card_id: string;
  title: string;
  principle: string;
};

export type LogosActionableCatalog = {
  toolbox: LogosToolboxCandidate[];
  pulse: LogosPulseCandidate[];
};

function isLogosOpenableAssignment(row: {
  content_type: string;
  external_url: string | null;
  user_delivery_status?: string | null;
}): boolean {
  const status = row.user_delivery_status ?? "active";
  if (status === "waiting" || status === "inactive") return false;
  if (row.content_type === "external_link") return false;
  if (row.external_url && isLikelyVideoUrl(row.external_url)) return false;
  return true;
}

export async function fetchLogosActionableCatalog(
  userId: string,
  locale: Locale,
  limit = 5,
): Promise<LogosActionableCatalog> {
  const cap = Math.min(Math.max(limit, 1), 8);
  const { data: rows, error } = await supabase
    .from("toolbox_assignments")
    .select("id, title, title_i18n, content_type, duration, external_url, user_delivery_status")
    .eq("user_id", userId)
    .order("assigned_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("fetchLogosActionableCatalog toolbox", error.message);
  }

  const toolbox = (rows ?? [])
    .filter(isLogosOpenableAssignment)
    .slice(0, cap)
    .map((row) => ({
      assignment_id: row.id,
      title: pickCatalogTemplateDisplayTitle(locale, row),
      content_type: row.content_type,
      duration: row.duration,
    }));

  const pulseResult = await fetchPulseDeck(locale, cap);
  const pulse =
    pulseResult.ok === true
      ? pulseResult.cards.slice(0, cap).map((c) => ({
          card_id: c.id,
          title: c.title,
          principle: c.principleName,
        }))
      : [];

  return { toolbox, pulse };
}

export async function resolveToolboxAssignmentId(
  userId: string,
  assignmentId?: string,
  slug?: string,
): Promise<string | null> {
  if (assignmentId) {
    const { data } = await supabase
      .from("toolbox_assignments")
      .select("id, content_type, external_url, user_delivery_status")
      .eq("user_id", userId)
      .eq("id", assignmentId)
      .maybeSingle();
    if (data && isLogosOpenableAssignment(data)) return data.id;
    return null;
  }

  const needle = slug?.trim().toLowerCase();
  if (!needle) return null;

  const { data: rows } = await supabase
    .from("toolbox_assignments")
    .select("id, title, content_type, external_url, user_delivery_status")
    .eq("user_id", userId)
    .limit(200);

  const hit = (rows ?? []).find(
    (r) =>
      isLogosOpenableAssignment(r) &&
      (r.title.toLowerCase().includes(needle) || r.id === needle),
  );
  return hit?.id ?? null;
}
