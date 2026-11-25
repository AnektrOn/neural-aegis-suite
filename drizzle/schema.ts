import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export interface StakeholderSeedItem {
  id: string;
  name: string;
  role: string;
  role_label?: string;
  tension_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface RawDilemmaResponseEntry {
  questionPosition: number;
  dimension: string;
  optionPosition: number;
  intensity: 1 | 2 | 3;
  answeredAt: string;
}

/**
 * Executive onboarding harvest table backing the 5-step mobile-first funnel
 * and `public.finalize_onboarding_and_populate_cockpit()`.
 */
export const userExecutiveProfiles = pgTable("user_executive_profiles", {
  userId: uuid("user_id").primaryKey(),
  roleTitle: text("role_title"),
  companyStage: text("company_stage"),
  teamSize: text("team_size"),
  annualRevenueBracket: text("annual_revenue_bracket"),
  governanceStructure: text("governance_structure"),
  primaryStakeholders: jsonb("primary_stakeholders")
    .$type<StakeholderSeedItem[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  urgentDecisionTitle: text("urgent_decision_title"),
  urgentDecisionStakes: text("urgent_decision_stakes"),
  urgentDecisionHorizon: text("urgent_decision_horizon"),
  dominantDecisionFriction: text("dominant_decision_friction"),
  rawDilemmaResponses: jsonb("raw_dilemma_responses")
    .$type<Record<string, RawDilemmaResponseEntry>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  peakFocusTime: text("peak_focus_time"),
  stressSymptoms: text("stress_symptoms")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  onboardingStepReached: integer("onboarding_step_reached").notNull().default(1),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`timezone('utc'::text, now())`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`timezone('utc'::text, now())`),
});

export type UserExecutiveProfile = typeof userExecutiveProfiles.$inferSelect;
export type NewUserExecutiveProfile = typeof userExecutiveProfiles.$inferInsert;
