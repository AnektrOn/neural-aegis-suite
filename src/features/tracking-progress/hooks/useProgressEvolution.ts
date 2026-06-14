/**
 * useProgressEvolution
 *
 * Loads the latest evolution snapshots for the current user × Myss perspective.
 */

import { useState, useEffect } from "react";
import type { TrackingProgressSnapshot } from "../domain/types";
import { loadProgressSnapshots } from "../services/trackingAnalysisService";
import { loadAdherenceStats } from "../services/trackingDailyService";
import { loadPerspectiveBySlug } from "../services/trackingQuestionService";

export interface ProgressEvolutionData {
  isLoading: boolean;
  snapshots: TrackingProgressSnapshot[];
  latestSnapshot: TrackingProgressSnapshot | null;
  adherence: { answeredDays: number; totalDays: number; streak: number } | null;
  error: string | null;
}

const MYSS_SLUG = "myss-archetype";

export function useProgressEvolution(userId: string | undefined): ProgressEvolutionData {
  const [isLoading, setIsLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<TrackingProgressSnapshot[]>([]);
  const [adherence, setAdherence] = useState<ProgressEvolutionData["adherence"]>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const perspectivePromise = loadPerspectiveBySlug(MYSS_SLUG);
        const adherencePromise = perspectivePromise.then((perspective) =>
          perspective ? loadAdherenceStats(userId, perspective.id, 14) : null,
        );

        const [snaps, stats] = await Promise.all([
          loadProgressSnapshots(userId, MYSS_SLUG),
          adherencePromise,
        ]);

        if (cancelled) return;
        setSnapshots(snaps);
        if (stats) setAdherence(stats);
      } catch (err) {
        if (!cancelled) {
          console.error("useProgressEvolution: error", err);
          setError(err instanceof Error ? err.message : "Erreur de chargement");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [userId]);

  return {
    isLoading,
    snapshots,
    latestSnapshot: snapshots[0] ?? null,
    adherence,
    error,
  };
}
