import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  computeDailyHealthScore,
  getHealthScoreTrend,
} from "@/services/aegisHealthScoreService";
import type { AegisHealthScore } from "@/types/aegisHealth";

const todayISO = (): string => new Date().toISOString().split("T")[0];

async function fetchAegisHealthScore(userId: string): Promise<{
  score: AegisHealthScore | null;
  trend: AegisHealthScore[];
}> {
  const trendRows = await getHealthScoreTrend(userId, 30);
  const today = todayISO();
  const todays = trendRows.find((r) => r.score_date === today);
  if (todays) {
    return { score: todays, trend: trendRows };
  }
  const fresh = await computeDailyHealthScore(userId);
  const mergedTrend = [
    ...trendRows.filter((r) => r.score_date !== fresh.score_date),
    fresh,
  ].sort((a, b) => a.score_date.localeCompare(b.score_date));
  return { score: fresh, trend: mergedTrend };
}

export function useAegisHealthScore(userId: string | undefined | null) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["aegis-health", userId],
    queryFn: () => fetchAegisHealthScore(userId!),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const refresh = useCallback(async () => {
    if (!userId) return;
    const fresh = await computeDailyHealthScore(userId);
    queryClient.setQueryData(
      ["aegis-health", userId],
      (prev: { score: AegisHealthScore | null; trend: AegisHealthScore[] } | undefined) => {
        const trend = prev?.trend ?? [];
        const merged = [
          ...trend.filter((r) => r.score_date !== fresh.score_date),
          fresh,
        ].sort((a, b) => a.score_date.localeCompare(b.score_date));
        return { score: fresh, trend: merged };
      },
    );
    void refetch();
  }, [userId, queryClient, refetch]);

  return {
    score: data?.score ?? null,
    trend: data?.trend ?? [],
    isLoading,
    refresh,
  };
}
