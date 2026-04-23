export interface AegisHealthScore {
  id: string;
  user_id: string;
  score_date: string;
  overall_score: number;
  mood_score: number;
  decision_score: number;
  habit_score: number;
  journal_score: number;
  relation_score: number;
  archetype_coherence: number;
  log_regularity: number;
  computed_at: string;
}

export interface UserHealthSummary {
  user_id: string;
  display_name: string | null;
  company_id: string | null;
  latest_score: number;
  latest_date: string;
  trend: "up" | "down" | "stable";
  delta: number;
}
