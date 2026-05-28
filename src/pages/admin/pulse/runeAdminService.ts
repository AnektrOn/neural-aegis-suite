import { supabase } from "@/integrations/supabase/client";

export interface RuneCollectionRow {
  id: string;
  code: string;
  name_i18n: Record<string, string>;
  description_i18n: Record<string, string>;
  icon_key: string;
  sort_order: number;
  is_active: boolean;
  rune_count?: number;
}

export interface RunePrincipleRow {
  id: string;
  code: string;
  collection_id: string | null;
  collection_code?: string;
  name_i18n: Record<string, string>;
  quote_i18n: Record<string, string>;
  description_i18n: Record<string, string>;
  icon_key: string;
  glyph_svg: string | null;
  bg_class: string;
  text_class: string;
  sort_order: number;
  pulses_to_unlock: number;
  is_active: boolean;
  card_count?: number;
}

export async function listRuneCollections(): Promise<RuneCollectionRow[]> {
  const { data, error } = await supabase
    .from("aegis_rune_collections" as never)
    .select("*" as never)
    .order("sort_order" as never, { ascending: true });

  if (error) {
    console.error("listRuneCollections:", error.message);
    return [];
  }
  return (data ?? []) as RuneCollectionRow[];
}

export async function listRunePrinciples(): Promise<RunePrincipleRow[]> {
  const { data, error } = await supabase
    .from("aegis_rune_principles" as never)
    .select("*, aegis_rune_collections(code)" as never)
    .order("sort_order" as never, { ascending: true });

  if (error) {
    console.error("listRunePrinciples:", error.message);
    return [];
  }

  return ((data as never[]) ?? []).map((row: never) => {
    const r = row as Record<string, unknown>;
    const coll = r.aegis_rune_collections as Record<string, unknown> | null;
    return {
      ...r,
      collection_code: coll?.code as string | undefined,
    } as RunePrincipleRow;
  });
}

export async function upsertCollection(
  row: Partial<RuneCollectionRow> & { code: string },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("aegis_rune_collections" as never)
    .upsert(row as never, { onConflict: "code" as never });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function upsertRune(
  row: Partial<RunePrincipleRow> & { code: string },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("aegis_rune_principles" as never)
    .upsert(row as never, { onConflict: "code" as never });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function toggleRuneActive(
  runeId: string,
  isActive: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from("aegis_rune_principles" as never)
    .update({ is_active: isActive } as never)
    .eq("id" as never, runeId as never);

  if (error) {
    console.error("toggleRuneActive:", error.message);
    return false;
  }
  return true;
}

export async function toggleCollectionActive(
  collId: string,
  isActive: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from("aegis_rune_collections" as never)
    .update({ is_active: isActive } as never)
    .eq("id" as never, collId as never);

  if (error) {
    console.error("toggleCollectionActive:", error.message);
    return false;
  }
  return true;
}

export async function deleteRune(runeId: string): Promise<boolean> {
  const { error } = await supabase
    .from("aegis_rune_principles" as never)
    .delete()
    .eq("id" as never, runeId as never);

  if (error) {
    console.error("deleteRune:", error.message);
    return false;
  }
  return true;
}

export async function deleteCollection(collId: string): Promise<boolean> {
  const { error } = await supabase
    .from("aegis_rune_collections" as never)
    .delete()
    .eq("id" as never, collId as never);

  if (error) {
    console.error("deleteCollection:", error.message);
    return false;
  }
  return true;
}
