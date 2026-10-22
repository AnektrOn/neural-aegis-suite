import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/** Studio HDR procédural : dôme dégradé + softboxes surexposées (valeurs > 1). */
function buildStudioScene(): THREE.Scene {
  const s = new THREE.Scene();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(60, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP;
        void main(){
          float h = normalize(vP).y;
          vec3 top = vec3(0.10, 0.13, 0.22);
          vec3 mid = vec3(0.025, 0.03, 0.05);
          vec3 bot = vec3(0.01, 0.01, 0.015);
          vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.7)) : mix(mid, bot, pow(-h, 0.5));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  s.add(dome);

  const box = (w: number, h: number, pos: [number, number, number], color: number, power: number) => {
    const c = new THREE.Color(color).multiplyScalar(power);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, toneMapped: false }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };

  // Softboxes légèrement adoucies pour des reflets nets sans brûler l'obsidienne.
  box(22, 14, [-16, 11, 12], 0xffa45a, 6.2); // clé chaude
  box(5, 26, [18, 5, -10], 0x58b8ff, 8.0); // bande froide en contre-jour
  box(30, 30, [0, 28, 0], 0xdfe8ff, 2.0); // plafond blanc froid
  box(4, 20, [-20, 2, -14], 0xff6a2a, 5.2); // liseré orange derrière
  box(16, 3, [4, -9, 16], 0x9a7bff, 2.2); // rebond violet bas
  return s;
}

function disposeStudioScene(studio: THREE.Scene) {
  studio.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}

/** PMREM studio seul — à utiliser quand la scène a déjà un composer / bloom. */
export function createStudioEnvMap(renderer: THREE.WebGLRenderer): {
  envMap: THREE.Texture;
  dispose: () => void;
} {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = buildStudioScene();
  const rt = pmrem.fromScene(studio, 0.02);
  disposeStudioScene(studio);
  pmrem.dispose();
  return {
    envMap: rt.texture,
    dispose: () => rt.dispose(),
  };
}

export type CubeEnvironment = {
  envMap: THREE.Texture;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  render: () => void;
  setSize: (w: number, h: number) => void;
  dispose: () => void;
};

export function createCubeEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
): CubeEnvironment {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const { envMap, dispose: disposeEnv } = createStudioEnvMap(renderer);
  scene.environment = envMap;
  scene.environmentIntensity = 1.05;

  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // strength / radius / threshold : halo présent sans noyer les softbox reflections
  const bloom = new UnrealBloomPass(size, 0.48, 0.72, 0.93);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  return {
    envMap,
    composer,
    bloom,
    render: () => composer.render(),
    setSize: (w, h) => {
      composer.setSize(w, h);
      bloom.setSize(w, h);
    },
    dispose: () => {
      disposeEnv();
      composer.dispose();
      if (scene.environment === envMap) scene.environment = null;
    },
  };
}
