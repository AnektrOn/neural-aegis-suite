import * as THREE from "three";
import type { WebGLRenderer } from "three";
import {
  LANDING_TERRAIN_CENTER_X,
  LANDING_TERRAIN_CENTER_Z,
  LANDING_TERRAIN_DEPTH,
  LANDING_TERRAIN_WIDTH,
} from "../layout/prismSceneConstants";
import {
  LAYOUT_CUBE_ABOVE_FOOT,
  LAYOUT_CUBE_HALF_SIZE,
  LAYOUT_MARBLE_HOVER,
} from "../layout/prismLayoutSceneScale";
import { sampleLandingTerrainHeight } from "../layout/landingTerrainHeight";
import { createAtmosphere, type Atmosphere } from "./atmosphere";
import { applyLandingGroundRealism } from "./landingGroundRealism";
import {
  createMarbleMonolithGroup,
  MARBLE_MONOLITH_WORLD_XZ,
} from "./marbleMonolithAssets";
import { createLandingPlayaEnvelope } from "./landingSceneEnvelope";
import {
  createVilleneuveShoreMaterial,
  createVilleneuveShoreTextures,
} from "./landingShoreGround";
import { bakeLandingPuddleAttribute } from "./landingTerrainPuddles";
import {
  createLandingGradientBackground,
  createLandingPortalEnvironment,
  createLandingPortalScene,
  createLandingSkyDome,
  LANDING_HORIZON_COLOR,
  LANDING_PORTAL_HEIGHT,
} from "./landingPortalScene";
import {
  createShatteredCubeGroup,
  SHATTERED_CUBE_WORLD_XZ,
} from "./shatteredCubeAssets";
import type { LandingRenderTuning } from "./landingRenderTuning";
import { createLandingRenderTuningState } from "./landingRenderTuning";
import { createLandingRadialGlowTexture } from "./landingSharedTextures";

export type LandingTravellingWorld = {
  getTerrainHeight: (x: number, z: number) => number;
  portalFootY: number;
  terrainMesh: THREE.Mesh;
  envTex: THREE.Texture;
  skyDome: THREE.Mesh;
  atmosphere: Atmosphere;
  renderTuning: LandingRenderTuning;
  portalScene: ReturnType<typeof createLandingPortalScene>;
  shatteredCube: ReturnType<typeof createShatteredCubeGroup>;
  marbleMonolith: ReturnType<typeof createMarbleMonolithGroup>;
  rayAnchor: THREE.Vector3;
  update: (dt: number, t: number, glow: number) => void;
  dispose: () => void;
};

export function attachLandingTravellingWorld(
  scene: THREE.Scene,
  renderer: WebGLRenderer,
): LandingTravellingWorld {
  const getTerrainHeight = sampleLandingTerrainHeight;
  const renderTuning = createLandingRenderTuningState();
  const terrainWidth = LANDING_TERRAIN_WIDTH;
  const terrainDepth = LANDING_TERRAIN_DEPTH;
  const terrainSegW = 112;
  const terrainSegD = 112;
  const terrainCenterX = LANDING_TERRAIN_CENTER_X;
  const terrainCenterZ = LANDING_TERRAIN_CENTER_Z;

  const landingGradientBg = createLandingGradientBackground();
  scene.background =
    landingGradientBg instanceof THREE.CanvasTexture
      ? landingGradientBg
      : new THREE.Color(LANDING_HORIZON_COLOR);
  scene.fog = null;

  const envTarget = createLandingPortalEnvironment(renderer);
  const envTex = envTarget.texture;
  scene.environment = envTex;

  const skyDome = createLandingSkyDome();
  scene.add(skyDome);
  const skyUniforms = (skyDome.material as THREE.ShaderMaterial).uniforms as {
    uHorizon: { value: THREE.Color };
    uZenith: { value: THREE.Color };
  };

  const shoreGround = createVilleneuveShoreTextures();
  const playaEnvelope = createLandingPlayaEnvelope(
    terrainCenterX,
    terrainCenterZ,
    terrainWidth,
    terrainDepth,
    LANDING_HORIZON_COLOR,
  );

  const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainDepth, terrainSegW, terrainSegD);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const wx = posAttr.getX(i) + terrainCenterX;
    const wz = posAttr.getZ(i) + terrainCenterZ;
    posAttr.setY(i, getTerrainHeight(wx, wz));
  }
  terrainGeo.computeVertexNormals();
  bakeLandingPuddleAttribute(
    terrainGeo,
    terrainSegW,
    terrainSegD,
    terrainCenterX,
    terrainCenterZ,
    getTerrainHeight,
  );

  const terrainMat = createVilleneuveShoreMaterial(
    shoreGround,
    envTex,
    "rainPuddles",
    playaEnvelope,
  ).material;
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.set(terrainCenterX, 0, terrainCenterZ);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  const shoreMat = terrainMat as THREE.MeshStandardMaterial;
  shoreMat.fog = false;
  shoreMat.envMapIntensity = 0;
  shoreMat.color.setRGB(1.14, 1.1, 1.04);
  scene.add(terrainMesh);

  applyLandingGroundRealism(shoreMat, shoreGround.height ?? null, () => ({
    antiTiling: renderTuning.groundAntiTiling,
    parallax: renderTuning.groundParallax,
    roughnessNoise: renderTuning.groundRoughnessNoise,
  }));

  const portalScene = createLandingPortalScene(
    scene,
    envTex,
    getTerrainHeight,
    terrainCenterX,
    terrainCenterZ,
  );

  const starCount = 220;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 180;
    starPositions[i * 3 + 1] = 4 + Math.random() * 75;
    starPositions[i * 3 + 2] = -35 - Math.random() * 80;
    const brightness = 0.3 + Math.random() * 0.5;
    starColors[i * 3] = brightness;
    starColors[i * 3 + 1] = brightness * (0.92 + Math.random() * 0.08);
    starColors[i * 3 + 2] = brightness * (0.85 + Math.random() * 0.15);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.42,
    fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  const coolHorizonTex = createLandingRadialGlowTexture(130, 140, 150);
  const coolSprites: THREE.Sprite[] = [];
  for (const hx of [-28, -19, 19, 28]) {
    const coolSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: coolHorizonTex,
        color: 0x8a949c,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    coolSprite.position.set(hx, 1.3, -18);
    coolSprite.scale.set(34, 6.5, 1);
    scene.add(coolSprite);
    coolSprites.push(coolSprite);
  }

  const marbleMonolithHeight = 6.4;
  const marbleFootY = getTerrainHeight(MARBLE_MONOLITH_WORLD_XZ.x, MARBLE_MONOLITH_WORLD_XZ.z);
  const marbleMonolith = createMarbleMonolithGroup({
    size: [1.6, marbleMonolithHeight, 0.6],
    position: new THREE.Vector3(
      MARBLE_MONOLITH_WORLD_XZ.x,
      marbleFootY + marbleMonolithHeight / 2 + LAYOUT_MARBLE_HOVER,
      MARBLE_MONOLITH_WORLD_XZ.z,
    ),
    seed: 11,
    envMap: envTex,
  });
  marbleMonolith.group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(marbleMonolith.group);

  const marbleAccentLight = new THREE.PointLight(0xf0b078, 4.5, 16, 1.6);
  marbleAccentLight.position.set(
    MARBLE_MONOLITH_WORLD_XZ.x + 1.8,
    marbleFootY + marbleMonolithHeight * 0.65,
    MARBLE_MONOLITH_WORLD_XZ.z + 2.2,
  );
  scene.add(marbleAccentLight);

  const cubeHalfSize = LAYOUT_CUBE_HALF_SIZE;
  const cubeFootY = getTerrainHeight(SHATTERED_CUBE_WORLD_XZ.x, SHATTERED_CUBE_WORLD_XZ.z);
  const shatteredCube = createShatteredCubeGroup({
    size: cubeHalfSize,
    grid: 10,
    seed: 5,
    position: new THREE.Vector3(
      SHATTERED_CUBE_WORLD_XZ.x,
      cubeFootY + LAYOUT_CUBE_ABOVE_FOOT,
      SHATTERED_CUBE_WORLD_XZ.z,
    ),
    autoPlay: true,
    glow: "#e2f1ff",
    defragDepth: 0.6,
    envMap: envTex,
    envMapIntensity: 0.92,
    studioLights: false,
    onPhaseChange: () => {
      portalScene.lights.moon.shadow.needsUpdate = true;
      if (portalScene.lights.portalSpot.castShadow) {
        portalScene.lights.portalSpot.shadow.needsUpdate = true;
      }
    },
  });
  shatteredCube.group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(shatteredCube.group);

  const cubeAccentLight = new THREE.PointLight(0x9aaabd, 3.6, 16, 1.6);
  cubeAccentLight.position.set(
    SHATTERED_CUBE_WORLD_XZ.x - 1.8,
    cubeFootY + cubeHalfSize * 2.1,
    SHATTERED_CUBE_WORLD_XZ.z + 2.2,
  );
  scene.add(cubeAccentLight);

  const atmosphere = createAtmosphere({
    scene,
    fog: null,
    sky: skyUniforms,
    ambient: portalScene.lights.ambient,
    mistMaterials: [],
    mistMeshes: [],
    water: null,
    starsMaterial: starMat,
    groundMaterial: shoreMat,
    pixelRatio: renderer.getPixelRatio(),
    anchorX: terrainCenterX,
    gradePass: null,
    bloomPass: null,
    godrayPass: null,
  });
  atmosphere.jump(0);

  const update = (dt: number, t: number, glow: number) => {
    atmosphere.update(dt, t, { mist: false, haze: false, motes: false });
    const flicker = 1 + 0.008 * Math.sin(t * 3.1) * Math.sin(t * 1.3 + 1.3);
    portalScene.portalUniforms.uTime.value = t;
    portalScene.portalUniforms.uIntensity.value = glow * flicker;
    const pulse = 1 + Math.sin(t * 0.7) * 0.014;
    portalScene.baseBloomSprite.scale.set(
      portalScene.portalBloomBase * pulse,
      portalScene.portalBloomBase * pulse,
      1,
    );
    portalScene.groundBounceLight.intensity = 2.8 * glow * pulse * flicker;
    marbleMonolith.update(t);
    shatteredCube.update(t);
  };

  const dispose = () => {
    atmosphere.dispose();
    shatteredCube.dispose();
    marbleMonolith.dispose();
    shoreGround.dispose();
    envTarget.dispose();
    coolHorizonTex.dispose();
    for (const s of coolSprites) {
      scene.remove(s);
      (s.material as THREE.SpriteMaterial).map?.dispose();
      (s.material as THREE.Material).dispose();
    }
    scene.remove(stars);
    starGeo.dispose();
    starMat.dispose();
    portalScene.disposePortalOnly();
    terrainGeo.dispose();
    terrainMat.dispose();
  };

  return {
    getTerrainHeight,
    portalFootY: portalScene.portalFootY,
    terrainMesh,
    envTex,
    skyDome,
    atmosphere,
    renderTuning,
    portalScene,
    shatteredCube,
    marbleMonolith,
    rayAnchor: portalScene.rayAnchor,
    update,
    dispose,
  };
}

export { LANDING_PORTAL_HEIGHT };
