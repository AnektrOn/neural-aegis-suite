import { supabase } from "@/integrations/supabase/client";
import { distributeToolboxToUsers } from "@/services/programBuilderService";
import {
  BUILTIN_TOOLBOX_CONTENT_TYPES,
  mergeContentTypeDefinitions,
  type ToolboxContentTypeDefinition,
} from "@/lib/toolbox-content-type-definitions";

export interface WidgetProposalRow {
  id: string;
  content_type_slug: string;
  title: string;
  title_i18n?: Record<string, string>;
  description?: string | null;
  description_i18n?: Record<string, string>;
  widget_config: Record<string, unknown>;
  external_url?: string | null;
  status: "pending_review" | "approved" | "rejected" | "published";
  suggested_user_ids?: string[];
  selected_user_ids?: string[];
  reasoning?: string | null;
  created_at?: string;
}

export async function bootstrapContentTypeDefinitions(actorId?: string) {
  const rows = BUILTIN_TOOLBOX_CONTENT_TYPES.map((def) => ({
    slug: def.slug,
    label_fr: def.label_fr,
    label_en: def.label_en,
    description_fr: def.description_fr,
    description_en: def.description_en,
    category: def.category,
    icon: def.icon,
    renderer_kind: def.renderer_kind,
    status: def.status,
    config_schema: def.config_schema,
    ui_blueprint: def.ui_blueprint,
    sample_config: def.sample_config,
    default_title_fr: def.default_title_fr,
    default_title_en: def.default_title_en,
    created_by: actorId ?? null,
  }));
  const { error } = await supabase
    .from("content_type_definitions" as never)
    .upsert(rows as never, { onConflict: "slug" });
  if (error) throw error;
}

export async function listContentTypeDefinitions() {
  const { data, error } = await supabase
    .from("content_type_definitions" as never)
    .select("*")
    .order("category", { ascending: true })
    .order("slug", { ascending: true });
  if (error) throw error;
  const merged = mergeContentTypeDefinitions(
    (data || []) as Array<Partial<ToolboxContentTypeDefinition> & { slug: string }>,
  );
  return merged;
}

export async function listWidgetProposals() {
  const { data, error } = await supabase
    .from("widget_proposals" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as WidgetProposalRow[];
}

export async function createProposalFromDefinition(params: {
  actorId: string;
  def: ToolboxContentTypeDefinition;
}) {
  const { actorId, def } = params;
  const { data, error } = await supabase
    .from("widget_proposals" as never)
    .insert({
      content_type_slug: def.slug,
      title: def.default_title_fr,
      title_i18n: { fr: def.default_title_fr, en: def.default_title_en },
      description: def.description_fr,
      description_i18n: { fr: def.description_fr, en: def.description_en },
      widget_config: def.sample_config,
      source: "admin_gallery",
      status: "pending_review",
      created_by: actorId,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as WidgetProposalRow;
}

export function validateAgainstContentType(
  def: ToolboxContentTypeDefinition,
  proposal: Pick<WidgetProposalRow, "widget_config" | "external_url">,
): string[] {
  const issues: string[] = [];
  const required = Array.isArray(
    (def.config_schema as { required?: unknown }).required,
  )
    ? ((def.config_schema as { required: string[] }).required as string[])
    : [];
  for (const key of required) {
    if ((proposal.widget_config as Record<string, unknown>)?.[key] === undefined) {
      issues.push(`Missing required field: ${key}`);
    }
  }
  if (def.slug === "external_link" && !proposal.external_url?.trim()) {
    issues.push("external_url is required for external_link.");
  }
  return issues;
}

export async function publishProposal(params: {
  actorId: string;
  proposal: WidgetProposalRow;
  selectedUserIds: string[];
  createTemplate?: boolean;
}) {
  const { actorId, proposal, selectedUserIds, createTemplate = true } = params;
  let templateId: string | null = null;

  if (createTemplate) {
    const { data: tpl, error: tplError } = await supabase
      .from("toolbox_templates" as never)
      .insert({
        content_type: proposal.content_type_slug,
        title: proposal.title,
        title_i18n: proposal.title_i18n || {},
        duration: null,
        description: proposal.description || null,
        description_i18n: proposal.description_i18n || {},
        external_url: proposal.external_url || null,
        widget_config: proposal.widget_config || {},
        is_active: true,
        created_by: actorId,
      } as never)
      .select("id")
      .single();
    if (tplError) throw tplError;
    templateId = tpl?.id ?? null;
  }

  const assignmentIds: string[] = [];
  if (templateId && selectedUserIds.length > 0) {
    const dist = await distributeToolboxToUsers({
      actorId,
      templateId,
      userIds: selectedUserIds,
      distributionMetadata: { source: "widget_proposal", proposal_id: proposal.id },
    });
    assignmentIds.push(...dist.assignmentIds);
  }

  if (proposal.id) {
    const { error: proposalError } = await supabase
      .from("widget_proposals" as never)
      .update({
        status: "published",
        selected_user_ids: selectedUserIds,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
        published_template_id: templateId,
        published_assignment_ids: assignmentIds,
      } as never)
      .eq("id", proposal.id);
    if (proposalError) throw proposalError;
  }

  return { templateId, assignmentIds };
}
