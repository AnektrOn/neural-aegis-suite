import * as THREE from "three";

const _viewCam = new THREE.Vector3();
const _viewScreen = new THREE.Vector3();

/**
 * 0 = pas de godrays (hors champ / derrière caméra / fente en bord d’écran seulement).
 * 1 = fente bien dans le cadre — évite le voile plein écran quand le portail est une bande latérale.
 */
export function landingPortalGodraysStrengthFactor(
  camera: THREE.PerspectiveCamera,
  portalAnchor: THREE.Vector3,
): number {
  _viewCam.copy(portalAnchor).applyMatrix4(camera.matrixWorldInverse);
  if (_viewCam.z >= -0.08) return 0;

  _viewScreen.copy(portalAnchor).project(camera);
  const margin = 0.1;
  if (
    _viewScreen.x < -margin ||
    _viewScreen.x > 1 + margin ||
    _viewScreen.y < -margin ||
    _viewScreen.y > 1 + margin
  ) {
    return 0;
  }

  const inset = 0.14;
  const dx = Math.min(_viewScreen.x - inset, 1 - inset - _viewScreen.x);
  const dy = Math.min(_viewScreen.y - inset, 1 - inset - _viewScreen.y);
  const edge = Math.min(dx, dy);
  if (edge <= 0) {
    return THREE.MathUtils.clamp(edge / inset + 0.15, 0, 0.22);
  }
  return THREE.MathUtils.clamp(0.35 + edge * 2.2, 0.35, 1);
}

/** @deprecated utiliser `landingPortalGodraysStrengthFactor` */
export function isLandingPortalGodraysVisible(
  camera: THREE.PerspectiveCamera,
  portalAnchor: THREE.Vector3,
  viewCam: THREE.Vector3,
  viewScreen: THREE.Vector3,
): boolean {
  viewCam.copy(portalAnchor).applyMatrix4(camera.matrixWorldInverse);
  if (viewCam.z >= -0.05) return false;
  viewScreen.copy(portalAnchor).project(camera);
  return (
    viewScreen.x >= 0.02 &&
    viewScreen.x <= 0.98 &&
    viewScreen.y >= 0.02 &&
    viewScreen.y <= 0.98
  );
}
