import {
  cloneLandingStageLayout,
  type LandingStageItemId,
  type LandingStageItemTransform,
  type LandingStageLayout,
  type LandingStageLinkMode,
} from "./landingStageLayout";

export const LANDING_SCROLL_KEYFRAME_COUNT = 8;

const LINK_MODES: LandingStageLinkMode[] = [
  "independent",
  "all",
  "shield-ring",
  "shield-aegis",
  "ring-aegis",
];

/** Deterministic PRNG (Mulberry32). */
export function createScrollRng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpTriple(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function lerpItem(
  a: LandingStageItemTransform,
  b: LandingStageItemTransform,
  t: number,
): LandingStageItemTransform {
  return {
    position: lerpTriple(a.position, b.position, t),
    rotation: lerpTriple(a.rotation, b.rotation, t),
    scale: lerp(a.scale, b.scale, t),
    visible: t < 0.5 ? a.visible : b.visible,
  };
}

export function lerpLandingStageLayout(
  a: LandingStageLayout,
  b: LandingStageLayout,
  t: number,
): LandingStageLayout {
  const u = smoothstep(t);
  const items = {} as LandingStageLayout["items"];
  for (const id of Object.keys(a.items) as LandingStageItemId[]) {
    items[id] = lerpItem(a.items[id], b.items[id], u);
  }
  return {
    link: u < 0.5 ? a.link : b.link,
    cluster: {
      position: lerpTriple(a.cluster.position, b.cluster.position, u),
      rotation: lerpTriple(a.cluster.rotation, b.cluster.rotation, u),
      scale: lerp(a.cluster.scale, b.cluster.scale, u),
    },
    items,
  };
}

function randomItem(
  rng: () => number,
  id: LandingStageItemId,
  anchor: LandingStageItemTransform,
): LandingStageItemTransform {
  const spread =
    id === "shield" ? 1.4 : id === "ring" ? 1.1 : 1.6;
  const pos = anchor.position.map(
    (v, i) => v + (rng() * 2 - 1) * spread * (i === 2 ? 0.55 : 1),
  ) as [number, number, number];
  const rot = anchor.rotation.map(
    () => (rng() * 2 - 1) * 0.35,
  ) as [number, number, number];
  const scale =
    anchor.scale * (0.65 + rng() * 1.1) * (id === "shield" ? 1 : 0.95);

  return {
    position: pos,
    rotation: rot,
    scale: Math.min(12, Math.max(0.2, scale)),
    visible: rng() > 0.08,
  };
}

export function randomLandingStageLayout(
  rng: () => number,
  anchor: LandingStageLayout,
): LandingStageLayout {
  const link = LINK_MODES[Math.floor(rng() * LINK_MODES.length)]!;
  const items = {} as LandingStageLayout["items"];
  for (const id of Object.keys(anchor.items) as LandingStageItemId[]) {
    items[id] = randomItem(rng, id, anchor.items[id]);
  }
  return {
    link,
    cluster: {
      position: [
        (rng() * 2 - 1) * 1.2,
        (rng() * 2 - 1) * 0.9,
        (rng() * 2 - 1) * 0.4,
      ],
      rotation: [0, 0, (rng() * 2 - 1) * 0.2],
      scale: 0.75 + rng() * 0.85,
    },
    items,
  };
}

export function buildLandingScrollKeyframes(
  seed: number,
  anchor: LandingStageLayout,
  count = LANDING_SCROLL_KEYFRAME_COUNT,
): LandingStageLayout[] {
  const rng = createScrollRng(seed);
  const keyframes: LandingStageLayout[] = [cloneLandingStageLayout(anchor)];
  for (let i = 1; i < count; i++) {
    keyframes.push(randomLandingStageLayout(rng, anchor));
  }
  return keyframes;
}

export function sampleLandingScrollLayout(
  keyframes: LandingStageLayout[],
  scroll01: number,
): LandingStageLayout {
  if (keyframes.length === 0) {
    throw new Error("landing scroll keyframes empty");
  }
  if (keyframes.length === 1 || scroll01 <= 0) {
    return cloneLandingStageLayout(keyframes[0]);
  }
  const t = Math.min(1, Math.max(0, scroll01)) * (keyframes.length - 1);
  const i = Math.min(keyframes.length - 2, Math.floor(t));
  const frac = t - i;
  return lerpLandingStageLayout(keyframes[i], keyframes[i + 1], frac);
}

const SCROLL_SEED_KEY = "prism-landing-scroll-seed:v1";

export function loadLandingScrollSeed(): number | null {
  try {
    const raw = localStorage.getItem(SCROLL_SEED_KEY);
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveLandingScrollSeed(seed: number) {
  try {
    localStorage.setItem(SCROLL_SEED_KEY, String(seed));
  } catch {
    /* ignore */
  }
}
