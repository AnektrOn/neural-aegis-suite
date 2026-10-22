import * as THREE from "three";

export type LandingPortalVolumetrics = {
  shaftLight: THREE.DirectionalLight;
  transmissionMesh: THREE.Mesh;
  dispose: () => void;
};

/**
 * Shaft + transmission (fente). Non branché sur la landing travelling : le volume
 * HDR + godrays écran donnaient des bandes visibles. Réactiver seulement avec
 * plans portail-only et sans émetteur cube dans le champ.
 */
export function createLandingPortalVolumetrics(
  slitCenterWorld: THREE.Vector3,
  cameraReference: THREE.Vector3,
  gapWidth: number,
  portalHeight: number,
): LandingPortalVolumetrics {
  const shaftLight = new THREE.DirectionalLight(0xf07830, 0.38);
  shaftLight.castShadow = true;
  shaftLight.shadow.mapSize.set(2048, 2048);
  shaftLight.shadow.bias = -0.0002;
  shaftLight.shadow.normalBias = 0.018;

  aimShaftThroughSlit(shaftLight, slitCenterWorld, cameraReference, gapWidth, portalHeight);

  const transmissionMesh = new THREE.Mesh(
    new THREE.BoxGeometry(gapWidth * 0.92, portalHeight * 0.94, 0.22),
    new THREE.MeshPhysicalMaterial({
      color: 0xffb070,
      transmission: 1,
      thickness: 1.4,
      roughness: 0.42,
      metalness: 0,
      ior: 1.12,
      transparent: true,
      opacity: 0.42,
      attenuationColor: new THREE.Color(0xff5c18),
      attenuationDistance: 3.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  transmissionMesh.position.copy(slitCenterWorld);
  transmissionMesh.renderOrder = 5;
  transmissionMesh.castShadow = false;
  transmissionMesh.receiveShadow = false;

  return {
    shaftLight,
    transmissionMesh,
    dispose: () => {
      transmissionMesh.geometry.dispose();
      (transmissionMesh.material as THREE.Material).dispose();
    },
  };
}

/** Lumière derrière la fente, axe caméra ↔ fente (godrays volumétriques + ombres piliers). */
export function aimShaftThroughSlit(
  light: THREE.DirectionalLight,
  slitCenter: THREE.Vector3,
  cameraReference: THREE.Vector3,
  gapWidth: number,
  portalHeight: number,
) {
  const toSlit = new THREE.Vector3().subVectors(slitCenter, cameraReference);
  const camDist = Math.max(toSlit.length(), 0.001);
  toSlit.multiplyScalar(1 / camDist);

  const back = 32;
  light.position.copy(slitCenter).addScaledVector(toSlit, back);
  light.target.position.copy(slitCenter).addScaledVector(toSlit, -10);
  light.target.updateMatrixWorld();

  const cam = light.shadow.camera as THREE.OrthographicCamera;
  const halfW = gapWidth * 0.55 + 1.2;
  const halfH = portalHeight * 0.48;
  cam.near = back - 6;
  cam.far = back + camDist + 12;
  cam.left = -halfW;
  cam.right = halfW;
  cam.top = halfH;
  cam.bottom = -halfH;
  cam.updateProjectionMatrix();
}
