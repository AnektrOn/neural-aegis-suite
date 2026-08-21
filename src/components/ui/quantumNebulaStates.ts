export type QuantumNebulaState = "solid" | "reflexion" | "mouvement";

export const QUANTUM_NEBULA_STATES: QuantumNebulaState[] = [
  "solid",
  "reflexion",
  "mouvement",
];

export const QUANTUM_NEBULA_STATE_LABELS: Record<
  QuantumNebulaState,
  { fr: string; en: string; description: { fr: string; en: string } }
> = {
  solid: {
    fr: "Solide",
    en: "Solid",
    description: {
      fr: "Nuage organique de particules — mouvement curl noise fluide",
      en: "Organic particle cloud — fluid curl noise motion",
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
      fr: "Sans son : nuage initial (comme Solide). Avec audio : ondulation organique",
      en: "No sound: initial cloud (like Solid). With audio: organic ripple",
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
 * Targets are fitted inside `maxRadius` so they share the same container as solid/mouvement.
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

  const sampleCount = samples.length / 3;
  const targets = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const si = Math.floor(rand() * sampleCount) * 3;
    const i3 = i * 3;
    targets[i3] = samples[si] ?? 0;
    targets[i3 + 1] = samples[si + 1] ?? 0;
    targets[i3 + 2] = samples[si + 2] ?? 0;
  }
  return targets;
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
