import { useThree } from "@react-three/fiber";
import type { Texture } from "three";

/** PMREM from `<Environment />` or `useRoomEnvMap`. */
export function useSceneEnvMap(): Texture | undefined {
  return useThree((state) => state.scene.environment ?? undefined);
}
