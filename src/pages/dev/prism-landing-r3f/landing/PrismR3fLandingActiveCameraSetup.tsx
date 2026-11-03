import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { R3F_SHATTERED_CUBE_LIGHT_LAYER } from "../scene/shatteredCube/r3fShatteredCubeConstants";

/** Theatre remplace la caméra Canvas : réappliquer les layers lab (cube layer 1). */
export function PrismR3fLandingActiveCameraSetup() {
  const camera = useThree((s) => s.camera);

  useLayoutEffect(() => {
    camera.layers.enable(0);
    camera.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
  }, [camera]);

  return null;
}
