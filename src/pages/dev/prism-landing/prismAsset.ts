/**
 * Landing hero GLB + pmndrs prism fallback.
 * Upstream: https://github.com/pmndrs/examples/tree/main/examples/nextjs-prism
 */
import pmndrsPrismGlb from "./assets/gltf/prism.glb?url";
import heroShieldGlb from "./assets/gltf/halo_hunter_shield2K.glb?url";
import heroShieldGlbFallback from "./assets/gltf/halo_hunter_shield.glb?url";

const shieldGlbFromEnv = import.meta.env.VITE_PRISM_SHIELD_GLB_URL as
  | string
  | undefined;

/** `aegis` = shield GLB + pmndrs glass material; `pmndrs` = original demo asset. */
export type PrismRenderMode = "pmndrs" | "aegis";

export const PRISM_RENDER_MODE = "aegis" as PrismRenderMode;

export const PRISM_GLB_URL =
  PRISM_RENDER_MODE === "pmndrs"
    ? pmndrsPrismGlb
    : (shieldGlbFromEnv ?? heroShieldGlb);

/** Sketchfab shield is ~636 tris — swap GLB via VITE_PRISM_SHIELD_GLB_URL for hero quality. */
export const PRISM_SHIELD_GLB_FALLBACK_URL = heroShieldGlbFallback;

export const PRISM_GLTF_MESH_NAME =
  PRISM_RENDER_MODE === "pmndrs" ? "Cone" : "Object_0";

/** Default height when no section preset is passed (see prismLandingPresets). */
export const PRISM_TARGET_HEIGHT = 4.85;

export const PRISM_POSITION: [number, number, number] = [0, -0.85, 0];
