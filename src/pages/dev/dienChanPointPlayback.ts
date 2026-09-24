/** Dwell time per BQC point step (bilateral coords highlighted together). */
export const POINT_STEP_MS = 3000;

/** Protocol order = massage order from the Moricoli / BQC tables. */
export function buildPointPlaybackSequence(pointIds: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const id of pointIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
