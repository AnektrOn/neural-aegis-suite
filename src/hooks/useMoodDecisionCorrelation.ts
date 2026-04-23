import { useEffect, useState, useCallback } from "react";
import {
  computeMoodDecisionCorrelation,
  type MoodDecisionCorrelation,
} from "@/services/correlationService";

export function useMoodDecisionCorrelation(userId: string | undefined, windowDays = 90) {
  const [data, setData] = useState<MoodDecisionCorrelation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const result = await computeMoodDecisionCorrelation(userId, windowDays);
      setData(result);
    } catch (e) {
      console.error("useMoodDecisionCorrelation error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId, windowDays]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, refresh };
}
