import { useCallback, useEffect, useRef, useState } from "react";
import { loadTaoPortraitParts } from "../services/taoPortraitService";
import type { TaoPortraitPartRow } from "../domain/types";

export function useTaoPortrait(userId: string | undefined) {
  const [parts, setParts] = useState<TaoPortraitPartRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seqRef = useRef(0);

  const load = useCallback(async () => {
    if (!userId) {
      setParts([]);
      setError(null);
      setLoading(false);
      return;
    }

    const seq = ++seqRef.current;
    setLoading(true);
    setError(null);

    try {
      const rows = await loadTaoPortraitParts(userId);
      if (seqRef.current !== seq) return;
      setParts(rows);
    } catch (e: unknown) {
      if (seqRef.current === seq) {
        setError(e instanceof Error ? e.message : "Failed to load Tao portrait");
      }
    } finally {
      if (seqRef.current === seq) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { parts, loading, error, reload: load };
}
