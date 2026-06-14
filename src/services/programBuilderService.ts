import { supabase } from "@/integrations/supabase/client";
import { isLikelyVideoUrl } from "@/lib/video-links";
import { bilingualPair } from "@/lib/content-i18n";
import { hydrateToolboxWidgetConfigForPersistence } from "@/lib/toolbox-widget-config-hydrate";
import {
  assertToolboxDescriptionEnglishIfPresent,
  assertToolboxTitleEnglishDistinct,
  dedupeToolboxTextI18n,
  finalizeToolboxTemplateI18nChunks,
} from "@/lib/toolbox-template-bilingual";
import { lookupCatalogFrToEn } from "@/lib/toolbox-widget-i18n";
import { getBuiltinToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";

export function isKnownToolboxContentType(contentType: string): boolean {
  if (!contentType?.trim()) return false;
  if ((TOOLBOX_CONTENT_TYPES as readonly string[]).includes(contentType)) return true;
  return getBuiltinToolboxContentTypeDefinition(contentType) != null;
}

export const TOOLBOX_CONTENT_TYPES = [
  "breathwork",
  "focus_introspectif",
  "body_scan",
  "visualization",
  "stop_protocol",
  "intention",
  "affirmations",
  "gratitude",
  "journal_prompt",
  "external_link",
  "micro_practice",
] as const;

export type ToolboxContentType = (typeof TOOLBOX_CONTENT_TYPES)[number];

export const TOOLBOX_USER_DELIVERY_STATUSES = [
  "assigned",
  "waiting",
  "active",
  "inactive",
] as const;

export type ToolboxUserDeliveryStatus = (typeof TOOLBOX_USER_DELIVERY_STATUSES)[number];

export interface CatalogTaggable {
  archetype_targets?: string[];
  shadow_targets?: string[];
}

export interface HabitTemplateInput extends CatalogTaggable {
  external_key?: string | null;
  name: string;
  name_i18n?: Record<string, string> | null;
  category: string;
  description?: string | null;
  description_i18n?: Record<string, string> | null;
  is_active?: boolean;
}

export interface ToolboxTemplateInput extends CatalogTaggable {
  external_key?: string | null;
  content_type: ToolboxContentType;
  title: string;
  title_i18n?: Record<string, string> | null;
  duration?: string | null;
  description?: string | null;
  description_i18n?: Record<string, string> | null;
  external_url?: string | null;
  widget_config?: Record<string, unknown> | null;
  is_active?: boolean;
}

export interface JournalPromptTemplateInput extends CatalogTaggable {
  external_key?: string | null;
  title: string;
  title_i18n?: Record<string, string> | null;
  prompt_text: string;
  prompt_text_i18n?: Record<string, string> | null;
  duration?: string | null;
  is_active?: boolean;
}

export type ProgramEntityType =
  | "habit_template"
  | "toolbox_template"
  | "journal_prompt_template"
  | "habit_assignment"
  | "toolbox_assignment"
  | "journal_prompt"
  | "import_run";

export interface ProgramEventInput {
  actor_id: string;
  user_id?: string | null;
  entity_type: ProgramEntityType;
  entity_id?: string | null;
  event_type: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

/**
 * Format JSON d'import simplifié.
 *
 * version: "toolbox-catalog-v1"
 *
 * Crée des gabarits catalogue (toolbox / routines / journal) et peut assigner
 * les toolbox_items aux utilisateurs via `default_user_ids`, `user_ids` ou `assignments`.
 *
 * Chaque item dans toolbox_items correspond à un futur widget assignable.
 * Chaque item dans habit_items correspond à une routine réutilisable.
 * Chaque item dans journal_items correspond à un prompt journal réutilisable.
 *
 * Assignation utilisateur (toolbox_items) :
 * - `default_user_ids` / `default_assignment_status` au niveau racine
 * - par item : `user_ids`, `assignment_status`, ou `assignments: [{ user_id, status? }]`
 * Statuts : assigned | waiting | active | inactive (synonymes FR : attribué, en_attente, inactif).
 */
export interface ToolboxCatalogImportPayload {
  version: "toolbox-catalog-v1";
  /** Appliqué aux toolbox_items qui ne définissent pas `user_ids` ni `assignments`. */
  default_user_ids?: string[];
  default_assignment_status?: string;
  toolbox_items?: Array<{
    external_key?: string;
    content_type: ToolboxContentType;
    title: string;
    title_fr?: string;
    title_en?: string;
    title_i18n?: Record<string, string>;
    duration?: string;
    description?: string;
    description_fr?: string;
    description_en?: string;
    description_i18n?: Record<string, string>;
    external_url?: string;
    widget_config: Record<string, unknown>;
    is_active?: boolean;
    /** Surcharge les `default_user_ids` pour cet item. */
    user_ids?: string[];
    /** Statut par défaut pour les utilisateurs listés dans `user_ids` (ou défaut racine). */
    assignment_status?: string;
    /** Liste explicite user + statut (prioritaire sur `user_ids`). */
    assignments?: Array<{ user_id: string; status?: string }>;
  }>;
  habit_items?: Array<{
    external_key?: string;
    name: string;
    name_fr?: string;
    name_en?: string;
    name_i18n?: Record<string, string>;
    category: string;
    description?: string;
    description_fr?: string;
    description_en?: string;
    description_i18n?: Record<string, string>;
    is_active?: boolean;
  }>;
  journal_items?: Array<{
    external_key?: string;
    title: string;
    title_fr?: string;
    title_en?: string;
    title_i18n?: Record<string, string>;
    prompt_text: string;
    prompt_fr?: string;
    prompt_en?: string;
    prompt_text_i18n?: Record<string, string>;
    duration?: string;
    is_active?: boolean;
  }>;
}

export interface ImportExecutionSummary {
  dryRun: boolean;
  createdToolboxTemplates: number;
  createdToolboxAssignments: number;
  createdHabitTemplates: number;
  createdJournalPromptTemplates: number;
  skippedDuplicates: number;
  skippedDuplicateToolboxAssignments: number;
  issues: ValidationIssue[];
}

function asArray(v?: string[]) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function normalizeKey(key?: string | null) {
  return (key || "").trim() || null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuidLike(id: string): boolean {
  return UUID_RE.test((id || "").trim());
}

export function normalizeToolboxUserDeliveryStatus(raw: unknown): ToolboxUserDeliveryStatus | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (s === "attribué" || s === "attribue" || s === "assigned") return "assigned";
  if (s === "en_attente" || s === "attente" || s === "waiting") return "waiting";
  if (s === "actif" || s === "active") return "active";
  if (s === "inactif" || s === "inactive") return "inactive";
  if ((TOOLBOX_USER_DELIVERY_STATUSES as readonly string[]).includes(s)) return s as ToolboxUserDeliveryStatus;
  return null;
}

export function resolveToolboxItemAssignments(
  t: NonNullable<ToolboxCatalogImportPayload["toolbox_items"]>[number],
  payload: ToolboxCatalogImportPayload,
): Array<{ userId: string; status: ToolboxUserDeliveryStatus }> {
  const rootDefault =
    normalizeToolboxUserDeliveryStatus(payload.default_assignment_status) ?? ("active" as const);

  if (Array.isArray(t.assignments)) {
    return t.assignments
      .filter((a) => a && typeof a.user_id === "string" && a.user_id.trim())
      .map((a) => ({
        userId: a.user_id.trim(),
        status:
          normalizeToolboxUserDeliveryStatus(a.status) ??
          normalizeToolboxUserDeliveryStatus(t.assignment_status) ??
          rootDefault,
      }));
  }

  const explicit = t.user_ids;
  const ids =
    explicit !== undefined
      ? explicit.map((x) => String(x).trim()).filter(Boolean)
      : (payload.default_user_ids || []).map((x) => String(x).trim()).filter(Boolean);

  const status =
    normalizeToolboxUserDeliveryStatus(t.assignment_status) ?? rootDefault;

  return ids.map((userId) => ({ userId, status }));
}

/** True when JSONB already has both FR and EN (non-empty). Avoids merging a single-locale legacy string into both slots. */
function hasIndependentFrEn(i?: Record<string, string> | null): boolean {
  if (!i || typeof i !== "object") return false;
  const fr = String((i as any).fr ?? (i as any).FR ?? "").trim();
  const en = String((i as any).en ?? (i as any).EN ?? "").trim();
  return Boolean(fr && en);
}

/** Merge `*_i18n` with legacy single string; if `direct` already has FR+EN, do not blend legacy. */
function mergeDirectAndLegacyI18n(
  direct: Record<string, string> | null | undefined,
  legacy: string | null | undefined
): Record<string, string> {
  return hasIndependentFrEn(direct ?? null)
    ? mergeI18nObject(direct ?? null, null, null, null)
    : mergeI18nObject(direct ?? null, null, null, legacy ?? null);
}

function mergeI18nObject(
  direct?: Record<string, string> | null,
  legacyFr?: string | null,
  legacyEn?: string | null,
  legacy?: string | null
): Record<string, string> {
  const out: Record<string, string> = {};
  const assign = (k: string, v?: string | null) => {
    const t = (v ?? "").trim();
    if (t) out[k] = t;
  };

  if (direct && typeof direct === "object") {
    assign("fr", (direct as any).fr ?? (direct as any).FR);
    assign("en", (direct as any).en ?? (direct as any).EN);
  }

  assign("fr", legacyFr ?? null);
  assign("en", legacyEn ?? null);

  const l = legacy?.trim();
  if (l) {
    // If only one locale is explicitly provided elsewhere, mirror to keep DB bilingual-friendly.
    if (!out.fr) assign("fr", l);
    if (!out.en) assign("en", l);
  }

  const frFinal = out.fr || out.en || l || "";
  const enFinal = out.en || out.fr || l || "";
  return bilingualPair(frFinal, enFinal);
}

export async function logProgramEvent(input: ProgramEventInput) {
  await supabase.from("program_events" as any).insert({
    actor_id: input.actor_id,
    user_id: input.user_id || null,
    entity_type: input.entity_type,
    entity_id: input.entity_id || null,
    event_type: input.event_type,
    metadata: input.metadata || {},
  } as any);
}

export async function createHabitTemplate(input: HabitTemplateInput, actorId: string) {
  const nameI18n = mergeDirectAndLegacyI18n(input.name_i18n || null, input.name);
  const descI18n = mergeDirectAndLegacyI18n(input.description_i18n || null, input.description ?? null);
  const payload = {
    external_key: normalizeKey(input.external_key),
    name: input.name.trim(),
    name_i18n: nameI18n,
    category: input.category.trim(),
    description: input.description?.trim() || null,
    description_i18n: descI18n,
    archetype_targets: asArray(input.archetype_targets),
    shadow_targets: asArray(input.shadow_targets),
    is_active: input.is_active ?? true,
    created_by: actorId,
  };

  const { data, error } = await supabase
    .from("habit_templates" as any)
    .insert(payload as any)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    entity_type: "habit_template",
    entity_id: (data as any).id,
    event_type: "template_created",
    metadata: { external_key: payload.external_key },
  });

  return data;
}

export async function createToolboxTemplate(input: ToolboxTemplateInput, actorId: string) {
  const titleI18n = mergeDirectAndLegacyI18n(input.title_i18n || null, input.title);
  const descI18n = mergeDirectAndLegacyI18n(input.description_i18n || null, input.description ?? null);
  const { title_i18n, description_i18n } = finalizeToolboxTemplateI18nChunks(titleI18n, descI18n);
  assertToolboxTitleEnglishDistinct(title_i18n, input.title);
  assertToolboxDescriptionEnglishIfPresent(description_i18n, input.description ?? null);

  const { widget_config, unresolvedPaths } = hydrateToolboxWidgetConfigForPersistence(
    input.content_type,
    (input.widget_config || {}) as Record<string, unknown>
  );
  if (unresolvedPaths.length > 0) {
    throw new Error(
      `widget_config : textes sans traduction EN (${unresolvedPaths.join(", ")}). ` +
        "Ajoutez les clés *_i18n.en dans le JSON d’import ou étendez CATALOG_FR_EN_PAIRS dans src/lib/toolbox-widget-i18n.ts."
    );
  }

  const payload = {
    external_key: normalizeKey(input.external_key),
    content_type: input.content_type,
    title: input.title.trim(),
    title_i18n,
    duration: input.duration?.trim() || null,
    description: input.description?.trim() || null,
    description_i18n,
    external_url: input.external_url?.trim() || null,
    widget_config,
    archetype_targets: asArray(input.archetype_targets),
    shadow_targets: asArray(input.shadow_targets),
    is_active: input.is_active ?? true,
    created_by: actorId,
  };
  const { data, error } = await supabase
    .from("toolbox_templates" as any)
    .insert(payload as any)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    entity_type: "toolbox_template",
    entity_id: (data as any).id,
    event_type: "template_created",
    metadata: { content_type: payload.content_type, external_key: payload.external_key },
  });

  return data;
}

export async function createJournalPromptTemplate(input: JournalPromptTemplateInput, actorId: string) {
  const titleI18n = mergeDirectAndLegacyI18n(input.title_i18n || null, input.title);
  const promptI18n = mergeDirectAndLegacyI18n(input.prompt_text_i18n || null, input.prompt_text);
  const payload = {
    external_key: normalizeKey(input.external_key),
    title: input.title.trim(),
    title_i18n: titleI18n,
    prompt_text: input.prompt_text.trim(),
    prompt_text_i18n: promptI18n,
    duration: input.duration?.trim() || null,
    archetype_targets: asArray(input.archetype_targets),
    shadow_targets: asArray(input.shadow_targets),
    is_active: input.is_active ?? true,
    created_by: actorId,
  };

  const { data, error } = await supabase
    .from("journal_prompt_templates" as any)
    .insert(payload as any)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    entity_type: "journal_prompt_template",
    entity_id: (data as any).id,
    event_type: "template_created",
    metadata: { external_key: payload.external_key },
  });

  return data;
}

export async function updateHabitTemplate(
  id: string,
  input: Partial<HabitTemplateInput>,
  actorId: string
) {
  const patch: Record<string, unknown> = {};
  if (input.external_key !== undefined) patch.external_key = normalizeKey(input.external_key);
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.name !== undefined || input.name_i18n !== undefined) {
    patch.name_i18n = mergeDirectAndLegacyI18n(input.name_i18n ?? null, input.name ?? null);
  }
  if (input.category !== undefined) patch.category = input.category.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.description !== undefined || input.description_i18n !== undefined) {
    patch.description_i18n = mergeDirectAndLegacyI18n(input.description_i18n ?? null, input.description ?? null);
  }
  if (input.archetype_targets !== undefined) patch.archetype_targets = asArray(input.archetype_targets);
  if (input.shadow_targets !== undefined) patch.shadow_targets = asArray(input.shadow_targets);
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from("habit_templates" as any)
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    entity_type: "habit_template",
    entity_id: id,
    event_type: "template_updated",
    metadata: { fields: Object.keys(patch) },
  });
  return data;
}

export async function updateToolboxTemplate(
  id: string,
  input: Partial<ToolboxTemplateInput>,
  actorId: string
) {
  const needsBilingual =
    input.widget_config !== undefined ||
    input.title !== undefined ||
    input.title_i18n !== undefined ||
    input.description !== undefined ||
    input.description_i18n !== undefined;

  let row: {
    title: string;
    title_i18n: Record<string, string> | null;
    description: string | null;
    description_i18n: Record<string, string> | null;
    content_type: string;
    widget_config: Record<string, unknown> | null;
  } | null = null;
  if (needsBilingual) {
    const { data, error } = await supabase
      .from("toolbox_templates" as any)
      .select("title,title_i18n,description,description_i18n,content_type,widget_config")
      .eq("id", id)
      .single();
    if (error) throw error;
    row = data as any;
  }

  const patch: Record<string, unknown> = {};
  if (input.external_key !== undefined) patch.external_key = normalizeKey(input.external_key);
  if (input.content_type !== undefined) patch.content_type = input.content_type;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.duration !== undefined) patch.duration = input.duration?.trim() || null;
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.external_url !== undefined) patch.external_url = input.external_url?.trim() || null;
  if (input.archetype_targets !== undefined) patch.archetype_targets = asArray(input.archetype_targets);
  if (input.shadow_targets !== undefined) patch.shadow_targets = asArray(input.shadow_targets);
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  if (row) {
    const titleMerged = mergeDirectAndLegacyI18n(
      (input.title_i18n ?? row.title_i18n) as Record<string, string> | null,
      (input.title ?? row.title) as string
    );
    const descMerged = mergeDirectAndLegacyI18n(
      (input.description_i18n ?? row.description_i18n) as Record<string, string> | null,
      (input.description ?? row.description) as string | null
    );
    const { title_i18n, description_i18n } = finalizeToolboxTemplateI18nChunks(titleMerged, descMerged);
    assertToolboxTitleEnglishDistinct(title_i18n, String(input.title ?? row.title ?? ""));
    assertToolboxDescriptionEnglishIfPresent(description_i18n, (input.description ?? row.description) as string | null);
    patch.title_i18n = title_i18n;
    patch.description_i18n = description_i18n;
  }

  if (input.widget_config !== undefined && row) {
    const ct = (input.content_type ?? row.content_type) as string;
    const { widget_config, unresolvedPaths } = hydrateToolboxWidgetConfigForPersistence(ct, input.widget_config as Record<string, unknown>);
    if (unresolvedPaths.length > 0) {
      throw new Error(
        `widget_config : textes sans traduction EN (${unresolvedPaths.join(", ")}). Complétez *_i18n.en ou le catalogue FR→EN.`
      );
    }
    patch.widget_config = widget_config;
  } else if (input.widget_config !== undefined) {
    patch.widget_config = input.widget_config || {};
  }

  const { data, error } = await supabase
    .from("toolbox_templates" as any)
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    entity_type: "toolbox_template",
    entity_id: id,
    event_type: "template_updated",
    metadata: { fields: Object.keys(patch) },
  });
  return data;
}

export async function updateJournalPromptTemplate(
  id: string,
  input: Partial<JournalPromptTemplateInput>,
  actorId: string
) {
  const patch: Record<string, unknown> = {};
  if (input.external_key !== undefined) patch.external_key = normalizeKey(input.external_key);
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.title !== undefined || input.title_i18n !== undefined) {
    patch.title_i18n = mergeDirectAndLegacyI18n(input.title_i18n ?? null, input.title ?? null);
  }
  if (input.prompt_text !== undefined) patch.prompt_text = input.prompt_text.trim();
  if (input.prompt_text !== undefined || input.prompt_text_i18n !== undefined) {
    patch.prompt_text_i18n = mergeDirectAndLegacyI18n(input.prompt_text_i18n ?? null, input.prompt_text ?? null);
  }
  if (input.duration !== undefined) patch.duration = input.duration?.trim() || null;
  if (input.archetype_targets !== undefined) patch.archetype_targets = asArray(input.archetype_targets);
  if (input.shadow_targets !== undefined) patch.shadow_targets = asArray(input.shadow_targets);
  if (input.is_active !== undefined) patch.is_active = input.is_active;

  const { data, error } = await supabase
    .from("journal_prompt_templates" as any)
    .update(patch as any)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    entity_type: "journal_prompt_template",
    entity_id: id,
    event_type: "template_updated",
    metadata: { fields: Object.keys(patch) },
  });
  return data;
}

export async function deleteCatalogItem(
  kind: "habit" | "toolbox" | "journal",
  id: string,
  actorId: string
) {
  if (kind === "habit") {
    const { error } = await supabase.from("habit_templates" as any).delete().eq("id", id);
    if (error) throw error;
    await logProgramEvent({ actor_id: actorId, entity_type: "habit_template", entity_id: id, event_type: "template_deleted", metadata: {} });
    return;
  }
  if (kind === "toolbox") {
    const { error } = await supabase.from("toolbox_templates" as any).delete().eq("id", id);
    if (error) throw error;
    await logProgramEvent({ actor_id: actorId, entity_type: "toolbox_template", entity_id: id, event_type: "template_deleted", metadata: {} });
    return;
  }
  const { error } = await supabase.from("journal_prompt_templates" as any).delete().eq("id", id);
  if (error) throw error;
  await logProgramEvent({ actor_id: actorId, entity_type: "journal_prompt_template", entity_id: id, event_type: "template_deleted", metadata: {} });
}

export async function assignHabitTemplateToUser(params: {
  actorId: string;
  userId: string;
  habitTemplateId: string;
  isActive?: boolean;
}) {
  const { actorId, userId, habitTemplateId, isActive = true } = params;
  const { data: existing } = await supabase
    .from("assigned_habits" as any)
    .select("id")
    .eq("user_id", userId)
    .eq("habit_template_id", habitTemplateId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing) return { skipped: true as const, data: existing };

  const { data, error } = await supabase
    .from("assigned_habits" as any)
    .insert({
      user_id: userId,
      habit_template_id: habitTemplateId,
      assigned_by: actorId,
      is_active: isActive,
    } as any)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    user_id: userId,
    entity_type: "habit_assignment",
    entity_id: (data as any).id,
    event_type: "assigned",
    metadata: { habit_template_id: habitTemplateId },
  });

  return { skipped: false as const, data };
}

export async function assignToolboxTemplateToUser(params: {
  actorId: string;
  userId: string;
  templateId: string;
  userDeliveryStatus?: ToolboxUserDeliveryStatus;
}) {
  const { actorId, userId, templateId, userDeliveryStatus = "active" } = params;
  const { data: template, error: tErr } = await supabase
    .from("toolbox_templates" as any)
    .select("*")
    .eq("id", templateId)
    .single();
  if (tErr) throw tErr;

  const { widget_config, unresolvedPaths } = hydrateToolboxWidgetConfigForPersistence(
    (template as any).content_type,
    ((template as any).widget_config || {}) as Record<string, unknown>
  );
  if (unresolvedPaths.length > 0) {
    throw new Error(
      `Gabarit catalogue incomplet (EN manquant sur : ${unresolvedPaths.join(", ")}). Corrigez le template avant assignation.`
    );
  }

  const assignment = {
    user_id: userId,
    content_type: (template as any).content_type,
    title: (template as any).title,
    title_i18n: hasIndependentFrEn((template as any).title_i18n)
      ? mergeI18nObject((template as any).title_i18n ?? null, null, null, null)
      : mergeI18nObject((template as any).title_i18n ?? null, null, null, (template as any).title),
    duration: (template as any).duration,
    description: (template as any).description,
    description_i18n: hasIndependentFrEn((template as any).description_i18n)
      ? mergeI18nObject((template as any).description_i18n ?? null, null, null, null)
      : mergeI18nObject((template as any).description_i18n ?? null, null, null, (template as any).description ?? null),
    external_url: (template as any).external_url,
    widget_config,
    assigned_by: actorId,
    template_id: (template as any).id,
    user_delivery_status: userDeliveryStatus,
  };

  const { data, error } = await supabase
    .from("toolbox_assignments" as any)
    .insert(assignment as any)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    user_id: userId,
    entity_type: "toolbox_assignment",
    entity_id: (data as any).id,
    event_type: "assigned",
    metadata: { template_id: (template as any).id, content_type: (template as any).content_type },
  });

  return data;
}

export async function assignJournalPromptTemplateToUser(params: {
  actorId: string;
  userId: string;
  templateId: string;
}) {
  const { actorId, userId, templateId } = params;
  const { data: template, error: tErr } = await supabase
    .from("journal_prompt_templates" as any)
    .select("*")
    .eq("id", templateId)
    .single();
  if (tErr) throw tErr;

  const promptI18n = hasIndependentFrEn((template as any).prompt_text_i18n)
    ? mergeI18nObject((template as any).prompt_text_i18n ?? null, null, null, null)
    : mergeI18nObject((template as any).prompt_text_i18n ?? null, null, null, (template as any).prompt_text);

  const { data, error } = await supabase
    .from("journal_prompts" as any)
    .insert({
      user_id: userId,
      assigned_by: actorId,
      prompt_text: (template as any).prompt_text,
      prompt_text_i18n: promptI18n,
      template_id: (template as any).id,
    } as any)
    .select("*")
    .single();
  if (error) throw error;

  // Mirror journal prompts into Toolbox so users can execute them
  // through the same widget/status flow as other toolbox items.
  const titleI18n = hasIndependentFrEn((template as any).title_i18n)
    ? mergeI18nObject((template as any).title_i18n ?? null, null, null, null)
    : mergeI18nObject((template as any).title_i18n ?? null, null, null, (template as any).title || "Journal Prompt");

  const journalWidgetRaw = {
    prompt: (template as any).prompt_text,
    prompt_i18n: promptI18n,
  };
  const { widget_config: journalWidget, unresolvedPaths: journalUn } = hydrateToolboxWidgetConfigForPersistence(
    "journal_prompt",
    journalWidgetRaw as Record<string, unknown>
  );
  if (journalUn.length > 0) {
    throw new Error(`Journal prompt : EN manquant (${journalUn.join(", ")}). Corrigez le gabarit.`);
  }

  const { error: toolboxError } = await supabase
    .from("toolbox_assignments" as any)
    .insert({
      user_id: userId,
      content_type: "journal_prompt",
      title: (template as any).title || "Journal Prompt",
      title_i18n: titleI18n,
      duration: (template as any).duration || "10 min",
      description: null,
      description_i18n: {},
      widget_config: journalWidget,
      assigned_by: actorId,
      template_id: (template as any).id,
    } as any);
  if (toolboxError) throw toolboxError;

  await logProgramEvent({
    actor_id: actorId,
    user_id: userId,
    entity_type: "journal_prompt",
    entity_id: (data as any).id,
    event_type: "assigned",
    metadata: { template_id: (template as any).id },
  });

  return data;
}

export async function assignToolboxDirect(params: {
  actorId: string;
  userId: string;
  contentType: string;
  title: string;
  titleI18n?: Record<string, string> | null;
  duration?: string | null;
  description?: string | null;
  descriptionI18n?: Record<string, string> | null;
  externalUrl?: string | null;
  widgetConfig?: Record<string, unknown> | null;
  userDeliveryStatus?: ToolboxUserDeliveryStatus;
}) {
  const {
    actorId,
    userId,
    contentType,
    title,
    titleI18n,
    duration,
    description,
    descriptionI18n,
    externalUrl,
    widgetConfig,
    userDeliveryStatus = "active",
  } = params;
  if (contentType === "external_link" && isLikelyVideoUrl(externalUrl)) {
    throw new Error("Video links must be assigned via Bibliotheque admin.");
  }
  const mergedTitleI18n = hasIndependentFrEn(titleI18n as any)
    ? mergeI18nObject(titleI18n ?? null, null, null, null)
    : mergeI18nObject(titleI18n ?? null, null, null, title);
  const mergedDescI18n = hasIndependentFrEn(descriptionI18n as any)
    ? mergeI18nObject(descriptionI18n ?? null, null, null, null)
    : mergeI18nObject(descriptionI18n ?? null, null, null, description ?? null);
  const { title_i18n: finalTitleI18n, description_i18n: finalDescI18n } = finalizeToolboxTemplateI18nChunks(
    mergedTitleI18n,
    mergedDescI18n
  );
  assertToolboxTitleEnglishDistinct(finalTitleI18n, title);
  assertToolboxDescriptionEnglishIfPresent(finalDescI18n, description ?? null);

  const { widget_config, unresolvedPaths } = hydrateToolboxWidgetConfigForPersistence(
    contentType,
    (widgetConfig || {}) as Record<string, unknown>
  );
  if (unresolvedPaths.length > 0) {
    throw new Error(
      `Assignation directe : widget_config incomplet (EN manquant sur ${unresolvedPaths.join(", ")}).`
    );
  }

  const { data, error } = await supabase
    .from("toolbox_assignments" as any)
    .insert({
      user_id: userId,
      content_type: contentType,
      title,
      title_i18n: finalTitleI18n,
      duration: duration || null,
      description: description || null,
      description_i18n: finalDescI18n,
      external_url: externalUrl || null,
      widget_config,
      assigned_by: actorId,
      user_delivery_status: userDeliveryStatus,
    } as any)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    user_id: userId,
    entity_type: "toolbox_assignment",
    entity_id: (data as any).id,
    event_type: "assigned_direct",
    metadata: { content_type: contentType },
  });
  return data;
}

export async function listCatalogData() {
  const [habitsRes, toolboxRes, journalRes] = await Promise.all([
    supabase.from("habit_templates" as any).select("*").order("created_at", { ascending: false }),
    supabase.from("toolbox_templates" as any).select("*").order("created_at", { ascending: false }),
    supabase.from("journal_prompt_templates" as any).select("*").order("created_at", { ascending: false }),
  ]);

  if (habitsRes.error) throw habitsRes.error;
  if (toolboxRes.error) throw toolboxRes.error;
  if (journalRes.error) throw journalRes.error;

  return {
    habits: (habitsRes.data || []) as any[],
    toolbox: (toolboxRes.data || []) as any[],
    journal: (journalRes.data || []) as any[],
  };
}

export async function listObservabilityFeed() {
  const [eventsRes, importsRes] = await Promise.all([
    supabase.from("program_events" as any).select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("admin_import_runs" as any).select("*").order("created_at", { ascending: false }).limit(40),
  ]);
  if (eventsRes.error) throw eventsRes.error;
  if (importsRes.error) throw importsRes.error;
  return {
    events: (eventsRes.data || []) as any[],
    imports: (importsRes.data || []) as any[],
  };
}

export async function getProgramKpiSummary() {
  const [
    toolboxAssignmentsRes,
    toolboxCompletionsRes,
    assignedHabitsRes,
    habitCompletionsRes,
    journalPromptsRes,
    importRunsRes,
    eventsRes,
  ] = await Promise.all([
    supabase.from("toolbox_assignments" as any).select("id"),
    supabase.from("toolbox_completions" as any).select("assignment_id, status"),
    supabase.from("assigned_habits" as any).select("id"),
    supabase.from("habit_completions" as any).select("assigned_habit_id"),
    supabase.from("journal_prompts" as any).select("id, is_completed"),
    supabase.from("admin_import_runs" as any).select("id"),
    supabase.from("program_events" as any).select("id"),
  ]);

  if (toolboxAssignmentsRes.error) throw toolboxAssignmentsRes.error;
  if (toolboxCompletionsRes.error) throw toolboxCompletionsRes.error;
  if (assignedHabitsRes.error) throw assignedHabitsRes.error;
  if (habitCompletionsRes.error) throw habitCompletionsRes.error;
  if (journalPromptsRes.error) throw journalPromptsRes.error;
  if (importRunsRes.error) throw importRunsRes.error;
  if (eventsRes.error) throw eventsRes.error;

  const totalToolbox = (toolboxAssignmentsRes.data || []).length;
  const completedToolbox = (toolboxCompletionsRes.data || []).filter((x: any) => x.status === "completed").length;

  const totalHabits = (assignedHabitsRes.data || []).length;
  const uniqueHabitDone = new Set((habitCompletionsRes.data || []).map((h: any) => h.assigned_habit_id)).size;

  const journalRows = (journalPromptsRes.data || []) as any[];
  const totalJournal = journalRows.length;
  const completedJournal = journalRows.filter((j) => !!j.is_completed).length;

  return {
    totalToolboxAssignments: totalToolbox,
    toolboxCompletionRate: totalToolbox > 0 ? Math.round((completedToolbox / totalToolbox) * 100) : 0,
    totalHabitAssignments: totalHabits,
    routineAdherenceRate: totalHabits > 0 ? Math.round((uniqueHabitDone / totalHabits) * 100) : 0,
    totalJournalPrompts: totalJournal,
    journalCompletionRate: totalJournal > 0 ? Math.round((completedJournal / totalJournal) * 100) : 0,
    importRuns: (importRunsRes.data || []).length,
    programEvents: (eventsRes.data || []).length,
  };
}

export async function getUserAssignmentStatus(userId: string) {
  const [habitAssignmentsRes, habitCompletionsRes, toolboxAssignmentsRes, toolboxCompletionsRes, journalPromptsRes] =
    await Promise.all([
      supabase.from("assigned_habits" as any).select("id, habit_template_id, assigned_at, is_active").eq("user_id", userId),
      supabase.from("habit_completions" as any).select("assigned_habit_id, completed_date").eq("user_id", userId),
      supabase.from("toolbox_assignments" as any).select("id, title, assigned_at").eq("user_id", userId),
      supabase.from("toolbox_completions" as any).select("assignment_id, status, completed_at").eq("user_id", userId),
      supabase.from("journal_prompts" as any).select("id, prompt_text, created_at, is_completed").eq("user_id", userId),
    ]);

  if (habitAssignmentsRes.error) throw habitAssignmentsRes.error;
  if (habitCompletionsRes.error) throw habitCompletionsRes.error;
  if (toolboxAssignmentsRes.error) throw toolboxAssignmentsRes.error;
  if (toolboxCompletionsRes.error) throw toolboxCompletionsRes.error;
  if (journalPromptsRes.error) throw journalPromptsRes.error;

  const habitDoneSet = new Set((habitCompletionsRes.data || []).map((h: any) => h.assigned_habit_id));
  const toolboxMap = new Map(
    (toolboxCompletionsRes.data || []).map((x: any) => [x.assignment_id, x.status as string])
  );

  const habits = (habitAssignmentsRes.data || []).map((h: any) => ({
    kind: "habit",
    id: h.id,
    status: habitDoneSet.has(h.id) ? "completed" : "assigned",
    assigned_at: h.assigned_at,
  }));
  const toolbox = (toolboxAssignmentsRes.data || []).map((t: any) => ({
    kind: "toolbox",
    id: t.id,
    title: t.title,
    status: (toolboxMap.get(t.id) || "assigned") as
      | "assigned"
      | "completed"
      | "abandoned"
      | "ignored"
      | "in_progress",
    assigned_at: t.assigned_at,
  }));
  const journals = (journalPromptsRes.data || []).map((j: any) => ({
    kind: "journal_prompt",
    id: j.id,
    status: j.is_completed ? "completed" : "assigned",
    assigned_at: j.created_at,
  }));
  return { habits, toolbox, journals };
}

type SuggestionItem = {
  type: "toolbox_template" | "habit_template" | "journal_prompt_template";
  id: string;
  /** Legacy single-language label (fallback). */
  title: string;
  /** JSONB `title_i18n` or `name_i18n` for habits — used with app locale for display. */
  title_i18n?: unknown;
  score: number;
  reason: string;
};

function scoreTemplate(
  templateArchetypes: string[],
  templateShadows: string[],
  topArchetypes: string[],
  shadowSignals: Record<string, number>
) {
  let score = 0;
  let archetypeHit = "";
  let shadowHit = "";
  for (const a of templateArchetypes) {
    const idx = topArchetypes.indexOf(a);
    if (idx >= 0) {
      const s = Math.max(1, 4 - idx);
      score += s;
      if (!archetypeHit) archetypeHit = a;
    }
  }
  for (const s of templateShadows) {
    const intensity = Number(shadowSignals[s] || 0);
    if (intensity > 0) {
      score += Math.round(intensity * 3);
      if (!shadowHit) shadowHit = s;
    }
  }
  return { score, archetypeHit, shadowHit };
}

export async function getArchetypeSuggestionsForUser(userId: string) {
  const [{ data: analysis }, catalog] = await Promise.all([
    supabase
      .from("analysis_results" as any)
      .select("top_archetypes, shadow_signals")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    listCatalogData(),
  ]);

  const topArchetypes = ((analysis as any)?.top_archetypes || []) as string[];
  const shadowSignals = ((analysis as any)?.shadow_signals || {}) as Record<string, number>;
  const out: SuggestionItem[] = [];

  for (const t of catalog.toolbox) {
    const { score, archetypeHit, shadowHit } = scoreTemplate(
      (t.archetype_targets || []) as string[],
      (t.shadow_targets || []) as string[],
      topArchetypes,
      shadowSignals
    );
    if (score <= 0) continue;
    out.push({
      type: "toolbox_template",
      id: t.id,
      title: t.title,
      title_i18n: (t as any).title_i18n,
      score,
      reason: `archetype:${archetypeHit || "none"} shadow:${shadowHit || "none"}`,
    });
  }

  for (const h of catalog.habits) {
    const { score, archetypeHit, shadowHit } = scoreTemplate(
      (h.archetype_targets || []) as string[],
      (h.shadow_targets || []) as string[],
      topArchetypes,
      shadowSignals
    );
    if (score <= 0) continue;
    out.push({
      type: "habit_template",
      id: h.id,
      title: h.name,
      title_i18n: (h as any).name_i18n,
      score,
      reason: `archetype:${archetypeHit || "none"} shadow:${shadowHit || "none"}`,
    });
  }

  for (const j of catalog.journal) {
    const { score, archetypeHit, shadowHit } = scoreTemplate(
      (j.archetype_targets || []) as string[],
      (j.shadow_targets || []) as string[],
      topArchetypes,
      shadowSignals
    );
    if (score <= 0) continue;
    out.push({
      type: "journal_prompt_template",
      id: j.id,
      title: j.title,
      title_i18n: (j as any).title_i18n,
      score,
      reason: `archetype:${archetypeHit || "none"} shadow:${shadowHit || "none"}`,
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 20);
}

export function validateToolboxCatalogPayload(payload: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!payload || typeof payload !== "object") {
    return [{ path: "$", message: "Le JSON doit être un objet." }];
  }
  const p = payload as ToolboxCatalogImportPayload;

  if (p.version !== "toolbox-catalog-v1") {
    issues.push({ path: "$.version", message: "version doit être 'toolbox-catalog-v1'." });
  }

  const hasItems =
    (p.toolbox_items?.length ?? 0) > 0 ||
    (p.habit_items?.length ?? 0) > 0 ||
    (p.journal_items?.length ?? 0) > 0;

  if (!hasItems) {
    issues.push({ path: "$", message: "Le fichier ne contient aucun item (toolbox_items, habit_items ou journal_items)." });
  }

  if (
    p.default_assignment_status !== undefined &&
    p.default_assignment_status !== null &&
    normalizeToolboxUserDeliveryStatus(p.default_assignment_status) === null
  ) {
    issues.push({
      path: "$.default_assignment_status",
      message: `Statut inconnu. Utilisez: ${TOOLBOX_USER_DELIVERY_STATUSES.join(", ")} (ex. assigned, waiting, active, inactive).`,
    });
  }

  (p.default_user_ids || []).forEach((uid, i) => {
    if (!isUuidLike(String(uid))) {
      issues.push({ path: `$.default_user_ids[${i}]`, message: "UUID utilisateur invalide." });
    }
  });

  (p.toolbox_items || []).forEach((t, i) => {
    const base = `$.toolbox_items[${i}]`;
    if (!t.content_type || !isKnownToolboxContentType(t.content_type)) {
      issues.push({
        path: `${base}.content_type`,
        message: `content_type invalide: "${t.content_type}". Utilisez un slug natif (${TOOLBOX_CONTENT_TYPES.join(", ")}) ou un slug composé du registre toolbox.`,
      });
    }
    if (!t.title?.trim()) {
      issues.push({ path: `${base}.title`, message: "title est obligatoire." });
    }
    if (t.widget_config === undefined || t.widget_config === null || typeof t.widget_config !== "object") {
      issues.push({ path: `${base}.widget_config`, message: "widget_config doit être un objet JSON (peut être {})." });
    }
    if (t.content_type === "external_link") {
      if (!t.external_url?.trim()) {
        issues.push({ path: `${base}.external_url`, message: "external_url est obligatoire pour external_link." });
      }
    }
    if (t.content_type === "journal_prompt") {
      const cfg = t.widget_config as any;
      if (!cfg?.prompt?.trim()) {
        issues.push({ path: `${base}.widget_config.prompt`, message: "widget_config.prompt est obligatoire pour journal_prompt." });
      }
    }
    if (t.content_type === "breathwork") {
      const cfg = t.widget_config as any;
      for (const field of ["cycles", "breath_in_sec", "pause1_sec", "breath_out_sec", "pause2_sec"]) {
        if (typeof cfg?.[field] !== "number") {
          issues.push({ path: `${base}.widget_config.${field}`, message: `${field} (nombre) est obligatoire pour breathwork.` });
        }
      }
    }
    if (t.content_type === "affirmations") {
      const cfg = t.widget_config as any;
      if (typeof cfg?.duration_min !== "number") {
        issues.push({ path: `${base}.widget_config.duration_min`, message: "duration_min est obligatoire pour affirmations." });
      }
      if (!Array.isArray(cfg?.affirmations) || cfg.affirmations.length === 0) {
        issues.push({ path: `${base}.widget_config.affirmations`, message: "affirmations (tableau de strings) est obligatoire." });
      }
    }
    if (t.content_type === "gratitude") {
      const cfg = t.widget_config as any;
      if (typeof cfg?.entries_count !== "number") {
        issues.push({ path: `${base}.widget_config.entries_count`, message: "entries_count est obligatoire pour gratitude." });
      }
    }
    if (t.content_type === "micro_practice") {
      const cfg = t.widget_config as any;
      if (!cfg?.instructions?.trim()) {
        issues.push({ path: `${base}.widget_config.instructions`, message: "instructions (string) est obligatoire pour micro_practice." });
      }
    }

    if (t.assignment_status !== undefined && t.assignment_status !== null) {
      if (normalizeToolboxUserDeliveryStatus(t.assignment_status) === null) {
        issues.push({
          path: `${base}.assignment_status`,
          message: `Statut inconnu. Utilisez: ${TOOLBOX_USER_DELIVERY_STATUSES.join(", ")}.`,
        });
      }
    }
    (t.user_ids || []).forEach((uid, j) => {
      if (!isUuidLike(String(uid))) {
        issues.push({ path: `${base}.user_ids[${j}]`, message: "UUID utilisateur invalide." });
      }
    });
    (t.assignments || []).forEach((a, j) => {
      if (!a?.user_id?.trim()) {
        issues.push({ path: `${base}.assignments[${j}].user_id`, message: "user_id obligatoire." });
      } else if (!isUuidLike(a.user_id)) {
        issues.push({ path: `${base}.assignments[${j}].user_id`, message: "UUID utilisateur invalide." });
      }
      if (a.status !== undefined && a.status !== null && normalizeToolboxUserDeliveryStatus(a.status) === null) {
        issues.push({
          path: `${base}.assignments[${j}].status`,
          message: `Statut inconnu. Utilisez: ${TOOLBOX_USER_DELIVERY_STATUSES.join(", ")}.`,
        });
      }
    });

    if (
      t.content_type &&
      t.widget_config &&
      typeof t.widget_config === "object" &&
      isKnownToolboxContentType(t.content_type)
    ) {
      const titleMerged = mergeI18nObject(t.title_i18n ?? null, t.title_fr ?? null, t.title_en ?? null, t.title);
      const descMerged = mergeI18nObject(
        t.description_i18n ?? null,
        t.description_fr ?? null,
        t.description_en ?? null,
        t.description ?? null
      );
      const { title_i18n, description_i18n } = finalizeToolboxTemplateI18nChunks(titleMerged, descMerged);
      const tf = String(title_i18n.fr ?? "").trim();
      const te = String(title_i18n.en ?? "").trim();
      if (tf && (!te || te === tf)) {
        issues.push({
          path: `${base}.title_i18n`,
          message:
            "Titre : anglais distinct requis (title_en / title_i18n.en ou entrée dans resolveToolboxTitleEnglish / lookupCatalogFrToEn).",
        });
      }
      const df = String(description_i18n.fr ?? "").trim();
      const de = String(description_i18n.en ?? "").trim();
      if (df && (!de || de === df)) {
        issues.push({
          path: `${base}.description_i18n`,
          message:
            "Description : anglais distinct requis (description_en / description_i18n.en ou entrée FR→EN catalogue).",
        });
      }

      const { unresolvedPaths } = hydrateToolboxWidgetConfigForPersistence(
        t.content_type,
        t.widget_config as Record<string, unknown>
      );
      for (const path of unresolvedPaths) {
        issues.push({
          path: `${base}.${path}`,
          message: `Traduction EN manquante pour ${path}. Ajoutez *_i18n.en ou étendez CATALOG_FR_EN_PAIRS (toolbox-widget-i18n.ts).`,
        });
      }
    }
  });

  (p.habit_items || []).forEach((h, i) => {
    const base = `$.habit_items[${i}]`;
    if (!h.name?.trim()) issues.push({ path: `${base}.name`, message: "name est obligatoire." });
    if (!h.category?.trim()) issues.push({ path: `${base}.category`, message: "category est obligatoire." });
  });

  (p.journal_items || []).forEach((j, i) => {
    const base = `$.journal_items[${i}]`;
    if (!j.title?.trim()) issues.push({ path: `${base}.title`, message: "title est obligatoire." });
    if (!j.prompt_text?.trim()) issues.push({ path: `${base}.prompt_text`, message: "prompt_text est obligatoire." });

    const promptMerged = mergeI18nObject(j.prompt_text_i18n ?? null, j.prompt_fr ?? null, j.prompt_en ?? null, j.prompt_text);
    const promptFin = dedupeToolboxTextI18n(promptMerged, (fr) => lookupCatalogFrToEn(fr));
    const pf = String(promptFin.fr ?? "").trim();
    const pe = String(promptFin.en ?? "").trim();
    if (pf && (!pe || pe === pf)) {
      issues.push({
        path: `${base}.prompt_text_i18n`,
        message:
          "prompt_text : anglais distinct requis (prompt_en / prompt_text_i18n.en ou entrée FR→EN catalogue).",
      });
    }

    const titleMerged = mergeI18nObject(j.title_i18n ?? null, j.title_fr ?? null, j.title_en ?? null, j.title);
    const { title_i18n: jt } = finalizeToolboxTemplateI18nChunks(titleMerged, mergeDirectAndLegacyI18n(null, null));
    const jtf = String(jt.fr ?? "").trim();
    const jte = String(jt.en ?? "").trim();
    if (jtf && (!jte || jte === jtf)) {
      issues.push({
        path: `${base}.title_i18n`,
        message:
          "Titre journal : anglais distinct requis (title_en / title_i18n.en ou map catalogue).",
      });
    }
  });

  return issues;
}

export async function runToolboxCatalogImport(params: {
  payload: ToolboxCatalogImportPayload;
  actorId: string;
  dryRun?: boolean;
}): Promise<ImportExecutionSummary> {
  const { payload, actorId, dryRun = false } = params;
  const issues = validateToolboxCatalogPayload(payload);
  const summary: ImportExecutionSummary = {
    dryRun,
    createdToolboxTemplates: 0,
    createdToolboxAssignments: 0,
    createdHabitTemplates: 0,
    createdJournalPromptTemplates: 0,
    skippedDuplicates: 0,
    skippedDuplicateToolboxAssignments: 0,
    issues,
  };

  if (issues.length > 0) return summary;
  if (dryRun) return summary;

  for (const t of payload.toolbox_items || []) {
    let templateId: string | null = null;
    const key = normalizeKey(t.external_key);
    if (key) {
      const { data: existing } = await supabase
        .from("toolbox_templates" as any)
        .select("id")
        .eq("external_key", key)
        .maybeSingle();
      if ((existing as any)?.id) {
        templateId = (existing as any).id as string;
        summary.skippedDuplicates += 1;
      }
    }

    if (!templateId) {
      const created = await createToolboxTemplate(
        {
          external_key: t.external_key,
          content_type: t.content_type,
          title: t.title,
          title_i18n: mergeI18nObject(t.title_i18n ?? null, t.title_fr ?? null, t.title_en ?? null, t.title),
          duration: t.duration,
          description: t.description,
          description_i18n: mergeI18nObject(
            t.description_i18n ?? null,
            t.description_fr ?? null,
            t.description_en ?? null,
            t.description ?? null
          ),
          external_url: t.external_url,
          widget_config: t.widget_config,
          is_active: t.is_active ?? true,
        },
        actorId
      );
      templateId = (created as any).id as string;
      summary.createdToolboxTemplates += 1;
    }

    const targets = resolveToolboxItemAssignments(t, payload);
    for (const { userId, status } of targets) {
      const { data: dup } = await supabase
        .from("toolbox_assignments" as any)
        .select("id")
        .eq("user_id", userId)
        .eq("template_id", templateId)
        .maybeSingle();
      if ((dup as any)?.id) {
        summary.skippedDuplicateToolboxAssignments += 1;
        continue;
      }
      await assignToolboxTemplateToUser({
        actorId,
        userId,
        templateId,
        userDeliveryStatus: status,
      });
      summary.createdToolboxAssignments += 1;
    }
  }

  for (const h of payload.habit_items || []) {
    const key = normalizeKey(h.external_key);
    if (key) {
      const { data: existing } = await supabase
        .from("habit_templates" as any)
        .select("id")
        .eq("external_key", key)
        .maybeSingle();
      if ((existing as any)?.id) {
        summary.skippedDuplicates += 1;
        continue;
      }
    }
    await createHabitTemplate(
      {
        external_key: h.external_key,
        name: h.name,
        name_i18n: mergeI18nObject(h.name_i18n ?? null, h.name_fr ?? null, h.name_en ?? null, h.name),
        category: h.category,
        description: h.description,
        description_i18n: mergeI18nObject(
          h.description_i18n ?? null,
          h.description_fr ?? null,
          h.description_en ?? null,
          h.description ?? null
        ),
        is_active: h.is_active ?? true,
      },
      actorId
    );
    summary.createdHabitTemplates += 1;
  }

  for (const j of payload.journal_items || []) {
    const key = normalizeKey(j.external_key);
    if (key) {
      const { data: existing } = await supabase
        .from("journal_prompt_templates" as any)
        .select("id")
        .eq("external_key", key)
        .maybeSingle();
      if ((existing as any)?.id) {
        summary.skippedDuplicates += 1;
        continue;
      }
    }
    await createJournalPromptTemplate(
      {
        external_key: j.external_key,
        title: j.title,
        title_i18n: mergeI18nObject(j.title_i18n ?? null, j.title_fr ?? null, j.title_en ?? null, j.title),
        prompt_text: j.prompt_text,
        prompt_text_i18n: mergeI18nObject(
          j.prompt_text_i18n ?? null,
          j.prompt_fr ?? null,
          j.prompt_en ?? null,
          j.prompt_text
        ),
        duration: j.duration,
        is_active: j.is_active ?? true,
      },
      actorId
    );
    summary.createdJournalPromptTemplates += 1;
  }

  await supabase.from("admin_import_runs" as any).insert({
    created_by: actorId,
    dry_run: false,
    status: "completed",
    payload,
    summary,
  } as any);

  await logProgramEvent({
    actor_id: actorId,
    entity_type: "import_run",
    event_type: "catalog_import_completed",
    metadata: {
      created_toolbox: summary.createdToolboxTemplates,
      created_toolbox_assignments: summary.createdToolboxAssignments,
      created_habits: summary.createdHabitTemplates,
      created_journal: summary.createdJournalPromptTemplates,
      skipped: summary.skippedDuplicates,
      skipped_duplicate_assignments: summary.skippedDuplicateToolboxAssignments,
    },
  });

  return summary;
}

export type ToolboxDistributionMode = "catalog" | "individual" | "group" | "global";

export interface ToolboxDistributionInput {
  mode: ToolboxDistributionMode;
  userId?: string;
  userIds?: string[];
  companyId?: string;
  locale?: "fr" | "en" | "all";
  assignmentStatus?: ToolboxUserDeliveryStatus;
}

const DISTRIBUTION_CHUNK = 20;

function matchesGlobalLocale(country: string | null, locale: "fr" | "en" | "all"): boolean {
  if (locale === "all") return true;
  const c = (country || "").trim().toLowerCase();
  const isFr =
    !c || c === "fr" || c === "france" || c.includes("français") || c.includes("french");
  return locale === "fr" ? isFr : Boolean(c) && !isFr;
}

export async function resolveDistributionUserIds(
  dist: ToolboxDistributionInput,
): Promise<string[]> {
  if (dist.mode === "catalog") return [];

  if (dist.mode === "individual") {
    const id = (dist.userId || "").trim();
    if (!isUuidLike(id)) throw new Error("UUID utilisateur requis.");
    return [id];
  }

  if (dist.mode === "group") {
    if (dist.companyId && isUuidLike(dist.companyId)) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", dist.companyId)
        .eq("is_disabled", false);
      if (error) throw error;
      return (data || []).map((p: { id: string }) => p.id);
    }
    const ids = [...new Set((dist.userIds || []).map((x) => x.trim()).filter(isUuidLike))];
    if (!ids.length) throw new Error("Sélectionnez au moins un utilisateur ou une entreprise.");
    return ids;
  }

  const locale = dist.locale ?? "all";
  const { data, error } = await supabase
    .from("profiles")
    .select("id, country")
    .eq("is_disabled", false);
  if (error) throw error;
  return (data || [])
    .filter((p: { country: string | null }) => matchesGlobalLocale(p.country, locale))
    .map((p: { id: string }) => p.id);
}

export async function previewDistributionUserCount(dist: ToolboxDistributionInput): Promise<number> {
  return (await resolveDistributionUserIds(dist)).length;
}

export async function distributeToolboxToUsers(params: {
  actorId: string;
  templateId: string;
  userIds: string[];
  userDeliveryStatus?: ToolboxUserDeliveryStatus;
  distributionMetadata?: Record<string, unknown>;
}): Promise<{ created: number; skipped: number; assignmentIds: string[] }> {
  const { actorId, templateId, userIds, userDeliveryStatus = "active", distributionMetadata } =
    params;
  const unique = [...new Set(userIds.filter(isUuidLike))];
  let created = 0;
  let skipped = 0;
  const assignmentIds: string[] = [];

  for (let i = 0; i < unique.length; i += DISTRIBUTION_CHUNK) {
    const chunk = unique.slice(i, i + DISTRIBUTION_CHUNK);
    const chunkResults = await Promise.all(
      chunk.map(async (userId) => {
        const { data: dup } = await supabase
          .from("toolbox_assignments" as any)
          .select("id")
          .eq("user_id", userId)
          .eq("template_id", templateId)
          .maybeSingle();
        if ((dup as any)?.id) return { kind: "skipped" as const };
        const data = await assignToolboxTemplateToUser({
          actorId,
          userId,
          templateId,
          userDeliveryStatus,
        });
        return { kind: "created" as const, id: (data as any).id as string };
      }),
    );
    for (const r of chunkResults) {
      if (r.kind === "skipped") skipped += 1;
      else {
        created += 1;
        assignmentIds.push(r.id);
      }
    }
  }

  if (created > 0) {
    await logProgramEvent({
      actor_id: actorId,
      entity_type: "toolbox_assignment",
      event_type: "distributed_batch",
      metadata: {
        template_id: templateId,
        created,
        skipped,
        ...distributionMetadata,
      },
    });
  }

  return { created, skipped, assignmentIds };
}

export async function distributeToolboxContent(params: {
  actorId: string;
  templateId: string;
  distribution: ToolboxDistributionInput;
}): Promise<{ created: number; skipped: number; userCount: number }> {
  const userIds = await resolveDistributionUserIds(params.distribution);
  if (params.distribution.mode === "catalog" || userIds.length === 0) {
    return { created: 0, skipped: 0, userCount: 0 };
  }
  const result = await distributeToolboxToUsers({
    actorId: params.actorId,
    templateId: params.templateId,
    userIds,
    userDeliveryStatus: params.distribution.assignmentStatus ?? "active",
    distributionMetadata: {
      mode: params.distribution.mode,
      locale: params.distribution.locale,
      company_id: params.distribution.companyId,
    },
  });
  return { ...result, userCount: userIds.length };
}

/** @deprecated Use runToolboxCatalogImport instead */
export async function runProgramImport(params: {
  payload: ToolboxCatalogImportPayload;
  actorId: string;
  dryRun?: boolean;
}) {
  return runToolboxCatalogImport(params);
}

/** @deprecated Use validateToolboxCatalogPayload instead */
export function validateProgramImportPayload(payload: unknown): ValidationIssue[] {
  return validateToolboxCatalogPayload(payload);
}
