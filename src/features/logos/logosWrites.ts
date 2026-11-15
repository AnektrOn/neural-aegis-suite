import { supabase } from "@/integrations/supabase/client";

export async function logosWriteMoodEntry(
  userId: string,
  params: { value: number; sleep?: number; stress?: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const value = Math.round(params.value);
  if (value < 1 || value > 10) return { ok: false, error: "value must be 1-10" };
  const { error } = await supabase.from("mood_entries" as never).insert({
    user_id: userId,
    value,
    sleep: params.sleep ?? null,
    stress: params.stress ?? null,
    meals_count: 0,
    meals: [],
  } as never);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logosWriteJournalEntry(
  userId: string,
  params: { title: string; content: string; tags?: string[] },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const title = params.title?.trim();
  const content = params.content?.trim();
  if (!title || !content) return { ok: false, error: "title and content required" };
  const { error } = await supabase.from("journal_entries").insert({
    user_id: userId,
    title,
    content,
    tags: params.tags ?? [],
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logosWriteDecision(
  userId: string,
  params: { name: string; priority?: number; responsibility?: number },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = params.name?.trim();
  if (!name) return { ok: false, error: "name required" };
  const priority = Math.min(10, Math.max(1, Math.round(params.priority ?? 5)));
  const responsibility = Math.min(10, Math.max(1, Math.round(params.responsibility ?? 5)));
  const { error } = await supabase.from("decisions").insert({
    user_id: userId,
    name,
    priority,
    responsibility,
  } as never);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logosResolveContactId(
  userId: string,
  contactId?: string,
  contactName?: string,
): Promise<string | null> {
  if (contactId) {
    const { data } = await supabase
      .from("people_contacts")
      .select("id")
      .eq("user_id", userId)
      .eq("id", contactId)
      .maybeSingle();
    return data?.id ?? null;
  }
  const name = contactName?.trim().toLowerCase();
  if (!name) return null;
  const { data: rows } = await supabase
    .from("people_contacts")
    .select("id, name")
    .eq("user_id", userId)
    .limit(100);
  const hit = (rows ?? []).find((r) => r.name?.toLowerCase().includes(name));
  return hit?.id ?? null;
}

export async function logosWriteRelationNote(
  userId: string,
  params: {
    contact_id?: string;
    contact_name?: string;
    quality?: number;
    note?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const contactId = await logosResolveContactId(userId, params.contact_id, params.contact_name);
  if (!contactId) return { ok: false, error: "contact not found" };
  const quality =
    params.quality !== undefined
      ? Math.min(10, Math.max(1, Math.round(params.quality)))
      : undefined;

  if (quality !== undefined || params.note?.trim()) {
    const { error: histErr } = await supabase.from("relation_quality_history").insert({
      user_id: userId,
      contact_id: contactId,
      quality: quality ?? null,
      note: params.note?.trim() || null,
    } as never);
    if (histErr) return { ok: false, error: histErr.message };
  }

  if (quality !== undefined) {
    const { error: upErr } = await supabase
      .from("people_contacts")
      .update({ quality } as never)
      .eq("id", contactId)
      .eq("user_id", userId);
    if (upErr) return { ok: false, error: upErr.message };
  }

  return { ok: true };
}
