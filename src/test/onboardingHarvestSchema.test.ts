import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { userExecutiveProfiles } from "../../drizzle/schema";

const REPO_ROOT = resolve(__dirname, "../..");

describe("0021_rich_onboarding_harvest schema & SQL alignment", () => {
  it("defines user_executive_profiles with expected columns in drizzle/schema.ts", () => {
    const config = getTableConfig(userExecutiveProfiles);
    expect(config.name).toBe("user_executive_profiles");

    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        "user_id",
        "role_title",
        "company_stage",
        "team_size",
        "annual_revenue_bracket",
        "governance_structure",
        "primary_stakeholders",
        "urgent_decision_title",
        "urgent_decision_stakes",
        "urgent_decision_horizon",
        "dominant_decision_friction",
        "raw_dilemma_responses",
        "peak_focus_time",
        "stress_symptoms",
        "onboarding_step_reached",
        "completed_at",
      ]),
    );
  });

  it("registers migration 0021_rich_onboarding_harvest in Drizzle journal", () => {
    const rawJournal = readFileSync(
      resolve(REPO_ROOT, "drizzle/migrations/meta/_journal.json"),
      "utf-8",
    );
    const journal = JSON.parse(rawJournal) as {
      entries: { idx: number; tag: string }[];
    };
    const entry = journal.entries.find(
      (e) => e.tag === "0021_rich_onboarding_harvest",
    );
    expect(entry).toBeDefined();
    expect(entry?.idx).toBe(21);
  });

  it("creates RLS-protected table and targets real live cockpit tables in 0021 SQL", () => {
    const sql = readFileSync(
      resolve(REPO_ROOT, "drizzle/migrations/0021_rich_onboarding_harvest.sql"),
      "utf-8",
    );

    // Table, profiles flag, and user-scoped RLS
    expect(sql).toMatch(
      /ALTER TABLE public\.profiles[\s\S]*onboarding_completed BOOLEAN NOT NULL DEFAULT false/i,
    );
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.user_executive_profiles");
    expect(sql).toContain("ALTER TABLE public.user_executive_profiles ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("USING (auth.uid() = user_id)");

    // Hardened SECURITY DEFINER RPC
    expect(sql).toContain(
      "CREATE OR REPLACE FUNCTION public.finalize_onboarding_and_populate_cockpit()",
    );
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = public");

    // Real live tables instead of phantom table names
    expect(sql).toContain("INSERT INTO public.decisions");
    expect(sql).toContain("INSERT INTO public.people_contacts");
    expect(sql).toContain("INSERT INTO public.relation_quality_history");
    expect(sql).toContain("INSERT INTO public.mood_entries");
    expect(sql).toContain("INSERT INTO public.toolbox_assignments");
    expect(sql).toContain("INSERT INTO public.aegis_health_scores");
    expect(sql).toContain("INSERT INTO public.guardian_onboarding");

    expect(sql).not.toContain("decision_logs");
    expect(sql).not.toContain("people_board_nodes");
  });
});
