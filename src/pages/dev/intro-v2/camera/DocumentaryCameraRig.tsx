import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { IntroV2ChapterId } from "../introV2Copy";
import { holdChapterMix, type HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";
import { INTRO_V2_CAMERA_PATHS } from "./introV2CameraPaths";

export type DocumentaryCameraOverrides = {
  pathSpeed?: number;
  handheld?: number;
  fovMin?: number;
  fovMax?: number;
};

type Props = {
  chapter: IntroV2ChapterId;
  hold: MutableRefObject<HoldState>;
  phase?: IntroPhase;
  overrides?: DocumentaryCameraOverrides;
  /** When false, hold does not push the camera along the path (flow DOF uses hold on particles). */
  holdPathInfluence?: boolean;
};

const _look = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _ahead = new THREE.Vector3();

/**
 * Nature-documentary style drift: smooth spline travel, subtle handheld, hold = gentle push-in.
 */
export function DocumentaryCameraRig({
  chapter,
  hold,
  phase,
  overrides,
  holdPathInfluence = true,
}: Props) {
  const { camera } = useThree();
  const path = INTRO_V2_CAMERA_PATHS[chapter];
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path.points, true, "catmullrom", 0.35), [path.points]);
  const sway = useRef(0);

  useFrame((state, delta) => {
    const s = hold.current;
    const elapsed = state.clock.elapsedTime;
    const phaseBoost = phase === "interact" ? 0.35 : phase === "narrate" ? 0.15 : 0;
    const holdPush = holdPathInfluence
      ? holdChapterMix(s, phase ?? "entry") * (0.12 + phaseBoost * 0.08)
      : 0;

    const pathSpeed = overrides?.pathSpeed ?? path.speed;
    const handheld = overrides?.handheld ?? 1;
    const u = (elapsed * pathSpeed + holdPush) % 1;
    curve.getPointAt(u, _pos);

    // Micro sway (handheld gimbal, not shaky cam).
    sway.current += delta;
    const sw = sway.current;
    _pos.x += Math.sin(sw * 0.31) * 0.35 * handheld;
    _pos.y += Math.cos(sw * 0.27) * 0.22 * handheld;
    _pos.z += Math.sin(sw * 0.19) * 0.18 * handheld;

    const k = 1 - Math.exp(-delta * 1.35);
    camera.position.lerp(_pos, k);

    curve.getTangentAt(u, _ahead);
    _look.copy(path.lookAt).addScaledVector(_ahead, 2.5);
    _look.y += Math.sin(sw * 0.22) * 0.15;
    camera.lookAt(_look);

    const fovRange = path.fov;
    if (fovRange && camera instanceof THREE.PerspectiveCamera) {
      const fovMin = overrides?.fovMin ?? fovRange.min;
      const fovMax = overrides?.fovMax ?? fovRange.max;
      const fovWave = (Math.sin(elapsed * 0.12) + 1) * 0.5;
      const targetFov = fovMin + (fovMax - fovMin) * fovWave;
      camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 0.8);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
