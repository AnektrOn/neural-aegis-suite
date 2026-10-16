import * as THREE from "three";
import type { GLTF } from "three-stdlib";

const GEOMETRY_ATTR_KEEP = ["position", "normal", "uv", "tangent"] as const;

/** Prefer this mesh/node name; falls back to the first mesh in the file. */
export function findPrismMesh(
  gltf: GLTF,
  preferredName?: string,
): THREE.Mesh {
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      meshes.push(child as THREE.Mesh);
    }
  });

  if (preferredName) {
    const named = meshes.find((m) => m.name === preferredName);
    if (named) return named;
  }

  if (meshes.length === 0) {
    throw new Error("Prism GLB contains no meshes.");
  }

  return meshes[0];
}

function stripExtraAttributes(geometry: THREE.BufferGeometry) {
  for (const key of Object.keys(geometry.attributes)) {
    if (!GEOMETRY_ATTR_KEEP.includes(key as (typeof GEOMETRY_ATTR_KEEP)[number])) {
      geometry.deleteAttribute(key);
    }
  }
}

/**
 * Bake node hierarchy into geometry, center it, and scale so height ≈ targetHeight.
 */
export function preparePrismGeometry(
  mesh: THREE.Mesh,
  targetHeight: number,
): THREE.BufferGeometry {
  const source = mesh.geometry;
  if (!source) {
    throw new Error(`Mesh "${mesh.name}" has no geometry.`);
  }

  const geometry = source.clone();
  mesh.updateWorldMatrix(true, true);
  geometry.applyMatrix4(mesh.matrixWorld);
  stripExtraAttributes(geometry);
  geometry.computeBoundingBox();

  const box = geometry.boundingBox;
  if (!box) {
    return geometry;
  }

  const size = new THREE.Vector3();
  box.getSize(size);
  const height = Math.max(size.y, 1e-6);
  const scale = targetHeight / height;
  geometry.scale(scale, scale, scale);
  geometry.center();
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Center the baked mesh, then scale it uniformly.
 * The Exocortex hero uses 0.7 on the raw shield, not a height target.
 */
export function bakePrismGeometry(
  mesh: THREE.Mesh,
  uniformScale: number,
): THREE.BufferGeometry {
  const source = mesh.geometry;
  if (!source) {
    throw new Error(`Mesh "${mesh.name}" has no geometry.`);
  }

  const geometry = source.clone();
  mesh.updateWorldMatrix(true, true);
  geometry.applyMatrix4(mesh.matrixWorld);
  stripExtraAttributes(geometry);
  geometry.center();
  geometry.scale(uniformScale, uniformScale, uniformScale);
  geometry.computeVertexNormals();
  return geometry;
}
