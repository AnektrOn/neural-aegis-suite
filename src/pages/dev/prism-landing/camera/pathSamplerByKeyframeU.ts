import * as THREE from "three";

export type PathSampleKeyframe = {
  u: number;
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
};

export type PathKeyframeU = { u: number };

/** Keyframes triées par `u` (une fois en amont, pas à chaque frame). */
export function sortPathKeyframesByU<T extends PathKeyframeU>(keyframes: T[]): T[] {
  if (keyframes.length < 2) return keyframes;
  for (let i = 1; i < keyframes.length; i++) {
    if (keyframes[i].u < keyframes[i - 1].u) {
      return [...keyframes].sort((a, b) => a.u - b.u);
    }
  }
  return keyframes;
}

/** Index d’étape (0…n−1) pour un paramètre u sur la timeline des keyframes (triées par u). */
export function keyframeStepIndexForU(keyframes: PathKeyframeU[], u: number): number {
  if (keyframes.length === 0) return 0;
  let idx = 0;
  for (let i = 0; i < keyframes.length; i++) {
    if (u >= keyframes[i].u - 1e-6) idx = i;
  }
  return idx;
}

export type PathSampleOut = {
  position?: THREE.Vector3;
  lookAt?: THREE.Vector3;
};

/**
 * Interpole position + lookAt selon le champ `u` de chaque keyframe
 * (pas le paramètre arc-length d'une spline globale).
 * `keyframes` doit être trié par `u` (voir `sortPathKeyframesByU`).
 */
export function samplePathAtKeyframeU(
  keyframes: PathSampleKeyframe[],
  u: number,
  out?: PathSampleOut,
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
  const position = out?.position ?? new THREE.Vector3();
  const lookAt = out?.lookAt ?? new THREE.Vector3();

  if (keyframes.length === 0) {
    position.set(0, 0, 0);
    lookAt.set(0, 0, 0);
    return { position, lookAt };
  }
  if (keyframes.length === 1) {
    position.copy(keyframes[0].position);
    lookAt.copy(keyframes[0].lookAt);
    return { position, lookAt };
  }

  const uMin = keyframes[0].u;
  const uMax = keyframes[keyframes.length - 1].u;
  const uClamp = THREE.MathUtils.clamp(u, uMin, uMax);

  let seg = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (uClamp <= keyframes[i + 1].u + 1e-9) {
      seg = i;
      break;
    }
    seg = i;
  }

  const a = keyframes[seg];
  const b = keyframes[seg + 1];
  const span = b.u - a.u;
  const t = span > 1e-9 ? (uClamp - a.u) / span : 0;

  position.lerpVectors(a.position, b.position, t);
  lookAt.lerpVectors(a.lookAt, b.lookAt, t);
  return { position, lookAt };
}

/** Points pour dessiner la courbe (échantillonnage sur l'axe u des keyframes). */
export function samplePathPolyline(
  keyframes: PathSampleKeyframe[],
  segments = 64,
): THREE.Vector3[] {
  if (keyframes.length < 2) return [];
  const sorted = sortPathKeyframesByU(keyframes) as PathSampleKeyframe[];
  const u0 = sorted[0].u;
  const u1 = sorted[sorted.length - 1].u;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const u = u0 + (i / segments) * (u1 - u0);
    pts.push(samplePathAtKeyframeU(sorted, u).position.clone());
  }
  return pts;
}
