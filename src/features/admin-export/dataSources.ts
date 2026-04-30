import { supabase } from "@/integrations/supabase/client";

export type DataSourceKey =
  | "mood"
  | "decisions"
  | "habits"
  | "journal"
  | "toolbox"
  | "people"
  | "places"
  | "sessions"
  | "notifications"
  | "audit_calls"
  | "assessments"
  | "deep_dive";

export interface DataSourceDef {
  key: DataSourceKey;
  label: string;
  table: string;
  dateColumn: string;
  userColumn: string;
  select?: string;
}

export const DATA_SOURCES: DataSourceDef[] = [
  { key: "mood", label: "Humeur / Sommeil / Stress", table: "mood_entries", dateColumn: "logged_at", userColumn: "user_id" },
  { key: "decisions", label: "Décisions", table: "decisions", dateColumn: "created_at", userColumn: "user_id" },
  { key: "habits", label: "Habitudes (complétions)", table: "habit_completions", dateColumn: "completed_date", userColumn: "user_id" },
  { key: "journal", label: "Journal", table: "journal_entries", dateColumn: "created_at", userColumn: "user_id" },
  { key: "toolbox", label: "Toolbox (complétions)", table: "toolbox_completions", dateColumn: "completed_at", userColumn: "user_id" },
  { key: "people", label: "Contacts / Relations", table: "people_contacts", dateColumn: "created_at", userColumn: "user_id" },
  { key: "places", label: "Lieux", table: "user_places", dateColumn: "created_at", userColumn: "user_id" },
  { key: "sessions", label: "Sessions utilisateur", table: "user_sessions", dateColumn: "started_at", userColumn: "user_id" },
  { key: "notifications", label: "Notifications", table: "notifications", dateColumn: "created_at", userColumn: "user_id" },
  { key: "audit_calls", label: "Audit calls", table: "audit_calls", dateColumn: "call_date", userColumn: "user_id" },
  { key: "assessments", label: "Assessments (sessions)", table: "assessment_sessions", dateColumn: "started_at", userColumn: "user_id" },
  { key: "deep_dive", label: "Snapshots Deep Dive", table: "archetype_profile_snapshots", dateColumn: "computed_at", userColumn: "user_id" },
];

export interface FetchParams {
  source: DataSourceDef;
  userIds: string[]; // empty = all
  fromIso: string | null;
  toIso: string | null;
}

export async function fetchSource({ source, userIds, fromIso, toIso }: FetchParams) {
  let q = (supabase as any)
    .from(source.table)
    .select("*")
    .order(source.dateColumn, { ascending: false })
    .limit(10000);

  if (fromIso) q = q.gte(source.dateColumn, fromIso);
  if (toIso) q = q.lte(source.dateColumn, toIso);
  if (userIds.length > 0) q = q.in(source.userColumn, userIds);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Record<string, any>[];
}
