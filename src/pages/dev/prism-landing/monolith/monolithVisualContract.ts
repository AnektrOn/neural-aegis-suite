/**
 * Visual contract for /dev/prism-landing (graphics-validation protocol).
 * Invariants must stay true with bloom disabled (`?monolithDebug=hdr`).
 */
export const MONOLITH_VISUAL_CONTRACT = {
  subject: "Symmetric marble monolith slit over basin water",
  identity: [
    "two dark pillars with ~0.7 m gap",
    "orange HDR slit source (not bloom-only)",
    "directional godrays through shadow gap",
  ],
  silhouette: [
    "pillar rims readable without bloom",
    "slit vertical band centered on gap axis",
  ],
  materialSeparation: [
    "marble pillars darker than fog",
    "water darker than fog with orange specular toward slit",
    "rocks rim-lit from slit",
  ],
  motion: ["slow water ripples", "stable godray axis (no sliding bar)"],
  cameraEnvelope: { near: 6, design: 14, far: 55 },
  lightingEnvelope: [
    "single directional shaft through gap",
    "no RectArea wash stacking on slit",
  ],
  invariants: [
    "primary pillar silhouette visible with bloom intensity 0",
    "slit remains colored (not full-frame white) at design exposure",
    "godray column shares gap axis (not offset ghost bar)",
    "tone mapping runs in exactly one post pass (not in slit material)",
  ],
  allowedDivergences: [
    "no human silhouette in slit (not yet authored)",
    "simplified exposure meter (64×36, no sky mask)",
  ],
  frameBudgetMs: 16.7,
} as const;
