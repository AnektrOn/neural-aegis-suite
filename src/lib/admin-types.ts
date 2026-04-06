export interface AdminProfile {
  id: string;
  display_name: string | null;
  company_id: string | null;
  country: string | null;
  is_disabled: boolean;
  created_at: string;
  timezone: string | null;
}

export interface AdminMoodEntry {
  id: string;
  user_id: string;
  value: number;
  sleep: number | null;
  stress: number | null;
  meals_count: number | null;
  logged_at: string;
}

export interface AdminJournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  tags: string[];
  mood_score: number | null;
  created_at: string;
}

export interface AdminDecision {
  id: string;
  user_id: string;
  name: string;
  priority: number;
  responsibility: number;
  status: 'pending' | 'decided' | 'deferred';
  created_at: string;
  decided_at: string | null;
  time_to_decide: string | null;
}

export interface AdminHabitCompletion {
  id: string;
  user_id: string;
  assigned_habit_id: string;
  completed_date: string;
}

export interface AdminSession {
  id: string;
  user_id: string;
  page: string;
  started_at: string;
  ended_at: string | null;
  last_heartbeat: string;
}

export interface AdminHesitation {
  id: string;
  user_id: string;
  page: string;
  input_name: string;
  hesitation_ms: number;
  created_at: string;
}

export interface AdminAuditCall {
  id: string;
  user_id: string;
  conducted_by: string;
  call_date: string;
  leadership_score: number | null;
  emotional_baseline: number | null;
  decision_style: string | null;
  key_challenges: string | null;
  goals: string | null;
  notes: string | null;
  created_at: string;
}

export interface AdminToolboxCompletion {
  id: string;
  user_id: string;
  assignment_id: string;
  status: 'completed' | 'abandoned' | 'ignored';
  completed_at: string;
}

export interface AdminToolboxAssignment {
  id: string;
  user_id: string;
  title: string;
  content_type: string;
  duration: string | null;
  assigned_at: string;
}

export interface AdminDailyScoreboard {
  id: string;
  user_id: string;
  score_date: string;
  total_score: number;
  max_score: number;
  breakdown: Array<{
    criteria_id: string;
    label: string;
    earned: number;
    max: number;
    met: boolean;
  }>;
}

export interface AlertSignal {
  userId: string;
  userName: string;
  companyName: string | null;
  type:
    | 'mood_drop'
    | 'no_login'
    | 'habit_streak_broken'
    | 'tool_abandoned_twice'
    | 'decision_stale'
    | 'no_journal';
  severity: 'low' | 'medium' | 'high';
  detail: string;
  since: string;
}
