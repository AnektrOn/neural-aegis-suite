/**
 * Unified Program domain model (Catalog + Assignments).
 * This file provides shared semantics used by admin pages and services.
 */

export type ProgramCatalogKind = "habit" | "toolbox" | "journal_prompt";

export type ProgramAssignmentStatus =
  | "assigned"
  | "in_progress"
  | "completed"
  | "abandoned"
  | "ignored";

export interface ProgramCatalogMeta {
  archetype_targets: string[];
  shadow_targets: string[];
  is_active: boolean;
}

export interface HabitCatalogItem extends ProgramCatalogMeta {
  kind: "habit";
  id: string;
  external_key: string | null;
  name: string;
  category: string;
  description: string | null;
}

export interface ToolboxCatalogItem extends ProgramCatalogMeta {
  kind: "toolbox";
  id: string;
  external_key: string | null;
  content_type: string;
  title: string;
  duration: string | null;
  description: string | null;
  external_url: string | null;
  widget_config: Record<string, unknown>;
}

export interface JournalPromptCatalogItem extends ProgramCatalogMeta {
  kind: "journal_prompt";
  id: string;
  external_key: string | null;
  title: string;
  prompt_text: string;
  duration: string | null;
}

export type ProgramCatalogItem = HabitCatalogItem | ToolboxCatalogItem | JournalPromptCatalogItem;

export function parseTagList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function joinTagList(tags?: string[] | null): string {
  if (!tags || tags.length === 0) return "";
  return tags.join(", ");
}
