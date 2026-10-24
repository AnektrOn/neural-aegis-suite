import * as THREE from "three";
import type { WebGLRenderer } from "three";
import {
  PORTAL_CENTER_X,
  PORTAL_GAP_WIDTH,
  PORTAL_SLIT_LOCAL_Z,
  PORTAL_WORLD_Z,
} from "../layout/prismSceneConstants";
import { LAYOUT_PILLAR } from "../layout/prismLayoutSceneScale";
import type { LandingLightRig } from "./landingCinematicLook";
import { applyLandingWastelandLighting } from "./landingCinematicLook";
import {
  LANDING_ENV_FRAG,
  LANDING_PORTAL_FRAG,
  LANDING_PORTAL_VERT,
  LANDING_SKY_FRAG,
  LANDING_SKY_VERT,
  LANDING_SPILL_FRAG,
  LANDING_SPILL_VERT,
} from "./landingPortalShaders";
import {
  createLandingJambGlowTexture,
  createLandingMonolithTextures,
  createLandingRadialGlowTexture,
} from "./landingSharedTextures";

export const LANDING_HORIZON_COLOR = 0x17140f;
export const LANDING_ZENITH_COLOR = 0x06070a;
export const LANDING_PORTAL_HEIGHT = 23.5;
const PORTAL_SLIT_Z = PORTAL_SLIT_LOCAL_Z;
const PORTAL_FORWARD_WORLD_Z = PORTAL_WORLD_Z + 1.65;
const GAP_WIDTH = PORTAL_GAP_WIDTH;
const GAP_CENTER_X = PORTAL_CENTER_X;
const PILLAR_WIDTH = LAYOUT_PILLAR.width;
const PILLAR_DEPTH = LAYOUT_PILLAR.depth;
const PORTAL_SPOT_SHADOWS = true;

export function createLandingGradientBackground() {
  const c = document.createElement("canvas");
  c.width = 2;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Color(LANDING_HORIZON_COLOR);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#0c0d10");
  g.addColorStop(0.55, "#1a1816");
  g.addColorStop(1, "#2e2a24");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createLandingPortalEnvironment(renderer: WebGLRenderer) {
  const envScene = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: LANDING_SKY_VERT,
      fragmentShader: LANDING_ENV_FRAG,
    }),
  );
  envScene.add(dome);
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileCubemapShader();
  const target = pmrem.fromScene(envScene, 0.0, 0.1, 100);
  pmrem.dispose();
  dome.geometry.dispose();
  (dome.material as THREE.Material).dispose();
  return target;
}

export function createLandingSkyDome() {
  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uHorizon: { value: new THREE.Color(LANDING_HORIZON_COLOR) },
        uZenith: { value: new THREE.Color(LANDING_ZENITH_COLOR) },
      },
      vertexShader: LANDING_SKY_VERT,
      fragmentShader: LANDING_SKY_FRAG,
    }),
  );
  skyDome.renderOrder = -10;
  skyDome.frustumCulled = false;
  return skyDome;
}

function createMonolithPillar(
  outerMat: THREE.Material,
  innerJambMat: THREE.Material,
  gapSide: "left" | "right",
  baseFootY: number,
) {
  const buryDepth = 1.2;
  const pillarHeight = LANDING_PORTAL_HEIGHT + buryDepth;
  const geo = new THREE.BoxGeometry(PILLAR_WIDTH, pillarHeight, PILLAR_DEPTH, 4, 24, 4);
  const pos = geo.attributes.position;
  const halfW = PILLAR_WIDTH / 2;
  const halfD = PILLAR_DEPTH / 2;
  const bevel = 0.035;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    if (Math.abs(Math.abs(vx) - halfW) < 0.001 && Math.abs(Math.abs(vz) - halfD) < 0.001) {
      pos.setX(i, vx - Math.sign(vx) * bevel);
      pos.setZ(i, vz - Math.sign(vz) * bevel);
    }
  }
  geo.computeVertexNormals();
  const outerFaces = [outerMat, outerMat, outerMat, outerMat, outerMat, outerMat];
  if (gapSide === "left") outerFaces[0] = innerJambMat;
  else outerFaces[1] = innerJambMat;
  const pillar = new THREE.Mesh(geo, outerFaces);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  const centerY = baseFootY + LANDING_PORTAL_HEIGHT - pillarHeight / 2;
  return { pillar, pillarWidth: PILLAR_WIDTH, centerY };
}

export type LandingPortalScene = {
  monolithGroup: THREE.Group;
  portalLightRig: THREE.Group;
  portalFootY: number;
  portalUniforms: { uTime: { value: number }; uIntensity: { value: number } };
  baseBloomSprite: THREE.Sprite;
  portalBloomBase: number;
  groundBounceLight: THREE.PointLight;
  lights: LandingLightRig;
  rayAnchor: THREE.Vector3;
  disposePortalOnly: () => void;
};

export function createLandingPortalScene(
  scene: THREE.Scene,
  envTex: THREE.Texture,
  getTerrainHeight: (x: number, z: number) => number,
  terrainCenterX: number,
  terrainCenterZ: number,
): LandingPortalScene {
  const portalFootY = getTerrainHeight(GAP_CENTER_X, PORTAL_FORWARD_WORLD_Z);
  const portalForwardLocalZ = PORTAL_FORWARD_WORLD_Z - PORTAL_WORLD_Z;
  const { roughnessTex: monolithRoughnessTex, normalTex: monolithNormalTex } =
    createLandingMonolithTextures();

  const monolithGroup = new THREE.Group();
  monolithGroup.position.set(GAP_CENTER_X, 0, PORTAL_WORLD_Z);
  scene.add(monolithGroup);

  const monolithOuterMat = new THREE.MeshPhysicalMaterial({
    color: 0x151413,
    roughness: 0.58,
    roughnessMap: monolithRoughnessTex,
    metalness: 0.16,
    normalMap: monolithNormalTex,
    normalScale: new THREE.Vector2(1.15, 1.15),
    clearcoat: 0.18,
    clearcoatRoughness: 0.4,
    envMap: envTex,
    envMapIntensity: 1.1,
  });

  const leftJambU0 = (PILLAR_DEPTH / 2 - PORTAL_SLIT_Z) / PILLAR_DEPTH;
  const rightJambU0 = (PORTAL_SLIT_Z + PILLAR_DEPTH / 2) / PILLAR_DEPTH;
  const createJambMaterial = (u0: number) =>
    new THREE.MeshPhysicalMaterial({
      color: 0x3d2a1b,
      emissive: new THREE.Color(0xf07a30),
      emissiveMap: createLandingJambGlowTexture(u0),
      emissiveIntensity: 1.7,
      roughness: 0.42,
      roughnessMap: monolithRoughnessTex,
      metalness: 0.2,
      normalMap: monolithNormalTex,
      normalScale: new THREE.Vector2(1.4, 1.4),
      clearcoat: 0.3,
      clearcoatRoughness: 0.3,
      envMap: envTex,
      envMapIntensity: 1.3,
    });

  const leftMonolith = createMonolithPillar(
    monolithOuterMat,
    createJambMaterial(leftJambU0),
    "left",
    portalFootY,
  );
  leftMonolith.pillar.position.set(
    -(GAP_WIDTH / 2 + leftMonolith.pillarWidth / 2),
    leftMonolith.centerY,
    0,
  );
  monolithGroup.add(leftMonolith.pillar);

  const rightMonolith = createMonolithPillar(
    monolithOuterMat,
    createJambMaterial(rightJambU0),
    "right",
    portalFootY,
  );
  rightMonolith.pillar.position.set(
    GAP_WIDTH / 2 + rightMonolith.pillarWidth / 2,
    rightMonolith.centerY,
    0,
  );
  monolithGroup.add(rightMonolith.pillar);

  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(GAP_WIDTH + 0.16, 0.2, 0.35),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd18c).multiplyScalar(1.5) }),
  );
  topTrim.position.set(0, portalFootY + LANDING_PORTAL_HEIGHT - 0.1, 0.55);
  monolithGroup.add(topTrim);

  const portalUniforms = { uTime: { value: 0 }, uIntensity: { value: 1.15 } };
  const portalCoreMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GAP_WIDTH + 0.24, LANDING_PORTAL_HEIGHT, 1, 1),
    new THREE.ShaderMaterial({
      vertexShader: LANDING_PORTAL_VERT,
      fragmentShader: LANDING_PORTAL_FRAG,
      uniforms: portalUniforms,
    }),
  );
  portalCoreMesh.position.set(0, portalFootY + LANDING_PORTAL_HEIGHT / 2, PORTAL_SLIT_Z);
  monolithGroup.add(portalCoreMesh);

  const backBoxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(GAP_WIDTH + 0.65, LANDING_PORTAL_HEIGHT + 1.2, 1.2),
    monolithOuterMat,
  );
  backBoxMesh.position.set(0, portalFootY + LANDING_PORTAL_HEIGHT / 2 - 0.4, -0.48);
  backBoxMesh.castShadow = true;
  backBoxMesh.receiveShadow = true;
  monolithGroup.add(backBoxMesh);

  const hemiLight = new THREE.HemisphereLight(0x3a3f4a, 0x1f150e, 0.38);
  scene.add(hemiLight);
  const ambientLight = new THREE.AmbientLight(0x16171c, 0.2);
  scene.add(ambientLight);

  const moonDirLight = new THREE.DirectionalLight(0x8791a3, 0.52);
  moonDirLight.position.set(-18, 28, 22);
  moonDirLight.castShadow = true;
  moonDirLight.shadow.mapSize.set(2048, 2048);
  moonDirLight.shadow.camera.near = 2;
  moonDirLight.shadow.camera.far = 90;
  const dCam = 18;
  moonDirLight.shadow.camera.left = -dCam;
  moonDirLight.shadow.camera.right = dCam;
  moonDirLight.shadow.camera.top = dCam;
  moonDirLight.shadow.camera.bottom = -dCam;
  moonDirLight.shadow.bias = -0.00018;
  moonDirLight.shadow.normalBias = 0.028;
  scene.add(moonDirLight);
  scene.add(moonDirLight.target);
  moonDirLight.target.position.set(terrainCenterX, 2, terrainCenterZ);

  const portalLightRig = new THREE.Group();
  portalLightRig.name = "PortalLightRig";
  portalLightRig.position.set(GAP_CENTER_X, 0, PORTAL_WORLD_Z);
  scene.add(portalLightRig);

  const portalSpotLight = new THREE.SpotLight(0xf79a3a, 65.0, 95, Math.PI * 0.28, 0.6, 1.4);
  portalSpotLight.position.set(0, portalFootY + 2.2, -0.35);
  portalSpotLight.castShadow = PORTAL_SPOT_SHADOWS;
  if (PORTAL_SPOT_SHADOWS) {
    portalSpotLight.shadow.mapSize.set(2048, 2048);
    portalSpotLight.shadow.bias = -0.00025;
    portalSpotLight.shadow.normalBias = 0.02;
    portalSpotLight.shadow.autoUpdate = false;
    portalSpotLight.shadow.needsUpdate = true;
  }
  portalSpotLight.target.position.set(0, portalFootY - 0.2, 12.0 - PORTAL_SLIT_Z);
  portalLightRig.add(portalSpotLight);
  portalLightRig.add(portalSpotLight.target);

  const groundBounceLight = new THREE.PointLight(0xf58533, 2.8, 18, 1.6);
  groundBounceLight.position.set(0, portalFootY + 1.2, 1.35);
  portalLightRig.add(groundBounceLight);

  const midPortalLight = new THREE.PointLight(0xf58533, 12.0, 24, 1.5);
  midPortalLight.position.set(0, portalFootY + 10.5, 0.75);
  portalLightRig.add(midPortalLight);

  const topPortalLight = new THREE.PointLight(0xf59042, 9.0, 20, 1.5);
  topPortalLight.position.set(0, portalFootY + 21.8, 0.75);
  portalLightRig.add(topPortalLight);

  const rightPillarGrazingLight = new THREE.PointLight(0xc8d0dc, 2.4, 14, 1.8);
  rightPillarGrazingLight.position.set(1.35, portalFootY + 7.0, 3.0);
  portalLightRig.add(rightPillarGrazingLight);

  const lights: LandingLightRig = {
    hemi: hemiLight,
    ambient: ambientLight,
    moon: moonDirLight,
    portalSpot: portalSpotLight,
    groundBounce: groundBounceLight,
    midPortal: midPortalLight,
    topPortal: topPortalLight,
    rightGrazing: rightPillarGrazingLight,
  };
  applyLandingWastelandLighting(lights, terrainCenterX, terrainCenterZ, {
    groundReadable: true,
  });

  const warmGlowTex = createLandingRadialGlowTexture(255, 185, 105);
  const portalBloomBase = 6.2;
  const baseBloomMat = new THREE.SpriteMaterial({
    map: warmGlowTex,
    color: 0xf2c88a,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const baseBloomSprite = new THREE.Sprite(baseBloomMat);
  baseBloomSprite.position.set(0, portalFootY + 1.6, portalForwardLocalZ);
  baseBloomSprite.scale.set(portalBloomBase, portalBloomBase, 1);
  portalLightRig.add(baseBloomSprite);

  const topSpillMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 11),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: LANDING_SPILL_VERT,
      fragmentShader: LANDING_SPILL_FRAG,
    }),
  );
  topSpillMesh.position.set(0, portalFootY + LANDING_PORTAL_HEIGHT + 5.2, 0.2 - PORTAL_SLIT_Z);
  portalLightRig.add(topSpillMesh);

  const rayAnchor = new THREE.Vector3(
    GAP_CENTER_X,
    portalFootY + 2.5,
    PORTAL_WORLD_Z + PORTAL_SLIT_Z + 0.6,
  );

  return {
    monolithGroup,
    portalLightRig,
    portalFootY,
    portalUniforms,
    baseBloomSprite,
    portalBloomBase,
    groundBounceLight,
    lights,
    rayAnchor,
    disposePortalOnly: () => {
      warmGlowTex.dispose();
    },
  };
}
