import { useCallback, useEffect, useState } from "react";
import {
  compareSnapshots,
  getSnapshotHistory,
  type ArchetypeProfileSnapshot,
  type SnapshotDelta,
} from "../services/snapshotService";

interface UseSnapshotHistoryResult {
  snapshots: ArchetypeProfileSnapshot[];
  latest: ArchetypeProfileSnapshot | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  compare: (idA: string, idB: string) => Promise<SnapshotDelta>;
}

export function useSnapshotHistory(
  userId: string | undefined | null,
): UseSnapshotHistoryResult {
  const [snapshots, setSnapshots] = useState<ArchetypeProfileSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setSnapshots([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await getSnapshotHistory(userId);
      setSnapshots(rows);
    } catch (e) {
      console.error("useSnapshotHistory load error", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const compare = useCallback(
    (idA: string, idB: string) => compareSnapshots(idA, idB),
    [],
  );

  return {
    snapshots,
    latest: snapshots[0] ?? null,
    isLoading,
    refresh: load,
    compare,
  };
}
