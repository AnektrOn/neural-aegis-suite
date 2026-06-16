import { supabase } from "@/integrations/supabase/client";
import type { PolePartId, TaoPortraitPartRow, WuXingPole } from "../domain/types";
import { POLE_PART_ORDER } from "../domain/types";

export async function loadTaoPortraitParts(
  userId: string,
  pole?: WuXingPole,
): Promise<TaoPortraitPartRow[]> {
  let query = supabase
    .from("user_tao_portrait_parts" as any)
    .select("id, user_id, pole, part_id, content_md, updated_at, created_at")
    .eq("user_id", userId);

  if (pole) {
    query = query.eq("pole", pole);
  }

  const { data, error } = await query.order("pole").order("part_id");
  if (error) throw error;
  return (data ?? []) as unknown as TaoPortraitPartRow[];
}

export async function loadTaoPortraitPart(
  userId: string,
  pole: WuXingPole,
  partId: PolePartId,
): Promise<TaoPortraitPartRow | null> {
  const { data, error } = await supabase
    .from("user_tao_portrait_parts" as any)
    .select("id, user_id, pole, part_id, content_md, updated_at, created_at")
    .eq("user_id", userId)
    .eq("pole", pole)
    .eq("part_id", partId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as TaoPortraitPartRow | null) ?? null;
}

export async function upsertTaoPortraitPart(
  userId: string,
  pole: WuXingPole,
  partId: PolePartId,
  contentMd: string,
): Promise<TaoPortraitPartRow> {
  const { data, error } = await supabase
    .from("user_tao_portrait_parts" as any)
    .upsert(
      {
        user_id: userId,
        pole,
        part_id: partId,
        content_md: contentMd,
      },
      { onConflict: "user_id,pole,part_id" },
    )
    .select("id, user_id, pole, part_id, content_md, updated_at, created_at")
    .single();

  if (error) throw error;
  return data as unknown as TaoPortraitPartRow;
}

export function partsByPole(
  rows: TaoPortraitPartRow[],
  pole: WuXingPole,
): Partial<Record<PolePartId, TaoPortraitPartRow>> {
  const map: Partial<Record<PolePartId, TaoPortraitPartRow>> = {};
  for (const row of rows) {
    if (row.pole === pole) {
      map[row.part_id as PolePartId] = row;
    }
  }
  return map;
}

export function countFilledParts(rows: TaoPortraitPartRow[], pole: WuXingPole): number {
  return POLE_PART_ORDER.filter((partId) => {
    const row = rows.find((r) => r.pole === pole && r.part_id === partId);
    return Boolean(row?.content_md?.trim());
  }).length;
}

export function hasTransversalT2(rows: TaoPortraitPartRow[]): boolean {
  return Boolean(
    rows.find((r) => r.pole === "transversal" && r.part_id === "T2_SYNTHESIS")?.content_md?.trim(),
  );
}
