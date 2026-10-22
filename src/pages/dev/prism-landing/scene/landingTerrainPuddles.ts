/**
 * Flaques post-pluie : creux locaux du mesh terrain (pas une nappe d’eau globale).
 */
import * as THREE from "three";

function hash2(x: number, z: number) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Remplit l’attribut `puddle` (0–1) sur la grille du terrain landing.
 */
export function bakeLandingPuddleAttribute(
  geometry: THREE.BufferGeometry,
  segmentsW: number,
  segmentsD: number,
  terrainCenterX: number,
  terrainCenterZ: number,
  sampleHeight: (x: number, z: number) => number,
) {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  const count = pos.count;
  const cols = segmentsW + 1;
  const puddles = new Float32Array(count);

  const heights = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    heights[i] = pos.getY(i);
  }

  const idx = (col: number, row: number) => row * cols + col;

  for (let row = 0; row <= segmentsD; row++) {
    for (let col = 0; col <= segmentsW; col++) {
      const i = idx(col, row);
      const y = heights[i];

      let ringSum = 0;
      let ringN = 0;
      for (let dz = -2; dz <= 2; dz++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (dx === 0 && dz === 0) continue;
          const c = col + dx;
          const r = row + dz;
          if (c < 0 || r < 0 || c > segmentsW || r > segmentsD) continue;
          ringSum += heights[idx(c, r)];
          ringN++;
        }
      }
      const ringAvg = ringN > 0 ? ringSum / ringN : y;

      let nearSum = 0;
      let nearN = 0;
      const neighbors: [number, number][] = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (const [dx, dz] of neighbors) {
        const c = col + dx;
        const r = row + dz;
        if (c < 0 || r < 0 || c > segmentsW || r > segmentsD) continue;
        nearSum += heights[idx(c, r)];
        nearN++;
      }
      const nearAvg = nearN > 0 ? nearSum / nearN : y;

      const depression = Math.max(0, nearAvg - y) * 0.72 + Math.max(0, ringAvg - y) * 0.28;
      let p = THREE.MathUtils.smoothstep(0.035, 0.14, depression);

      const wx = pos.getX(i) + terrainCenterX;
      const wz = pos.getZ(i) + terrainCenterZ;
      const patch = hash2(wx * 0.31, wz * 0.27);
      p *= THREE.MathUtils.smoothstep(0.22, 0.78, patch);

      const slopeProxy = Math.abs(y - nearAvg);
      p *= 1 - THREE.MathUtils.smoothstep(0.08, 0.22, slopeProxy);

      puddles[i] = THREE.MathUtils.clamp(p, 0, 1);
    }
  }

  geometry.setAttribute("puddle", new THREE.BufferAttribute(puddles, 1));
}
