import { useEffect } from "react";
import { useOptionalPrismR3fLandingLoad } from "../config/PrismR3fLandingLoadContext";

/** Signal : Environment + wasteland montés (Suspense résolu). */
export function PrismR3fLandingSceneReady() {
  const load = useOptionalPrismR3fLandingLoad();

  useEffect(() => {
    if (!load) return;
    load.reportSceneAssetsReady();
    load.reportProgress(100);
  }, [load]);

  return null;
}
