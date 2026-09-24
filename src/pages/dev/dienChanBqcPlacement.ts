import * as THREE from "three";
import { refineDiagramUvForPlacement } from "./dienChanMeshCalibration";
import { svgPointToUV } from "./dienChanFaceZones";

export type FaceProjectedBounds = {
  left: number;
  right: number;
  bottom: number;
  top: number;
};

const _v = new THREE.Vector3();

/**
 * Enveloppe écran (NDC) du mesh frontal — même repère que le diagramme Moricoli une fois le visage centré.
 */
export function computeFaceProjectedBounds(
  headMesh: THREE.Mesh,
  camera: THREE.Camera,
  minFront = 0.12,
): FaceProjectedBounds {
  headMesh.updateWorldMatrix(true, false);
  const geo = headMesh.geometry;
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  if (!box) {
    return { left: -0.35, right: 0.35, bottom: -0.45, top: 0.45 };
  }

  const min = box.min;
  const size = new THREE.Vector3().subVectors(box.max, min);
  const sx = Math.max(size.x, 1e-5);
  const sy = Math.max(size.y, 1e-5);
  const sz = Math.max(size.z, 1e-5);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;

  for (let i = 0; i < pos.count; i++) {
    const front = (pos.getZ(i) - min.z) / sz;
    if (front < minFront) continue;

    _v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    headMesh.localToWorld(_v);
    _v.project(camera);

    left = Math.min(left, _v.x);
    right = Math.max(right, _v.x);
    bottom = Math.min(bottom, _v.y);
    top = Math.max(top, _v.y);
  }

  if (!Number.isFinite(left)) {
    return { left: -0.35, right: 0.35, bottom: -0.45, top: 0.45 };
  }

  return { left, right, bottom, top };
}

/** Coordonnées SVG Moricoli → NDC pour raycast (caméra actuelle, visage face). */
export function diagramSvgToNdc(
  svgX: number,
  svgY: number,
  bounds: FaceProjectedBounds,
): THREE.Vector2 {
  const raw = svgPointToUV(svgX, svgY);
  const { u: du, v: dv } = refineDiagramUvForPlacement(raw.u, raw.v);
  const x = bounds.left + du * (bounds.right - bounds.left);
  const y = bounds.bottom + dv * (bounds.top - bounds.bottom);
  return new THREE.Vector2(x, y);
}

/** Position sur le mesh à partir des coords Moricoli (bbox + UV, toujours définie). */
export function diagramToHeadLocal(
  svgX: number,
  svgY: number,
  geometry: THREE.BufferGeometry,
  out = new THREE.Vector3(),
): THREE.Vector3 {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const size = new THREE.Vector3().subVectors(box.max, box.min);
  const sz = Math.max(size.z, 1e-5);
  const raw = svgPointToUV(svgX, svgY);
  const { u, v } = refineDiagramUvForPlacement(raw.u, raw.v);
  out.set(
    box.min.x + u * size.x,
    box.min.y + v * size.y,
    box.max.z - sz * 0.012,
  );
  return out;
}

/**
 * Point BQC précis sur la surface du mesh (espace local tête).
 * Raycast si possible, sinon repli bbox Moricoli.
 */
export function placeBqcPointOnMeshLocal(
  svgX: number,
  svgY: number,
  headMesh: THREE.Mesh,
  camera: THREE.Camera,
  raycaster: THREE.Raycaster,
  bounds: FaceProjectedBounds,
  out = new THREE.Vector3(),
): THREE.Vector3 | null {
  const ndc = diagramSvgToNdc(svgX, svgY, bounds);
  raycaster.setFromCamera(ndc, camera);

  const hits = raycaster.intersectObject(headMesh, false);
  const geo = headMesh.geometry;
  geo.computeBoundingBox();
  const box = geo.boundingBox;
  if (!box) return null;

  const size = new THREE.Vector3().subVectors(box.max, box.min);
  const sz = Math.max(size.z, 1e-5);
  const surfaceZ = box.max.z - sz * 0.02;

  if (hits.length > 0) {
    out.copy(hits[0].point);
    headMesh.worldToLocal(out);
    out.z = Math.max(out.z, surfaceZ);
    return out;
  }

  return diagramToHeadLocal(svgX, svgY, geo, out);
}
