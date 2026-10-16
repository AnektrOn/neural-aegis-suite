import * as THREE from "three";

const N = 256;

/** Smooth noise texture for streak shader (iChannel0). */
export function buildAsteroidNoiseTexture(grain: number): THREE.DataTexture {
  const base = new Float32Array(N * N);
  for (let i = 0; i < base.length; i++) base[i] = Math.random();

  const work = new Float32Array(N * N);
  const tmp = new Float32Array(N * N);
  const passes = Math.round((1 - grain) * 16);

  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < N; y++) {
      const row = y * N;
      for (let x = 0; x < N; x++) {
        tmp[row + x] = (work[row + (x + N - 1) % N] + work[row + x] + work[row + (x + 1) % N]) / 3;
      }
    }
    for (let y = 0; y < N; y++) {
      const up = ((y + N - 1) % N) * N;
      const mid = y * N;
      const down = ((y + 1) % N) * N;
      for (let x = 0; x < N; x++) {
        work[mid + x] = (tmp[up + x] + tmp[mid + x] + tmp[down + x]) / 3;
      }
    }
  }

  let mean = 0;
  for (let i = 0; i < work.length; i++) mean += work[i];
  mean /= work.length;
  let variance = 0;
  for (let i = 0; i < work.length; i++) variance += (work[i] - mean) ** 2;
  const std = Math.sqrt(variance / work.length) || 1;
  const gainC = 0.289 / std;

  const noiseData = new Uint8Array(N * N * 4);
  for (let i = 0; i < work.length; i++) {
    const v = Math.min(1, Math.max(0, 0.5 + (work[i] - mean) * gainC));
    const b = Math.round(v * 255);
    const k = i * 4;
    noiseData[k] = b;
    noiseData[k + 1] = b;
    noiseData[k + 2] = b;
    noiseData[k + 3] = 255;
  }

  const tex = new THREE.DataTexture(noiseData, N, N, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}
