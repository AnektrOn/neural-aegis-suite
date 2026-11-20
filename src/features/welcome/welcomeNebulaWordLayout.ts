import { DEFAULT_HERO_VISUAL_TUNING } from "@/components/ui/quantum-nebula-hero-v3";

/** Doit correspondre à `QuantumNebulaHeroV3` (PerspectiveCamera). */
export const WELCOME_NEBULA_CAMERA_FOV = 65;

export interface WelcomeNebulaViewport {
  width: number;
  height: number;
}

export interface WelcomeNebulaScreenAnchor {
  /** 0 = gauche, 1 = droite */
  x: number;
  /** 0 = haut, 1 = bas */
  y: number;
}

/** Aligné sur le breakpoint `md` Tailwind — comportement mot simplifié en dessous. */
export const WELCOME_NEBULA_MOBILE_MAX_WIDTH = 768;

export const WELCOME_NEBULA_WORD_SCALE_DESKTOP = 1.55;
/** −33 % sur mobile */
export const WELCOME_NEBULA_WORD_SCALE_MOBILE =
  WELCOME_NEBULA_WORD_SCALE_DESKTOP * 0.67;

export function isWelcomeNebulaMobileViewport(
  viewport: WelcomeNebulaViewport = readWelcomeNebulaViewport(),
): boolean {
  return viewport.width < WELCOME_NEBULA_MOBILE_MAX_WIDTH;
}

export function getWelcomeNebulaWordScale(
  viewport: WelcomeNebulaViewport = readWelcomeNebulaViewport(),
): number {
  return isWelcomeNebulaMobileViewport(viewport)
    ? WELCOME_NEBULA_WORD_SCALE_MOBILE
    : WELCOME_NEBULA_WORD_SCALE_DESKTOP;
}

/** Ancres visuelles du mot (fractions du viewport). */
export const WELCOME_NEBULA_SCREEN_ANCHORS = {
  right: { x: 0.70, y: 0.54 },
  left: { x: 0.22, y: 0.54 },
  center: { x: 0.5, y: 0.5 },
} as const satisfies Record<string, WelcomeNebulaScreenAnchor>;

export type WelcomeNebulaWorldAnchor = {
  offsetX: number;
  offsetY: number;
};

/** Convertit une position normalisée écran → offset monde sur le plan z=0 (caméra sur +Z). */
export function screenNormToWorldOffset(
  normX: number,
  normY: number,
  viewport: WelcomeNebulaViewport,
  cameraDistance: number = DEFAULT_HERO_VISUAL_TUNING.cameraDistance,
  fovDeg: number = WELCOME_NEBULA_CAMERA_FOV,
): WelcomeNebulaWorldAnchor {
  const aspect =
    Math.max(viewport.width, 1) / Math.max(viewport.height, 1);
  const vFovRad = (fovDeg * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(vFovRad / 2) * cameraDistance;
  const visibleWidth = visibleHeight * aspect;
  return {
    offsetX: (normX - 0.5) * visibleWidth,
    offsetY: (0.5 - normY) * visibleHeight,
  };
}

export function getWelcomeNebulaWorldLayout(
  viewport?: WelcomeNebulaViewport,
  cameraDistance: number = DEFAULT_HERO_VISUAL_TUNING.cameraDistance,
): {
  right: WelcomeNebulaWorldAnchor;
  left: WelcomeNebulaWorldAnchor;
  center: WelcomeNebulaWorldAnchor;
} {
  const vp: WelcomeNebulaViewport =
    viewport ??
    (typeof window !== "undefined"
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: 390, height: 844 });

  const anchors = WELCOME_NEBULA_SCREEN_ANCHORS;
  const center = screenNormToWorldOffset(
    anchors.center.x,
    anchors.center.y,
    vp,
    cameraDistance,
  );
  if (isWelcomeNebulaMobileViewport(vp)) {
    return { right: center, left: center, center };
  }
  return {
    right: screenNormToWorldOffset(
      anchors.right.x,
      anchors.right.y,
      vp,
      cameraDistance,
    ),
    left: screenNormToWorldOffset(
      anchors.left.x,
      anchors.left.y,
      vp,
      cameraDistance,
    ),
    center,
  };
}

export function readWelcomeNebulaViewport(): WelcomeNebulaViewport {
  if (typeof window === "undefined") {
    return { width: 390, height: 844 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}