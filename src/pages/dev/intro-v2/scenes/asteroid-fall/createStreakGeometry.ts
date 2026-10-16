import * as THREE from "three";

export const ASTEROID_MAX_STREAKS = 3000;
export const ASTEROID_LAYERS = 50;
export const ASTEROID_CENTER = new THREE.Vector3(0, 0, -60);
export const ASTEROID_BASE_DEPTH = 60;
export const ASTEROID_DIR = new THREE.Vector3(4, -3, 0).normalize();

/** First instances = tight hero cluster (minimal idle count). */
export const ASTEROID_LEAD_COUNT = 20;
/** Mid ring — appears during hold. */
export const ASTEROID_MID_COUNT = 140;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const FOCUS_X = -14;
const FOCUS_Y = 6;
const FOCUS_Z = -58;

function buildPrefTable(): THREE.Vector4[] {
  const pref: THREE.Vector4[] = [];
  let sumCx = 0;
  let sumSx = 0;
  let sumCy = 0;
  let sumSy = 0;
  for (let L = 0; L < ASTEROID_LAYERS; L++) {
    pref.push(new THREE.Vector4(sumCx, sumSx, sumCy, sumSy));
    const ax = L * (9 + L);
    const ay = L * (11 + L);
    sumCx += Math.cos(ax);
    sumSx += Math.sin(ax);
    sumCy += Math.cos(ay);
    sumSy += Math.sin(ay);
  }
  return pref;
}

export function createAsteroidStreakGeometry(): THREE.InstancedBufferGeometry {
  const basePos = new Float32Array([0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0]);
  const idx = new Uint16Array([0, 1, 2, 1, 3, 2]);

  const aStart = new Float32Array(ASTEROID_MAX_STREAKS * 3);
  const aMotion = new Float32Array(ASTEROID_MAX_STREAKS * 4);
  const aSeed = new Float32Array(ASTEROID_MAX_STREAKS * 3);

  for (let i = 0; i < ASTEROID_MAX_STREAKS; i++) {
    if (i < ASTEROID_LEAD_COUNT) {
      aStart[i * 3] = FOCUS_X + rand(-6, 5);
      aStart[i * 3 + 1] = FOCUS_Y + rand(-4, 5);
      aStart[i * 3 + 2] = FOCUS_Z + rand(-5, 5);
      aMotion[i * 4] = 35 + Math.pow(Math.random(), 1.2) * 55;
      aMotion[i * 4 + 1] = rand(0.85, 1.15);
    } else if (i < ASTEROID_MID_COUNT) {
      aStart[i * 3] = FOCUS_X + rand(-28, 22);
      aStart[i * 3 + 1] = FOCUS_Y + rand(-22, 18);
      aStart[i * 3 + 2] = FOCUS_Z + rand(-18, 22);
      aMotion[i * 4] = 28 + Math.pow(Math.random(), 1.4) * 75;
      aMotion[i * 4 + 1] = rand(0.9, 1.25);
    } else {
      aStart[i * 3] = rand(-90, 150);
      aStart[i * 3 + 1] = rand(-100, 70);
      aStart[i * 3 + 2] = ASTEROID_CENTER.z + rand(-90, 90);
      aMotion[i * 4] = 25 + Math.pow(Math.random(), 1.5) * 100;
      aMotion[i * 4 + 1] = rand(1.0, 1.4);
    }
    aMotion[i * 4 + 2] = Math.floor(rand(0, ASTEROID_LAYERS));
    aMotion[i * 4 + 3] = i;

    aSeed[i * 3] = Math.random();
    aSeed[i * 3 + 1] = Math.random();
    aSeed[i * 3 + 2] = Math.random();
  }

  const geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex(new THREE.BufferAttribute(idx, 1));
  geometry.setAttribute("position", new THREE.BufferAttribute(basePos, 3));
  geometry.setAttribute("aStart", new THREE.InstancedBufferAttribute(aStart, 3));
  geometry.setAttribute("aMotion", new THREE.InstancedBufferAttribute(aMotion, 4));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 3));
  geometry.instanceCount = 0;

  return geometry;
}

export function createAsteroidStreakUniforms(noiseTexture: THREE.DataTexture) {
  const unit = ASTEROID_BASE_DEPTH * Math.tan(THREE.MathUtils.degToRad(29));
  return {
    uTime: { value: 0 },
    uCount: { value: 0 },
    uDir: { value: ASTEROID_DIR.clone() },
    uSway: { value: 0.25 },
    uFog: { value: 0.003 },
    uUnit: { value: unit },
    uPref: { value: buildPrefTable() },
    iChannel0: { value: noiseTexture },
  };
}
