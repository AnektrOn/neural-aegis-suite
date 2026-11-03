import { useProgress } from "@react-three/drei";
import { useEffect } from "react";
import { useOptionalPrismR3fLandingLoad } from "../config/PrismR3fLandingLoadContext";

type Props = {
  onProgress: (pct: number) => void;
};

export function PrismR3fLandingLoadBridge({ onProgress }: Props) {
  const { progress, active } = useProgress();
  const load = useOptionalPrismR3fLandingLoad();

  useEffect(() => {
    onProgress(progress);
    load?.reportProgress(progress);
  }, [progress, onProgress, load]);

  useEffect(() => {
    if (!active && progress >= 100) {
      load?.reportProgress(100);
    }
  }, [active, progress, load]);

  return null;
}
