import { supabase } from "@/integrations/supabase/client";

export type PlaceTagDefinition = {
  id: string;
  slug: string;
  label_fr: string;
  label_en: string;
  description: string | null;
  risk_level: number;
  sort_order: number;
  active: boolean;
  created_at: string;
};

export async function adminFetchPlaceTags(): Promise<PlaceTagDefinition[]> {
  try {
    const { data, error } = await supabase
      .from("place_tag_definitions")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("adminFetchPlaceTags:", error.message);
      return [];
    }
    return (data || []) as PlaceTagDefinition[];
  } catch (e) {
    console.error("adminFetchPlaceTags:", e);
    return [];
  }
}

export async function adminUpsertPlaceTag(row: {
  id?: string;
  slug: string;
  label_fr: string;
  label_en: string;
  description?: string | null;
  risk_level?: number;
  sort_order?: number;
  active?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (row.id) {
      const { error } = await supabase
        .from("place_tag_definitions")
        .update({
          slug: row.slug,
          label_fr: row.label_fr,
          label_en: row.label_en,
          description: row.description ?? null,
          risk_level: row.risk_level ?? 0,
          sort_order: row.sort_order ?? 0,
          active: row.active ?? true,
        })
        .eq("id", row.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    }
    const { error } = await supabase.from("place_tag_definitions").insert({
      slug: row.slug,
      label_fr: row.label_fr,
      label_en: row.label_en,
      description: row.description ?? null,
      risk_level: row.risk_level ?? 0,
      sort_order: row.sort_order ?? 0,
      active: row.active ?? true,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    console.error("adminUpsertPlaceTag:", e);
    return { ok: false, error: "unknown" };
  }
}

export async function adminDeletePlaceTag(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("place_tag_definitions").delete().eq("id", id);
    if (error) {
      console.error("adminDeletePlaceTag:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("adminDeletePlaceTag:", e);
    return false;
  }
}

export type AdminUserPlaceRow = {
  id: string;
  user_id: string;
  name: string;
  maps_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export async function adminFetchSharedPlaces(): Promise<AdminUserPlaceRow[]> {
  try {
    const { data, error } = await supabase
      .from("user_places")
      .select("id, user_id, name, maps_url, latitude, longitude, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("adminFetchSharedPlaces:", error.message);
      return [];
    }
    return (data || []) as AdminUserPlaceRow[];
  } catch (e) {
    console.error("adminFetchSharedPlaces:", e);
    return [];
  }
}
