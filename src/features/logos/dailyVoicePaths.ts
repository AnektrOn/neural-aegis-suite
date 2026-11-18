import type { LogosAvailablePath } from "./logosPathService";

export function dailyVoicePaths(batches: Array<{ id: string; date: string; synced_at: string; prompts: unknown }>): LogosAvailablePath[] {
  return batches.flatMap((batch) => {
    const payload = batch.prompts as { prompts?: unknown[] } | null;
    const prompts = Array.isArray(batch.prompts) ? batch.prompts : payload?.prompts;
    if (!Array.isArray(prompts)) return [];
    return prompts.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const p = value as Record<string, unknown>;
      const opening = p.agent_mandate ?? p.opening_prompt ?? p.openingPrompt ?? p.prompt;
      const title = p.title_fr ?? p.title ?? p.titleFr;
      const id = typeof p.id === "string" ? p.id : typeof p.slot_index === "number" ? `${batch.id}:${p.slot_index}` : null;
      if (!id || typeof opening !== "string" || !opening.trim() || typeof title !== "string") return [];
      const expiresAt = typeof p.expires_at === "string" ? p.expires_at : `${batch.date}T23:59:59.999Z`;
      return [{ id, batchId: batch.id, batchCreatedAt: batch.synced_at,
        category: typeof p.category_slug === "string" ? p.category_slug : typeof p.category === "string" ? p.category : "daily",
        titleFr: title, titleEn: typeof p.title_en === "string" ? p.title_en : title,
        openingPrompt: opening, firstMessage: typeof p.first_message_agent === "string" ? p.first_message_agent : typeof p.first_message === "string" ? p.first_message : opening,
        expiresAt, isFavorited: false, daysUntilExpiry: (Date.parse(expiresAt) - Date.now()) / 86400000,
      }];
    });
  });
}