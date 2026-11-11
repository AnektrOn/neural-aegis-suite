export const EXPORT_ROOT = "1dVrAm_xlKF9pt5WX-7yomm63JpiZyi75";

// Explicit allowlist: never export auth credentials, push tokens or private service configuration.
export const USER_EXPORT_TABLES = [
  "account_pauses", "admin_alerts", "aegis_health_scores", "aegis_user_card_interactions",
  "aegis_user_rune_progress", "affiliates", "analysis_results", "app_update_events",
  "archetype_profile_snapshots", "archetype_scores", "assessment_responses", "assessment_sessions",
  "assigned_habits", "audit_calls", "cartography_bundles", "company_memberships", "daily_actions",
  "daily_scoreboards", "decisions", "deepdive_responses", "elevenlabs_documents", "elevenlabs_drive_folders",
  "employer_data_consent", "guardian_onboarding", "habit_completions", "houses72_responses",
  "input_hesitations", "journal_entries", "journal_prompts", "library_video_assignments",
  "meditation_assignments", "mood_entries", "newsletter_subscribers", "notifications", "people_contacts",
  "program_events", "recommendation_tools", "relation_quality_history", "scoreboard_criteria",
  "subscriptions", "sync_jobs", "toolbox_assignment_stats", "toolbox_assignments", "toolbox_completions",
  "tracking_daily_batches", "tracking_daily_responses", "tracking_progress_snapshots", "tracking_questions",
  "tracking_user_settings", "user_agents", "user_app_versions", "user_badges", "user_location_admin_consent",
  "user_place_contact_links", "user_places", "user_reports", "user_roles", "user_sessions", "user_tao_portrait_parts",
] as const;

export async function readAllRows(queryPage: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const rows: unknown[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await queryPage(from, from + 499);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < 500) return rows;
  }
}
// Each exported table lands in the same per-user category folder as live exports.
const CATEGORY_TABLES: Record<string, readonly string[]> = {
  Quizz: ["assessment_sessions", "assessment_responses", "archetype_scores", "archetype_profile_snapshots",
    "analysis_results", "deepdive_responses", "houses72_responses", "recommendation_tools"],
  Rapport: ["user_reports", "cartography_bundles", "cartography_bundle_sections", "user_tao_portrait_parts", "aegis_health_scores"],
  Mood: ["mood_entries", "tracking_daily_batches", "tracking_daily_responses", "tracking_progress_snapshots",
    "tracking_questions", "tracking_user_settings"],
  Decisions: ["decisions"],
  Habits: ["assigned_habits", "habit_completions", "daily_actions", "daily_scoreboards", "scoreboard_criteria"],
  Toolbox: ["toolbox_assignments", "toolbox_completions", "toolbox_assignment_stats", "meditation_assignments",
    "library_video_assignments", "aegis_user_card_interactions", "aegis_user_rune_progress"],
  Journal: ["journal_entries", "journal_prompts"],
  People: ["people_contacts", "relation_quality_history", "user_places", "user_place_contact_links"],
  Profil: ["profiles", "subscriptions", "account_pauses", "company_memberships", "user_roles", "affiliates",
    "employer_data_consent", "user_location_admin_consent", "newsletter_subscribers", "guardian_onboarding",
    "audit_calls", "program_events", "user_badges", "admin_messages"],
};

export function categoryForTable(table: string): string {
  for (const [category, tables] of Object.entries(CATEGORY_TABLES)) if (tables.includes(table)) return category;
  return "Logs";
}
