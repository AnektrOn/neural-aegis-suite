import * as THREE from "three-aegis-core";

/** Studio IBL léger pour reflets verre (sans RoomEnvironment, absent en r128) */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const pmrem = new THREE.PMREMGenerator(renderer);
  if (typeof pmrem.compileCubemapShader === "function") {
    pmrem.compileCubemapShader();
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8e7e5);

  const panelGeo = new THREE.PlaneGeometry(14, 14);

  const keyPanel = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  keyPanel.position.set(6, 5, 4);
  keyPanel.lookAt(0, 0, 0);
  scene.add(keyPanel);

  const topPanel = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: 0xfafafa }),
  );
  topPanel.position.set(0, 8, 0);
  topPanel.rotation.x = Math.PI * 0.5;
  scene.add(topPanel);

  const fillPanel = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: 0xd4e0ea }),
  );
  fillPanel.position.set(-6, 2, 3);
  fillPanel.lookAt(0, 0, 0);
  scene.add(fillPanel);

  const rimPanel = new THREE.Mesh(
    panelGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  rimPanel.position.set(0, 2, -7);
  rimPanel.lookAt(0, 0, 0);
  scene.add(rimPanel);

  return pmrem.fromScene(scene, 0.04);
}
