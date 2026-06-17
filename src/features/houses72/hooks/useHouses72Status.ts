import { useEffect, useState } from "react";
import {
  getHouses72CompletionMap,
} from "@/features/archetype-assessment/services/houses72Service";
import {
  getPopulatedHouses,
} from "@/features/archetype-assessment/domain/houses72Scoring";

export interface Houses72Status {
  /** Houses that have all 6 questions answered. */
  completedHouses: number;
  /** Total number of houses with questions (currently 6). */
  totalHouses: number;
  /** True if the user has answered at least one question. */
  hasAnyProgress: boolean;
  /** True if every populated house is fully answered. */
  isFullyComplete: boolean;
  loading: boolean;
}

const POPULATED = getPopulatedHouses();

export function useHouses72Status(userId: string | undefined): Houses72Status {
  const [completionMap, setCompletionMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);
    getHouses72CompletionMap(userId)
      .then((map) => {
        if (alive) setCompletionMap(map);
      })
      .catch(() => {
        // silently ignore — CTA will show "Commencer"
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId]);

  const completedHouses = POPULATED.filter(
    (h) => (completionMap[h] ?? 0) >= 6,
  ).length;
  const totalHouses = POPULATED.length;
  const hasAnyProgress = Object.keys(completionMap).length > 0;
  const isFullyComplete = completedHouses >= totalHouses;

  return { completedHouses, totalHouses, hasAnyProgress, isFullyComplete, loading };
}
