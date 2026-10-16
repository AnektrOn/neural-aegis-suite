import * as THREE from "three";

/** Shared look target. K1, K2 and K4 all aim here. */
export const ASTEROID_CAMERA_FOCUS = new THREE.Vector3(-13.9, 5.9, -58);

/** Hold progress maps 0..1 onto K1 → K2 → K4. K2 sits halfway through the hold. */
export const ASTEROID_FILM_TIME_K1 = 0;
export const ASTEROID_FILM_TIME_K2 = 0.5;
export const ASTEROID_FILM_TIME_K4 = 1;

const FILM_TIMES = [ASTEROID_FILM_TIME_K1, ASTEROID_FILM_TIME_K2, ASTEROID_FILM_TIME_K4] as const;

const CH = 8;

type FilmKey = {
  pos: readonly [number, number, number];
  look: readonly [number, number, number];
  fov: number;
};

const FILM_KEYS: readonly FilmKey[] = [
  { pos: [17.2, -8.5, -36.1], look: [-13.9, 5.9, -58.0], fov: 50 },
  { pos: [-31.2, 25.9, -27.0], look: [-13.9, 5.9, -58.0], fov: 41 },
  { pos: [0.5, -12.4, -24.7], look: [-13.9, 5.9, -58.0], fov: 100 },
];

function buildChannels(): Float64Array[] {
  const chan: Float64Array[] = [];
  for (let c = 0; c < CH; c++) chan.push(new Float64Array(FILM_KEYS.length));
  for (let k = 0; k < FILM_KEYS.length; k++) {
    const key = FILM_KEYS[k];
    const dx = key.pos[0] - key.look[0];
    const dy = key.pos[1] - key.look[1];
    const dz = key.pos[2] - key.look[2];
    const radius = Math.hypot(dx, dy, dz);
    chan[0][k] = dx / radius;
    chan[1][k] = dy / radius;
    chan[2][k] = dz / radius;
    chan[3][k] = radius;
    chan[4][k] = key.look[0];
    chan[5][k] = key.look[1];
    chan[6][k] = key.look[2];
    chan[7][k] = key.fov;
  }
  return chan;
}

const CHAN = buildChannels();
const _sample = new Float64Array(CH);

function tangent(a: Float64Array, t: readonly number[], k: number) {
  const n = t.length;
  if (k <= 0 || k >= n - 1) return 0;
  return (a[k + 1] - a[k - 1]) / (t[k + 1] - t[k - 1]);
}

function hermite(a: Float64Array, t: readonly number[], k: number, s: number, dt: number) {
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    (2 * s3 - 3 * s2 + 1) * a[k] +
    (s3 - 2 * s2 + s) * dt * tangent(a, t, k) +
    (-2 * s3 + 3 * s2) * a[k + 1] +
    (s3 - s2) * dt * tangent(a, t, k + 1)
  );
}

/** Sample the orbit. Writes position and look target, returns fov. No allocation. */
export function asteroidFilmPose(time: number, outPos: THREE.Vector3, outLook: THREE.Vector3): number {
  const t = FILM_TIMES;
  const last = t.length - 1;
  let timeClamped = time;
  if (timeClamped < t[0]) timeClamped = t[0];
  else if (timeClamped > t[last]) timeClamped = t[last];

  let k = 0;
  while (k < last - 1 && timeClamped > t[k + 1]) k++;
  const dt = t[k + 1] - t[k];
  const s = dt > 0 ? (timeClamped - t[k]) / dt : 0;

  for (let c = 0; c < CH; c++) {
    _sample[c] = hermite(CHAN[c], t, k, s, dt);
  }

  let dx = _sample[0];
  let dy = _sample[1];
  let dz = _sample[2];
  const len = Math.hypot(dx, dy, dz) || 1;
  dx /= len;
  dy /= len;
  dz /= len;

  const radius = _sample[3];
  outLook.set(_sample[4], _sample[5], _sample[6]);
  outPos.set(outLook.x + dx * radius, outLook.y + dy * radius, outLook.z + dz * radius);
  return _sample[7];
}
