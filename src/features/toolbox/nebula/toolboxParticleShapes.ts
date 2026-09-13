/** Deterministic toolbox particle geometries — denser figurative forms, not scaled spheres. */

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function assignSamples(
  samples: number[],
  particleCount: number,
  rand: () => number,
  jitter = 0.012,
): Float32Array {
  const out = new Float32Array(particleCount * 3);
  const n = samples.length / 3;
  if (n < 1) return out;
  for (let i = 0; i < particleCount; i++) {
    const si = (i % n) * 3;
    const jx = (rand() - 0.5) * jitter;
    const jy = (rand() - 0.5) * jitter;
    const jz = (rand() - 0.5) * jitter;
    const i3 = i * 3;
    out[i3] = samples[si]! + jx;
    out[i3 + 1] = samples[si + 1]! + jy;
    out[i3 + 2] = samples[si + 2]! + jz;
  }
  return out;
}

function pushEllipsoidShell(
  samples: number[],
  cx: number,
  cy: number,
  cz: number,
  rx: number,
  ry: number,
  rz: number,
  count: number,
  rand: () => number,
  hollow = 0.55,
) {
  for (let i = 0; i < count; i++) {
    const u = rand();
    const v = rand();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const r = hollow + (1 - hollow) * Math.pow(rand(), 0.55);
    const sx = Math.sin(phi) * Math.cos(theta);
    const sy = Math.cos(phi);
    const sz = Math.sin(phi) * Math.sin(theta);
    samples.push(cx + sx * rx * r, cy + sy * ry * r, cz + sz * rz * r);
  }
}

type Vec3 = [number, number, number];
type Vec2 = [number, number];

/** Low-poly wireframe lungs — traced from silhouette reference (patient right = screen left). */
const TRACHEA_POLY: Vec2[] = [
  [-0.05, 0.98],
  [0.05, 0.98],
  [0.05, 0.54],
  [-0.05, 0.54],
];

const BRONCHUS_LEFT: Vec2[] = [[0, 0.54], [-0.22, 0.48]];
const BRONCHUS_RIGHT: Vec2[] = [[0, 0.54], [0.22, 0.48]];

const PATIENT_RIGHT_LOBE: Vec2[] = [
  [-0.22, 0.48],
  [-0.48, 0.38],
  [-0.62, 0.12],
  [-0.64, -0.18],
  [-0.55, -0.48],
  [-0.35, -0.68],
  [-0.12, -0.72],
  [-0.04, -0.55],
  [-0.02, -0.15],
  [-0.08, 0.2],
];

const PATIENT_LEFT_LOBE: Vec2[] = [
  [0.22, 0.48],
  [0.45, 0.4],
  [0.58, 0.15],
  [0.6, -0.15],
  [0.52, -0.45],
  [0.35, -0.65],
  [0.14, -0.68],
  [0.22, -0.35],
  [0.1, -0.05],
  [0.08, 0.25],
];

const TRACHEA_CARINA_Y = 0.54;
const HILUM_Y = 0.48;

const TRACHEA_FRACTION = 0.1;
const BRONCHUS_FRACTION = 0.08;

function distToSegment2D(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 > 1e-8 ? Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  return Math.hypot(px - cx, py - cy);
}

function isInsidePolygon(x: number, y: number, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]![0];
    const yi = poly[i]![1];
    const xj = poly[j]![0];
    const yj = poly[j]![1];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-8) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function samplePolylineEdge(verts: Vec2[], closed: boolean, rand: () => number): Vec3 {
  const edges: { ax: number; ay: number; bx: number; by: number; len: number }[] = [];
  let total = 0;
  for (let i = 0; i < verts.length - 1; i += 1) {
    const a = verts[i]!;
    const b = verts[i + 1]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    edges.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], len });
    total += len;
  }
  if (closed && verts.length > 1) {
    const a = verts[verts.length - 1]!;
    const b = verts[0]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    edges.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], len });
    total += len;
  }
  let pick = rand() * total;
  for (const edge of edges) {
    if (pick <= edge.len) {
      const frac = edge.len > 0 ? pick / edge.len : 0;
      const jitter = (rand() - 0.5) * 0.003;
      return [
        edge.ax + (edge.bx - edge.ax) * frac + jitter,
        edge.ay + (edge.by - edge.ay) * frac + jitter,
        (rand() - 0.5) * 0.006,
      ];
    }
    pick -= edge.len;
  }
  const last = verts[verts.length - 1] ?? [0, 0];
  return [last[0], last[1], 0];
}

function isFixedAirway(nx: number, ny: number): boolean {
  if (ny >= TRACHEA_CARINA_Y && Math.abs(nx) < 0.075) return true;
  if (distToSegment2D(nx, ny, 0, TRACHEA_CARINA_Y, -0.22, HILUM_Y) < 0.028) return true;
  if (distToSegment2D(nx, ny, 0, TRACHEA_CARINA_Y, 0.22, HILUM_Y) < 0.028) return true;
  return false;
}

/** Low-poly wireframe: particles on trachea + bronchi + lobe outlines. */
export function buildLungLobesTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(91);
  const targets = new Float32Array(particleCount * 3);
  const tracheaCount = Math.round(particleCount * TRACHEA_FRACTION);
  const bronchusCount = Math.round(particleCount * BRONCHUS_FRACTION);
  const perLobe = Math.round((particleCount - tracheaCount - bronchusCount) / 2);

  let idx = 0;
  const write = (p: Vec3) => {
    if (idx >= particleCount) return;
    targets[idx * 3] = p[0] * radius;
    targets[idx * 3 + 1] = p[1] * radius;
    targets[idx * 3 + 2] = p[2] * radius;
    idx += 1;
  };

  const generate = (n: number, sample: () => Vec3) => {
    for (let i = 0; i < n; i += 1) write(sample());
  };

  generate(tracheaCount, () => samplePolylineEdge(TRACHEA_POLY, true, rand));
  generate(Math.round(bronchusCount / 2), () => samplePolylineEdge(BRONCHUS_LEFT, false, rand));
  generate(bronchusCount - Math.round(bronchusCount / 2), () =>
    samplePolylineEdge(BRONCHUS_RIGHT, false, rand),
  );
  generate(perLobe, () => samplePolylineEdge(PATIENT_RIGHT_LOBE, true, rand));
  generate(particleCount - idx, () => samplePolylineEdge(PATIENT_LEFT_LOBE, true, rand));

  return targets;
}

/** 0 = fixed trachea/bronchi, 1 = lobe outline expands on inhale. */
export function lungInflateWeightAtPosition(
  x: number,
  y: number,
  _z: number,
  radius: number,
): number {
  const nx = x / radius;
  const ny = y / radius;
  if (isFixedAirway(nx, ny)) return 0;
  if (isInsidePolygon(nx, ny, PATIENT_RIGHT_LOBE) || isInsidePolygon(nx, ny, PATIENT_LEFT_LOBE)) {
    return 1;
  }
  const nearRight =
    PATIENT_RIGHT_LOBE.some((a, i) => {
      const b = PATIENT_RIGHT_LOBE[(i + 1) % PATIENT_RIGHT_LOBE.length]!;
      return distToSegment2D(nx, ny, a[0], a[1], b[0], b[1]) < 0.025;
    });
  const nearLeft =
    PATIENT_LEFT_LOBE.some((a, i) => {
      const b = PATIENT_LEFT_LOBE[(i + 1) % PATIENT_LEFT_LOBE.length]!;
      return distToSegment2D(nx, ny, a[0], a[1], b[0], b[1]) < 0.025;
    });
  return nearRight || nearLeft ? 1 : 0;
}

/** RGB 0–1 — white wireframe on black (fixed airway slightly dimmer). */
export function lungAnatomyColorAtPosition(
  x: number,
  y: number,
  z: number,
  radius: number,
): [number, number, number] {
  const nx = x / radius;
  const ny = y / radius;
  const dim = lungInflateWeightAtPosition(x, y, z, radius) < 0.5 ? 0.78 : 1;
  const j = (((nx * 17 + ny * 31) % 1) - 0.5) * 0.03;
  return [0.92 * dim + j, 0.94 * dim + j, 0.97 * dim + j];
}

/** Spiral vortex disk — STOP « S ». */
export function buildVortexTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(17);
  const samples: number[] = [];
  const arms = 3;
  for (let i = 0; i < 9000; i++) {
    const arm = i % arms;
    const t = rand();
    const r = Math.pow(t, 0.65) * radius * 0.95;
    const ang = arm * ((Math.PI * 2) / arms) + t * Math.PI * 3.2 + (rand() - 0.5) * 0.25;
    const y = (rand() - 0.5) * radius * 0.18 * (1 - t * 0.6);
    samples.push(Math.cos(ang) * r, y, Math.sin(ang) * r);
  }
  return assignSamples(samples, particleCount, rand);
}

/** Vertical breath column — STOP « T ». */
export function buildColumnTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(29);
  const samples: number[] = [];
  for (let i = 0; i < 7000; i++) {
    const y = (rand() - 0.5) * radius * 1.7;
    const spread = 0.08 * radius + Math.pow(Math.abs(y) / (radius * 0.85), 1.4) * 0.22 * radius;
    const a = rand() * Math.PI * 2;
    const r = spread * Math.pow(rand(), 0.45);
    samples.push(Math.cos(a) * r, y, Math.sin(a) * r);
  }
  // crossbar
  for (let i = 0; i < 2200; i++) {
    const x = (rand() - 0.5) * radius * 1.35;
    const y = radius * 0.55 + (rand() - 0.5) * 0.08 * radius;
    const z = (rand() - 0.5) * 0.1 * radius;
    samples.push(x, y, z);
  }
  return assignSamples(samples, particleCount, rand);
}

/** Concentric observation rings — STOP « O ». */
export function buildRingsTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(41);
  const samples: number[] = [];
  const rings = [0.28, 0.48, 0.68, 0.9];
  for (const rr of rings) {
    const ringR = radius * rr;
    const count = Math.floor(1800 + rr * 1600);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand() * 0.02;
      const wobble = 1 + (rand() - 0.5) * 0.04;
      samples.push(
        Math.cos(a) * ringR * wobble,
        (rand() - 0.5) * 0.06 * radius,
        Math.sin(a) * ringR * wobble,
      );
    }
  }
  return assignSamples(samples, particleCount, rand);
}

/** Forward jet / proceed stream — STOP « P ». */
export function buildStreamTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(53);
  const samples: number[] = [];
  for (let i = 0; i < 8500; i++) {
    const t = rand();
    const z = (t - 0.35) * radius * 1.6;
    const flare = 0.06 * radius + t * 0.55 * radius;
    const a = rand() * Math.PI * 2;
    const r = flare * Math.pow(rand(), 0.7);
    samples.push(Math.cos(a) * r, Math.sin(a) * r * 0.7, z);
  }
  return assignSamples(samples, particleCount, rand);
}

/** Grounding field — visualisation ancrage. */
export function buildGroundTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(67);
  const samples: number[] = [];
  for (let i = 0; i < 9000; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius * 0.95;
    const y = -radius * 0.35 + (rand() - 0.5) * 0.08 * radius + Math.sin(r * 4) * 0.03 * radius;
    samples.push(Math.cos(a) * r, y, Math.sin(a) * r);
  }
  return assignSamples(samples, particleCount, rand);
}

/** Safe-place dome shell. */
export function buildDomeTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(71);
  const samples: number[] = [];
  for (let i = 0; i < 9000; i++) {
    const u = rand();
    const v = rand();
    const theta = 2 * Math.PI * u;
    const phi = (Math.PI * 0.5) * Math.pow(v, 0.75);
    const shell = 0.82 + rand() * 0.18;
    samples.push(
      Math.sin(phi) * Math.cos(theta) * radius * shell,
      Math.cos(phi) * radius * shell * 0.95 - radius * 0.05,
      Math.sin(phi) * Math.sin(theta) * radius * shell,
    );
  }
  return assignSamples(samples, particleCount, rand);
}

/** Perspective tunnel — rings along depth. */
export function buildTunnelTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(83);
  const samples: number[] = [];
  const layers = 14;
  for (let layer = 0; layer < layers; layer++) {
    const t = layer / (layers - 1);
    const z = (t - 0.5) * radius * 1.7;
    const ringR = radius * (0.22 + (1 - t) * 0.7);
    const count = 520;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + layer * 0.15;
      const jitter = 1 + (rand() - 0.5) * 0.05;
      samples.push(Math.cos(a) * ringR * jitter, Math.sin(a) * ringR * jitter, z + (rand() - 0.5) * 0.04 * radius);
    }
  }
  return assignSamples(samples, particleCount, rand);
}

/** Standing body silhouette (stacked lobes for move/gauge engines). */
export function buildBodyTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(113);
  const samples: number[] = [];
  const sx = radius * 0.028;
  const sy = radius * 0.0092;
  const toX = (cx: number) => (cx - 40) * sx;
  const toY = (cy: number) => (100 - cy) * sy * 10;

  const lobes: Array<[number, number, number, number, number]> = [
    [40, 16, 12, 14, 2200],
    [40, 42, 7, 6, 700],
    [40, 54, 24, 7, 1600],
    [40, 70, 16, 12, 1800],
    [22, 78, 7, 18, 900],
    [58, 78, 7, 18, 900],
    [40, 90, 14, 11, 1400],
    [40, 108, 16, 8, 900],
    [32, 132, 8, 16, 1100],
    [48, 132, 8, 16, 1100],
    [30, 160, 7, 14, 900],
    [50, 160, 7, 14, 900],
    [28, 178, 8, 5, 500],
    [52, 178, 8, 5, 500],
  ];
  for (const [cx, cy, rx, ry, count] of lobes) {
    pushEllipsoidShell(
      samples,
      toX(cx),
      toY(cy),
      0,
      rx * sx * 1.15,
      ry * sy * 10,
      Math.min(rx, ry) * sx * 0.55,
      count,
      rand,
      0.35,
    );
  }
  return assignSamples(samples, particleCount, rand);
}

/** Seated meditator — attention / visualisation. */
export function buildLotusTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(127);
  const samples: number[] = [];
  const R = radius;
  pushEllipsoidShell(samples, 0, R * 0.38, 0, R * 0.16, R * 0.18, R * 0.14, 1800, rand, 0.4);
  pushEllipsoidShell(samples, 0, R * 0.08, 0, R * 0.22, R * 0.32, R * 0.16, 2800, rand, 0.38);
  pushEllipsoidShell(samples, -R * 0.32, -R * 0.28, 0, R * 0.34, R * 0.12, R * 0.22, 1800, rand, 0.45);
  pushEllipsoidShell(samples, R * 0.32, -R * 0.28, 0, R * 0.34, R * 0.12, R * 0.22, 1800, rand, 0.45);
  pushEllipsoidShell(samples, -R * 0.28, 0.02 * R, 0, R * 0.08, R * 0.22, R * 0.08, 700, rand, 0.4);
  pushEllipsoidShell(samples, R * 0.28, 0.02 * R, 0, R * 0.08, R * 0.22, R * 0.08, 700, rand, 0.4);
  return assignSamples(samples, particleCount, rand);
}

export function buildSphereTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(3);
  const samples: number[] = [];
  pushEllipsoidShell(samples, 0, 0, 0, radius, radius, radius, 9000, rand, 0.42);
  return assignSamples(samples, particleCount, rand);
}

/** Soft torus — breath hold / coherence. */
export function buildTorusTargets(particleCount: number, radius: number): Float32Array {
  const rand = mulberry32(101);
  const samples: number[] = [];
  const R = radius * 0.55;
  const r = radius * 0.22;
  for (let i = 0; i < 9000; i++) {
    const u = rand() * Math.PI * 2;
    const v = rand() * Math.PI * 2;
    const rr = r * (0.75 + rand() * 0.35);
    samples.push(
      (R + rr * Math.cos(v)) * Math.cos(u),
      rr * Math.sin(v) * 0.85,
      (R + rr * Math.cos(v)) * Math.sin(u),
    );
  }
  return assignSamples(samples, particleCount, rand);
}

export const TOOLBOX_SHAPE_LIBRARY = {
  sphere: buildSphereTargets,
  lungs: buildLungLobesTargets,
  vortex: buildVortexTargets,
  column: buildColumnTargets,
  rings: buildRingsTargets,
  stream: buildStreamTargets,
  ground: buildGroundTargets,
  dome: buildDomeTargets,
  tunnel: buildTunnelTargets,
  torus: buildTorusTargets,
  body: buildBodyTargets,
  lotus: buildLotusTargets,
} as const;

export type ToolboxShapeId = keyof typeof TOOLBOX_SHAPE_LIBRARY;
