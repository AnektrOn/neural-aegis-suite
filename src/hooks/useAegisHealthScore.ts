import { useCallback, useEffect, useState } from "react";
import {
  computeDailyHealthScore,
  getHealthScoreTrend,
} from "@/services/aegisHealthScoreService";
import type { AegisHealthScore } from "@/types/aegisHealth";

interface UseAegisHealthScoreResult {
  score: AegisHealthScore | null;
  trend: AegisHealthScore[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const todayISO = (): string => new Date().toISOString().split("T")[0];

export function useAegisHealthScore(
  userId: string | undefined | null,
): UseAegisHealthScoreResult {
  const [score, setScore] = useState<AegisHealthScore | null>(null);
  const [trend, setTrend] = useState<AegisHealthScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const trendRows = await getHealthScoreTrend(userId, 30);
      const today = todayISO();
      const todays = trendRows.find((r) => r.score_date === today);
      if (todays) {
        setScore(todays);
        setTrend(trendRows);
      } else {
        const fresh = await computeDailyHealthScore(userId);
        setScore(fresh);
        const refreshed = await getHealthScoreTrend(userId, 30);
        setTrend(refreshed);
      }
    } catch (e) {
      console.error("useAegisHealthScore load error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const fresh = await computeDailyHealthScore(userId);
      setScore(fresh);
      const refreshed = await getHealthScoreTrend(userId, 30);
      setTrend(refreshed);
    } catch (e) {
      console.error("useAegisHealthScore refresh error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return { score, trend, isLoading, refresh };
}
