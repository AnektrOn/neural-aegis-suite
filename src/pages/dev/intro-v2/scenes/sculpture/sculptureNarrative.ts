/** Scene 2 hold — particle unification capped so the crisp crystal never forms. */

/** Max particle unification (never fully snaps to the sampled crystal layout). */
export const SCULPTURE_HOLD_ORDER_CAP = 0.95;

/** Maps hold progress to sculpture engine order (0 = vortex, 1 = cap). */
export function sculptureHoldVisualOrder(mix: number): number {
  if (mix <= 0) return 0;
  const t = Math.min(1, Math.max(0, mix));
  const eased = t * t * (3 - 2 * t);
  return eased * SCULPTURE_HOLD_ORDER_CAP;
}
