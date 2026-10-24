import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { Water } from "three/addons/objects/Water.js";
import { createAegisText3D, type AegisText3D } from "./createAegisText3D";
import {
  createMarbleMonolithGroup,
  MARBLE_MONOLITH_VIEW,
  MARBLE_MONOLITH_WORLD_XZ,
} from "./marbleMonolithAssets";
import {
  createShatteredCubeGroup,
  SHATTERED_CUBE_VIEW,
  SHATTERED_CUBE_WORLD_XZ,
} from "./shatteredCubeAssets";
import { createStudioEnvMap } from "./cubeEnvironment";
import { createAtmosphere } from "./atmosphere";
import { attachLandingTravellingRig } from "../camera/landingTravellingRig";
import { createLandingRenderTuningState } from "./landingRenderTuning";
import {
  readLandingAtmoLayerFlags,
  syncLandingPostFromAtmosphere,
} from "./landingAtmospherePost";
import { LANDING_FOG_SCATTERING_SHADER } from "./landingFogScatteringPass";
import { createLandingPlayaEnvelope } from "./landingSceneEnvelope";
import { createLandingAdaptiveDpr } from "./landingAdaptiveDpr";
import { applyLandingGroundRealism } from "./landingGroundRealism";
import { createLandingHdriEnvironment } from "./landingHdriEnvironment";
import { attachLandingPostRealism, type LandingPostRealismBundle } from "./landingPostRealism";
import { createLandingPuddleReflection, type LandingPuddleReflection } from "./landingPuddleReflection";
import { applyLandingPuddleReflectionMap } from "./landingPuddleMaterial";
import {
  landingComposerRenderTargetType,
  landingSupportsLut3d,
} from "./landingWebGLCaps";
import { readLandingUsePmndrsComposer } from "./landingComposerMode";
import {
  createLandingPmndrsPipeline,
  type LandingPmndrsPipeline,
} from "./landingPmndrsComposer";
import { setLandingPmndrsBloomFromBootstrap } from "./landingPmndrsPostBridge";

const LANDING_BLOOM_RES_SCALE = 0.5;
import {
  LANDING_MIST_EXTENT,
  LANDING_TERRAIN_CENTER_X,
  LANDING_TERRAIN_CENTER_Z,
  LANDING_TERRAIN_DEPTH,
  LANDING_TERRAIN_WIDTH,
  LANDING_WATER_LEVEL,
  LANDING_WATER_PLANE_SIZE,
  PORTAL_CENTER_X,
  PORTAL_GAP_WIDTH,
  PORTAL_SLIT_LOCAL_Z,
  PORTAL_WORLD_Z,
} from "../layout/prismSceneConstants";
import {
  LAYOUT_CUBE_ABOVE_FOOT,
  LAYOUT_CUBE_HALF_SIZE,
  LAYOUT_MARBLE_HOVER,
} from "../layout/prismLayoutSceneScale";
import waterNormalsUrl from "../assets/textures/waternormals.jpeg?url";
import {
  attachVisibilityPause,
  consumeIdleRenderSlot,
  resolvePerformanceConfig,
  type PrismPerformanceProfile,
} from "./prismLandingPerformance";
import {
  createVilleneuveShoreMaterial,
  createVilleneuveShoreTextures,
  type LandingShoreTextures,
} from "./landingShoreGround";
import { disposeLandingWastelandRocks } from "./landingWastelandRocks";
import { bakeLandingPuddleAttribute } from "./landingTerrainPuddles";
import {
  applyLandingPostFxBootstrap,
  applyLandingWastelandLighting,
  LANDING_WASTELAND_POST,
} from "./landingCinematicLook";
import { LANDING_GODRAY_SHADER, syncLandingGodrayWarmth } from "./landingGodrayPass";
import { landingPortalGodraysStrengthFactor } from "./landingPortalGodraysGate";
import type { MarbleTwoLayerTextures } from "./marbleTwoLayerTextures";

const USE_POSTFX = true;
const WET_GROUND = true;
const PORTAL_SPOT_SHADOWS = true;
const WATER_LEVEL = 0.03;
const MAX_PIXEL_RATIO = 2.0;

const PORTAL_HEIGHT = 23.5;
const GAP_WIDTH = PORTAL_GAP_WIDTH;
const GAP_CENTER_X = PORTAL_CENTER_X;
const GAP_LEFT = GAP_CENTER_X - GAP_WIDTH / 2;
const GAP_RIGHT = GAP_CENTER_X + GAP_WIDTH / 2;
const PILLAR_WIDTH = 1.15;
const PILLAR_DEPTH = 2.6;
/** Plan de la fente (local au groupe portail). */
const PORTAL_SLIT_Z = PORTAL_SLIT_LOCAL_Z;
/** Échantillon sol devant la fente (vers la caméra, +Z). */
const PORTAL_FORWARD_WORLD_Z = PORTAL_WORLD_Z + 1.65;

/* VILLENEUVE : focale longue (≈ anamorphique 50-75mm) → compression des plans,
   le monolithe écrase le spectateur. Caméra basse, très en retrait, comme Dune / Arrival. */
const DEFAULT_FOV = 26;
const DEFAULT_CAM_POS = new THREE.Vector3(15, 1.1, 38);
const DEFAULT_TARGET = new THREE.Vector3(PORTAL_CENTER_X, 10.4, PORTAL_WORLD_Z);

/* Horizon poussiéreux gris-ocre (Arrival / Dune) au lieu du bleu nuit saturé. */
const HORIZON_COLOR = 0x17140f;
const ZENITH_COLOR = 0x06070a;

const PORTAL_VERT = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

/* BLADE RUNNER 2049 : la fente devient une nappe de lumière ocre-orangée dense et calme,
   plus de braises/étincelles nerveuses, cœur moins blanc-chaud, un seul ton dominant. */
const PORTAL_FRAG = `
  uniform float uTime;
  uniform float uIntensity;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p = p * 2.04 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    // Ondulation très lente : la lumière respire, elle ne vacille pas
    uv.x += (noise(vec2(uv.y * 10.0, uTime * 0.35)) - 0.5) * 0.008 * (0.3 + uv.y);
    vec2 q = vec2(
      fbm(uv * vec2(3.0, 6.0) + vec2(0.0, -uTime * 0.035)),
      fbm(uv * vec2(3.0, 6.0) + vec2(4.2, -uTime * 0.028))
    );
    float cloud = fbm(uv * vec2(4.5, 9.0) + q * 1.8 - vec2(0.0, uTime * 0.04));
    float bottomBlast = pow(max(0.0, 1.0 - uv.y * 1.25), 2.4);
    float midGlow = 1.0 - smoothstep(0.05, 1.0, uv.y);
    float centerCore = 1.0 - pow(abs(uv.x - 0.5) * 2.0, 2.2);
    float topFrameGlow = smoothstep(0.92, 0.995, uv.y) * 0.45;

    vec3 deepAmber = vec3(0.34, 0.15, 0.06);
    vec3 warmOrange = vec3(0.92, 0.44, 0.15);
    vec3 brightGold = vec3(1.45, 0.98, 0.52);
    vec3 pureCore = vec3(2.3, 1.95, 1.5);

    vec3 col = mix(deepAmber, warmOrange, midGlow * (0.55 + 0.45 * cloud));
    col = mix(col, brightGold, bottomBlast * 0.8 + centerCore * 0.3 + cloud * 0.2 * midGlow);
    col = mix(col, pureCore, pow(bottomBlast, 1.9) * 0.8 + topFrameGlow * 0.35);

    // Particules de cendre rares et lentes (Dune), très discrètes
    vec2 sparkUv = uv * vec2(28.0, 95.0) + vec2(sin(uTime * 0.08), -uTime * 0.12);
    vec2 sparkId = floor(sparkUv);
    vec2 sparkF = fract(sparkUv) - 0.5;
    float h = hash(sparkId);
    if (h > 0.992) {
      float d = length(sparkF);
      float twinkle = 0.5 + 0.5 * sin(uTime * 1.1 + h * 40.0);
      float spark = (1.0 - smoothstep(0.02, 0.2, d)) * twinkle;
      col += vec3(1.6, 1.2, 0.75) * spark * 0.55;
    }

    float edgeVignette = smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x);
    col *= (0.72 + 0.28 * edgeVignette);
    col *= 1.0 + bottomBlast * 1.8;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

const SPILL_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SPILL_FRAG = `
  varying vec2 vUv;
  void main() {
    float horiz = exp(-pow((vUv.x - 0.5) * 3.8, 2.0));
    float vert = pow(max(0.0, 1.0 - vUv.y), 2.2);
    vec3 col = vec3(0.95, 0.58, 0.28);
    gl_FragColor = vec4(col, horiz * vert * 0.2);
  }
`;

const SKY_VERT = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = `
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    gl_FragColor = vec4(mix(uHorizon, uZenith, pow(h, 0.45)), 1.0);
  }
`;

const ENV_VERT = SKY_VERT;
const ENV_FRAG = `
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float el = asin(clamp(d.y, -1.0, 1.0));
    // Ciel quasi neutre, gris-brun brumeux (Arrival), très peu de bleu
    vec3 skyCol = mix(vec3(0.050, 0.052, 0.058), vec3(0.008, 0.009, 0.013), smoothstep(0.0, 0.85, el));
    // Rebond du sol : sable sombre et chaud (Dune)
    vec3 groundCol = vec3(0.032, 0.021, 0.013);
    vec3 col = mix(groundCol, skyCol, smoothstep(-0.2, 0.05, el));

    // Fente HDR principale
    float azBack = atan(d.x, -d.z);
    float strip = (1.0 - smoothstep(0.012, 0.06, abs(azBack)))
                * smoothstep(-0.05, 0.04, el)
                * (1.0 - smoothstep(0.35, 1.15, el));
    col += vec3(1.3, 0.62, 0.22) * strip * 8.0;

    // Halo diffus autour de la fente pour les matériaux rugueux
    float wideGlow = (1.0 - smoothstep(0.0, 0.65, abs(azBack)))
                   * (1.0 - smoothstep(0.0, 0.7, abs(el - 0.15)));
    col += vec3(0.9, 0.42, 0.15) * wideGlow * 1.5;

    // Rim light froide très retenue, gris acier plutôt que bleu lunaire
    float azFront = atan(d.x, d.z);
    float moonRim = (1.0 - smoothstep(0.0, 1.2, abs(azFront - 0.35)))
                  * smoothstep(0.15, 0.65, el)
                  * (1.0 - smoothstep(0.65, 1.2, el));
    col += vec3(0.30, 0.34, 0.40) * moonRim * 1.1;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const MIST_VERT = `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const MIST_FRAG = `
  uniform sampler2D uNoise;
  uniform float uTime;
  uniform float uGlow;
  uniform float uOpacity;
  uniform vec2 uSeed;
  uniform vec3 uPortal;
  uniform vec3 uCoolColor;
  uniform vec3 uWarmColor;
  uniform vec2 uMistCenter;
  uniform vec2 uMistHalfExtents;
  uniform float uPeripheryVeil;
  varying vec3 vWorldPos;
  void main() {
    // Dérive quasi imperceptible, brume lourde et stagnante (Arrival)
    vec3 p3 = vWorldPos * 0.014 + vec3(uSeed.x, uSeed.y * 0.7, uSeed.x * 1.3)
      + vec3(uTime * 0.045, uTime * 0.028, -uTime * 0.019);
    vec2 p = p3.xz + p3.y * 0.35;
    vec3 n1 = texture2D(uNoise, p).rgb;
    vec3 n2 = texture2D(uNoise, p * 2.7 + n1.rg * 0.25 + p3.xy * 0.08).rgb;
    float n = n1.r * 0.6 + n2.g * 0.4;
    // Seuil abaissé : la brume couvre davantage, avec un voile continu
    float cover = smoothstep(0.30, 0.70, n);
    vec2 e = abs(vWorldPos.xz - uMistCenter) / uMistHalfExtents;
    float mEdge = max(e.x, e.y);
    float edge = 1.0 - smoothstep(0.76, 1.14, mEdge);
    float periphery = smoothstep(0.30, 0.82, mEdge);
    float edgeMask = mix(edge, 1.0, step(0.5, uPeripheryVeil));
    float veilBoost = mix(1.0, periphery * 1.45, step(0.5, uPeripheryVeil));
    float nearCam = smoothstep(0.0, 0.85, abs(cameraPosition.y - vWorldPos.y));
    float d = length(vWorldPos.xz - uPortal.xz);
    // Lumière diffusée plus large : la brume absorbe et étale la source
    float lit = exp(-d * 0.06) * uGlow;
    vec3 col = mix(uCoolColor, uWarmColor, clamp(lit, 0.0, 1.0));
    gl_FragColor = vec4(col, cover * edgeMask * veilBoost * nearCam * uOpacity);
  }
`;

/* ÉTALONNAGE style Lightroom / Photoshop — uniforms pilotés par le panneau landing. */
const GRADE_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uExposure: { value: 1.0 },
    uVignette: { value: 0.46 },
    uGrain: { value: 0.038 },
    uGrainSize: { value: 1.15 },
    uTemp: { value: 0.05 },
    uTint: { value: -0.02 },
    uContrast: { value: 1.05 },
    uHighlights: { value: -0.08 },
    uShadows: { value: 0.06 },
    uWhites: { value: 0.0 },
    uBlacks: { value: 0.04 },
    uSaturation: { value: 0.74 },
    uVibrance: { value: 0.12 },
    uFade: { value: 0.02 },
    uCA: { value: 0.0012 },
    uShadowTintMul: { value: new THREE.Vector3(0.96, 0.985, 1.03) },
    uHighTintMul: { value: new THREE.Vector3(1.06, 0.99, 0.9) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uLUT: { value: null as THREE.Data3DTexture | null },
    uLUTSize: { value: 17 },
    uLUTStrength: { value: 0 },
    uToneAgx: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uExposure;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uGrainSize;
    uniform float uTemp;
    uniform float uTint;
    uniform float uContrast;
    uniform float uHighlights;
    uniform float uShadows;
    uniform float uWhites;
    uniform float uBlacks;
    uniform float uSaturation;
    uniform float uVibrance;
    uniform float uFade;
    uniform float uCA;
    uniform vec3 uShadowTintMul;
    uniform vec3 uHighTintMul;
    uniform vec2 uResolution;
    uniform sampler3D uLUT;
    uniform float uLUTSize;
    uniform float uLUTStrength;
    uniform float uToneAgx;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    vec3 RRTAndODTFit(vec3 v) {
      vec3 a = v * (v + 0.0245786) - 0.000090537;
      vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
      return a / b;
    }

    vec3 agxDefaultContrastApprox(vec3 x) {
      vec3 x2 = x * x;
      vec3 x4 = x2 * x2;
      return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
    }

    vec3 agxTone(vec3 color) {
      color *= uExposure / 0.6;
      const mat3 agxInset = mat3(
        vec3(0.856627, 0.137275, 0.006098),
        vec3(0.095095, 0.812362, 0.092543),
        vec3(0.048373, 0.162410, 0.789217)
      );
      const mat3 agxOutset = mat3(
        vec3(1.1270, -0.1413, -0.1413),
        vec3(-0.1413, 1.1270, -0.1413),
        vec3(-0.1413, -0.1413, 1.1270)
      );
      color = agxInset * color;
      color = agxDefaultContrastApprox(color);
      color = agxOutset * color;
      return clamp(color, 0.0, 1.0);
    }

    vec3 acesFilmic(vec3 color) {
      const mat3 ACESInputMat = mat3(
        vec3(0.59719, 0.07600, 0.02840),
        vec3(0.35458, 0.90834, 0.13383),
        vec3(0.04823, 0.01566, 0.83777)
      );
      const mat3 ACESOutputMat = mat3(
        vec3(1.60475, -0.10208, -0.00327),
        vec3(-0.53108, 1.10813, -0.07276),
        vec3(-0.07367, -0.00605, 1.07602)
      );
      color *= uExposure / 0.6;
      color = ACESInputMat * color;
      color = RRTAndODTFit(color);
      color = ACESOutputMat * color;
      return clamp(color, 0.0, 1.0);
    }

    vec3 linearToSRGB(vec3 x) {
      return mix(
        12.92 * x,
        1.055 * pow(max(x, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
        step(vec3(0.0031308), x)
      );
    }

    float luma(vec3 c) {
      return dot(c, vec3(0.2126, 0.7152, 0.0722));
    }

    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      float edgeMask = smoothstep(0.18, 0.72, r2);
      vec2 off = c * r2 * uCA * edgeMask;
      vec3 col = vec3(
        texture2D(tDiffuse, vUv + off).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - off).b
      );

      col = uToneAgx > 0.5 ? agxTone(col) : acesFilmic(col);
      col = linearToSRGB(col);

      // Balance des blancs (température / teinte)
      col.r += uTemp * 0.14;
      col.b -= uTemp * 0.14;
      col.g += uTint * 0.10;
      col.r -= uTint * 0.05;
      col.b -= uTint * 0.05;
      col = clamp(col, 0.0, 1.0);

      float l = luma(col);

      // Highlights / Shadows (courbes locales)
      float hiMask = smoothstep(0.45, 0.95, l);
      float shMask = 1.0 - smoothstep(0.05, 0.45, l);
      col += hiMask * uHighlights * 0.35;
      col += shMask * uShadows * 0.35;

      // Whites / Blacks (extrémités)
      float whMask = smoothstep(0.7, 1.0, l);
      float bkMask = 1.0 - smoothstep(0.0, 0.25, l);
      col += whMask * uWhites * 0.4;
      col += bkMask * uBlacks * 0.35;
      col = clamp(col, 0.0, 1.0);

      // Contraste autour du gris moyen
      col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);
      l = luma(col);

      // Saturation + Vibrance
      vec3 gray = vec3(l);
      float satAmt = clamp(uSaturation, 0.0, 2.0);
      col = mix(gray, col, satAmt);
      float maxC = max(col.r, max(col.g, col.b));
      float minC = min(col.r, min(col.g, col.b));
      float sat = maxC - minC;
      float vib = clamp(uVibrance, 0.0, 1.0) * (1.0 - sat);
      col = mix(gray, col, 1.0 + vib);

      // Teinte ombres/hautes (pilotée par l'atmosphère landing)
      l = luma(col);
      vec3 shadowTint = col * uShadowTintMul;
      vec3 highTint = col * uHighTintMul;
      col = mix(shadowTint, highTint, smoothstep(0.06, 0.6, l));

      // Fade (noirs relevés)
      float fade = clamp(uFade, 0.0, 0.25);
      col = col * (1.0 - fade * 1.2) + vec3(fade);

      if (uLUTStrength > 0.001) {
        float lutScale = (uLUTSize - 1.0) / uLUTSize;
        vec3 lutCoord = clamp(col, 0.0, 1.0) * lutScale + 0.5 / uLUTSize;
        col = mix(col, texture(uLUT, lutCoord).rgb, clamp(uLUTStrength, 0.0, 1.0));
      }

      // Vignette (bords uniquement)
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      float vigLen = length(c * vec2(aspect * 0.55 + 0.45, 1.0));
      float vig = smoothstep(0.52, 1.12, vigLen);
      col *= 1.0 - uVignette * vig * vig;

      // Grain (échelle + plus fort dans les ombres)
      l = luma(col);
      float gScale = max(uGrainSize, 0.25);
      vec2 gUv = gl_FragCoord.xy / gScale + fract(uTime) * vec2(113.0, 271.0);
      float g = hash12(gUv) - 0.5;
      col += g * uGrain * (1.0 - l * 0.65);

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `,
};

const GRADE_LUT_UNIFORMS_GLSL = `    uniform sampler3D uLUT;
    uniform float uLUTSize;
`;

const GRADE_LUT_APPLY_GLSL = `      if (uLUTStrength > 0.001) {
        float lutScale = (uLUTSize - 1.0) / uLUTSize;
        vec3 lutCoord = clamp(col, 0.0, 1.0) * lutScale + 0.5 / uLUTSize;
        col = mix(col, texture(uLUT, lutCoord).rgb, clamp(uLUTStrength, 0.0, 1.0));
      }

`;

/** Sans `sampler3D` si WebGL1 / pas de textures 3D (évite erreur précision shader). */
function resolveLandingGradeShader(enableLut3d: boolean) {
  if (enableLut3d) return GRADE_SHADER;
  const uniforms = THREE.UniformsUtils.clone(GRADE_SHADER.uniforms) as Record<
    string,
    { value: unknown }
  >;
  delete uniforms.uLUT;
  delete uniforms.uLUTSize;
  return {
    uniforms,
    vertexShader: GRADE_SHADER.vertexShader,
    fragmentShader: GRADE_SHADER.fragmentShader
      .replace(GRADE_LUT_UNIFORMS_GLSL, "")
      .replace(GRADE_LUT_APPLY_GLSL, ""),
  };
}

function hash2D(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  const a = hash2D(ix, iy);
  const b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1);
  const d = hash2D(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves = 5) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, y * frequency);
    frequency *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

function intHash(ix: number, iy: number, seed: number) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function periodicNoise(x: number, y: number, px: number, py: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % px) + px) % px;
  const x1 = (x0 + 1) % px;
  const y0 = ((yi % py) + py) % py;
  const y1 = (y0 + 1) % py;
  const a = intHash(x0, y0, seed);
  const b = intHash(x1, y0, seed);
  const c = intHash(x0, y1, seed);
  const d = intHash(x1, y1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function periodicFbm(x: number, y: number, octaves: number, px: number, py: number, seed: number) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * periodicNoise(x * f, y * f, px * f, py * f, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/**
 * Convertit un champ de hauteur 2D en véritable Normal Map Tangent-Space (Sobel 3x3)
 * pour un rendu de micro-relief net sous lumière rasante sans artefacts de bumpMap 8-bit.
 */
function heightFieldToNormalTexture(
  heights: Float32Array,
  size: number,
  strength: number,
  repeatX: number,
  repeatY: number,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const sample = (x: number, y: number) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return heights[wy * size + wx];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = sample(x - 1, y - 1);
      const t = sample(x, y - 1);
      const tr = sample(x + 1, y - 1);
      const l = sample(x - 1, y);
      const r = sample(x + 1, y);
      const bl = sample(x - 1, y + 1);
      const b = sample(x, y + 1);
      const br = sample(x + 1, y + 1);

      const dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
      const dY = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);

      let nx = -dX * strength;
      let ny = -dY * strength;
      let nz = 1.0;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * size + x) * 4;
      data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
      data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  const normalTex = new THREE.CanvasTexture(canvas);
  normalTex.colorSpace = THREE.NoColorSpace;
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(repeatX, repeatY);
  normalTex.anisotropy = 8;
  return normalTex;
}

/** Conservé en no-op sécurisé pour compatibilité avec createAegisText3D sans casser le PBR moderne. */
function applyR128LightFalloff(_material: THREE.Material) {
  // Intentionnellement désactivé : la physique d'éclairage native r170+ préserve les normales et les reflets PBR.
}

function createTerrainTextures() {
  const size = 1024;
  const heights = new Float32Array(size * size);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const empty = new THREE.Texture();
    return { bumpTex: empty, normalTex: empty, roughnessTex: empty };
  }
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const warp = periodicFbm(nx * 8, ny * 8, 4, 8, 8, 11);
      const ripples = Math.sin(ny * 150.0 + warp * 6.2) * 0.5 + 0.5;
      const mediumRock = periodicFbm(nx * 24, ny * 16, 5, 24, 16, 23);
      const fineGrain = intHash(x, y, 7);
      const h = ripples * 0.44 + mediumRock * 0.44 + fineGrain * 0.12;
      heights[y * size + x] = h;

      // Roughness map : creux plus humides/lisses (valeurs basses), crêtes poussiéreuses (valeurs hautes)
      const rough = Math.min(1, Math.max(0.25, 0.52 + (h - 0.5) * 0.65));
      const val = Math.floor(rough * 255);
      const idx = (y * size + x) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const roughnessTex = new THREE.CanvasTexture(canvas);
  roughnessTex.colorSpace = THREE.NoColorSpace;
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;
  roughnessTex.repeat.set(14, 14);
  roughnessTex.anisotropy = 8;

  const normalTex = heightFieldToNormalTexture(heights, size, 4.2, 14, 14);
  return { bumpTex: roughnessTex, normalTex, roughnessTex };
}

function createTerrainAlbedo() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const broad = periodicFbm(nx * 8, ny * 8, 4, 8, 8, 5);
      const streak = periodicFbm(nx * 4, ny * 32, 3, 4, 32, 9);
      const grit = intHash(x, y, 3);
      const v = Math.min(1, Math.max(0, 0.42 + broad * 0.58 + (streak - 0.5) * 0.2 + (grit - 0.5) * 0.08));
      const i = (y * size + x) * 4;
      d[i] = v * 255;
      d[i + 1] = v * 244;
      d[i + 2] = v * 232;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.anisotropy = 8;
  return tex;
}

function createMonolithTextures() {
  const size = 1024;
  const heights = new Float32Array(size * size);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const empty = new THREE.Texture();
    return { roughnessTex: empty, normalTex: empty };
  }
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const base = periodicFbm(nx * 8, ny * 16, 6, 8, 16, 31);
      const streaks = periodicFbm(nx * 32, ny * 4, 4, 32, 4, 47);
      const microPits = Math.pow(periodicFbm(nx * 64, ny * 64, 3, 64, 64, 73), 2.8);
      const grain = intHash(x, y, 19) * 0.08;

      const h = base * 0.52 + streaks * 0.28 - microPits * 0.25 + grain;
      heights[y * size + x] = h;

      // Basalte poli / obsidienne : rugosité entre 0.18 (zones lisses) et 0.68 (micro-fissures)
      const rough = Math.min(0.75, Math.max(0.16, 0.28 + (1.0 - base) * 0.28 + microPits * 0.35));
      const c = Math.floor(rough * 255);
      const idx = (y * size + x) * 4;
      data[idx] = c;
      data[idx + 1] = c;
      data[idx + 2] = c;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const roughnessTex = new THREE.CanvasTexture(canvas);
  roughnessTex.colorSpace = THREE.NoColorSpace;
  roughnessTex.wrapS = THREE.RepeatWrapping;
  roughnessTex.wrapT = THREE.RepeatWrapping;
  roughnessTex.repeat.set(1, 3);
  roughnessTex.anisotropy = 8;

  const normalTex = heightFieldToNormalTexture(heights, size, 3.6, 1, 3);
  return { roughnessTex, normalTex };
}

function createJambGlowTexture(u0: number) {
  const w = 128;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    const v = 1 - y / (h - 1);
    const vert = 0.16 + 0.84 * Math.exp(-v * 2.8) + 0.22 * Math.exp(-(1 - v) * 16);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const depth = Math.exp(-Math.pow((u - u0) / 0.24, 2));
      const val = Math.min(1, vert * (0.18 + 0.82 * depth)) * 255;
      const i = (y * w + x) * 4;
      d[i] = val;
      d[i + 1] = val;
      d[i + 2] = val;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function createPeriodicNoiseTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 8;
      const ny = (y / size) * 8;
      const i = (y * size + x) * 4;
      d[i] = periodicFbm(nx, ny, 4, 8, 8, 1) * 255;
      d[i + 1] = periodicFbm(nx, ny, 4, 8, 8, 2) * 255;
      d[i + 2] = periodicFbm(nx, ny, 4, 8, 8, 3) * 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createWaterNormals() {
  const tex = new THREE.TextureLoader().load(waterNormalsUrl);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function createLandingGradientBackground() {
  const c = document.createElement("canvas");
  c.width = 2;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.Color(HORIZON_COLOR);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  // Ciel bas Arrival / Dune : sombre et désaturé (évite le voile gris plein écran à l’ouverture)
  g.addColorStop(0, "#0c0d10");
  g.addColorStop(0.55, "#1a1816");
  g.addColorStop(1, "#2e2a24");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function getTerrainHeight(x: number, z: number) {
  const distToPortal = Math.sqrt(
    (x - GAP_CENTER_X) * (x - GAP_CENTER_X) +
      (z - PORTAL_WORLD_Z) * (z - PORTAL_WORLD_Z),
  );
  const flatten = THREE.MathUtils.smoothstep(distToPortal, 1.8, 9.5);
  let h = 0;
  h += Math.sin(x * 0.18 + z * 0.12) * 0.42;
  h += Math.cos(x * 0.35 - z * 0.28) * 0.25;
  h += (fbm(x * 0.15 + 10, z * 0.15 + 10, 4) - 0.5) * 1.6;
  h += (fbm(x * 0.6 + 5, z * 0.8 + 5, 3) - 0.5) * 0.35;
  const sideMound =
    Math.exp(-Math.pow((z - PORTAL_WORLD_Z) * 0.22, 2)) * (Math.sin(x * 0.25) * 0.35);
  const dryBerm =
    Math.exp(-Math.pow(distToPortal / 5.2, 2)) * 0.55 * (1 - THREE.MathUtils.smoothstep(z, PORTAL_WORLD_Z + 2, PORTAL_WORLD_Z + 14));
  const foregroundSlope = z > PORTAL_WORLD_Z + 18 ? -(z - PORTAL_WORLD_Z - 18) * 0.035 : 0;
  return h * flatten + sideMound * flatten + dryBerm + foregroundSlope;
}

function createRadialGlowTexture(r: number, g: number, b: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1.0)`);
  grad.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, 0.45)`);
  grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.10)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPortalEnvironment(renderer: THREE.WebGLRenderer) {
  const envScene = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: ENV_VERT,
      fragmentShader: ENV_FRAG,
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

/**
 * Crée un pilier monolithique avec micro-chanfrein (bevel) sur les arêtes verticales
 * pour capter les reflets spéculaires rasants de la fente et du ciel nocturne.
 */
function createMonolithPillar(
  outerMat: THREE.Material,
  innerJambMat: THREE.Material,
  gapSide: "left" | "right",
  baseFootY: number,
) {
  const pillarWidth = PILLAR_WIDTH;
  const buryDepth = 1.2;
  const pillarHeight = PORTAL_HEIGHT + buryDepth;
  const pillarDepth = PILLAR_DEPTH;

  const geo = new THREE.BoxGeometry(pillarWidth, pillarHeight, pillarDepth, 4, 24, 4);
  const pos = geo.attributes.position;
  const halfW = pillarWidth / 2;
  const halfD = pillarDepth / 2;
  const bevel = 0.035;

  // Léger chanfrein architectural sur les arêtes pour que la lumière accroche les bords
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    if (Math.abs(Math.abs(vx) - halfW) < 0.001 && Math.abs(Math.abs(vz) - halfD) < 0.001) {
      pos.setX(i, vx - Math.sign(vx) * bevel);
      pos.setZ(i, vz - Math.sign(vz) * bevel);
    }
  }
  geo.computeVertexNormals();

  const outerFaces = [
    outerMat,
    outerMat,
    outerMat,
    outerMat,
    outerMat,
    outerMat,
  ];
  if (gapSide === "left") {
    outerFaces[0] = innerJambMat; // Face +X orientée vers la fente
  } else {
    outerFaces[1] = innerJambMat; // Face -X orientée vers la fente
  }

  const pillar = new THREE.Mesh(geo, outerFaces);
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  // Alignement vertical exact : le sommet culmine à baseFootY + PORTAL_HEIGHT
  const centerY = baseFootY + PORTAL_HEIGHT - pillarHeight / 2;
  return { pillar, pillarWidth, pillarHeight, centerY };
}

export type CosmicMonolithHandle = {
  resize: (width: number, height: number) => void;
  dispose: () => void;
  resetCamera: () => void;
  focusMarbleMonolith: () => void;
  focusShatteredCube: () => void;
  setCinematic: (on: boolean) => void;
  setGlow: (value: number) => void;
  setAegisPosition: (x: number, y: number, z: number) => void;
  setAtmosphere: (level: number) => void;
  animateAtmosphere: (level: number, seconds?: number) => void;
  jumpAtmosphere: (level: number) => void;
  getAtmosphere: () => number;
  getPerformanceTelemetry?: () => {
    profile: PrismPerformanceProfile;
    pixelRatio: number;
    pausedByVisibility: boolean;
    idleThrottleActive: boolean;
  };
};

export type CreateCosmicMonolithSceneOptions = {
  /** Active le travelling + POV (landing éditoriale uniquement). */
  landingTravelling?: boolean;
  /** `optimized` : DPR adaptatif + throttle rendu idle (route / landing-opt). */
  performanceProfile?: PrismPerformanceProfile;
  /** Sol shore préchargé (PBR ou procédural) — fourni par les wrappers landing. */
  shoreGround?: LandingShoreTextures;
  /** Rochers GLB (`assets/gltf/Rocks/`) — sinon cailloux procéduraux. */
  wastelandRocks?: THREE.Group;
  /** Marbre 2 calques (`textures/marble/base` + veines). */
  marbleTwoLayer?: MarbleTwoLayerTextures | null;
  /** LUT 3D (wrapper landing). */
  landingLut?: THREE.Data3DTexture;
};

export function createCosmicMonolithScene(
  canvas: HTMLCanvasElement,
  onCinematicChange?: (on: boolean) => void,
  options?: CreateCosmicMonolithSceneOptions,
): CosmicMonolithHandle {
  const colorManagementWas = THREE.ColorManagement.enabled;
  THREE.ColorManagement.enabled = true;
  const marbleTwoLayerTextures = options?.marbleTwoLayer ?? null;

  const parent = canvas.parentElement;
  const width = parent?.clientWidth || window.innerWidth;
  const height = parent?.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  const landingTravelling = Boolean(options?.landingTravelling);
  const landingRenderTuning = landingTravelling ? createLandingRenderTuningState() : null;
  let postRealism: LandingPostRealismBundle | null = null;
  let hdriEnvironment: Awaited<ReturnType<typeof createLandingHdriEnvironment>> | null = null;
  let puddleReflection: LandingPuddleReflection | null = null;
  const performanceProfile = options?.performanceProfile ?? "default";
  const perfConfig = resolvePerformanceConfig(performanceProfile);
  const landingGradientBg = landingTravelling ? createLandingGradientBackground() : null;
  scene.background =
    landingGradientBg instanceof THREE.CanvasTexture
      ? landingGradientBg
      : new THREE.Color(HORIZON_COLOR);
  // Brouillard plus dense : l'air est lourd, les lointains se dissolvent (Arrival / Dune)
  scene.fog = landingTravelling
    ? null
    : new THREE.FogExp2(HORIZON_COLOR, 0.0185);

  const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, width / Math.max(height, 1), 0.1, 400);
  camera.position.copy(DEFAULT_CAM_POS);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    // MSAA inutile en landing travelling : le composer tourne avec samples: 0.
    antialias: !landingTravelling,
    powerPreference: "high-performance",
    alpha: false,
  });
  let pixelRatio =
    performanceProfile === "optimized"
      ? perfConfig.maxPixelRatio
      : Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = landingTravelling
    ? THREE.BasicShadowMap
    : THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = landingTravelling ? 1.02 : 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(DEFAULT_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = landingTravelling ? Math.PI * 0.44 : Math.PI / 2 - 0.015;
  controls.minDistance = 6;
  controls.maxDistance = options?.landingTravelling ? 64 : 120;
  controls.update();

  const terrainWidth = options?.landingTravelling ? LANDING_TERRAIN_WIDTH : 160;
  const terrainDepth = options?.landingTravelling ? LANDING_TERRAIN_DEPTH : 140;
  const terrainSegW = options?.landingTravelling ? 112 : 320;
  const terrainSegD = options?.landingTravelling ? 112 : 280;
  const terrainCenterX = options?.landingTravelling ? LANDING_TERRAIN_CENTER_X : 0;
  const terrainCenterZ = options?.landingTravelling ? LANDING_TERRAIN_CENTER_Z : 0;

  const shoreGround = landingTravelling
    ? (options?.shoreGround ?? createVilleneuveShoreTextures())
    : null;
  const { normalTex: terrainNormalTex, roughnessTex: terrainRoughnessTex } = landingTravelling
    ? { normalTex: shoreGround!.normal, roughnessTex: shoreGround!.roughness }
    : createTerrainTextures();
  const terrainAlbedoTex = landingTravelling ? shoreGround!.albedo : createTerrainAlbedo();
  const { roughnessTex: monolithRoughnessTex, normalTex: monolithNormalTex } = createMonolithTextures();
  const envTarget = createPortalEnvironment(renderer);
  const envTex = envTarget.texture;
  scene.environment = envTex;

  const skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(300, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uHorizon: { value: new THREE.Color(HORIZON_COLOR) },
        uZenith: { value: new THREE.Color(ZENITH_COLOR) },
      },
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
    }),
  );
  skyDome.renderOrder = -10;
  skyDome.frustumCulled = false;
  scene.add(skyDome);

  const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainDepth, terrainSegW, terrainSegD);
  terrainGeo.rotateX(-Math.PI / 2);
  const posAttr = terrainGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const wx = posAttr.getX(i) + terrainCenterX;
    const wz = posAttr.getZ(i) + terrainCenterZ;
    posAttr.setY(i, getTerrainHeight(wx, wz));
  }
  terrainGeo.computeVertexNormals();

  if (landingTravelling) {
    bakeLandingPuddleAttribute(
      terrainGeo,
      terrainSegW,
      terrainSegD,
      terrainCenterX,
      terrainCenterZ,
      getTerrainHeight,
    );
  }

  const playaEnvelope = landingTravelling
    ? createLandingPlayaEnvelope(
        terrainCenterX,
        terrainCenterZ,
        terrainWidth,
        terrainDepth,
        HORIZON_COLOR,
      )
    : undefined;
  const terrainMat = landingTravelling
    ? createVilleneuveShoreMaterial(shoreGround!, envTex, "rainPuddles", playaEnvelope).material
    : new THREE.MeshStandardMaterial({
        color: 0x45301c,
        map: terrainAlbedoTex,
        roughness: 0.92,
        roughnessMap: terrainRoughnessTex,
        metalness: 0.02,
        normalMap: terrainNormalTex,
        normalScale: new THREE.Vector2(1.35, 1.35),
        envMap: envTex,
        envMapIntensity: 0.7,
      });
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.position.set(terrainCenterX, 0, terrainCenterZ);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = landingTravelling;
  if (landingTravelling) {
    const shoreMat = terrainMat as THREE.MeshStandardMaterial;
    shoreMat.fog = false;
    shoreMat.envMapIntensity = 0;
    shoreMat.color.setRGB(1.14, 1.1, 1.04);
  }
  scene.add(terrainMesh);

  if (landingTravelling && landingRenderTuning && shoreGround) {
    applyLandingGroundRealism(
      terrainMat as THREE.MeshStandardMaterial,
      shoreGround.height ?? null,
      () => ({
        antiTiling: landingRenderTuning.groundAntiTiling,
        parallax: landingRenderTuning.groundParallax,
        roughnessNoise: landingRenderTuning.groundRoughnessNoise,
      }),
    );
  }

  /** Rochers GLB désactivés (perf + placement) — réactiver via `wastelandRocks` plus tard. */
  const foregroundRocks =
    landingTravelling && options?.wastelandRocks ? options.wastelandRocks : null;
  if (foregroundRocks) {
    scene.add(foregroundRocks);
  }

  const portalFootY = getTerrainHeight(GAP_CENTER_X, PORTAL_FORWARD_WORLD_Z);
  const portalForwardLocalZ = PORTAL_FORWARD_WORLD_Z - PORTAL_WORLD_Z;

  const monolithGroup = new THREE.Group();
  monolithGroup.position.set(GAP_CENTER_X, 0, PORTAL_WORLD_Z);
  scene.add(monolithGroup);

  // Basalte brut quasi mat, brutaliste (Dune) : moins de clearcoat « verre », plus de pierre
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
  const createJambMaterial = (u0: number) => {
    return new THREE.MeshPhysicalMaterial({
      color: 0x3d2a1b,
      emissive: new THREE.Color(0xf07a30),
      emissiveMap: createJambGlowTexture(u0),
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
  };
  const leftJambMat = createJambMaterial(leftJambU0);
  const rightJambMat = createJambMaterial(rightJambU0);

  const leftMonolith = createMonolithPillar(monolithOuterMat, leftJambMat, "left", portalFootY);
  leftMonolith.pillar.position.set(
    -(GAP_WIDTH / 2 + leftMonolith.pillarWidth / 2),
    leftMonolith.centerY,
    0,
  );
  monolithGroup.add(leftMonolith.pillar);

  const rightMonolith = createMonolithPillar(monolithOuterMat, rightJambMat, "right", portalFootY);
  rightMonolith.pillar.position.set(
    GAP_WIDTH / 2 + rightMonolith.pillarWidth / 2,
    rightMonolith.centerY,
    0,
  );
  monolithGroup.add(rightMonolith.pillar);

  // Liseré supérieur moins néon : un fil de lumière, pas un tube
  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(GAP_WIDTH + 0.16, 0.2, 0.35),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd18c).multiplyScalar(1.5) }),
  );
  topTrim.position.set(0, portalFootY + PORTAL_HEIGHT - 0.1, 0.55);
  monolithGroup.add(topTrim);

  const portalUniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 1.15 },
  };
  const portalCoreMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(GAP_WIDTH + 0.24, PORTAL_HEIGHT, 1, 1),
    new THREE.ShaderMaterial({
      vertexShader: PORTAL_VERT,
      fragmentShader: PORTAL_FRAG,
      uniforms: portalUniforms,
    }),
  );
  portalCoreMesh.position.set(0, portalFootY + PORTAL_HEIGHT / 2, PORTAL_SLIT_Z);
  monolithGroup.add(portalCoreMesh);

  const backBoxMesh = new THREE.Mesh(
    new THREE.BoxGeometry(GAP_WIDTH + 0.65, PORTAL_HEIGHT + 1.2, 1.2),
    monolithOuterMat,
  );
  backBoxMesh.position.set(0, portalFootY + PORTAL_HEIGHT / 2 - 0.4, -0.48);
  backBoxMesh.castShadow = true;
  backBoxMesh.receiveShadow = true;
  monolithGroup.add(backBoxMesh);

  let aegisText: AegisText3D | null = null;
  let sceneDisposed = false;
  void createAegisText3D({
    scene,
    camera,
    domElement: canvas,
    orbitControls: controls,
    initialPosition: new THREE.Vector3(
      GAP_CENTER_X,
      portalFootY + 9.2,
      PORTAL_WORLD_Z + 0.72,
    ),
    getGroundHeight: getTerrainHeight,
    applyLightFalloff: applyR128LightFalloff,
    enableTransform: !options?.landingTravelling,
  })
    .then((built) => {
      if (sceneDisposed) {
        built.dispose();
        return;
      }
      aegisText = built;
    })
    .catch((err) => {
      console.error("AEGIS 3D text failed to load:", err);
    });

  // Éclairage ambiant abaissé : les ombres doivent être profondes, le contraste vient de la fente
  const hemiLight = new THREE.HemisphereLight(0x3a3f4a, 0x1f150e, 0.38);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0x16171c, 0.2);
  scene.add(ambientLight);

  // Lune voilée : froide, grise, faible. Elle sculpte les volumes sans « éclairer la scène »
  const moonDirLight = new THREE.DirectionalLight(0x8791a3, 0.52);
  moonDirLight.position.set(-18, 28, 22);
  moonDirLight.castShadow = true;
  moonDirLight.shadow.mapSize.set(2048, 2048);
  moonDirLight.shadow.camera.near = 2;
  moonDirLight.shadow.camera.far = 90;
  const dCam = landingTravelling ? 18 : 26;
  moonDirLight.shadow.camera.left = -dCam;
  moonDirLight.shadow.camera.right = dCam;
  moonDirLight.shadow.camera.top = dCam;
  moonDirLight.shadow.camera.bottom = -dCam;
  moonDirLight.shadow.bias = -0.0003;
  moonDirLight.shadow.normalBias = 0.025;
  moonDirLight.shadow.autoUpdate = false;
  moonDirLight.shadow.needsUpdate = true;
  scene.add(moonDirLight);

  const portalLightRig = new THREE.Group();
  portalLightRig.name = "PortalLightRig";
  portalLightRig.position.set(GAP_CENTER_X, 0, PORTAL_WORLD_Z);
  scene.add(portalLightRig);

  /* SpotLight : faisceau net découpé par les piliers, légèrement plus chaud-ocre. */
  const portalSpotLight = new THREE.SpotLight(0xf79a3a, 65.0, 95, Math.PI * 0.28, 0.6, 1.4);
  portalSpotLight.position.set(0, portalFootY + 2.2, -0.35);
  portalSpotLight.castShadow = PORTAL_SPOT_SHADOWS;
  if (PORTAL_SPOT_SHADOWS) {
    portalSpotLight.shadow.mapSize.set(2048, 2048);
    portalSpotLight.shadow.bias = -0.00025;
    portalSpotLight.shadow.normalBias = 0.02;
    portalSpotLight.shadow.focus = 1.0;
    portalSpotLight.shadow.camera.near = 0.25;
    portalSpotLight.shadow.camera.far = 75;
    portalSpotLight.shadow.autoUpdate = false;
    portalSpotLight.shadow.needsUpdate = true;
  }
  portalSpotLight.target.position.set(0, portalFootY - 0.2, 12.0 - PORTAL_SLIT_Z);
  portalLightRig.add(portalSpotLight);
  portalLightRig.add(portalSpotLight.target);

  const groundBounceLight = new THREE.PointLight(0xf5ad60, 18.0, 28, 1.6);
  groundBounceLight.position.set(0, portalFootY + 1.2, 1.35);
  portalLightRig.add(groundBounceLight);

  const midPortalLight = new THREE.PointLight(0xf58533, 12.0, 24, 1.5);
  midPortalLight.position.set(0, portalFootY + 10.5, 0.75);
  portalLightRig.add(midPortalLight);

  const topPortalLight = new THREE.PointLight(0xf59042, 9.0, 20, 1.5);
  topPortalLight.position.set(0, portalFootY + 21.8, 0.75);
  portalLightRig.add(topPortalLight);

  const rightPillarGrazingLight = new THREE.PointLight(0xf07b29, 7.0, 22, 1.6);
  rightPillarGrazingLight.position.set(1.35, portalFootY + 7.0, 3.0);
  scene.add(rightPillarGrazingLight);

  if (landingTravelling) {
    scene.add(moonDirLight.target);
    applyLandingWastelandLighting(
      {
        hemi: hemiLight,
        ambient: ambientLight,
        moon: moonDirLight,
        portalSpot: portalSpotLight,
        groundBounce: groundBounceLight,
        midPortal: midPortalLight,
        topPortal: topPortalLight,
        rightGrazing: rightPillarGrazingLight,
      },
      terrainCenterX,
      terrainCenterZ,
      { groundReadable: true },
    );
  }

  const warmGlowTex = createRadialGlowTexture(255, 185, 105);
  const coolHorizonTex = createRadialGlowTexture(130, 140, 150);
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
  const portalBloomBase = landingTravelling ? 6.2 : 9.2;
  baseBloomSprite.scale.set(portalBloomBase, portalBloomBase, 1);
  portalLightRig.add(baseBloomSprite);

  const portalMistSprites: THREE.Sprite[] = [];
  // Sprites « boules » désactivés sur travelling : le godray écran porte la fente.
  if (!landingTravelling) {
    for (let i = 0; i < 4; i++) {
      const mistMat = new THREE.SpriteMaterial({
        map: warmGlowTex,
        color: 0xf08c3b,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mistMat);
      const spreadX = (i - 1.5) * 4.2;
      sprite.position.set(
        spreadX,
        portalFootY + 1.1,
        1.2 + Math.abs(i - 1.5) * 0.7,
      );
      sprite.scale.set(18, 4.6, 1);
      portalLightRig.add(sprite);
      portalMistSprites.push(sprite);
    }
  }

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
  }

  const topSpillMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(5.5, 11),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: SPILL_VERT,
      fragmentShader: SPILL_FRAG,
    }),
  );
  topSpillMesh.position.set(0, portalFootY + PORTAL_HEIGHT + 5.2, 0.2 - PORTAL_SLIT_Z);
  portalLightRig.add(topSpillMesh);

  const mistNoiseTex = createPeriodicNoiseTexture();
  const mistW = options?.landingTravelling ? LANDING_MIST_EXTENT.width : 140;
  const mistD = options?.landingTravelling ? LANDING_MIST_EXTENT.depth : 110;
  // Landing travelling : pas de nappes de brume au sol (voile gris) — fog moteur + scatter post suffisent.
  const mistHeights = options?.landingTravelling
    ? []
    : [0.1, 0.32, 0.65, 1.1, 1.8, 2.9];
  const mistOpacities = options?.landingTravelling
    ? []
    : [0.24, 0.19, 0.14, 0.1, 0.07, 0.045];
  const mistGeo =
    mistHeights.length > 0 ? new THREE.PlaneGeometry(mistW, mistD) : null;
  const sceneWaterY = options?.landingTravelling ? LANDING_WATER_LEVEL : WATER_LEVEL;
  const mistMaterials: THREE.ShaderMaterial[] = [];
  const mistMeshes: THREE.Mesh[] = [];
  const mistCenterXZ = new THREE.Vector2(
    options?.landingTravelling ? terrainCenterX : 0,
    options?.landingTravelling ? terrainCenterZ : -10,
  );
  const mistHalfExtents = new THREE.Vector2(
    options?.landingTravelling ? mistW * 0.52 : 70,
    options?.landingTravelling ? mistD * 0.52 : 55,
  );
  mistHeights.forEach((h, i) => {
    if (!mistGeo) return;
    const mat = new THREE.ShaderMaterial({
      vertexShader: MIST_VERT,
      fragmentShader: MIST_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uNoise: { value: mistNoiseTex },
        uTime: { value: 0 },
        uGlow: { value: 1 },
        uOpacity: { value: mistOpacities[i] },
        uSeed: { value: new THREE.Vector2(i * 3.7, i * 1.9) },
        uPortal: { value: new THREE.Vector3(GAP_CENTER_X, 0, PORTAL_WORLD_Z + PORTAL_SLIT_Z) },
        uMistCenter: { value: mistCenterXZ.clone() },
        uMistHalfExtents: { value: mistHalfExtents.clone() },
        uPeripheryVeil: { value: 0 },
        // Brume froide grise neutre qui se réchauffe en ocre près de la source
        uCoolColor: { value: new THREE.Color(0.105, 0.115, 0.125) },
        uWarmColor: { value: new THREE.Color(1.2, 0.62, 0.26) },
      },
    });
    const layer = new THREE.Mesh(mistGeo, mat);
    layer.rotation.x = -Math.PI / 2;
    layer.position.set(
      terrainCenterX,
      sceneWaterY + h,
      options?.landingTravelling ? terrainCenterZ : -10,
    );
    layer.renderOrder = 2 + i;
    scene.add(layer);
    mistMaterials.push(mat);
    mistMeshes.push(layer);
  });


  let water: Water | null = null;
  const waterNormalsTex = createWaterNormals();
  /** Landing wasteland : flaques dans les creux (shader), pas de plan Water global. */
  if (WET_GROUND && !landingTravelling) {
    water = new Water(new THREE.PlaneGeometry(600, 600), {
      textureWidth: 1024,
      textureHeight: 1024,
      waterNormals: waterNormalsTex,
      sunDirection: new THREE.Vector3(0, 0.08, -1).normalize(),
      sunColor: 0xf08438,
      waterColor: 0x050607,
      distortionScale: 0.28,
      fog: true,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.set(terrainCenterX, sceneWaterY, terrainCenterZ);
    (water.material as THREE.ShaderMaterial).uniforms.size.value = 7.5;
    scene.add(water);
  }

  // Ciel quasi vide : peu d'étoiles, très discrètes
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
  scene.add(new THREE.Points(starGeo, starMat));

  let dustGeo: THREE.BufferGeometry | null = null;
  let dustTex: THREE.Texture | null = null;
  let portalDust: THREE.Points | null = null;
  if (!landingTravelling) {
    const dustCount = 200;
    dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSpeeds = new Float32Array(dustCount);
    const dustPhases = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = GAP_LEFT - 0.8 + Math.random() * (GAP_WIDTH + 2.2);
      dustPositions[i * 3 + 1] = portalFootY + Math.random() * PORTAL_HEIGHT;
      dustPositions[i * 3 + 2] = -0.2 + Math.random() * 4.5;
      dustSpeeds[i] = 0.06 + Math.random() * 0.16;
      dustPhases[i] = i * 0.37;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute("aSpeed", new THREE.BufferAttribute(dustSpeeds, 1));
    dustGeo.setAttribute("aPhase", new THREE.BufferAttribute(dustPhases, 1));
    dustTex = createRadialGlowTexture(255, 214, 150);
    const dustUniforms = {
      uTime: { value: 0 },
      uFootY: { value: portalFootY },
      uTopY: { value: portalFootY + PORTAL_HEIGHT },
      uMap: { value: dustTex },
      uOpacity: { value: 0.45 },
    };
    portalDust = new THREE.Points(
      dustGeo,
      new THREE.ShaderMaterial({
        uniforms: dustUniforms,
        vertexShader: `
        attribute float aSpeed;
        attribute float aPhase;
        uniform float uTime;
        uniform float uFootY;
        uniform float uTopY;
        void main() {
          float span = max(uTopY - uFootY, 0.01);
          float y = uFootY + mod(position.y - uFootY + uTime * aSpeed, span);
          vec3 p = vec3(
            position.x + sin(uTime * 0.4 + aPhase) * 0.05,
            y,
            position.z + cos(uTime * 0.3 + aPhase * 1.7) * 0.035
          );
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float size = 18.0 * (280.0 / max(-mv.z, 1.0));
          gl_PointSize = clamp(size, 2.0, 96.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
        fragmentShader: `
        uniform sampler2D uMap;
        uniform float uOpacity;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          if (tex.a < 0.02) discard;
          gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
        }
      `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(portalDust);
  }

  const marbleMonolithHeight = 6.4;
  const marbleFootY = getTerrainHeight(
    MARBLE_MONOLITH_WORLD_XZ.x,
    MARBLE_MONOLITH_WORLD_XZ.z,
  );
  const marbleMonolith = createMarbleMonolithGroup({
    size: [1.6, marbleMonolithHeight, 0.6],
    position: new THREE.Vector3(
      MARBLE_MONOLITH_WORLD_XZ.x,
      marbleFootY + marbleMonolithHeight / 2 + LAYOUT_MARBLE_HOVER,
      MARBLE_MONOLITH_WORLD_XZ.z,
    ),
    seed: 11,
    envMap: envTex,
    twoLayer: marbleTwoLayerTextures,
  });
  marbleMonolith.group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(marbleMonolith.group);

  // Éclairage dédié subtil pour mettre en valeur le veinage et le volume du monolithe de marbre
  const marbleAccentLight = new THREE.PointLight(0xf0b078, 4.5, 16, 1.6);
  marbleAccentLight.position.set(
    MARBLE_MONOLITH_WORLD_XZ.x + 1.8,
    marbleFootY + marbleMonolithHeight * 0.65,
    MARBLE_MONOLITH_WORLD_XZ.z + 2.2,
  );
  scene.add(marbleAccentLight);

  const cubeHalfSize = LAYOUT_CUBE_HALF_SIZE;
  const cubeFootY = getTerrainHeight(SHATTERED_CUBE_WORLD_XZ.x, SHATTERED_CUBE_WORLD_XZ.z);
  const cubeStudio = landingTravelling ? null : createStudioEnvMap(renderer);
  const markShadowMapsDirty = () => {
    moonDirLight.shadow.needsUpdate = true;
    if (PORTAL_SPOT_SHADOWS) portalSpotLight.shadow.needsUpdate = true;
  };
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
    envMap: landingTravelling ? envTex : cubeStudio!.envMap,
    envMapIntensity: landingTravelling ? 0.92 : 1.5,
    // Scène déjà éclairée / post-FX : pas de softboxes locales sur le groupe.
    studioLights: false,
    onPhaseChange: (phase) => {
      if (phase !== "hold") markShadowMapsDirty();
    },
  });
  shatteredCube.group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  scene.add(shatteredCube.group);

  // Accent du cube : bleu-gris froid, moins saturé
  const cubeAccentLight = new THREE.PointLight(0x9aaabd, 3.6, 16, 1.6);
  cubeAccentLight.position.set(
    SHATTERED_CUBE_WORLD_XZ.x - 1.8,
    cubeFootY + cubeHalfSize * 2.1,
    SHATTERED_CUBE_WORLD_XZ.z + 2.2,
  );
  scene.add(cubeAccentLight);

  const pickRaycaster = new THREE.Raycaster();
  const pickPointer = new THREE.Vector2();

  type CameraTransition = {
    fromPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toPos: THREE.Vector3;
    toTarget: THREE.Vector3;
    elapsed: number;
    duration: number;
  };
  let cameraTransition: CameraTransition | null = null;

  const startCameraTransition = (toPos: THREE.Vector3, toTarget: THREE.Vector3) => {
    landingRig?.beforeCameraTransition();
    cameraTransition = {
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos: toPos.clone(),
      toTarget: toTarget.clone(),
      elapsed: 0,
      // Transitions plus lentes et plus solennelles
      duration: 3.6,
    };
    cinematicMode = false;
    onCinematicChange?.(false);
  };

  let composer: EffectComposer | null = null;
  let pmndrsPipeline: LandingPmndrsPipeline | null = null;
  let fogScatteringPass: ShaderPass | null = null;
  let godrayPass: ShaderPass | null = null;
  let bloomPass: UnrealBloomPass | null = null;
  let gradePass: ShaderPass | null = null;
  const usePmndrsComposer =
    landingTravelling && readLandingUsePmndrsComposer(landingTravelling);
  if (USE_POSTFX) {
    try {
      renderer.toneMapping = THREE.NoToneMapping;
      if (usePmndrsComposer) {
        pmndrsPipeline = createLandingPmndrsPipeline({
          renderer,
          scene,
          camera,
          width,
          height,
          pixelRatio,
          portalFootY,
          landingLut: options?.landingLut,
          performanceProfile,
        });
        setLandingPmndrsBloomFromBootstrap(
          pmndrsPipeline.postFx.bloom,
          LANDING_WASTELAND_POST.bloomStrength,
          LANDING_WASTELAND_POST.bloomRadius,
          LANDING_WASTELAND_POST.bloomThreshold,
        );
        if (landingRenderTuning && renderer.capabilities.isWebGL2) {
          puddleReflection = createLandingPuddleReflection(
            renderer,
            scene,
            camera,
            terrainMesh.position,
          );
          applyLandingPuddleReflectionMap(
            terrainMat as THREE.MeshStandardMaterial,
            () => puddleReflection?.texture ?? null,
            () => landingRenderTuning.puddleReflection,
          );
          void createLandingHdriEnvironment(renderer, scene, envTex).then((env) => {
            if (sceneDisposed) {
              env.dispose();
              return;
            }
            hdriEnvironment = env;
            syncLandingRealism();
          });
        }
      } else {
      const rtW = Math.max(1, Math.floor(width * pixelRatio));
      const rtH = Math.max(1, Math.floor(height * pixelRatio));
      const depthTexture = landingTravelling
        ? new THREE.DepthTexture(rtW, rtH)
        : undefined;
      const composerRtType = landingComposerRenderTargetType(renderer);
      const target = new THREE.WebGLRenderTarget(rtW, rtH, {
        type: composerRtType,
        samples: landingTravelling ? 0 : 4,
        depthBuffer: true,
        depthTexture,
      });
      composer = new EffectComposer(renderer, target);
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
      composer.addPass(new RenderPass(scene, camera));
      if (landingTravelling) {
        fogScatteringPass = new ShaderPass(LANDING_FOG_SCATTERING_SHADER);
        fogScatteringPass.uniforms.uResolution.value.set(width * pixelRatio, height * pixelRatio);
        composer.addPass(fogScatteringPass);
      }
      // Godrays radiaux (fente portail) — essentiels sur la landing travelling.
      godrayPass = new ShaderPass(LANDING_GODRAY_SHADER);
      composer.addPass(godrayPass);
      // Bloom large et doux, façon halation argentique autour de la fente (force↑, rayon↑, seuil↓)
      const drawW = width * pixelRatio;
      const drawH = height * pixelRatio;
      const bloomW = Math.max(4, Math.floor(drawW * LANDING_BLOOM_RES_SCALE));
      const bloomH = Math.max(4, Math.floor(drawH * LANDING_BLOOM_RES_SCALE));
      const bloomInit = landingTravelling ? LANDING_WASTELAND_POST : null;
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(bloomW, bloomH),
        bloomInit?.bloomStrength ?? 0.42,
        bloomInit?.bloomRadius ?? 0.92,
        bloomInit?.bloomThreshold ?? 0.88,
      );
      composer.addPass(bloomPass);
      const gradeLut3d =
        landingSupportsLut3d(renderer) && Boolean(options?.landingLut);
      gradePass = new ShaderPass(resolveLandingGradeShader(gradeLut3d));
      gradePass.uniforms.uResolution.value.set(drawW, drawH);
      composer.addPass(gradePass);
      if (gradeLut3d && gradePass && options?.landingLut) {
        gradePass.uniforms.uLUT.value = options.landingLut;
        gradePass.uniforms.uLUTSize.value = options.landingLut.image.width;
      }
      if (landingTravelling && scene.fog instanceof THREE.FogExp2) {
        applyLandingPostFxBootstrap(
          LANDING_WASTELAND_POST,
          scene.fog,
          bloomPass,
          godrayPass,
        );
      }
      if (
        landingTravelling &&
        landingRenderTuning &&
        bloomPass &&
        renderer.capabilities.isWebGL2
      ) {
        const bloomIndex = composer.passes.indexOf(bloomPass);
        postRealism = attachLandingPostRealism(
          composer,
          scene,
          camera,
          width,
          height,
          pixelRatio,
          Math.max(1, bloomIndex),
        );
        puddleReflection = createLandingPuddleReflection(
          renderer,
          scene,
          camera,
          terrainMesh.position,
        );
        applyLandingPuddleReflectionMap(
          terrainMat as THREE.MeshStandardMaterial,
          () => puddleReflection?.texture ?? null,
          () => landingRenderTuning.puddleReflection,
        );
        void createLandingHdriEnvironment(renderer, scene, envTex).then((env) => {
          if (sceneDisposed) {
            env.dispose();
            return;
          }
          hdriEnvironment = env;
          syncLandingRealism();
        });
      }
      }
    } catch (err) {
      console.warn("Post-processing unavailable, falling back to direct render:", err);
      pmndrsPipeline?.dispose();
      pmndrsPipeline = null;
      composer?.dispose();
      composer = null;
      fogScatteringPass = null;
      godrayPass = null;
      bloomPass = null;
      gradePass = null;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
    }
  }

  const rayAnchor = new THREE.Vector3(
    GAP_CENTER_X,
    portalFootY + 2.5,
    PORTAL_WORLD_Z + PORTAL_SLIT_Z + 0.6,
  );
  const rayScreen = new THREE.Vector3();
  const rayCam = new THREE.Vector3();

  let cinematicMode = !options?.landingTravelling;
  let glow = 1.15;
  let running = true;
  let idleRenderAccum = 0;
  let idleThrottleActive = false;
  let visibilityPause: ReturnType<typeof attachVisibilityPause> | null = null;
  const clock = new THREE.Clock();

  const atmoLayerFlags = readLandingAtmoLayerFlags();
  if (landingTravelling) {
    atmoLayerFlags.mist = false;
    atmoLayerFlags.haze = false;
    atmoLayerFlags.motes = false;
  }
  let landingRig: ReturnType<typeof attachLandingTravellingRig> | null = null;
  if (options?.landingTravelling && landingRenderTuning) {
    landingRig = attachLandingTravellingRig({
      camera,
      controls,
      scene,
      getTerrainHeight,
      applyLightFalloff: applyR128LightFalloff,
      isSceneDisposed: () => sceneDisposed,
      setCinematicMode: (on) => {
        cinematicMode = on;
      },
      notifyCinematicChange: (on) => {
        onCinematicChange?.(on);
      },
      renderTuning: landingRenderTuning,
    });
  }

  const ATMOSPHERE_START = 0;
  const atmosphere = createAtmosphere({
    scene,
    fog: scene.fog instanceof THREE.FogExp2 ? scene.fog : null,
    sky: (skyDome.material as THREE.ShaderMaterial).uniforms as {
      uHorizon: { value: THREE.Color };
      uZenith: { value: THREE.Color };
    },
    ambient: ambientLight,
    mistMaterials,
    mistMeshes,
    water,
    starsMaterial: starMat,
    groundMaterial: terrainMat,
    pixelRatio,
    anchorX: landingTravelling ? terrainCenterX : GAP_CENTER_X,
    gradePass,
    bloomPass,
    godrayPass,
  });
  atmosphere.jump(ATMOSPHERE_START);

  const scatterBufferSize = new THREE.Vector2();
  let viewWidth = width;
  let viewHeight = height;
  let landingPostDirty = true;
  const syncPostBufferSizes = () => {
    const drawW = viewWidth * pixelRatio;
    const drawH = viewHeight * pixelRatio;
    if (pmndrsPipeline) {
      pmndrsPipeline.syncBufferSizes(viewWidth, viewHeight, pixelRatio);
      pmndrsPipeline.setGodraysPerfProfile(performanceProfile, pixelRatio);
      return;
    }
    fogScatteringPass?.uniforms.uResolution.value.set(drawW, drawH);
    gradePass?.uniforms.uResolution.value.set(drawW, drawH);
    bloomPass?.setSize(
      Math.max(4, Math.floor(drawW * LANDING_BLOOM_RES_SCALE)),
      Math.max(4, Math.floor(drawH * LANDING_BLOOM_RES_SCALE)),
    );
    postRealism?.resize(viewWidth, viewHeight, pixelRatio);
  };

  let adaptiveDpr: ReturnType<typeof createLandingAdaptiveDpr> | null = null;
  if (landingRenderTuning) {
    adaptiveDpr = createLandingAdaptiveDpr({
      renderer,
      composer: pmndrsPipeline ?? composer,
      getMaxRatio: () => perfConfig.maxPixelRatio,
      onApplied: (pr) => {
        pixelRatio = pr;
        syncPostBufferSizes();
      },
    });
    adaptiveDpr.setAutoEnabled(landingRenderTuning.autoPixelRatio);
    if (!landingRenderTuning.autoPixelRatio) {
      adaptiveDpr.setManualRatio(landingRenderTuning.manualPixelRatio);
    }
  }

  const syncLandingRealism = () => {
    if (!landingRenderTuning) return;
    const t = landingRenderTuning;
    hdriEnvironment?.setEnabled(t.hdriEnvironment);
    hdriEnvironment?.setIntensity(t.hdriIntensity);
    const dprLow = renderer.getPixelRatio() < 1.5;
    const pathPlaying = landingRig?.handle.isPathPlaying() ?? false;
    const dofOk = t.depthOfField && !pathPlaying && cameraTransition === null;
    if (pmndrsPipeline?.realism) {
      const r = pmndrsPipeline.realism;
      r.setSsaoEnabled(t.highQualityAo && !dprLow);
      r.setPortalVolumeStrength(
        t.portalVolumetric ? t.portalVolumetricStrength : 0,
      );
      r.setDofEnabled(dofOk);
      r.setDofStrength(t.depthOfFieldStrength);
    } else {
      postRealism?.setGtaoEnabled(t.highQualityAo && !dprLow);
      postRealism?.setPortalVolumeStrength(
        t.portalVolumetric ? t.portalVolumetricStrength : 0,
      );
      postRealism?.setBokehEnabled(dofOk);
      postRealism?.setBokehStrength(t.depthOfFieldStrength);
    }
    puddleReflection?.setEnabled(t.puddleReflection);
  };

  const applyLandingTuning = () => {
    if (!landingRenderTuning) return;
    syncLandingRealism();
    renderer.getDrawingBufferSize(scatterBufferSize);
    const pmndrsTargets = pmndrsPipeline?.getPostTargets();
    syncLandingPostFromAtmosphere(
      landingRenderTuning,
      atmosphere.postFx,
      {
        camera,
        renderer,
        fog: scene.fog instanceof THREE.FogExp2 ? scene.fog : null,
        bloomPass: pmndrsTargets?.bloomPass ?? bloomPass,
        gradePass: pmndrsTargets?.gradePass ?? gradePass,
        fogScatteringPass: pmndrsTargets?.fogScatteringPass ?? fogScatteringPass,
        fogScatteringAmount: LANDING_WASTELAND_POST.fogScattering,
        fogScatteringResolution: {
          width: scatterBufferSize.x,
          height: scatterBufferSize.y,
        },
      },
      atmoLayerFlags,
    );
    const gradeU =
      pmndrsTargets?.gradePass?.uniforms ?? gradePass?.uniforms;
    if (gradeU?.uLUTStrength) {
      gradeU.uLUTStrength.value = landingRenderTuning.lutStrength;
    }
    if (gradeU?.uToneAgx) {
      gradeU.uToneAgx.value = landingRenderTuning.toneMappingAgx ? 1 : 0;
    }
  };
  if (landingRenderTuning) applyLandingTuning();

  const portalSpriteVisible = atmoLayerFlags.portalSprites;
  baseBloomSprite.visible = portalSpriteVisible;
  for (const sprite of portalMistSprites) sprite.visible = portalSpriteVisible;

  const onPointerDown = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pickPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pickPointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    pickRaycaster.setFromCamera(pickPointer, camera);
    const hits = pickRaycaster.intersectObjects(shatteredCube.meshes, false);
    if (hits.length > 0) {
      shatteredCube.triggerBurst();
    }

    if (!cinematicMode) return;
    cinematicMode = false;
    onCinematicChange?.(false);
  };
  canvas.addEventListener("pointerdown", onPointerDown);

  const loop = () => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    atmosphere.update(dt, t, {
      mist: atmoLayerFlags.mist,
      haze: atmoLayerFlags.haze,
      motes: atmoLayerFlags.motes,
    });
    // Scintillement quasi nul : la source est une masse stable, pas une flamme
    const flicker = 1 + 0.008 * Math.sin(t * 3.1) * Math.sin(t * 1.3 + 1.3);
    portalUniforms.uTime.value = t;
    portalUniforms.uIntensity.value = glow * flicker;

    // Respiration lente de la lumière (≈ 9 s par cycle)
    const pulse = 1 + Math.sin(t * 0.7) * 0.014;
    baseBloomSprite.scale.set(portalBloomBase * pulse, portalBloomBase * pulse, 1);
    groundBounceLight.intensity = landingTravelling
      ? 2.8 * glow * pulse * flicker
      : 16.0 * glow * pulse * flicker;

    for (const mat of mistMaterials) mat.uniforms.uTime.value = t;
    puddleReflection?.tick(dt);
    if (postRealism?.portalVolumePass?.enabled) {
      const volU = postRealism.portalVolumePass.material.uniforms;
      volU.uTime.value = t;
      volU.uPortal.value.set(GAP_CENTER_X, portalFootY + PORTAL_HEIGHT * 0.42, PORTAL_WORLD_Z);
      volU.uCameraNear.value = camera.near;
      volU.uCameraFar.value = camera.far;
    }
    if (pmndrsPipeline?.realism) {
      const portalVol = landingRenderTuning?.portalVolumetric
        ? landingRenderTuning.portalVolumetricStrength
        : 0;
      if (portalVol > 0.001) {
        pmndrsPipeline.realism.tickPortal(t, rayAnchor);
      }
    }
    // Eau presque figée
    if (water) (water.material as THREE.ShaderMaterial).uniforms.time.value += dt * 0.12;
    marbleMonolith.update(t);
    shatteredCube.update(t);

    if (
      landingRenderTuning &&
      (landingPostDirty || atmosphere.isTransitioning() || Boolean(pmndrsPipeline))
    ) {
      applyLandingTuning();
      landingPostDirty = false;
    }

    const rigOwnsCamera = landingRig?.update(dt) ?? false;
    adaptiveDpr?.tick(dt);
    if (landingRenderTuning?.highQualityAo && renderer.getPixelRatio() < 1.5) {
      if (pmndrsPipeline?.realism) {
        pmndrsPipeline.realism.setSsaoEnabled(false);
      } else if (postRealism?.gtaoPass?.enabled) {
        postRealism.setGtaoEnabled(false);
      }
    }
    if (landingRenderTuning?.depthOfField) {
      const dofOk =
        cameraTransition === null && !landingRig?.handle.isPathPlaying();
      if (pmndrsPipeline?.realism) {
        pmndrsPipeline.realism.setDofEnabled(dofOk);
      } else {
        postRealism?.setBokehEnabled(dofOk);
      }
    }
    if (!rigOwnsCamera && cameraTransition) {
      cameraTransition.elapsed += dt;
      const u = Math.min(1, cameraTransition.elapsed / cameraTransition.duration);
      // Ease-in-out plus doux (smootherstep) : démarrage et arrêt imperceptibles
      const ease = u * u * u * (u * (u * 6 - 15) + 10);
      camera.position.lerpVectors(cameraTransition.fromPos, cameraTransition.toPos, ease);
      controls.target.lerpVectors(cameraTransition.fromTarget, cameraTransition.toTarget, ease);
      if (u >= 1) cameraTransition = null;
    } else if (cinematicMode) {
      /* Mouvement quasi imperceptible : un lent push-in vers le monolithe (≈ 3 min),
         une très légère dérive latérale, aucune oscillation nerveuse. Le plan est tenu. */
      const push = 0.5 - 0.5 * Math.cos(t * 0.035);
      camera.position.x = DEFAULT_CAM_POS.x + Math.sin(t * 0.04) * 0.8;
      camera.position.y = DEFAULT_CAM_POS.y + push * 0.35;
      camera.position.z = DEFAULT_CAM_POS.z - push * 5.5;
      controls.target.set(
        DEFAULT_TARGET.x,
        DEFAULT_TARGET.y,
        DEFAULT_TARGET.z,
      );
    }
    if (!rigOwnsCamera) {
      controls.update();
    }
    skyDome.position.copy(camera.position);

    if (
      perfConfig.idleTargetFps != null &&
      landingTravelling &&
      landingRig
    ) {
      const canIdleThrottle =
        !landingRig.handle.isPathPlaying() &&
        cameraTransition === null &&
        !cinematicMode;
      if (canIdleThrottle) {
        const slot = consumeIdleRenderSlot(
          idleRenderAccum,
          dt,
          perfConfig.idleTargetFps,
        );
        idleRenderAccum = slot.nextAccumulator;
        idleThrottleActive = true;
        if (slot.skipRender) return;
      } else {
        idleRenderAccum = 0;
        idleThrottleActive = false;
      }
    } else {
      idleThrottleActive = false;
    }

    if (pmndrsPipeline) {
      camera.updateMatrixWorld();
      const rayMul =
        (landingRenderTuning?.godrayStrength ?? 1) *
        glow *
        LANDING_WASTELAND_POST.godrayScreenMul;
      const portalGodraysFactor = landingPortalGodraysStrengthFactor(camera, rayAnchor);
      const rayStrength = atmoLayerFlags.godrays
        ? atmosphere.postFx.godrayStrength * rayMul
        : 0;
      pmndrsPipeline.updateGodraysFrame({
        camera,
        enabled: atmoLayerFlags.godrays,
        strength: rayStrength,
        glow,
        portalStrengthFactor: portalGodraysFactor,
        pathU: landingRig?.handle.getPathU() ?? 0,
        pathPlaying: landingRig?.handle.isPathPlaying() ?? false,
      });
      const gu = pmndrsPipeline.postFx.grade.uniformsRecord;
      if (gu.uTime) gu.uTime.value = t;
      pmndrsPipeline.render(dt);
    } else if (composer && bloomPass && gradePass) {
      camera.updateMatrixWorld();
      if (godrayPass) {
        rayCam.copy(rayAnchor).applyMatrix4(camera.matrixWorldInverse);
        if (rayCam.z < 0) {
          rayScreen.copy(rayAnchor).project(camera);
          godrayPass.uniforms.uCenter.value.set(rayScreen.x * 0.5 + 0.5, rayScreen.y * 0.5 + 0.5);
          // Godrays atténués à 55 % : lumière diffuse plutôt que rayons démonstratifs
          const rayMul =
            (landingRenderTuning?.godrayStrength ?? 1) *
            glow *
            (landingTravelling ? LANDING_WASTELAND_POST.godrayScreenMul : 0.42);
          const portalRays =
            atmoLayerFlags.godrays &&
            rayScreen.x >= 0.04 &&
            rayScreen.x <= 0.96 &&
            rayScreen.y >= 0.04 &&
            rayScreen.y <= 0.96;
          const rayStrength = portalRays ? atmosphere.postFx.godrayStrength * rayMul : 0;
          godrayPass.uniforms.uStrength.value = rayStrength;
          if (rayStrength > 0) {
            syncLandingGodrayWarmth(
              godrayPass.uniforms,
              atmosphere.postFx.highTint,
              rayStrength,
            );
          }
        } else {
          godrayPass.uniforms.uStrength.value = 0;
        }
        godrayPass.uniforms.uTime.value = t;
      }
      gradePass.uniforms.uTime.value = t;
      composer.render(dt);
    } else {
      renderer.render(scene, camera);
    }
  };
  renderer.setAnimationLoop(loop);

  if (perfConfig.pauseWhenHidden) {
    visibilityPause = attachVisibilityPause(renderer, () => loop, (on) => {
      running = on;
    });
  }

  return {
    resize(nextWidth, nextHeight) {
      viewWidth = nextWidth;
      viewHeight = nextHeight;
      camera.aspect = nextWidth / Math.max(nextHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
      pmndrsPipeline?.setSize(nextWidth, nextHeight);
      composer?.setSize(nextWidth, nextHeight);
      syncPostBufferSizes();
    },
    resetCamera() {
      startCameraTransition(DEFAULT_CAM_POS, DEFAULT_TARGET);
    },
    focusMarbleMonolith() {
      startCameraTransition(MARBLE_MONOLITH_VIEW.camera, MARBLE_MONOLITH_VIEW.target);
    },
    focusShatteredCube() {
      startCameraTransition(SHATTERED_CUBE_VIEW.camera, SHATTERED_CUBE_VIEW.target);
    },
    setCinematic(on) {
      cinematicMode = on;
    },
    setGlow(value) {
      glow = value;
      portalUniforms.uIntensity.value = value;
      portalSpotLight.intensity = 56.0 * value;
      groundBounceLight.intensity = landingTravelling ? 2.8 * value : 16.0 * value;
      baseBloomMat.opacity = Math.min(1, 0.68 * value);
      leftJambMat.emissiveIntensity = 1.5 * value;
      rightJambMat.emissiveIntensity = 1.5 * value;
      for (const mat of mistMaterials) mat.uniforms.uGlow.value = value / 1.15;
    },
    setAtmosphere(level) {
      atmosphere.setLevel(level);
      landingPostDirty = true;
    },
    animateAtmosphere(level, seconds) {
      atmosphere.animateTo(level, seconds);
      landingPostDirty = true;
    },
    jumpAtmosphere(level) {
      atmosphere.jump(level);
      landingPostDirty = true;
    },
    getAtmosphere() {
      return atmosphere.state.level;
    },
    setAegisPosition(x, y, z) {
      aegisText?.setPosition(x, y, z);
    },
    getPerformanceTelemetry() {
      return {
        profile: performanceProfile,
        pixelRatio: renderer.getPixelRatio(),
        pausedByVisibility: visibilityPause?.isPaused() ?? false,
        idleThrottleActive,
      };
    },
    dispose() {
      sceneDisposed = true;
      running = false;
      visibilityPause?.dispose();
      visibilityPause = null;
      renderer.setAnimationLoop(null);
      canvas.removeEventListener("pointerdown", onPointerDown);
      postRealism?.dispose();
      hdriEnvironment?.dispose();
      puddleReflection?.dispose();
      adaptiveDpr?.dispose();
      landingRig?.dispose();
      aegisText?.dispose();
      aegisText = null;
      atmosphere.dispose();
      marbleMonolith.dispose();
      marbleTwoLayerTextures?.dispose();
      shatteredCube.dispose();
      cubeStudio?.dispose();
      controls.dispose();
      fogScatteringPass = null;
      pmndrsPipeline?.dispose();
      pmndrsPipeline = null;
      composer?.dispose();
      if (landingGradientBg instanceof THREE.CanvasTexture) {
        landingGradientBg.dispose();
      }
      envTarget.dispose();
      if (shoreGround) {
        shoreGround.dispose();
      } else {
        terrainNormalTex.dispose();
        terrainRoughnessTex.dispose();
        terrainAlbedoTex.dispose();
      }
      if (foregroundRocks) {
        disposeLandingWastelandRocks(foregroundRocks);
      }
      monolithRoughnessTex.dispose();
      monolithNormalTex.dispose();
      dustGeo?.dispose();
      dustTex?.dispose();
      (portalDust?.material as THREE.ShaderMaterial | undefined)?.dispose();
      mistGeo?.dispose();
      if (mistHeights.length > 0) mistNoiseTex.dispose();
      waterNormalsTex.dispose();
      if (water) {
        water.geometry.dispose();
        (water.material as THREE.ShaderMaterial).dispose();
      }
      for (const mat of mistMaterials) {
        mat.dispose();
      }
      terrainMesh.geometry.dispose();
      (terrainMesh.material as THREE.Material).dispose();
      renderer.dispose();
      const loseCtx = renderer.getContext().getExtension("WEBGL_lose_context");
      loseCtx?.loseContext();
      THREE.ColorManagement.enabled = colorManagementWas;
    },
    ...(landingRig?.handle ?? {}),
    ...(landingRenderTuning
      ? {
          getLandingRenderTuning() {
            return { ...landingRenderTuning };
          },
          setLandingRenderTuning(partial: Partial<typeof landingRenderTuning>) {
            Object.assign(landingRenderTuning, partial);
            landingPostDirty = true;
            if (partial.autoPixelRatio !== undefined) {
              adaptiveDpr?.setAutoEnabled(partial.autoPixelRatio);
            }
            if (
              partial.manualPixelRatio !== undefined &&
              !landingRenderTuning.autoPixelRatio
            ) {
              adaptiveDpr?.setManualRatio(partial.manualPixelRatio);
            }
            if (partial.autoPixelRatio === true) {
              adaptiveDpr?.setManualRatio(null);
            }
            if (
              partial.groundAntiTiling !== undefined ||
              partial.groundParallax !== undefined ||
              partial.groundRoughnessNoise !== undefined ||
              partial.puddleReflection !== undefined
            ) {
              (terrainMat as THREE.MeshStandardMaterial).needsUpdate = true;
            }
            syncLandingRealism();
          },
        }
      : {}),
  };
}