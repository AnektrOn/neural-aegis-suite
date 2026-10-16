import { useCallback, useEffect, useMemo, useState } from "react";
import {
  cloneLandingStageLayout,
  computeLandingStageWorldPositions,
  DEFAULT_LANDING_STAGE_LAYOUT,
  loadLandingStageLayoutFromStorage,
  saveLandingStageLayoutToStorage,
  type LandingStageItemId,
  type LandingStageItemTransform,
  type LandingStageLayout,
  type LandingStageLinkMode,
} from "./landingStageLayout";

export function useLandingStageLayout() {
  const [layout, setLayout] = useState<LandingStageLayout>(() => {
    return loadLandingStageLayoutFromStorage() ?? cloneLandingStageLayout(DEFAULT_LANDING_STAGE_LAYOUT);
  });

  useEffect(() => {
    saveLandingStageLayoutToStorage(layout);
  }, [layout]);

  const worldPositions = useMemo(
    () => computeLandingStageWorldPositions(layout),
    [layout],
  );

  const setLink = useCallback((link: LandingStageLinkMode) => {
    setLayout((prev) => ({ ...prev, link }));
  }, []);

  const patchItem = useCallback(
    (id: LandingStageItemId, patch: Partial<LandingStageItemTransform>) => {
      setLayout((prev) => ({
        ...prev,
        items: {
          ...prev.items,
          [id]: { ...prev.items[id], ...patch },
        },
      }));
    },
  []);

  const patchCluster = useCallback(
    (patch: Partial<LandingStageLayout["cluster"]>) => {
      setLayout((prev) => ({
        ...prev,
        cluster: { ...prev.cluster, ...patch },
      }));
    },
    [],
  );

  const resetLayout = useCallback(() => {
    setLayout(cloneLandingStageLayout(DEFAULT_LANDING_STAGE_LAYOUT));
  }, []);

  return {
    layout,
    setLayout,
    worldPositions,
    setLink,
    patchItem,
    patchCluster,
    resetLayout,
  };
}
