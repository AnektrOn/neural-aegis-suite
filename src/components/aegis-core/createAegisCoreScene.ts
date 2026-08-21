import * as THREE from "three-aegis-core";
import { RoomEnvironment } from "three-aegis-core/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three-aegis-core/examples/jsm/controls/OrbitControls.js";
import {
  AEGIS_CORE_FRAGMENT_SHADER,
  AEGIS_CORE_VERTEX_SHADER,
  AEGIS_SHELL_VERTEX_PATCH,
} from "./aegisCoreShaders";
import {
  COSMIC_DISC_FRAGMENT_SHADER,
  COSMIC_DISC_VERTEX_SHADER,
} from "./aegisCoreCosmicDiscShaders";
import {
  type AegisEvolutionState,
  type CosmicDiscParams,
  type SphereEvolutionParams,
  getEvolutionParams,
  isCosmicDiscParams,
} from "./evolutionStates";

export interface AegisCoreSceneOptions {
  backgroundColor?: string | null;
  dpr?: number;
  animate?: boolean;
  interactive?: boolean;
  autoRotate?: boolean;
  evolutionState?: AegisEvolutionState;
}

export interface AegisCoreSceneHandle {
  resize: (width: number, height: number) => void;
  setPixelRatio: (dpr: number) => void;
  setEvolutionState: (state: AegisEvolutionState) => void;
  render: () => void;
  tick: (elapsedSeconds: number) => void;
  dispose: () => void;
}

const DEFAULT_BG = "#e5e4e2";
const INNER_RADIUS = 0.88;
const OUTER_RADIUS = 1;

function mountCanvas(canvas: HTMLCanvasElement, container: HTMLElement): void {
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  container.appendChild(canvas);
}

function applySphereEvolutionUniforms(
  inner: Record<string, { value: number | THREE.Color | THREE.Vector3 }>,
  shell: Record<string, { value: number }> | null,
  p: SphereEvolutionParams,
): boolean {
  (inner.displacementScale as { value: number }).value = p.displacementScale;
  (inner.stripesFrequency as { value: number }).value = p.stripesFrequency;
  (inner.stripeSharpness as { value: number }).value = p.stripeSharpness;
  (inner.noiseWeight as { value: number }).value = p.noiseWeight;
  (inner.noiseScale as { value: number }).value = p.noiseScale;
  (inner.polarHigh as { value: number }).value = p.polarHigh;
  (inner.polarLow as { value: number }).value = p.polarLow;
  (inner.equatorFlare as { value: number }).value = p.equatorFlare;

  if (shell) {
    shell.aegisDisplacementScale.value = p.shellDisplacementScale;
    shell.aegisStripesFrequency.value = p.stripesFrequency;
    shell.aegisStripeSharpness.value = p.stripeSharpness;
    shell.aegisNoiseWeight.value = p.noiseWeight;
    shell.aegisNoiseScale.value = p.noiseScale;
    shell.aegisPolarHigh.value = p.polarHigh;
    shell.aegisPolarLow.value = p.polarLow;
    shell.aegisEquatorFlare.value = p.equatorFlare;
  }

  return p.animateLayers;
}

function applyCosmicDiscUniforms(
  discUniforms: Record<string, { value: number | THREE.Color | THREE.Vector3 | number[] }>,
  p: CosmicDiscParams,
): void {
  (discUniforms.voidRadius as { value: number }).value = p.voidRadius;
  (discUniforms.amberZoneEnd as { value: number }).value = p.amberZoneEnd;
  (discUniforms.rayZoneStart as { value: number }).value = p.rayZoneStart;
  (discUniforms.rayIntensity as { value: number }).value = p.rayIntensity;
  (discUniforms.spikeCount as { value: number }).value = p.spikeCount;
  (discUniforms.spikeHeight as { value: number }).value = p.spikeHeight;
  (discUniforms.colorVoid as { value: THREE.Color }).value.setRGB(...p.colorVoid);
  (discUniforms.colorAmberDark as { value: THREE.Color }).value.setRGB(...p.colorAmberDark);
  (discUniforms.colorAmberBright as { value: THREE.Color }).value.setRGB(...p.colorAmberBright);
  (discUniforms.colorAmberHot as { value: THREE.Color }).value.setRGB(...p.colorAmberHot);
  (discUniforms.colorRayWhite as { value: THREE.Color }).value.setRGB(...p.colorRayWhite);
  (discUniforms.colorRaySilver as { value: THREE.Color }).value.setRGB(...p.colorRaySilver);
}

export function createAegisCoreScene(
  container: HTMLElement,
  options: AegisCoreSceneOptions = {},
): AegisCoreSceneHandle {
  const {
    backgroundColor = DEFAULT_BG,
    dpr = Math.min(window.devicePixelRatio || 1, 3),
    animate = false,
    interactive = false,
    autoRotate = true,
    evolutionState = "emerging",
  } = options;

  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);

  const scene = new THREE.Scene();
  if (backgroundColor) {
    scene.background = new THREE.Color(backgroundColor);
    scene.fog = new THREE.FogExp2(backgroundColor, 0.035);
  }

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0.05, 5.1);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: backgroundColor == null,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputEncoding = THREE.sRGBEncoding;
  if (backgroundColor) {
    renderer.setClearColor(backgroundColor, 1);
  }
  mountCanvas(renderer.domElement, container);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  let controls: OrbitControls | null = null;
  if (interactive) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.65;
    controls.minDistance = 3.2;
    controls.maxDistance = 9;
    controls.update();
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(4.5, 9, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(4096, 4096);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -4;
  keyLight.shadow.camera.right = 4;
  keyLight.shadow.camera.top = 4;
  keyLight.shadow.camera.bottom = -4;
  keyLight.shadow.radius = 4;
  keyLight.shadow.bias = -0.00008;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xd8e8f0, 0.85);
  fillLight.position.set(-6, 2, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.55);
  rimLight.position.set(0, 4, -8);
  scene.add(rimLight);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.18 }),
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -1.55;
  plane.receiveShadow = true;
  scene.add(plane);

  const keyLightDir = keyLight.position.clone().normalize();
  const fillLightDir = fillLight.position.clone().normalize();
  const rimLightDir = rimLight.position.clone().normalize();

  const innerUniforms = {
    time: { value: 0 },
    noiseScale: { value: 4.2 },
    displacementScale: { value: 0.24 },
    stripesFrequency: { value: 52 },
    stripeSharpness: { value: 0.82 },
    noiseWeight: { value: 0.48 },
    polarHigh: { value: 1 },
    polarLow: { value: 0.44 },
    equatorFlare: { value: 0.08 },
    colorBase: { value: new THREE.Color("#0c6368") },
    colorDark: { value: new THREE.Color("#021818") },
    colorHighlight: { value: new THREE.Color("#3cb8b0") },
    keyLightDir: { value: keyLightDir },
    fillLightDir: { value: fillLightDir },
    rimLightDir: { value: rimLightDir },
  };

  const innerGeometry = new THREE.SphereGeometry(INNER_RADIUS, 320, 320);
  const innerMaterial = new THREE.ShaderMaterial({
    vertexShader: AEGIS_CORE_VERTEX_SHADER,
    fragmentShader: AEGIS_CORE_FRAGMENT_SHADER,
    uniforms: innerUniforms,
    depthWrite: true,
  });
  const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
  innerSphere.castShadow = true;
  innerSphere.receiveShadow = true;
  scene.add(innerSphere);

  const shellUniforms: Record<string, { value: number }> = {
    aegisTime: { value: 0 },
    aegisNoiseScale: { value: 4.2 },
    aegisDisplacementScale: { value: 0 },
    aegisStripesFrequency: { value: 52 },
    aegisStripeSharpness: { value: 0 },
    aegisNoiseWeight: { value: 0 },
    aegisPolarHigh: { value: 1 },
    aegisPolarLow: { value: 0.5 },
    aegisEquatorFlare: { value: 0 },
  };

  const outerGeometry = new THREE.SphereGeometry(OUTER_RADIUS, 128, 128);
  const outerMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x001a22,
    metalness: 0,
    roughness: 0.03,
    transmission: 0.97,
    ior: 1.52,
    thickness: 1.15,
    attenuationColor: new THREE.Color("#146b6e"),
    attenuationDistance: 0.85,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMap: envRT.texture,
    envMapIntensity: 0.42,
    transparent: true,
  });

  outerMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shellUniforms);
    shader.vertexShader = AEGIS_SHELL_VERTEX_PATCH + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `
        #include <begin_vertex>
        float aegisDisp = aegisDisplace(
          transformed, objectNormal, aegisTime, aegisNoiseScale, aegisDisplacementScale,
          aegisStripesFrequency, aegisStripeSharpness, aegisNoiseWeight,
          aegisPolarHigh, aegisPolarLow, aegisEquatorFlare
        );
        transformed += objectNormal * aegisDisp;
      `,
    );
  };
  outerMaterial.customProgramCacheKey = () => "aegis-shell-v2";

  const outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
  outerSphere.castShadow = true;
  outerSphere.renderOrder = 2;
  scene.add(outerSphere);

  // === COSMIC DISC (for seed state) ===
  const DISC_RADIUS = 1.8;
  const DISC_SEGMENTS = 512;

  const cosmicDiscUniforms = {
    time: { value: 0 },
    voidRadius: { value: 0.06 },
    amberZoneEnd: { value: 0.28 },
    rayZoneStart: { value: 0.35 },
    rayIntensity: { value: 1.2 },
    spikeCount: { value: 80 },
    spikeHeight: { value: 0.15 },
    colorVoid: { value: new THREE.Color(0x000000) },
    colorAmberDark: { value: new THREE.Color(0.18, 0.08, 0.02) },
    colorAmberBright: { value: new THREE.Color(0.85, 0.55, 0.22) },
    colorAmberHot: { value: new THREE.Color(1.0, 0.75, 0.35) },
    colorRayWhite: { value: new THREE.Color(0.98, 0.98, 0.96) },
    colorRaySilver: { value: new THREE.Color(0.78, 0.82, 0.85) },
  };

  const cosmicDiscGeometry = new THREE.PlaneGeometry(
    DISC_RADIUS * 2,
    DISC_RADIUS * 2,
    DISC_SEGMENTS,
    DISC_SEGMENTS
  );

  const cosmicDiscMaterial = new THREE.ShaderMaterial({
    vertexShader: COSMIC_DISC_VERTEX_SHADER,
    fragmentShader: COSMIC_DISC_FRAGMENT_SHADER,
    uniforms: cosmicDiscUniforms,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
  });

  const cosmicDisc = new THREE.Mesh(cosmicDiscGeometry, cosmicDiscMaterial);
  cosmicDisc.visible = false;
  scene.add(cosmicDisc);

  // Track current state
  let currentState: AegisEvolutionState = evolutionState;
  let layerAnimate = false;

  // Function to update visibility and uniforms based on state
  const updateStateVisuals = (state: AegisEvolutionState) => {
    const params = getEvolutionParams(state);
    currentState = state;

    if (isCosmicDiscParams(params)) {
      // Cosmic disc mode (seed state)
      innerSphere.visible = false;
      outerSphere.visible = false;
      cosmicDisc.visible = true;
      plane.visible = false;

      // Update background for cosmic disc
      scene.background = new THREE.Color(0x000000);
      scene.fog = null;
      renderer.setClearColor(0x000000, 1);

      // Apply cosmic disc parameters
      applyCosmicDiscUniforms(cosmicDiscUniforms, params);
      layerAnimate = params.animateLayers;
    } else {
      // Sphere mode (emerging/evolved states)
      innerSphere.visible = true;
      outerSphere.visible = true;
      cosmicDisc.visible = false;
      plane.visible = true;

      // Restore original background
      if (backgroundColor) {
        scene.background = new THREE.Color(backgroundColor);
        scene.fog = new THREE.FogExp2(backgroundColor, 0.035);
        renderer.setClearColor(backgroundColor, 1);
      }

      // Apply sphere parameters
      layerAnimate = applySphereEvolutionUniforms(innerUniforms, shellUniforms, params);
    }
  };

  // Initialize state
  updateStateVisuals(evolutionState);

  const disposeList: Array<{ dispose: () => void }> = [
    innerGeometry,
    innerMaterial,
    outerGeometry,
    outerMaterial,
    cosmicDiscGeometry,
    cosmicDiscMaterial,
    plane.geometry,
    plane.material as THREE.Material,
    envRT,
  ];

  let elapsed = 0;
  let activeDpr = dpr;

  return {
    resize(w: number, h: number) {
      const safeW = Math.max(w, 1);
      const safeH = Math.max(h, 1);
      camera.aspect = safeW / safeH;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(activeDpr);
      renderer.setSize(safeW, safeH, false);
    },
    setPixelRatio(nextDpr: number) {
      activeDpr = nextDpr;
    },
    setEvolutionState(state: AegisEvolutionState) {
      updateStateVisuals(state);
    },
    tick(seconds: number) {
      elapsed = seconds;
    },
    render() {
      const shouldLayerAnimate = animate && layerAnimate;
      const params = getEvolutionParams(currentState);

      if (isCosmicDiscParams(params)) {
        // Cosmic disc animation
        if (shouldLayerAnimate) {
          cosmicDiscUniforms.time.value = elapsed * 0.15;
        } else {
          cosmicDiscUniforms.time.value = 0;
        }
      } else {
        // Sphere animation
        if (shouldLayerAnimate) {
          innerUniforms.time.value = elapsed * 0.15;
          shellUniforms.aegisTime.value = elapsed * 0.15;
          innerSphere.rotation.y = elapsed * 0.08;
        } else {
          innerUniforms.time.value = 0;
          shellUniforms.aegisTime.value = 0;
        }
      }

      controls?.update();
      renderer.render(scene, camera);
    },
    dispose() {
      controls?.dispose();
      pmrem.dispose();
      renderer.dispose();
      disposeList.forEach((item) => item.dispose());
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
    },
  };
}
