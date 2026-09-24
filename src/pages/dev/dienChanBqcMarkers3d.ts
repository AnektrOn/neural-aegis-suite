import * as THREE from "three";
import type { MeshPlacementField } from "./dienChanMeshPlacementField";
import { placeSvgOnMeshField } from "./dienChanMeshPlacementField";

export type BqcMarker3d = {
  id: number;
  mesh: THREE.Mesh;
  spotlight: boolean;
  /** Multiplicateur densité (clusters sourcils etc.) — appliqué aussi au pulse. */
  radiusScale: number;
};

/** Rayon relatif à la hauteur du mesh tête (points isolés). */
export const MARKER_RADIUS_RATIO = 0.0026;
export const MARKER_RADIUS_SPOT_RATIO = 0.005;
const MARKER_GLOW_RADIUS_RATIO = 0.012;
/** Sphère de pick invisible (tap mobile ≥ ~44px visuel selon zoom). */
const MARKER_HIT_RADIUS_RATIO = 0.014;

/** Distance SVG (cadre ~400×450) en dessous de laquelle on réduit le marqueur. */
const DENSE_SVG_PX = 14;
const DENSE_MIN_SCALE = 0.38;

export const BQC_MARKER_USER_DATA_KEY = "bqcId";

export function headMeshSpanY(geometry: THREE.BufferGeometry): number {
  geometry.computeBoundingBox();
  const b = geometry.boundingBox;
  return b ? Math.max(b.max.y - b.min.y, 1e-5) : 1;
}

/**
 * Plus le voisin SVG est proche, plus le point est petit — évite le « pâté » sourcils.
 */
export function densityRadiusScale(minNeighborSvgPx: number): number {
  if (!Number.isFinite(minNeighborSvgPx) || minNeighborSvgPx >= DENSE_SVG_PX) return 1;
  const t = Math.max(0, minNeighborSvgPx) / DENSE_SVG_PX;
  return DENSE_MIN_SCALE + (1 - DENSE_MIN_SCALE) * t * t;
}

type SvgSite = { id: number; x: number; y: number };

function collectSvgSites(
  pointIds: number[],
  coords: Record<number, { x: number; y: number }[]>,
): SvgSite[] {
  const sites: SvgSite[] = [];
  for (const id of pointIds) {
    const list = coords[id];
    if (!list?.length) continue;
    for (const c of list) sites.push({ id, x: c.x, y: c.y });
  }
  return sites;
}

function minNeighborDistance(sites: SvgSite[], index: number): number {
  const a = sites[index];
  let min = Infinity;
  for (let i = 0; i < sites.length; i++) {
    if (i === index) continue;
    const b = sites[i];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < min) min = d;
  }
  return min;
}

export function rebuildBqcMarkersOnHead(
  headMesh: THREE.Mesh,
  markersGroup: THREE.Group,
  options: {
    pointIds: number[];
    coords: Record<number, { x: number; y: number }[]>;
    spotlightId: number | null;
    placementField: MeshPlacementField;
    camera: THREE.Camera;
    sharedGeo: THREE.SphereGeometry;
    matSpot: THREE.MeshBasicMaterial;
    matRef: THREE.MeshBasicMaterial;
    matGlow: THREE.MeshBasicMaterial;
    hitMat: THREE.MeshBasicMaterial;
    existing: BqcMarker3d[];
  },
): BqcMarker3d[] {
  const {
    pointIds,
    coords,
    spotlightId,
    placementField,
    camera,
    sharedGeo,
    matSpot,
    matRef,
    matGlow,
    hitMat,
  } = options;

  while (markersGroup.children.length > 0) {
    markersGroup.remove(markersGroup.children[0]);
  }

  const span = headMeshSpanY(headMesh.geometry);
  const baseR = span * MARKER_RADIUS_RATIO;
  const spotR = span * MARKER_RADIUS_SPOT_RATIO;
  const hitR = span * MARKER_HIT_RADIUS_RATIO;
  const localHit = new THREE.Vector3();
  const out: BqcMarker3d[] = [];

  const sites = collectSvgSites(pointIds, coords);
  let siteIndex = 0;

  for (const id of pointIds) {
    const list = coords[id];
    if (!list?.length) continue;
    const spotlight = spotlightId === id;

    for (const c of list) {
      const radiusScale = spotlight
        ? 1
        : densityRadiusScale(minNeighborDistance(sites, siteIndex));
      siteIndex += 1;

      placeSvgOnMeshField(c.x, c.y, placementField, headMesh, camera, localHit);

      const mesh = new THREE.Mesh(sharedGeo, spotlight ? matSpot : matRef);
      mesh.position.copy(localHit);
      const r = (spotlight ? spotR : baseR) * radiusScale;
      mesh.scale.setScalar(r);
      mesh.renderOrder = 20;
      mesh.frustumCulled = false;
      mesh.userData[BQC_MARKER_USER_DATA_KEY] = id;

      const hit = new THREE.Mesh(sharedGeo, hitMat);
      hit.position.copy(localHit);
      hit.scale.setScalar(Math.max(hitR, r * 1.8));
      hit.renderOrder = 19;
      hit.frustumCulled = false;
      hit.userData[BQC_MARKER_USER_DATA_KEY] = id;

      if (spotlight) {
        const glow = new THREE.Mesh(sharedGeo, matGlow);
        glow.position.copy(localHit);
        glow.scale.setScalar(span * MARKER_GLOW_RADIUS_RATIO);
        glow.renderOrder = 18;
        glow.frustumCulled = false;
        markersGroup.add(glow);
      }

      markersGroup.add(hit);
      markersGroup.add(mesh);
      out.push({ id, mesh, spotlight, radiusScale });
    }
  }

  return out;
}
