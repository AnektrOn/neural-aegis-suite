/** Lire les tokens Aegis (HSL triplets dans index.css) pour Three.js. */

export type AegisWirePalette = {
  fillHex: number;
  wireHex: number;
  wireBaseRgb: [number, number, number];
  zoneRgb: [number, number, number];
  markerHex: number;
  markerSpotHex: number;
  ambientHex: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
};

function parseHslTriplet(raw: string): [number, number, number] | null {
  const m = raw.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function hslToRgb01(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [r + m, g + m, b + m];
}

function cssHslVar(name: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const parsed = parseHslTriplet(raw);
  if (!parsed) return fallback;
  return hslToRgb01(parsed[0], parsed[1], parsed[2]);
}

function rgb01ToHex(r: number, g: number, b: number): number {
  const ri = Math.round(Math.min(1, Math.max(0, r)) * 255);
  const gi = Math.round(Math.min(1, Math.max(0, g)) * 255);
  const bi = Math.round(Math.min(1, Math.max(0, b)) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Palette fil de fer Dien Chan alignée sur DienChanMap / tokens Aegis. */
export function readAegisWirePalette(light: boolean): AegisWirePalette {
  const primary = cssHslVar("--primary", [0.78, 0.62, 0.52]);
  const warm = cssHslVar("--aegis-warm", [0.92, 0.72, 0.45]);
  const bg = cssHslVar("--background", [0.06, 0.09, 0.11]);
  const primaryMuted = cssHslVar("--primary-muted", [0.12, 0.1, 0.08]);
  const border = cssHslVar("--border", [0.22, 0.28, 0.32]);

  const wireLineRgb = mixRgb(primary, border, light ? 0.38 : 0.48);
  const zoneRgb = warm;
  const wireRgb = mixRgb(primary, warm, 0.22);

  const markerSpotHex = rgb01ToHex(warm[0], warm[1], warm[2]);
  const markerHex = rgb01ToHex(
    warm[0] * 0.92 + primary[0] * 0.08,
    warm[1] * 0.92 + primary[1] * 0.08,
    warm[2] * 0.92 + primary[2] * 0.08,
  );

  const ambient = mixRgb(primary, bg, 0.72);

  return {
    fillHex: rgb01ToHex(bg[0], bg[1], bg[2]),
    wireHex: rgb01ToHex(wireRgb[0], wireRgb[1], wireRgb[2]),
    wireBaseRgb: wireLineRgb,
    zoneRgb,
    markerHex,
    markerSpotHex,
    ambientHex: rgb01ToHex(ambient[0], ambient[1], ambient[2]),
    bloomStrength: light ? 0.12 : 0.42,
    bloomRadius: light ? 0.22 : 0.45,
    bloomThreshold: light ? 0.62 : 0.18,
  };
}
