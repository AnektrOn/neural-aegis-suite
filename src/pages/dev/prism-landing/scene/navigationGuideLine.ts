import * as THREE from "three";
import { SCENE_ANCHORS } from "../layout/prismSceneConstants";
import type { WalkSurface } from "../locomotion/walkSurface";

const GUIDE_LIFT = 0.16;
const TUBE_RADIUS = 0.06;
const TUBE_SEGMENTS = 64;
const RADIAL_SEGMENTS = 6;

export type NavigationGuideLine = {
  group: THREE.Group;
  setVisible: (on: boolean) => void;
  setOpacity: (opacity: number) => void;
  dispose: () => void;
};

export function createNavigationGuideLine(
  scene: THREE.Scene,
  walkSurface: WalkSurface,
): NavigationGuideLine {
  const foot = (x: number, z: number) => walkSurface.getFootHeight(x, z) + GUIDE_LIFT;

  const controlPoints = [
    new THREE.Vector3(
      SCENE_ANCHORS.scene1Cube.x,
      foot(SCENE_ANCHORS.scene1Cube.x, SCENE_ANCHORS.scene1Cube.z),
      SCENE_ANCHORS.scene1Cube.z,
    ),
    new THREE.Vector3(-18, foot(-18, 22), 22),
    new THREE.Vector3(
      SCENE_ANCHORS.scene2Marble.x - 6,
      foot(SCENE_ANCHORS.scene2Marble.x - 6, SCENE_ANCHORS.scene2Marble.z + 8),
      SCENE_ANCHORS.scene2Marble.z + 8,
    ),
    new THREE.Vector3(
      SCENE_ANCHORS.scene2Marble.x,
      foot(SCENE_ANCHORS.scene2Marble.x, SCENE_ANCHORS.scene2Marble.z),
      SCENE_ANCHORS.scene2Marble.z,
    ),
    new THREE.Vector3(22, foot(22, 4), 4),
    new THREE.Vector3(
      SCENE_ANCHORS.scene3Portal.x,
      foot(SCENE_ANCHORS.scene3Portal.x, SCENE_ANCHORS.scene3Portal.z),
      SCENE_ANCHORS.scene3Portal.z,
    ),
  ];

  const curve = new THREE.CatmullRomCurve3(controlPoints, false, "centripetal");
  const tubeGeo = new THREE.TubeGeometry(curve, TUBE_SEGMENTS, TUBE_RADIUS, RADIAL_SEGMENTS, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xffc978,
    emissive: 0xffa040,
    emissiveIntensity: 0.55,
    metalness: 0.1,
    roughness: 0.65,
    transparent: true,
    opacity: 0.72,
  });

  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  tube.castShadow = false;
  tube.receiveShadow = false;

  const group = new THREE.Group();
  group.name = "NavigationGuideLine";
  group.add(tube);
  group.visible = false;
  scene.add(group);

  return {
    group,
    setVisible(on: boolean) {
      group.visible = on;
    },
    setOpacity(opacity: number) {
      tubeMat.opacity = opacity;
    },
    dispose() {
      scene.remove(group);
      tubeGeo.dispose();
      tubeMat.dispose();
    },
  };
}
