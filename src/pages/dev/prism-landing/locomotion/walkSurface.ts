import * as THREE from "three";
import { WALK_WATER_LEVEL } from "../layout/prismSceneConstants";

export type WalkSurface = {
  waterLevel: number;
  getTerrainY: (x: number, z: number) => number;
  getFootHeight: (x: number, z: number) => number;
  pickGroundPoint: (
    camera: THREE.Camera,
    pointerNdc: THREE.Vector2,
  ) => THREE.Vector3 | null;
};

type CreateWalkSurfaceOptions = {
  terrainMesh: THREE.Mesh;
  getTerrainHeight: (x: number, z: number) => number;
  waterLevel?: number;
};

const RAY_ORIGIN_Y = 120;
const _raycaster = new THREE.Raycaster();
const _down = new THREE.Vector3(0, -1, 0);
const _fromAbove = new THREE.Vector3();
const _plane = new THREE.Plane();
const _planeHit = new THREE.Vector3();

export function createWalkSurface(options: CreateWalkSurfaceOptions): WalkSurface {
  const { terrainMesh, getTerrainHeight } = options;
  const waterLevel = options.waterLevel ?? WALK_WATER_LEVEL;

  const getTerrainY = (x: number, z: number) => {
    _fromAbove.set(x, RAY_ORIGIN_Y, z);
    _raycaster.set(_fromAbove, _down);
    const hits = _raycaster.intersectObject(terrainMesh, false);
    if (hits.length > 0) {
      return hits[0].point.y;
    }
    return getTerrainHeight(x, z);
  };

  const getFootHeight = (x: number, z: number) => Math.max(getTerrainY(x, z), waterLevel);

  const pickGroundPoint = (camera: THREE.Camera, pointerNdc: THREE.Vector2) => {
    _raycaster.setFromCamera(pointerNdc, camera);
    const hits = _raycaster.intersectObject(terrainMesh, false);
    if (hits.length > 0) {
      const p = hits[0].point;
      return new THREE.Vector3(p.x, Math.max(p.y, waterLevel), p.z);
    }

    _plane.set(new THREE.Vector3(0, 1, 0), -waterLevel);
    const planeHit = _raycaster.ray.intersectPlane(_plane, _planeHit);
    if (planeHit) {
      return new THREE.Vector3(planeHit.x, waterLevel, planeHit.z);
    }
    return null;
  };

  return {
    waterLevel,
    getTerrainY,
    getFootHeight,
    pickGroundPoint,
  };
}
