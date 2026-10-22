import * as THREE from "three";

export type PathSampleKeyframe = {
  u: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

export type PathKeyframeU = { u: number };

/** Index d’étape (0…n−1) pour un paramètre u sur la timeline des keyframes. */
export function keyframeStepIndexForU(keyframes: PathKeyframeU[], u: number): number {
  if (keyframes.length === 0) return 0;
  const sorted = [...keyframes].sort((a, b) => a.u - b.u);
  let idx = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (u >= sorted[i].u - 1e-6) idx = i;
  }
  return idx;
}

/**
 * Interpole position + lookAt selon le champ `u` de chaque keyframe
 * (pas le paramètre arc-length d'une spline globale).
 */
export function samplePathAtKeyframeU(
  keyframes: PathSampleKeyframe[],
  u: number,
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  if (keyframes.length === 0) {
    return {
      position: new THREE.Vector3(),
      lookAt: new THREE.Vector3(),
    };
  }
  if (keyframes.length === 1) {
    return {
      position: keyframes[0].position.clone(),
      lookAt: keyframes[0].lookAt.clone(),
    };
  }

  const sorted = [...keyframes].sort((a, b) => a.u - b.u);
  const uMin = sorted[0].u;
  const uMax = sorted[sorted.length - 1].u;
  const uClamp = THREE.MathUtils.clamp(u, uMin, uMax);

  let seg = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (uClamp <= sorted[i + 1].u + 1e-9) {
      seg = i;
      break;
    }
    seg = i;
  }

  const a = sorted[seg];
  const b = sorted[seg + 1];
  const span = b.u - a.u;
  const t = span > 1e-9 ? (uClamp - a.u) / span : 0;

  return {
    position: new THREE.Vector3().lerpVectors(a.position, b.position, t),
    lookAt: new THREE.Vector3().lerpVectors(a.lookAt, b.lookAt, t),
  };
}

/** Points pour dessiner la courbe (échantillonnage sur l'axe u des keyframes). */
export function samplePathPolyline(
  keyframes: PathSampleKeyframe[],
  segments = 64,
): THREE.Vector3[] {
  if (keyframes.length < 2) return [];
  const sorted = [...keyframes].sort((a, b) => a.u - b.u);
  const u0 = sorted[0].u;
  const u1 = sorted[sorted.length - 1].u;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const u = u0 + (i / segments) * (u1 - u0);
    pts.push(samplePathAtKeyframeU(sorted, u).position);
  }
  return pts;
}
