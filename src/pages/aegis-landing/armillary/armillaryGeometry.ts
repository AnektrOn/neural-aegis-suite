import { DEG } from "./armillaryConstants";

type Mesh = { P: number[]; N: number[]; I: number[]; UV?: number[]; T?: number[] };

export function extrudeProfile(profile: number[][], segments: number): Mesh {
  const P: number[] = [];
  const N: number[] = [];
  const UV: number[] = [];
  const T: number[] = [];
  const I: number[] = [];
  const n = profile.length;
  const vDenom = Math.max(1, n - 1);
  for (let s = 0; s <= segments; s++) {
    const t = (s / segments) * Math.PI * 2;
    const cf = Math.cos(t);
    const sf = Math.sin(t);
    const u = (s / segments) * 3;
    for (let i = 0; i < n; i++) {
      const [px, py, nx, ny] = profile[i];
      P.push(px * cf, px * sf, py);
      N.push(nx * cf, nx * sf, ny);
      UV.push(u, i / vDenom);
      T.push(-sf, cf, 0);
    }
  }
  for (let s = 0; s < segments; s++) {
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = s * n + i;
      const b = (s + 1) * n + i;
      const c = (s + 1) * n + j;
      const d = s * n + j;
      I.push(a, b, c, a, c, d);
    }
  }
  return { P, N, I, UV, T };
}

/** Cross-section of a torus band: `inner`/`outer` radii, `depth` along the local Z of the profile. */
export function ringBandProfile(
  inner: number,
  outer: number,
  depth: number,
  bevel = 0.025,
  filletSteps = 5,
) {
  const half = [
    [outer - bevel, depth / 2 - bevel, 0],
    [inner + bevel, depth / 2 - bevel, 90],
    [inner + bevel, -depth / 2 + bevel, 180],
    [outer - bevel, -depth / 2 + bevel, 270],
  ] as const;
  const profile: number[][] = [];
  for (const [cx, cy, startDeg] of half) {
    for (let k = 0; k <= filletSteps; k++) {
      const ang = (startDeg + (90 * k) / filletSteps) * DEG;
      const cv = Math.cos(ang);
      const sv = Math.sin(ang);
      profile.push([cx + bevel * cv, cy + bevel * sv, cv, sv]);
    }
  }
  return profile;
}

export function filletProfile(radius: number, tube: number, segments = 10) {
  return Array.from({ length: segments }, (_, i) => {
    const t = (i / segments) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    return [radius + tube * c, tube * s, c, s];
  });
}

export function sphereMesh(radius: number, lat = 32, lon = 48): Mesh {
  const P: number[] = [];
  const N: number[] = [];
  const I: number[] = [];
  for (let i = 0; i <= lat; i++) {
    const v = i / lat;
    const phi = v * Math.PI;
    for (let j = 0; j <= lon; j++) {
      const u = j / lon;
      const theta = u * Math.PI * 2;
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      P.push(radius * x, radius * y, radius * z);
      N.push(x, y, z);
    }
  }
  for (let i = 0; i < lat; i++) {
    for (let j = 0; j < lon; j++) {
      const a = i * (lon + 1) + j;
      const b = a + lon + 1;
      I.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return { P, N, I };
}

export function tickMarksMesh(spec: {
  R: number;
  w: number;
  depth: number;
  ticks: number;
}): Mesh {
  const { R, w, depth, ticks } = spec;
  const P: number[] = [];
  const N: number[] = [];
  const I: number[] = [];
  const tickDepth = 0.012;
  for (let side of [1, -1] as const) {
    for (let h = 0; h < ticks; h++) {
      const g = (h / ticks) * Math.PI * 2;
      const major = h % 6 === 0;
      const len = major ? w * 0.7 : w * 0.38;
      const r = R - w * 0.5 + (major ? 0 : w * 0.15);
      const cx = Math.cos(g) * r;
      const cy = Math.sin(g) * r;
      const ty = Math.cos(g);
      const tz = Math.sin(g);
      const bx = -tz;
      const bz = ty;
      const z = side * (depth / 2 + 0.02);
      const base = P.length / 3;
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ] as const) {
        P.push(
          cx + ty * (sx * len) / 2 + bx * (sy * tickDepth) / 2,
          cy + tz * (sx * len) / 2 + bz * (sy * tickDepth) / 2,
          z,
        );
        N.push(0, 0, side);
      }
      I.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  return { P, N, I };
}
