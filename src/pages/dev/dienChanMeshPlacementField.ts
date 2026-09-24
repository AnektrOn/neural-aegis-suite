import * as THREE from "three";
import {
  computeFaceProjectedBounds,
  diagramSvgToNdc,
  diagramToHeadLocal,
  type FaceProjectedBounds,
} from "./dienChanBqcPlacement";

const _raycaster = new THREE.Raycaster();

export type MeshPlacementField = {
  box: THREE.Box3;
  bounds: FaceProjectedBounds;
};

export function buildMeshPlacementField(
  headMesh: THREE.Mesh,
  camera: THREE.Camera,
): MeshPlacementField {
  headMesh.updateWorldMatrix(true, false);
  camera.updateMatrixWorld();
  const bounds = computeFaceProjectedBounds(headMesh, camera);
  headMesh.geometry.computeBoundingBox();
  const box = headMesh.geometry.boundingBox!.clone();
  return { box, bounds };
}

/**
 * Point Moricoli sur la surface du mesh (raycast NDC, repli bbox).
 */
export function placeSvgOnMeshField(
  svgX: number,
  svgY: number,
  field: MeshPlacementField,
  headMesh: THREE.Mesh,
  camera: THREE.Camera,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  const { bounds, box } = field;
  const ndc = diagramSvgToNdc(svgX, svgY, bounds);

  headMesh.updateWorldMatrix(true, false);
  camera.updateMatrixWorld();
  _raycaster.setFromCamera(ndc, camera);
  const hits = _raycaster.intersectObject(headMesh, false);

  const geo = headMesh.geometry;
  const min = box.min;
  const size = new THREE.Vector3().subVectors(box.max, min);

  if (hits.length > 0) {
    out.copy(hits[0].point);
    headMesh.worldToLocal(out);
    const sz = Math.max(size.z, 1e-5);
    out.z += sz * 0.003;
    return out;
  }

  diagramToHeadLocal(svgX, svgY, geo, out);
  return out;
}
