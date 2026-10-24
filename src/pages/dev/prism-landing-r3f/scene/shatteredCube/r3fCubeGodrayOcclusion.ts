import * as THREE from "three";
import { R3F_SHATTERED_CUBE_LIGHT_LAYER } from "./r3fShatteredCubeConstants";

/**
 * Meshes opaques du monolithe / sol : aussi sur le layer du cube pour que la shadow map
 * de la PointLight noyau alimente GodraysPass (sinon les rayons traversent les piliers).
 */
export function enableR3fCubeGodrayOcclusion(root: THREE.Object3D) {
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!child.castShadow) return;
    child.layers.enable(R3F_SHATTERED_CUBE_LIGHT_LAYER);
  });
}
