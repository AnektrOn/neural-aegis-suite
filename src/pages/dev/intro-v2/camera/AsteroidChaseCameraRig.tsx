import { useLayoutEffect, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { holdChapterMix, type HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";
import { sampleAsteroidNarrative } from "../scenes/asteroid-fall/asteroidNarrative";
import {
  ASTEROID_FILM_TIME_K1,
  ASTEROID_FILM_TIME_K4,
  asteroidFilmPose,
} from "../scenes/asteroid-fall/asteroidFallCamera";

type Props = {
  hold: MutableRefObject<HoldState>;
  phase?: IntroPhase;
};

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

/**
 * Scene 1: hold orbits K1 → K2 → K4. The level stays at its peak after release.
 */
export function AsteroidChaseCameraRig({ hold, phase }: Props) {
  const { camera } = useThree();

  useLayoutEffect(() => {
    const fov = asteroidFilmPose(ASTEROID_FILM_TIME_K1, _pos, _look);
    camera.position.copy(_pos);
    camera.lookAt(_look);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.near = 0.1;
      camera.far = 800;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  useFrame(() => {
    const mix = holdChapterMix(hold.current, phase);
    const { filmT } = sampleAsteroidNarrative(mix);
    const filmTime =
      ASTEROID_FILM_TIME_K1 + filmT * (ASTEROID_FILM_TIME_K4 - ASTEROID_FILM_TIME_K1);

    const fov = asteroidFilmPose(filmTime, _pos, _look);
    camera.position.copy(_pos);
    camera.lookAt(_look);

    if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
