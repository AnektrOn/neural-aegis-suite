export interface WeeklyDigest {
  moodTrend: "up" | "down" | "stable";
  moodDelta: number;
  habitRate: number;
  decisionsResolved: number;
  journalCount: number;
  streakDays: number;
  moodSeries?: number[];
}

export interface MobileHabit {
  id: string;
  name: string;
  category: string;
  completed: boolean;
}

export const PULL_REFRESH_HINT_KEY = "aegis_pull_refresh_hint_dismissed";

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.16, delay, ease: "easeOut" as const },
});

export const priorityBadge = (p: number): { label: string; cls: string } => {
  if (p >= 5) return { label: "P" + p, cls: "bg-destructive/10 text-destructive" };
  if (p >= 3) return { label: "P" + p, cls: "bg-warning/10 text-warning" };
  return { label: "P" + p, cls: "bg-transparent text-muted-foreground" };
};
