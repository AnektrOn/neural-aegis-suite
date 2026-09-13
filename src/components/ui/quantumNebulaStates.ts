export type QuantumNebulaState = "repos" | "reflexion" | "mouvement";

export const QUANTUM_NEBULA_STATES: QuantumNebulaState[] = [
  "repos",
  "reflexion",
  "mouvement",
];

export const QUANTUM_NEBULA_STATE_LABELS: Record<
  QuantumNebulaState,
  { fr: string; en: string; description: { fr: string; en: string } }
> = {
  repos: {
    fr: "Repos",
    en: "Rest",
    description: {
      fr: "Nuage organique calme — respiration subtile, sans drive audio",
      en: "Calm organic cloud — subtle breath, no audio drive",
    },
  },
  reflexion: {
    fr: "Réflexion",
    en: "Reflection",
    description: {
      fr: "Un neurone lumineux au centre — mêmes teintes cyan, dendrites fractales",
      en: "One luminous neuron at the center — same cyan hues, fractal dendrites",
    },
  },
  mouvement: {
    fr: "Mouvement",
    en: "Movement",
    description: {
      fr: "Sans son : nuage initial (comme Repos). Avec audio : ondulation organique",
      en: "No sound: initial cloud (like Rest). With audio: organic ripple",
    },
  },
};

/** Centre d'un neurone dans le nuage (amas de particules) */
export interface Neuron {
  x: number;
  y: number;
  z: number;
}

export function initNeurons(count: number, spread: number): Neuron[] {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * spread,
    y: (Math.random() - 0.5) * spread,
    z: (Math.random() - 0.5) * spread,
  }));
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface NeuralMicrograph {
  targets: Float32Array;
  sizes: Float32Array;
  brightness: Float32Array;
  phase: Float32Array;
}

/** Concentric ring density bias for reflexion — boosts mass on shells without erasing radial dendrites. */
export interface NeuralRingDensity {
  pupilRadius: number;
  ringInnerWidth: number;
  ringMidWidth: number;
  ringMidPosition: number;
  ringOuterThinWidth: number;
  ringOuterThickWidth: number;
  ringOuterGap: number;
  ringDensityInner: number;
  ringDensityMid: number;
  ringDensityOuterThin: number;
  ringDensityOuterThick: number;
}

function buildRingShellsForBias(pupilRadius: number, outerRadius: number, rings: NeuralRingDensity) {
  const pupil = Math.max(0.02, Math.min(pupilRadius, outerRadius * 0.85));
  const span = Math.max(0.05, outerRadius - pupil);
  const innerCenter = pupil + rings.ringInnerWidth * 0.55;
  const midCenter = pupil + span * rings.ringMidPosition;
  const thickOuter = outerRadius - rings.ringOuterThickWidth * 0.55;
  const thinOuter = thickOuter - rings.ringOuterGap - rings.ringOuterThinWidth * 0.55;
  const weights = [
    Math.max(0.01, rings.ringDensityInner),
    Math.max(0.01, rings.ringDensityMid),
    Math.max(0.01, rings.ringDensityOuterThin),
    Math.max(0.01, rings.ringDensityOuterThick),
  ];
  const weightSum = weights.reduce((a, b) => a + b, 0);
  return [
    { center: innerCenter, halfWidth: Math.max(0.004, rings.ringInnerWidth * 0.5), weight: weights[0] / weightSum },
    { center: midCenter, halfWidth: Math.max(0.003, rings.ringMidWidth * 0.5), weight: weights[1] / weightSum },
    {
      center: Math.max(innerCenter + 0.08, thinOuter),
      halfWidth: Math.max(0.004, rings.ringOuterThinWidth * 0.5),
      weight: weights[2] / weightSum,
    },
    {
      center: thickOuter,
      halfWidth: Math.max(0.01, rings.ringOuterThickWidth * 0.5),
      weight: weights[3] / weightSum,
    },
  ].map((ring) => ({
    ...ring,
    center: Math.min(Math.max(ring.center, pupil + 0.01), outerRadius - 0.01),
  }));
}

function ringDensityMultiplier(
  radius: number,
  shells: ReturnType<typeof buildRingShellsForBias>,
) {
  // High floor keeps continuous radial dendrites clearly visible between rings.
  let boost = 1.15;
  for (const shell of shells) {
    const sigma = Math.max(0.01, shell.halfWidth * 1.35);
    const d = (radius - shell.center) / sigma;
    boost += shell.weight * 2.2 * Math.exp(-d * d);
  }
  return boost;
}

/**
 * One Golgi-like neuron at the origin: bright soma and fractal dendrites.
 * Sampled into per-particle targets for the reflexion state.
 * Targets are fitted inside `maxRadius` so they share the same container as repos/mouvement.
 * Optional `ringDensity` thickens four concentric bands without removing radial branches.
 */
export function buildNeuralMicrograph(
  particleCount: number,
  seed = 77,
  maxRadius = 1.35,
  ringDensity?: NeuralRingDensity | null,
): NeuralMicrograph {
  const rand = mulberry32(seed);
  const samples: number[] = [];

  const push = (
    x: number,
    y: number,
    z: number,
    weight: number,
    size: number,
    brightness: number,
    phase: number,
  ) => {
    samples.push(x, y, z, weight, size, brightness, phase);
  };

  const soma = { x: 0, y: 0 };
  const fitRadius = Math.max(0.35, maxRadius);

  for (let i = 0; i < 2200; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.62) * 0.16;
    push(
      soma.x + Math.cos(a) * r,
      soma.y + Math.sin(a) * r * 0.86,
      (rand() - 0.5) * 0.045,
      14,
      2.45,
      1,
      rand() * Math.PI * 2,
    );
  }

  const maxSampleFloats = 90_000 * 7;

  const grow = (
    x: number,
    y: number,
    dx: number,
    dy: number,
    length: number,
    depth: number,
    thickness: number,
  ) => {
    if (samples.length >= maxSampleFloats) return;
    const step = 0.026;
    const n = Math.max(5, Math.floor(length / step));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const nx = -dy;
      const ny = dx;
      const bend = (rand() - 0.5) * 0.28;
      dx += nx * bend * 0.18;
      dy += ny * bend * 0.18;
      const mag = Math.hypot(dx, dy) || 1;
      dx /= mag;
      dy /= mag;
      x += dx * step;
      y += dy * step;
      const taper = thickness * (1 - t * 0.62);
      const z = (rand() - 0.5) * 0.055 * (1.1 - taper);
      const phase = Math.hypot(x, y) * 3.4 + depth;
      push(x, y, z, 0.55 + taper * 2.4, 0.55 + taper * 0.95, 0.42 + taper * 0.58, phase);

      if (rand() < 0.16) {
        const s = (rand() - 0.5) * (0.018 + (1 - taper) * 0.04);
        push(
          x + nx * s,
          y + ny * s,
          z,
          0.35,
          1.05 + rand() * 0.35,
          0.85,
          phase + 1.7,
        );
      }

      if (depth < 6 && i > n * 0.18 && rand() < 0.092 + (1 - t) * 0.05) {
        const ang = (rand() < 0.5 ? -1 : 1) * (0.38 + rand() * 0.85);
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        grow(
          x,
          y,
          dx * c - dy * s,
          dx * s + dy * c,
          length * (0.34 + rand() * 0.32),
          depth + 1,
          taper * 0.58,
        );
      }
    }
  };

  const primary = 28;
  const branchLen = fitRadius * (0.55 + 0.35);
  for (let b = 0; b < primary; b++) {
    const ang = (b / primary) * Math.PI * 2 + (rand() - 0.5) * 0.32;
    grow(
      soma.x,
      soma.y,
      Math.cos(ang),
      Math.sin(ang),
      branchLen * (0.72 + rand() * 0.45),
      0,
      1,
    );
  }

  const stride = 7;
  const sampleCount = samples.length / stride;
  const cumulative = new Float32Array(sampleCount);
  const ringShells = ringDensity
    ? buildRingShellsForBias(ringDensity.pupilRadius, fitRadius, ringDensity)
    : null;
  let total = 0;
  for (let i = 0; i < sampleCount; i++) {
    let weight = samples[i * stride + 3];
    if (ringShells) {
      const sx = samples[i * stride];
      const sy = samples[i * stride + 1];
      const sz = samples[i * stride + 2];
      const radius = Math.hypot(sx, sy, sz);
      weight *= ringDensityMultiplier(radius, ringShells);
    }
    total += weight;
    cumulative[i] = total;
  }

  const pick = () => {
    const r = rand() * total;
    let lo = 0;
    let hi = sampleCount - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  const targets = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const brightness = new Float32Array(particleCount);
  const phase = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const s = pick() * stride;
    const jitter = samples[s + 4] * 0.035;
    let x = samples[s] + (rand() - 0.5) * jitter;
    let y = samples[s + 1] + (rand() - 0.5) * jitter;
    let z = samples[s + 2] + (rand() - 0.5) * jitter * 0.6;
    let r = Math.hypot(x, y, z);
    if (r > fitRadius && r > 0.0001) {
      const scale = (fitRadius * 0.98) / r;
      x *= scale;
      y *= scale;
      z *= scale;
      r = fitRadius * 0.98;
    }
    // Keep targets outside the absolute-black pupil so they aren't shader-culled.
    const minR = ringDensity ? Math.max(0.04, ringDensity.pupilRadius * 1.18) : 0;
    if (minR > 0) {
      if (r < 0.0001) {
        const a = rand() * Math.PI * 2;
        x = Math.cos(a) * minR;
        y = Math.sin(a) * minR;
        z = 0;
      } else if (r < minR) {
        const scale = minR / r;
        x *= scale;
        y *= scale;
        z *= scale;
      }
    }
    targets[i * 3] = x;
    targets[i * 3 + 1] = y;
    targets[i * 3 + 2] = z;
    sizes[i] = samples[s + 4];
    brightness[i] = samples[s + 5];
    phase[i] = samples[s + 6];
  }

  return { targets, sizes, brightness, phase };
}

/**
 * Metatron's Cube / Fruit of Life sample cloud.
 * 13 circle centers + circle arcs + all connecting chords.
 * Each particle gets one target on the figure (seeded).
 */
export function buildMetatronTargets(
  particleCount: number,
  radius = 2.1,
  seed = 91,
): Float32Array {
  const rand = mulberry32(seed);
  const centers: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  const ringR = radius * 0.38;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    centers.push({ x: Math.cos(a) * ringR, y: Math.sin(a) * ringR });
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    centers.push({ x: Math.cos(a) * ringR * 2, y: Math.sin(a) * ringR * 2 });
  }

  const samples: number[] = [];
  const circleR = ringR;

  const pushSample = (x: number, y: number, z: number) => {
    samples.push(x, y, z);
  };

  // Dense sampling on the 13 circles
  for (const c of centers) {
    const steps = 96;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const jitter = (rand() - 0.5) * 0.012;
      pushSample(
        c.x + Math.cos(a) * (circleR + jitter),
        c.y + Math.sin(a) * (circleR + jitter),
        (rand() - 0.5) * 0.08,
      );
    }
  }

  // All chords between centers (Metatron lattice)
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      const a = centers[i];
      const b = centers[j];
      const steps = 28;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        pushSample(
          a.x + (b.x - a.x) * t + (rand() - 0.5) * 0.008,
          a.y + (b.y - a.y) * t + (rand() - 0.5) * 0.008,
          (rand() - 0.5) * 0.05,
        );
      }
    }
  }

  return assignSamplesToParticles(samples, particleCount, rand);
}

export type QuantumNebulaFigure = "metatron" | "sriYantra" | "dna" | "svg" | "obj";

function assignSamplesToParticles(
  samples: number[],
  particleCount: number,
  rand: () => number,
): Float32Array {
  const sampleCount = samples.length / 3;
  const targets = new Float32Array(particleCount * 3);
  if (sampleCount < 1) return targets;
  for (let i = 0; i < particleCount; i++) {
    const si = Math.floor(rand() * sampleCount) * 3;
    const i3 = i * 3;
    targets[i3] = samples[si] ?? 0;
    targets[i3 + 1] = samples[si + 1] ?? 0;
    targets[i3 + 2] = samples[si + 2] ?? 0;
  }
  return targets;
}

function sampleSegment(
  samples: number[],
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  steps: number,
  rand: () => number,
  jitter = 0,
) {
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    samples.push(
      ax + (bx - ax) * t + (rand() - 0.5) * jitter,
      ay + (by - ay) * t + (rand() - 0.5) * jitter,
      az + (bz - az) * t + (rand() - 0.5) * jitter,
    );
  }
}

function sampleCircle(
  samples: number[],
  cx: number,
  cy: number,
  radius: number,
  steps: number,
  rand: () => number,
  zSpread = 0.04,
) {
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    samples.push(
      cx + Math.cos(a) * radius,
      cy + Math.sin(a) * radius,
      (rand() - 0.5) * zSpread,
    );
  }
}

function fitSamplesToRadius(samples: number[], radius: number) {
  if (samples.length < 3) return;
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < samples.length; i += 3) {
    const x = samples[i] ?? 0;
    const y = samples[i + 1] ?? 0;
    const z = samples[i + 2] ?? 0;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  let maxR = 0.0001;
  for (let i = 0; i < samples.length; i += 3) {
    const dx = (samples[i] ?? 0) - cx;
    const dy = (samples[i + 1] ?? 0) - cy;
    const dz = (samples[i + 2] ?? 0) - cz;
    const r = Math.hypot(dx, dy, dz);
    if (r > maxR) maxR = r;
  }
  const scale = radius / maxR;
  for (let i = 0; i < samples.length; i += 3) {
    samples[i] = ((samples[i] ?? 0) - cx) * scale;
    samples[i + 1] = ((samples[i + 1] ?? 0) - cy) * scale;
    samples[i + 2] = ((samples[i + 2] ?? 0) - cz) * scale;
  }
}

function sampleTriangle(
  samples: number[],
  size: number,
  cy: number,
  pointingUp: boolean,
  rand: () => number,
) {
  const h = size * Math.sqrt(3);
  const topY = pointingUp ? cy + h * (2 / 3) : cy - h * (2 / 3);
  const baseY = pointingUp ? cy - h * (1 / 3) : cy + h * (1 / 3);
  const a = { x: 0, y: topY };
  const b = { x: -size, y: baseY };
  const c = { x: size, y: baseY };
  const steps = Math.max(36, Math.round(size * 54));
  sampleSegment(samples, a.x, a.y, 0, b.x, b.y, 0, steps, rand, 0.006);
  sampleSegment(samples, b.x, b.y, 0, c.x, c.y, 0, steps, rand, 0.006);
  sampleSegment(samples, c.x, c.y, 0, a.x, a.y, 0, steps, rand, 0.006);
}

function samplePetal(
  samples: number[],
  angle: number,
  innerR: number,
  outerR: number,
  width: number,
  rand: () => number,
) {
  const tipX = Math.cos(angle) * outerR;
  const tipY = Math.sin(angle) * outerR;
  const left = {
    x: Math.cos(angle - width) * innerR,
    y: Math.sin(angle - width) * innerR,
  };
  const right = {
    x: Math.cos(angle + width) * innerR,
    y: Math.sin(angle + width) * innerR,
  };
  const ctrlL = {
    x: Math.cos(angle - width * 0.45) * (innerR + (outerR - innerR) * 0.72),
    y: Math.sin(angle - width * 0.45) * (innerR + (outerR - innerR) * 0.72),
  };
  const ctrlR = {
    x: Math.cos(angle + width * 0.45) * (innerR + (outerR - innerR) * 0.72),
    y: Math.sin(angle + width * 0.45) * (innerR + (outerR - innerR) * 0.72),
  };
  const steps = 22;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const mt = 1 - t;
    samples.push(
      mt * mt * left.x + 2 * mt * t * ctrlL.x + t * t * tipX,
      mt * mt * left.y + 2 * mt * t * ctrlL.y + t * t * tipY,
      (rand() - 0.5) * 0.035,
    );
    samples.push(
      mt * mt * right.x + 2 * mt * t * ctrlR.x + t * t * tipX,
      mt * mt * right.y + 2 * mt * t * ctrlR.y + t * t * tipY,
      (rand() - 0.5) * 0.035,
    );
  }
}

/**
 * Sri Yantra sample cloud: 9 interlocking triangles, bindu, lotuses, circles, square gates.
 */
export function buildSriYantraTargets(
  particleCount: number,
  radius = 2.1,
  seed = 47,
): Float32Array {
  const rand = mulberry32(seed);
  const samples: number[] = [];
  const R = radius * 0.52;

  sampleCircle(samples, 0, 0, R * 0.045, 48, rand, 0.02);

  const down = [
    { s: 1, y: -0.03 },
    { s: 0.82, y: -0.07 },
    { s: 0.62, y: -0.09 },
    { s: 0.42, y: -0.1 },
    { s: 0.22, y: -0.07 },
  ];
  const up = [
    { s: 0.96, y: 0.04 },
    { s: 0.74, y: 0.08 },
    { s: 0.52, y: 0.1 },
    { s: 0.3, y: 0.08 },
  ];
  for (const t of down) sampleTriangle(samples, R * t.s, R * t.y, false, rand);
  for (const t of up) sampleTriangle(samples, R * t.s, R * t.y, true, rand);

  const lotusInner = R * 1.08;
  const lotusMid = R * 1.28;
  const lotusOuter = R * 1.52;
  for (let i = 0; i < 8; i++) {
    samplePetal(samples, (i / 8) * Math.PI * 2, lotusInner, lotusMid, 0.28, rand);
  }
  for (let i = 0; i < 16; i++) {
    samplePetal(
      samples,
      (i / 16) * Math.PI * 2 + Math.PI / 16,
      lotusMid * 0.98,
      lotusOuter,
      0.16,
      rand,
    );
  }

  sampleCircle(samples, 0, 0, lotusOuter * 1.04, 140, rand, 0.03);
  sampleCircle(samples, 0, 0, lotusOuter * 1.12, 150, rand, 0.03);
  sampleCircle(samples, 0, 0, lotusOuter * 1.2, 160, rand, 0.03);

  const s = lotusOuter * 1.34;
  const corners = [
    { x: -s, y: -s },
    { x: s, y: -s },
    { x: s, y: s },
    { x: -s, y: s },
  ];
  for (let i = 0; i < 4; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 4];
    if (!a || !b) continue;
    sampleSegment(samples, a.x, a.y, 0, b.x, b.y, 0, 48, rand, 0.005);
  }
  const gate = s * 0.18;
  const depth = s * 0.16;
  const stems: Array<[number, number, number, number, number, number, number, number]> = [
    [-gate, s, gate, s, 0, s, 0, s + depth],
    [-gate, -s, gate, -s, 0, -s, 0, -s - depth],
    [s, -gate, s, gate, s, 0, s + depth, 0],
    [-s, -gate, -s, gate, -s, 0, -s - depth, 0],
  ];
  for (const [ax, ay, bx, by, sx, sy, tx, ty] of stems) {
    sampleSegment(samples, ax, ay, 0, bx, by, 0, 18, rand, 0.004);
    sampleSegment(samples, sx, sy, 0, tx, ty, 0, 16, rand, 0.004);
    const nx = tx - sx;
    const ny = ty - sy;
    const len = Math.hypot(nx, ny) || 1;
    const px = (-ny / len) * gate;
    const py = (nx / len) * gate;
    sampleSegment(samples, tx - px, ty - py, 0, tx + px, ty + py, 0, 18, rand, 0.004);
  }

  return assignSamplesToParticles(samples, particleCount, rand);
}

/**
 * Double-helix DNA sample cloud with base-pair rungs.
 */
export function buildDnaTargets(
  particleCount: number,
  radius = 2.1,
  seed = 53,
): Float32Array {
  const rand = mulberry32(seed);
  const samples: number[] = [];
  const height = radius * 1.82;
  const helixR = radius * 0.3;
  const turns = 5;
  const backboneSteps = 640;
  const pairEvery = 10;
  const tilt = 0.22;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);

  const push = (x: number, y: number, z: number) => {
    samples.push(x, y * cosT - z * sinT, y * sinT + z * cosT);
  };

  for (let i = 0; i <= backboneSteps; i++) {
    const t = i / backboneSteps;
    const ang = t * turns * Math.PI * 2;
    const y = (t - 0.5) * height;
    const x1 = Math.cos(ang) * helixR;
    const z1 = Math.sin(ang) * helixR;
    const x2 = Math.cos(ang + Math.PI) * helixR;
    const z2 = Math.sin(ang + Math.PI) * helixR;
    push(x1, y, z1);
    push(x2, y, z2);
    push(x1 * 1.05, y, z1 * 1.05);
    push(x2 * 1.05, y, z2 * 1.05);

    if (i % pairEvery === 0) {
      const rungSteps = 16;
      for (let s = 0; s <= rungSteps; s++) {
        const u = s / rungSteps;
        push(x1 + (x2 - x1) * u, y, z1 + (z2 - z1) * u);
      }
    }
  }

  return assignSamplesToParticles(samples, particleCount, rand);
}

function parseObjIndex(token: string, vertCount: number): number {
  const n = Number.parseInt(token.split("/")[0] ?? "", 10);
  if (!Number.isFinite(n) || n === 0) return -1;
  return n > 0 ? n - 1 : vertCount + n;
}

/**
 * Sample a Wavefront OBJ into particle targets (vertices + edges, fitted to radius).
 */
export function buildObjTargets(
  objText: string,
  particleCount: number,
  radius = 2.1,
  seed = 19,
): Float32Array {
  const rand = mulberry32(seed);
  const verts: Array<[number, number, number]> = [];
  const samples: number[] = [];
  const lines = objText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("v ")) continue;
    const parts = trimmed.split(/\s+/);
    const x = Number(parts[1]);
    const y = Number(parts[2]);
    const z = Number(parts[3]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      verts.push([x, y, z]);
    }
  }

  const edgeSteps = verts.length > 8000 ? 3 : verts.length > 2000 ? 6 : 12;
  const seenEdges = new Set<string>();
  const addEdge = (ia: number, ib: number) => {
    if (ia < 0 || ib < 0 || ia === ib) return;
    const key = ia < ib ? `${ia}-${ib}` : `${ib}-${ia}`;
    if (seenEdges.has(key)) return;
    seenEdges.add(key);
    const a = verts[ia];
    const b = verts[ib];
    if (!a || !b) return;
    sampleSegment(samples, a[0], a[1], a[2], b[0], b[1], b[2], edgeSteps, rand, 0);
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("f ")) {
      const idxs = trimmed
        .split(/\s+/)
        .slice(1)
        .map((token) => parseObjIndex(token, verts.length))
        .filter((i) => i >= 0);
      for (let i = 0; i < idxs.length; i++) {
        const a = idxs[i];
        const b = idxs[(i + 1) % idxs.length];
        if (a === undefined || b === undefined) continue;
        addEdge(a, b);
      }
    } else if (trimmed.startsWith("l ")) {
      const idxs = trimmed
        .split(/\s+/)
        .slice(1)
        .map((token) => parseObjIndex(token, verts.length))
        .filter((i) => i >= 0);
      for (let i = 0; i < idxs.length - 1; i++) {
        const a = idxs[i];
        const b = idxs[i + 1];
        if (a === undefined || b === undefined) continue;
        addEdge(a, b);
      }
    }
  }

  if (samples.length < 9) {
    for (const [x, y, z] of verts) samples.push(x, y, z);
  }

  fitSamplesToRadius(samples, radius * 0.96);
  return assignSamplesToParticles(samples, particleCount, rand);
}

const SVG_NS = "http://www.w3.org/2000/svg";

function svgLocalName(el: Element): string {
  return el.tagName.toLowerCase().replace(/^svg:/, "");
}

function isSvgTemplateNode(el: Element): boolean {
  return Boolean(
    el.closest("defs, clipPath, mask, pattern, marker, symbol, linearGradient, radialGradient"),
  );
}

function cleanSvgMarkup(svgText: string): string | null {
  const cleaned = svgText
    .replace(/^\uFEFF/, "")
    .replace(/^<\?xml[^>]*>\s*/i, "")
    .replace(/<!DOCTYPE[^>]*>\s*/i, "")
    .trim();
  if (!cleaned) return null;
  return /<svg[\s>]/i.test(cleaned)
    ? cleaned
    : `<svg xmlns="${SVG_NS}" viewBox="0 0 100 100">${cleaned}</svg>`;
}

function parseSvgHref(raw: string | null): string | null {
  if (!raw) return null;
  let href = raw.trim();
  if (/^url\(/i.test(href)) {
    href = href.replace(/^url\(/i, "").replace(/\)\s*$/, "").trim().replace(/^['"]|['"]$/g, "");
  }
  const hash = href.lastIndexOf("#");
  if (hash < 0) return null;
  const id = href.slice(hash + 1).trim();
  return id || null;
}

function parseViewBox(value: string | null): { x: number; y: number; w: number; h: number } | null {
  if (!value) return null;
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 4 || parts.some((n) => !Number.isFinite(n))) return null;
  const w = parts[2] ?? 0;
  const h = parts[3] ?? 0;
  if (w === 0 || h === 0) return null;
  return { x: parts[0] ?? 0, y: parts[1] ?? 0, w, h };
}

function localToRootMatrix(svg: SVGSVGElement, el: Element): DOMMatrix | null {
  const gfx = el as SVGGraphicsElement;
  const elCtm =
    typeof gfx.getScreenCTM === "function" ? gfx.getScreenCTM() : null;
  const rootCtm = svg.getScreenCTM?.() ?? null;
  if (elCtm && rootCtm) {
    try {
      return rootCtm.inverse().multiply(elCtm);
    } catch {
      return elCtm;
    }
  }
  return typeof gfx.getCTM === "function" ? gfx.getCTM() : null;
}

function pushSvgPoint(
  svg: SVGSVGElement,
  ctm: DOMMatrix | null,
  x: number,
  y: number,
  samples: number[],
  rand: () => number,
) {
  let px = x;
  let py = y;
  if (ctm) {
    const point = svg.createSVGPoint();
    point.x = x;
    point.y = y;
    const mapped = point.matrixTransform(ctm);
    px = mapped.x;
    py = mapped.y;
  }
  samples.push(px, -py, (rand() - 0.5) * 0.045);
}

function sampleSvgGeometryElement(
  svg: SVGSVGElement,
  el: Element,
  samples: number[],
  rand: () => number,
) {
  const geom = el as SVGGeometryElement;
  const ctm = localToRootMatrix(svg, el);
  try {
    if (typeof geom.getTotalLength === "function") {
      const length = geom.getTotalLength();
      if (Number.isFinite(length) && length > 0) {
        const steps = Math.max(24, Math.min(720, Math.round(length / 1.6)));
        for (let i = 0; i <= steps; i++) {
          const point = geom.getPointAtLength((i / steps) * length);
          pushSvgPoint(svg, ctm, point.x, point.y, samples, rand);
        }
        return;
      }
    }
  } catch {
    /* Some SVG nodes expose the API but reject zero-size geometry. */
  }
  try {
    const box = (el as SVGGraphicsElement).getBBox();
    if (!box.width && !box.height) return;
    const corners: Array<[number, number]> = [
      [box.x, box.y],
      [box.x + box.width, box.y],
      [box.x + box.width, box.y + box.height],
      [box.x, box.y + box.height],
    ];
    for (let c = 0; c < 4; c++) {
      const a = corners[c];
      const b = corners[(c + 1) % 4];
      if (!a || !b) continue;
      for (let s = 0; s <= 12; s++) {
        const t = s / 12;
        pushSvgPoint(
          svg,
          ctm,
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
          samples,
          rand,
        );
      }
    }
  } catch {
    /* getBBox also throws for unrendered / empty nodes. */
  }
}

function flattenSvgUses(svg: SVGSVGElement) {
  for (let pass = 0; pass < 8; pass++) {
    const uses = [...svg.querySelectorAll("use")];
    if (uses.length === 0) break;
    for (const use of uses) {
      const id = parseSvgHref(
        use.getAttribute("href") ||
          use.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
          use.getAttribute("xlink:href"),
      );
      const ref = id ? svg.getElementById(id) : null;
      if (!ref) {
        use.remove();
        continue;
      }
      const group = document.createElementNS(SVG_NS, "g");
      const x = Number(use.getAttribute("x") || 0) || 0;
      const y = Number(use.getAttribute("y") || 0) || 0;
      const width = Number(use.getAttribute("width") || "");
      const height = Number(use.getAttribute("height") || "");
      const ownTransform = use.getAttribute("transform") || "";
      const vb = parseViewBox(ref.getAttribute("viewBox"));
      let extra = `translate(${x} ${y})`;
      if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && vb) {
        extra += ` scale(${width / vb.w} ${height / vb.h}) translate(${-vb.x} ${-vb.y})`;
      }
      group.setAttribute("transform", `${ownTransform} ${extra}`.trim());
      for (const attr of ["fill", "stroke", "stroke-width", "opacity", "fill-opacity", "stroke-opacity"]) {
        const value = use.getAttribute(attr);
        if (value && !group.hasAttribute(attr)) group.setAttribute(attr, value);
      }
      const refName = svgLocalName(ref);
      if (refName === "symbol" || refName === "svg" || refName === "g") {
        for (const child of [...ref.childNodes]) {
          group.appendChild(child.cloneNode(true));
        }
      } else {
        group.appendChild(ref.cloneNode(true));
      }
      use.replaceWith(group);
    }
  }
}

function mountSvgForSampling(svgText: string): { host: HTMLDivElement; svg: SVGSVGElement } | null {
  const markup = cleanSvgMarkup(svgText);
  if (!markup) return null;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:0;top:0;width:512px;height:512px;visibility:hidden;pointer-events:none;z-index:-1;";
  document.body.appendChild(host);

  try {
    host.innerHTML = markup;
  } catch {
    host.remove();
    return null;
  }

  let svg = host.querySelector("svg");
  if (!svg) {
    const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
    const parsedSvg = parsed.documentElement;
    if (
      parsedSvg &&
      svgLocalName(parsedSvg) === "svg" &&
      !parsed.querySelector("parsererror")
    ) {
      svg = document.importNode(parsedSvg, true) as unknown as SVGSVGElement;
      host.replaceChildren(svg);
    }
  }
  if (!svg) {
    host.remove();
    return null;
  }

  if (!svg.getAttribute("xmlns")) svg.setAttribute("xmlns", SVG_NS);
  svg.setAttribute("width", "512");
  svg.setAttribute("height", "512");
  flattenSvgUses(svg);
  try {
    void svg.getBBox();
  } catch {
    /* Layout probe only. */
  }
  return { host, svg };
}

function collectSvgSamples(svg: SVGSVGElement, rand: () => number): number[] {
  const samples: number[] = [];
  const nodes = svg.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect");
  for (const node of nodes) {
    if (isSvgTemplateNode(node)) continue;
    sampleSvgGeometryElement(svg, node, samples, rand);
  }
  if (samples.length < 9) {
    for (const node of nodes) {
      sampleSvgGeometryElement(svg, node, samples, rand);
    }
  }
  return samples;
}

/**
 * Sample an SVG (paths, circles, lines, polygons, use/defs) into particle targets.
 * Uses the browser SVG engine so cubic/arc commands stay accurate.
 */
export function buildSvgTargets(
  svgText: string,
  particleCount: number,
  radius = 2.1,
  seed = 23,
): Float32Array | null {
  if (typeof document === "undefined") return null;
  const rand = mulberry32(seed);
  const mounted = mountSvgForSampling(svgText);
  if (!mounted) return null;

  let samples: number[] = [];
  try {
    samples = collectSvgSamples(mounted.svg, rand);
  } finally {
    mounted.host.remove();
  }

  if (samples.length < 9) return null;
  fitSamplesToRadius(samples, radius * 0.96);
  return assignSamplesToParticles(samples, particleCount, rand);
}

/** Fallback when path sampling fails (text, embedded images, messy XML). */
export async function buildSvgTargetsFromRaster(
  svgText: string,
  particleCount: number,
  radius = 2.1,
  seed = 23,
): Promise<Float32Array | null> {
  if (typeof document === "undefined") return null;
  const markup = cleanSvgMarkup(svgText);
  if (!markup) return null;

  const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const size = 640;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || img.width < 1 || img.height < 1) return null;
    const scale = Math.min(size / img.width, size / img.height);
    const drawW = Math.max(1, img.width * scale);
    const drawH = Math.max(1, img.height * scale);
    const ox = (size - drawW) * 0.5;
    const oy = (size - drawH) * 0.5;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, ox, oy, drawW, drawH);
    const pixels = ctx.getImageData(0, 0, size, size).data;
    const corner = (x: number, y: number) => {
      const i = (y * size + x) * 4;
      return {
        r: pixels[i] ?? 0,
        g: pixels[i + 1] ?? 0,
        b: pixels[i + 2] ?? 0,
        a: pixels[i + 3] ?? 0,
      };
    };
    const bg = corner(0, 0);
    const samples: number[] = [];
    const rand = mulberry32(seed);
    const step = 2;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        const i = (y * size + x) * 4;
        const r = pixels[i] ?? 0;
        const g = pixels[i + 1] ?? 0;
        const b = pixels[i + 2] ?? 0;
        const a = pixels[i + 3] ?? 0;
        if (a < 28) continue;
        const dr = r - bg.r;
        const dg = g - bg.g;
        const db = b - bg.b;
        const da = a - bg.a;
        if (Math.hypot(dr, dg, db, da) < 28) continue;
        samples.push(x, -y, (rand() - 0.5) * 0.04);
      }
    }
    if (samples.length < 9) return null;
    fitSamplesToRadius(samples, radius * 0.96);
    return assignSamplesToParticles(samples, particleCount, rand);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function buildSvgTargetsAsync(
  svgText: string,
  particleCount: number,
  radius = 2.1,
  seed = 23,
): Promise<Float32Array | null> {
  return (
    buildSvgTargets(svgText, particleCount, radius, seed) ??
    (await buildSvgTargetsFromRaster(svgText, particleCount, radius, seed))
  );
}

/** Battement très subtil */
export function heartbeatPulse(elapsedSeconds: number, bpm = 62): number {
  const period = 60 / bpm;
  const phase = (elapsedSeconds % period) / period;
  const lub = Math.exp(-Math.pow((phase - 0.1) / 0.055, 2));
  const dub = Math.exp(-Math.pow((phase - 0.22) / 0.04, 2)) * 0.55;
  return (lub + dub) * 0.55;
}

export function bandAverage(data: Uint8Array, start: number, end: number): number {
  if (end <= start) return 0;
  let sum = 0;
  for (let i = start; i < end; i++) sum += data[i] ?? 0;
  return sum / (end - start) / 255;
}

export function coreRadiusForViewport(
  cameraFovDeg: number,
  cameraZ: number,
  viewportHeightPx: number,
  cloudHeightRatio: number,
): number {
  const fovRad = (cameraFovDeg * Math.PI) / 180;
  const visibleWorldHeight = 2 * Math.tan(fovRad / 2) * cameraZ;
  return (visibleWorldHeight * cloudHeightRatio) * 0.48;
}
