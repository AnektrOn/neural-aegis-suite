import * as THREE from "three";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647);
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothNoise3D(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const n000 = hash3(ix, iy, iz);
  const n100 = hash3(ix + 1, iy, iz);
  const n010 = hash3(ix, iy + 1, iz);
  const n110 = hash3(ix + 1, iy + 1, iz);
  const n001 = hash3(ix, iy, iz + 1);
  const n101 = hash3(ix + 1, iy, iz + 1);
  const n011 = hash3(ix, iy + 1, iz + 1);
  const n111 = hash3(ix + 1, iy + 1, iz + 1);

  const nx00 = n000 + (n100 - n000) * ux;
  const nx10 = n010 + (n110 - n010) * ux;
  const nx01 = n001 + (n101 - n001) * ux;
  const nx11 = n011 + (n111 - n011) * ux;
  const nxy0 = nx00 + (nx10 - nx00) * uy;
  const nxy1 = nx01 + (nx11 - nx01) * uy;
  return nxy0 + (nxy1 - nxy0) * uz;
}

export type R3fShatteredCubeSubItem = {
  rest: THREE.Vector3;
  blastVector: THREE.Vector3;
  slotRaw: number;
  start: number;
  blastDistance: number;
  driftFreq: number;
  phaseOffset: number;
};

export type R3fShatteredCubeLattice = {
  items: R3fShatteredCubeSubItem[];
  count: number;
  cell: number;
  baseCubeSize: number;
  orientQuat: THREE.Quaternion;
  geometry: THREE.BoxGeometry;
};

export type R3fShatteredCubeLatticeOptions = {
  grid?: number;
  seed?: number;
  coreRatio?: number;
};

export function buildR3fShatteredCubeLattice(
  options: R3fShatteredCubeLatticeOptions = {},
): R3fShatteredCubeLattice {
  const N = Math.max(6, Math.round(options.grid ?? 10));
  const seed = options.seed ?? 5;
  const coreRatio = options.coreRatio ?? 0.62;
  const rand = mulberry32(seed + 31);

  const cell = 2 / N;
  const L = Math.max(1, Math.round(((1 - coreRatio) * N) / 2));

  const orientQuat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(-1, -1, -1).normalize(),
    new THREE.Vector3(0, -1, 0),
  );

  const items: R3fShatteredCubeSubItem[] = [];

  for (let ix = 0; ix < N; ix++) {
    for (let iy = 0; iy < N; iy++) {
      for (let iz = 0; iz < N; iz++) {
        const dist = Math.min(ix, N - 1 - ix, iy, N - 1 - iy, iz, N - 1 - iz);
        if (dist >= L) continue;

        const rx = -1 + (ix + 0.5) * cell;
        const ry = -1 + (iy + 0.5) * cell;
        const rz = -1 + (iz + 0.5) * cell;
        const rest = new THREE.Vector3(rx, ry, rz);
        const radialDir = rest.clone().normalize();

        const ax = Math.abs(rx);
        const ay = Math.abs(ry);
        const az = Math.abs(rz);
        const normal = new THREE.Vector3();
        const tangentA = new THREE.Vector3();
        const tangentB = new THREE.Vector3();
        if (ax >= ay && ax >= az) {
          normal.set(Math.sign(rx) || 1, 0, 0);
          tangentA.set(0, 1, 0);
          tangentB.set(0, 0, 1);
        } else if (ay >= ax && ay >= az) {
          normal.set(0, Math.sign(ry) || 1, 0);
          tangentA.set(1, 0, 0);
          tangentB.set(0, 0, 1);
        } else {
          normal.set(0, 0, Math.sign(rz) || 1);
          tangentA.set(1, 0, 0);
          tangentB.set(0, 1, 0);
        }

        const clusterNoise = smoothNoise3D(
          Math.floor(ix / 2) * 1.25 + seed * 0.7,
          Math.floor(iy / 2) * 1.25 + seed * 1.1,
          Math.floor(iz / 2) * 1.25,
        );
        const fine = rand();
        const patternN = smoothNoise3D(ix * 0.55 + seed * 0.3, iy * 0.55, iz * 0.55 + seed * 0.2);
        const slotRaw = dist * 0.7 + patternN * 1.6 + fine * 0.12;

        const blastVector = radialDir
          .clone()
          .multiplyScalar(0.76)
          .addScaledVector(normal, 0.42)
          .addScaledVector(tangentA, (fine - 0.5) * 0.28)
          .addScaledVector(tangentB, (clusterNoise - 0.5) * 0.28)
          .normalize();

        const layerFactor = dist === 0 ? 1.25 : dist === 1 ? 1.0 : 0.85;
        const blastDistance =
          (1.35 + Math.pow(clusterNoise, 1.1) * 2.1 + fine * 1.35) * layerFactor;

        items.push({
          rest,
          blastVector,
          slotRaw,
          start: 0,
          blastDistance,
          driftFreq: 0.5 + fine * 0.6,
          phaseOffset: clusterNoise * Math.PI * 2 + fine * 3.14,
        });
      }
    }
  }

  const count = items.length;
  const order = items.slice().sort((a, b) => a.slotRaw - b.slotRaw);
  order.forEach((it, rank) => {
    it.start = (rank / count) * (1 - 0.08);
  });

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  geometry.computeVertexNormals();
  const restAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
  items.forEach((it, i) => restAttr.setXYZ(i, it.rest.x, it.rest.y, it.rest.z));
  geometry.setAttribute("aRest", restAttr);

  return {
    items,
    count,
    cell,
    baseCubeSize: cell * 0.94,
    orientQuat,
    geometry,
  };
}

export const r3fShatteredCubeEaseInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

const _orientedMat = new THREE.Matrix4();
const _corner = new THREE.Vector3();

/** Y minimal de la coque au repos (espace du pivot `r3f-shattered-cube`, spin à zéro). */
export function computeR3fShatteredCubeRestMinY(
  lattice: R3fShatteredCubeLattice,
  size: number,
): number {
  _orientedMat.compose(
    new THREE.Vector3(0, 0, 0),
    lattice.orientQuat,
    new THREE.Vector3(size, size, size),
  );

  let minY = Infinity;
  const half = lattice.baseCubeSize * 0.5;

  for (const it of lattice.items) {
    for (let ix = -1; ix <= 1; ix += 2) {
      for (let iy = -1; iy <= 1; iy += 2) {
        for (let iz = -1; iz <= 1; iz += 2) {
          _corner.set(
            it.rest.x + ix * half,
            it.rest.y + iy * half,
            it.rest.z + iz * half,
          );
          _corner.applyMatrix4(_orientedMat);
          if (_corner.y < minY) minY = _corner.y;
        }
      }
    }
  }

  const emitterHalf = (lattice.cell * 0.94) * 0.5;
  for (let ix = -1; ix <= 1; ix += 2) {
    for (let iy = -1; iy <= 1; iy += 2) {
      for (let iz = -1; iz <= 1; iz += 2) {
        _corner.set(ix * emitterHalf, iy * emitterHalf, iz * emitterHalf);
        _corner.applyMatrix4(_orientedMat);
        if (_corner.y < minY) minY = _corner.y;
      }
    }
  }

  return minY;
}

export function r3fShatteredCubePivotYOnGround(
  lattice: R3fShatteredCubeLattice,
  size: number,
  groundY = 0,
): number {
  return groundY - computeR3fShatteredCubeRestMinY(lattice, size) + 0.03;
}

export { clamp01 };
