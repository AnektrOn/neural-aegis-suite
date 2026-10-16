/**
 * Reference implementation (sync with):
 * `npx degit pmndrs/examples/examples/nextjs-prism`
 * https://github.com/pmndrs/examples/tree/main/examples/nextjs-prism
 *
 * AEGIS landing keeps upstream glass material + post-FX;
 * `Prism.tsx` swaps `prism.glb` geometry for the shield GLB.
 */

/** From upstream `src/components/Prism.tsx` — MeshTransmissionMaterial props */
export const PMNDRS_PRISM_GLASS = {
  clearcoat: 1,
  transmission: 1,
  thickness: 0.9,
  roughness: 0,
  anisotropy: 0.1,
  chromaticAberration: 1,
  toneMapped: false,
} as const;
