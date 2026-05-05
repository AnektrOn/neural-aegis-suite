import { supabase } from "@/integrations/supabase/client";
import { isLikelyVideoUrl } from "@/lib/video-links";

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

export interface CatalogTaggable {
  archetype_targets?: string[];
  shadow_targets?: string[];
}

export interface HabitTemplateInput extends CatalogTaggable {
  external_key?: string | null;
  name: string;
  category: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ToolboxTemplateInput extends CatalogTaggable {
  external_key?: string | null;
  content_type: ToolboxContentType;
  title: string;
  duration?: string | null;
  description?: string | null;
  external_url?: string | null;
  widget_config?: Record<string, unknown> | null;
  is_active?: boolean;
}

export interface JournalPromptTemplateInput extends CatalogTaggable {
  external_key?: string | null;
  title: string;
  prompt_text: string;
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
 * Crée uniquement des templates dans le catalogue.
 * L'assignation aux users se fait ensuite manuellement depuis l'admin.
 *
 * Chaque item dans toolbox_items correspond à un futur widget assignable.
 * Chaque item dans habit_items correspond à une routine réutilisable.
 * Chaque item dans journal_items correspond à un prompt journal réutilisable.
 */
export interface ToolboxCatalogImportPayload {
  version: "toolbox-catalog-v1";
  toolbox_items?: Array<{
    external_key?: string;
    content_type: ToolboxContentType;
    title: string;
    duration?: string;
    description?: string;
    external_url?: string;
    widget_config: Record<string, unknown>;
    is_active?: boolean;
  }>;
  habit_items?: Array<{
    external_key?: string;
    name: string;
    category: string;
    description?: string;
    is_active?: boolean;
  }>;
  journal_items?: Array<{
    external_key?: string;
    title: string;
    prompt_text: string;
    duration?: string;
    is_active?: boolean;
  }>;
}

export interface ImportExecutionSummary {
  dryRun: boolean;
  createdToolboxTemplates: number;
  createdHabitTemplates: number;
  createdJournalPromptTemplates: number;
  skippedDuplicates: number;
  issues: ValidationIssue[];
}

function asArray(v?: string[]) {
  return Array.isArray(v) ? v.filter(Boolean) : [];
}

function normalizeKey(key?: string | null) {
  return (key || "").trim() || null;
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
  const payload = {
    external_key: normalizeKey(input.external_key),
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description?.trim() || null,
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
    entity_id: data.id,
    event_type: "template_created",
    metadata: { external_key: payload.external_key },
  });

  return data;
}

export async function createToolboxTemplate(input: ToolboxTemplateInput, actorId: string) {
  const payload = {
    external_key: normalizeKey(input.external_key),
    content_type: input.content_type,
    title: input.title.trim(),
    duration: input.duration?.trim() || null,
    description: input.description?.trim() || null,
    external_url: input.external_url?.trim() || null,
    widget_config: input.widget_config || {},
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
    entity_id: data.id,
    event_type: "template_created",
    metadata: { content_type: payload.content_type, external_key: payload.external_key },
  });

  return data;
}

export async function createJournalPromptTemplate(input: JournalPromptTemplateInput, actorId: string) {
  const payload = {
    external_key: normalizeKey(input.external_key),
    title: input.title.trim(),
    prompt_text: input.prompt_text.trim(),
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
    entity_id: data.id,
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
  if (input.category !== undefined) patch.category = input.category.trim();
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
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
  const patch: Record<string, unknown> = {};
  if (input.external_key !== undefined) patch.external_key = normalizeKey(input.external_key);
  if (input.content_type !== undefined) patch.content_type = input.content_type;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.duration !== undefined) patch.duration = input.duration?.trim() || null;
  if (input.description !== undefined) patch.description = input.description?.trim() || null;
  if (input.external_url !== undefined) patch.external_url = input.external_url?.trim() || null;
  if (input.widget_config !== undefined) patch.widget_config = input.widget_config || {};
  if (input.archetype_targets !== undefined) patch.archetype_targets = asArray(input.archetype_targets);
  if (input.shadow_targets !== undefined) patch.shadow_targets = asArray(input.shadow_targets);
  if (input.is_active !== undefined) patch.is_active = input.is_active;

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
  if (input.prompt_text !== undefined) patch.prompt_text = input.prompt_text.trim();
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
    entity_id: data.id,
    event_type: "assigned",
    metadata: { habit_template_id: habitTemplateId },
  });

  return { skipped: false as const, data };
}

export async function assignToolboxTemplateToUser(params: {
  actorId: string;
  userId: string;
  templateId: string;
}) {
  const { actorId, userId, templateId } = params;
  const { data: template, error: tErr } = await supabase
    .from("toolbox_templates" as any)
    .select("*")
    .eq("id", templateId)
    .single();
  if (tErr) throw tErr;

  const assignment = {
    user_id: userId,
    content_type: template.content_type,
    title: template.title,
    duration: template.duration,
    description: template.description,
    external_url: template.external_url,
    widget_config: template.widget_config || {},
    assigned_by: actorId,
    template_id: template.id,
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
    entity_id: data.id,
    event_type: "assigned",
    metadata: { template_id: template.id, content_type: template.content_type },
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

  const { data, error } = await supabase
    .from("journal_prompts" as any)
    .insert({
      user_id: userId,
      assigned_by: actorId,
      prompt_text: template.prompt_text,
      template_id: template.id,
    } as any)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    user_id: userId,
    entity_type: "journal_prompt",
    entity_id: data.id,
    event_type: "assigned",
    metadata: { template_id: template.id },
  });

  return data;
}

export async function assignToolboxDirect(params: {
  actorId: string;
  userId: string;
  contentType: string;
  title: string;
  duration?: string | null;
  description?: string | null;
  externalUrl?: string | null;
  widgetConfig?: Record<string, unknown> | null;
}) {
  const { actorId, userId, contentType, title, duration, description, externalUrl, widgetConfig } = params;
  if (contentType === "external_link" && isLikelyVideoUrl(externalUrl)) {
    throw new Error("Video links must be assigned via Bibliotheque admin.");
  }
  const { data, error } = await supabase
    .from("toolbox_assignments" as any)
    .insert({
      user_id: userId,
      content_type: contentType,
      title,
      duration: duration || null,
      description: description || null,
      external_url: externalUrl || null,
      widget_config: widgetConfig || {},
      assigned_by: actorId,
    } as any)
    .select("*")
    .single();
  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    user_id: userId,
    entity_type: "toolbox_assignment",
    entity_id: data.id,
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
  title: string;
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

  const topArchetypes = (analysis?.top_archetypes || []) as string[];
  const shadowSignals = (analysis?.shadow_signals || {}) as Record<string, number>;
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

  (p.toolbox_items || []).forEach((t, i) => {
    const base = `$.toolbox_items[${i}]`;
    if (!t.content_type || !TOOLBOX_CONTENT_TYPES.includes(t.content_type)) {
      issues.push({
        path: `${base}.content_type`,
        message: `content_type invalide: "${t.content_type}". Valeurs acceptées: ${TOOLBOX_CONTENT_TYPES.join(", ")}.`,
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
    createdHabitTemplates: 0,
    createdJournalPromptTemplates: 0,
    skippedDuplicates: 0,
    issues,
  };

  if (issues.length > 0) return summary;
  if (dryRun) return summary;

  for (const t of payload.toolbox_items || []) {
    const key = normalizeKey(t.external_key);
    if (key) {
      const { data: existing } = await supabase
        .from("toolbox_templates" as any)
        .select("id")
        .eq("external_key", key)
        .maybeSingle();
      if (existing?.id) {
        summary.skippedDuplicates += 1;
        continue;
      }
    }
    await createToolboxTemplate(
      {
        external_key: t.external_key,
        content_type: t.content_type,
        title: t.title,
        duration: t.duration,
        description: t.description,
        external_url: t.external_url,
        widget_config: t.widget_config,
        is_active: t.is_active ?? true,
      },
      actorId
    );
    summary.createdToolboxTemplates += 1;
  }

  for (const h of payload.habit_items || []) {
    const key = normalizeKey(h.external_key);
    if (key) {
      const { data: existing } = await supabase
        .from("habit_templates" as any)
        .select("id")
        .eq("external_key", key)
        .maybeSingle();
      if (existing?.id) {
        summary.skippedDuplicates += 1;
        continue;
      }
    }
    await createHabitTemplate(
      {
        external_key: h.external_key,
        name: h.name,
        category: h.category,
        description: h.description,
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
      if (existing?.id) {
        summary.skippedDuplicates += 1;
        continue;
      }
    }
    await createJournalPromptTemplate(
      {
        external_key: j.external_key,
        title: j.title,
        prompt_text: j.prompt_text,
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
      created_habits: summary.createdHabitTemplates,
      created_journal: summary.createdJournalPromptTemplates,
      skipped: summary.skippedDuplicates,
    },
  });

  return summary;
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
