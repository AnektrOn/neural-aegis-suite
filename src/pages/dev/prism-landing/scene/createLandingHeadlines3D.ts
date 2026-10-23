import * as THREE from "three";

/** Headlines 3D (pré-plan copy) — stub : aucun snapshot non vide avant le 22/10 11:44. */
export type LandingHeadline = {
  group: THREE.Group;
  exhibit: "intro" | "cube" | "marble" | "portal";
  setVisible: (on: boolean) => void;
  dispose: () => void;
};

type CreateLandingHeadlines3DOptions = {
  scene: THREE.Scene;
  getGroundHeight: (x: number, z: number) => number;
  applyLightFalloff?: (material: THREE.Material) => void;
  cubeWorld: { x: number; z: number };
  marbleWorld: { x: number; z: number };
};

export async function createLandingHeadlines3D(
  _options: CreateLandingHeadlines3DOptions,
): Promise<LandingHeadline[]> {
  return [];
}
