import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/** Premier frame en frameloop="demand". */
export function LandingR3fDemandInvalidate() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    invalidate();
  }, [invalidate]);
  return null;
}
