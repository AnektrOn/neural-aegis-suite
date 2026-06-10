export interface DecisionRecord {
  id: string;
  name: string;
  priority: number;
  responsibility: number;
  status: string;
  created_at: string;
  decided_at: string | null;
  deferred_until: string | null;
  time_to_decide: string | null;
}

export interface DecisionAnalytics {
  total: number;
  pendingCount: number;
  decidedCount: number;
  deferredCount: number;
  decidedThisWeek: number;
  avgResolutionHours: number;
  oldestPendingDays: number;
  statusPie: { name: string; value: number; fill: string }[];
  weeklyResolved: { day: string; count: number }[];
  priorityBars: { priority: string; count: number }[];
}

const STATUS_COLORS = {
  pending: "hsl(var(--warning))",
  decided: "hsl(var(--primary))",
  deferred: "hsl(var(--muted-foreground))",
} as const;

export function formatDecisionDuration(createdAt: string, decidedAt: string): string {
  const diff = new Date(decidedAt).getTime() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}min`;
}

export function buildDecisionAnalytics(
  decisions: DecisionRecord[],
  labels: { pending: string; decided: string; deferred: string },
  dateLocale: string,
): DecisionAnalytics {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const pending = decisions.filter((d) => d.status === "pending");
  const decided = decisions.filter((d) => d.status === "decided");
  const deferred = decisions.filter((d) => d.status === "deferred");

  const decidedThisWeek = decided.filter(
    (d) => d.decided_at && new Date(d.decided_at) >= weekAgo,
  ).length;

  const durations = decided
    .filter((d) => d.decided_at)
    .map(
      (d) =>
        (new Date(d.decided_at!).getTime() - new Date(d.created_at).getTime()) /
        3_600_000,
    );
  const avgResolutionHours =
    durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  const oldestPendingDays =
    pending.length > 0
      ? Math.max(
          ...pending.map((p) =>
            Math.floor((now.getTime() - new Date(p.created_at).getTime()) / 86_400_000),
          ),
        )
      : 0;

  const statusPie = [
    { name: labels.pending, value: pending.length, fill: STATUS_COLORS.pending },
    { name: labels.decided, value: decided.length, fill: STATUS_COLORS.decided },
    { name: labels.deferred, value: deferred.length, fill: STATUS_COLORS.deferred },
  ].filter((s) => s.value > 0);

  const weeklyResolved: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const day = d.toLocaleDateString(dateLocale, { weekday: "short" });
    const count = decided.filter((dec) => dec.decided_at?.startsWith(key)).length;
    weeklyResolved.push({ day, count });
  }

  const priorityMap = new Map<number, number>();
  for (const d of decisions) {
    const p = Math.min(5, Math.max(0, Math.round(d.priority)));
    priorityMap.set(p, (priorityMap.get(p) ?? 0) + 1);
  }
  const priorityBars = [0, 1, 2, 3, 4, 5].map((p) => ({
    priority: `P${p}`,
    count: priorityMap.get(p) ?? 0,
  }));

  return {
    total: decisions.length,
    pendingCount: pending.length,
    decidedCount: decided.length,
    deferredCount: deferred.length,
    decidedThisWeek,
    avgResolutionHours,
    oldestPendingDays,
    statusPie,
    weeklyResolved,
    priorityBars,
  };
}

export function formatAvgHours(hours: number, locale: string): string {
  if (hours <= 0) return "—";
  if (hours < 1) {
    const min = Math.round(hours * 60);
    return locale === "fr" ? `${min} min` : `${min}m`;
  }
  if (hours < 24) return locale === "fr" ? `${Math.round(hours)} h` : `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return locale === "fr" ? `${days} j` : `${days}d`;
}
