import * as THREE from "three";
import type { Water } from "three/addons/objects/Water.js";

/**
 * TROIS AMBIANCES ATMOSPHÉRIQUES PURES + FILTRES DE POST-PROCESSING DYNAMIQUES
 * Aucun objet figuratif (pas d'escalier, pas de sentier, pas de vortex/glyphes).
 *
 * - Niveau 0 (Image 3) : Abîme Bleu Pétrole & Brume Glacée (Filtre Cold Cyan / Argent)
 * - Niveau 1 (Image 2) : Nuit Cosmique Saphir & Poussières d'Or (Filtre Saphir / Ambre)
 * - Niveau 2 (Image 1) : Diffusion Solaire & Brume Dorée (Filtre Or Chaud / Bronze)
 */

type Keyframe = {
  // Environnement 3D
  horizon: THREE.Color;
  zenith: THREE.Color;
  fogDensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  mistMul: number;
  mistCoolColor: THREE.Color;
  mistWarmColor: THREE.Color;
  groundEnv: number;
  stars: number;
  waterSun: THREE.Color;
  waterColor: THREE.Color;
  // Diffusion atmosphérique lointaine (haze pure sans forme géométrique)
  hazeOpacity: number;
  hazePrimaryColor: THREE.Color;
  hazeSecondaryColor: THREE.Color;
  // Particules ambiantes
  motes: number;
  moteColor: THREE.Color;
  // Filtres de Post-Processing pilotés par l'atmosphère
  exposure: number;
  bloomStrength: number;
  godrayStrength: number;
  vignette: number;
  grain: number;
  chromaticAberration: number;
  contrast: number;
  shadowTint: THREE.Color;
  midTint: THREE.Color;
  highTint: THREE.Color;
};

function c(hex: number) {
  const col = new THREE.Color();
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  col.setRGB(r, g, b, THREE.NoColorSpace);
  return col;
}

function makeKeys(): [Keyframe, Keyframe, Keyframe] {
  return [
    // =========================================================================
    // NIVEAU 0 : WASTELAND GRIS-OCRE (post-pluie, Arrival / Dune)
    // =========================================================================
    {
      horizon: c(0x17140f),
      zenith: c(0x06070a),
      fogDensity: 0.0205,
      ambientColor: c(0x1a1816),
      ambientIntensity: 0.33,
      mistMul: 0.88,
      mistCoolColor: c(0x141618),
      mistWarmColor: c(0x6a5848),
      groundEnv: 0.92,
      stars: 0.18,
      waterSun: c(0xb8c4d0),
      waterColor: c(0x080a0c),
      hazeOpacity: 0.38,
      hazePrimaryColor: c(0x1e1c18),
      hazeSecondaryColor: c(0x4a443c),
      motes: 0.09,
      moteColor: c(0xa8b0b8),
      exposure: 0.96,
      bloomStrength: 0.24,
      godrayStrength: 0.13,
      vignette: 0.4,
      grain: 0.032,
      chromaticAberration: 0.0018,
      contrast: 1.03,
      shadowTint: c(0x5a5e64),
      midTint: c(0x8a8680),
      highTint: c(0xc8c4bc),
    },
    // =========================================================================
    // NIVEAU 1 (Image 2) : COSMOS SAPHIR & POUSSIÈRE D'OR
    // =========================================================================
    {
      horizon: c(0x060c1a),
      zenith: c(0x010207),
      fogDensity: 0.016,
      ambientColor: c(0x121e32),
      ambientIntensity: 0.34,
      mistMul: 0.58,
      mistCoolColor: c(0x0c1828),
      mistWarmColor: c(0xc87838),
      groundEnv: 1.15,
      stars: 1.0,
      waterSun: c(0xffb558),
      waterColor: c(0x02040a),
      hazeOpacity: 0.65,
      hazePrimaryColor: c(0x0c3c8c),
      hazeSecondaryColor: c(0xd98a3c),
      motes: 0.42,
      moteColor: c(0xd8a868),
      exposure: 1.02,
      bloomStrength: 0.32,
      godrayStrength: 0.15,
      vignette: 0.38,
      grain: 0.024,
      chromaticAberration: 0.0028,
      contrast: 1.04,
      shadowTint: c(0x6e98e8),
      midTint: c(0x9ab0d6),
      highTint: c(0xffdfb0),
    },
    // =========================================================================
    // NIVEAU 2 (Image 1) : APOTHÉOSE SOLAIRE & BRUME DORÉE
    // =========================================================================
    {
      horizon: c(0x4f3b22),
      zenith: c(0x17120b),
      fogDensity: 0.0175,
      ambientColor: c(0x2e2418),
      ambientIntensity: 0.48,
      mistMul: 1.05,
      mistCoolColor: c(0x2a2218),
      mistWarmColor: c(0xc89050),
      groundEnv: 1.35,
      stars: 0.12,
      waterSun: c(0xffcf75),
      waterColor: c(0x1a1309),
      hazeOpacity: 0.52,
      hazePrimaryColor: c(0x5c4428),
      hazeSecondaryColor: c(0xa87840),
      motes: 0.28,
      moteColor: c(0xe8c890),
      exposure: 1.06,
      bloomStrength: 0.38,
      godrayStrength: 0.2,
      vignette: 0.34,
      grain: 0.032,
      chromaticAberration: 0.002,
      contrast: 1,
      shadowTint: c(0xb89c78),
      midTint: c(0xe6c89c),
      highTint: c(0xfff0c4),
    },
  ];
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

function blend(out: Keyframe, a: Keyframe, b: Keyframe, s: number) {
  for (const k of Object.keys(out) as (keyof Keyframe)[]) {
    const av = a[k];
    const bv = b[k];
    const ov = out[k];
    if (typeof av === "number") {
      (out[k] as number) = av + ((bv as number) - av) * s;
    } else if (ov instanceof THREE.Color) {
      ov.copy(av as THREE.Color).lerp(bv as THREE.Color, s);
    }
  }
}

/**
 * BRUME ATMOSPHÉRIQUE DE FOND PURE (Sans aucune géométrie figurative)
 * Crée uniquement une douce diffusion nuageuse/atmosphérique dans le ciel lointain.
 */
const AMBIENT_HAZE_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const AMBIENT_HAZE_FRAG = `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.02 + vec2(1.9, 4.7);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    if (uOpacity <= 0.002) discard;
    vec2 uv = vUv;

    // Dérive atmosphérique très lente (brume et nuages diffus)
    float n1 = fbm(uv * vec2(3.2, 4.5) + vec2(uTime * 0.005, -uTime * 0.003));
    float n2 = fbm(uv * vec2(6.5, 8.0) - vec2(uTime * 0.007, 0.0) + n1 * 0.65);

    // Diffusion radiale très large sans contour dur
    vec2 centered = (uv - vec2(0.5, 0.42)) * vec2(1.6, 1.8);
    float radialSoft = exp(-dot(centered, centered) * 1.65);

    float edgeFade = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y)
                   * smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);

    vec3 col = mix(uPrimaryColor, uSecondaryColor, smoothstep(0.25, 0.8, n2 * radialSoft * 1.4));
    float alpha = clamp((n1 * 0.55 + radialSoft * 0.45) * edgeFade * uOpacity * 0.55, 0.0, 1.0);

    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

/**
 * POUSSIÈRES ATMOSPHÉRIQUES FLOTTANTES (Bokeh doux)
 */
const MOTE_VERT = `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    float H = 28.0;
    float y = mod(aSeed.y * H + uTime * (0.12 + aSeed.x * 0.24), H);
    vec3 p = vec3(
      (aSeed.z - 0.5) * 75.0 + sin(uTime * 0.18 + aSeed.x * 30.0) * 1.5,
      y,
      -5.0 - aSeed.w * 32.0 + cos(uTime * 0.15 + aSeed.y * 30.0) * 1.5
    );
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float tw = 0.5 + 0.5 * sin(uTime * 1.8 + aSeed.x * 60.0);
    vAlpha = smoothstep(0.0, 2.5, y) * (1.0 - smoothstep(H - 5.0, H, y)) * tw;

    float dist = max(-mv.z, 4.0);
    gl_PointSize = clamp(uSize * uPixelRatio * (0.45 + aSeed.x * 0.65) * (28.0 / dist), 1.0, 8.0);
    if (mv.z > -2.0) {
      gl_PointSize = 0.0;
      vAlpha = 0.0;
    }
  }
`;

const MOTE_FRAG = `
  uniform vec3 uColor;
  uniform float uAmount;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * 4.5);
    float k = clamp(core * vAlpha * uAmount, 0.0, 1.0);
    if (k < 0.004) discard;
    gl_FragColor = vec4(uColor * k, k);
  }
`;

export type AtmospherePostFX = {
  fogDensity: number;
  exposure: number;
  bloomStrength: number;
  godrayStrength: number;
  vignette: number;
  grain: number;
  chromaticAberration: number;
  contrast: number;
  shadowTint: THREE.Color;
  midTint: THREE.Color;
  highTint: THREE.Color;
};

export type AtmosphereContext = {
  scene: THREE.Scene;
  fog: THREE.FogExp2;
  sky: { uHorizon: { value: THREE.Color }; uZenith: { value: THREE.Color } };
  ambient: THREE.AmbientLight;
  mistMaterials: THREE.ShaderMaterial[];
  mistMeshes: THREE.Mesh[];
  water: Water | null;
  starsMaterial: THREE.PointsMaterial;
  groundMaterial: THREE.MeshStandardMaterial;
  pixelRatio: number;
  anchorX: number;
  /** Optionnel : passes de post-processing pour appliquer automatiquement les filtres d'ambiance */
  gradePass?: { uniforms: Record<string, { value: unknown }> } | null;
  bloomPass?: { strength: number } | null;
  godrayPass?: { uniforms: Record<string, { value: unknown }> } | null;
};

export type Atmosphere = {
  state: { level: number };
  /** Valeurs courantes des filtres de post-processing interpolées selon le niveau (0 → 2) */
  postFx: AtmospherePostFX;
  setLevel: (level: number) => void;
  animateTo: (level: number, seconds?: number) => void;
  jump: (level: number) => void;
  update: (
    dt: number,
    t: number,
    layers?: { haze?: boolean; motes?: boolean; mist?: boolean },
  ) => void;
  dispose: () => void;
};

export function createAtmosphere(ctx: AtmosphereContext): Atmosphere {
  const KEYS = makeKeys();
  const rand = (() => {
    let s = 1234;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  })();

  const group = new THREE.Group();
  group.name = "Atmosphere";
  ctx.scene.add(group);

  // 1. Diffusion atmosphérique lointaine (haze nuageuse douce, sans forme géométrique dure)
  const hazeGeo = new THREE.PlaneGeometry(180, 110);
  const hazeMat = new THREE.ShaderMaterial({
    vertexShader: AMBIENT_HAZE_VERT,
    fragmentShader: AMBIENT_HAZE_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    fog: false,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.45 },
      uPrimaryColor: { value: new THREE.Color() },
      uSecondaryColor: { value: new THREE.Color() },
    },
  });
  const hazeMesh = new THREE.Mesh(hazeGeo, hazeMat);
  hazeMesh.position.set(ctx.anchorX, 24, -48);
  hazeMesh.renderOrder = 1;
  group.add(hazeMesh);

  // 2. Particules d'ambiance flottantes
  const S = 850;
  const pGeo = new THREE.BufferGeometry();
  const pSeed = new Float32Array(S * 4);
  for (let i = 0; i < S * 4; i++) pSeed[i] = rand();
  pGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(S * 3), 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(pSeed, 4));

  const moteMat = new THREE.ShaderMaterial({
    vertexShader: MOTE_VERT,
    fragmentShader: MOTE_FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    fog: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 9.5 },
      uPixelRatio: { value: ctx.pixelRatio },
      uAmount: { value: 0 },
      uColor: { value: new THREE.Color() },
    },
  });
  const motes = new THREE.Points(pGeo, moteMat);
  motes.frustumCulled = false;
  motes.renderOrder = 4;
  group.add(motes);

  const mistBase = ctx.mistMaterials.map((mm) => mm.uniforms.uOpacity.value as number);
  const groundBase = ctx.groundMaterial.envMapIntensity;
  const starsBase = ctx.starsMaterial.opacity;

  const cur: Keyframe = cloneKey(KEYS[0]);
  const state = { level: 0 };
  let targetScrollLevel: number | null = null;
  let tween: { from: number; to: number; t: number; dur: number } | null = null;
  let layerFlags: { haze?: boolean; motes?: boolean; mist?: boolean } = {};

  const postFx: AtmospherePostFX = {
    fogDensity: cur.fogDensity,
    exposure: cur.exposure,
    bloomStrength: cur.bloomStrength,
    godrayStrength: cur.godrayStrength,
    vignette: cur.vignette,
    grain: cur.grain,
    chromaticAberration: cur.chromaticAberration,
    contrast: cur.contrast,
    shadowTint: cur.shadowTint.clone(),
    midTint: cur.midTint.clone(),
    highTint: cur.highTint.clone(),
  };

  function apply(t: number) {
    const L = Math.min(2, Math.max(0, state.level));
    if (L <= 1) {
      blend(cur, KEYS[0], KEYS[1], smoother(L));
    } else {
      blend(cur, KEYS[1], KEYS[2], smoother(L - 1));
    }

    // 1. Ciel, Brouillard & Ambiance
    ctx.sky.uHorizon.value.copy(cur.horizon);
    ctx.sky.uZenith.value.copy(cur.zenith);
    if (ctx.scene.background instanceof THREE.Color) {
      ctx.scene.background.copy(cur.horizon);
    }
    ctx.fog.color.copy(cur.horizon);
    postFx.fogDensity = cur.fogDensity;
    ctx.ambient.color.copy(cur.ambientColor);
    ctx.ambient.intensity = cur.ambientIntensity;

    // 2. Nappes de brume au sol (opacité + teintes dynamiques si le shader les supporte)
    const mistOn = layerFlags.mist !== false;
    ctx.mistMeshes.forEach((mesh, i) => {
      mesh.visible = mistOn;
      const mm = ctx.mistMaterials[i];
      if (!mm) return;
      mm.uniforms.uOpacity.value = mistOn ? mistBase[i] * cur.mistMul : 0;
      if (mm.uniforms.uCoolColor) mm.uniforms.uCoolColor.value.copy(cur.mistCoolColor);
      if (mm.uniforms.uWarmColor) mm.uniforms.uWarmColor.value.copy(cur.mistWarmColor);
    });

    ctx.groundMaterial.envMapIntensity = groundBase * cur.groundEnv;
    ctx.starsMaterial.opacity = starsBase * cur.stars;

    if (ctx.water) {
      const wu = (ctx.water.material as THREE.ShaderMaterial).uniforms;
      wu.sunColor.value.copy(cur.waterSun);
      wu.waterColor.value.copy(cur.waterColor);
    }

    // 3. Diffusion atmosphérique lointaine & Particules
    hazeMesh.visible = layerFlags.haze !== false && cur.hazeOpacity > 0.005;
    hazeMat.uniforms.uOpacity.value = cur.hazeOpacity;
    hazeMat.uniforms.uPrimaryColor.value.copy(cur.hazePrimaryColor);
    hazeMat.uniforms.uSecondaryColor.value.copy(cur.hazeSecondaryColor);
    hazeMat.uniforms.uTime.value = t;

    motes.visible = layerFlags.motes !== false && cur.motes > 0.005;
    moteMat.uniforms.uAmount.value = cur.motes;
    moteMat.uniforms.uColor.value.copy(cur.moteColor);
    moteMat.uniforms.uTime.value = t;

    // 4. Synchronisation des Filtres de Post-Processing
    postFx.exposure = cur.exposure;
    postFx.bloomStrength = cur.bloomStrength;
    postFx.godrayStrength = cur.godrayStrength;
    postFx.vignette = cur.vignette;
    postFx.grain = cur.grain;
    postFx.chromaticAberration = cur.chromaticAberration;
    postFx.contrast = cur.contrast;
    postFx.shadowTint.copy(cur.shadowTint);
    postFx.midTint.copy(cur.midTint);
    postFx.highTint.copy(cur.highTint);
  }

  const api: Atmosphere = {
    state,
    postFx,
    setLevel(level) {
      tween = null;
      targetScrollLevel = Math.min(2, Math.max(0, level));
    },
    animateTo(level, seconds = 3) {
      targetScrollLevel = null;
      tween = {
        from: state.level,
        to: Math.min(2, Math.max(0, level)),
        t: 0,
        dur: Math.max(0.01, seconds),
      };
    },
    jump(level) {
      tween = null;
      targetScrollLevel = null;
      state.level = Math.min(2, Math.max(0, level));
      apply(0);
    },
    update(dt, t, layers) {
      if (layers) layerFlags = layers;
      if (tween) {
        tween.t += dt;
        const u = Math.min(1, tween.t / tween.dur);
        state.level = tween.from + (tween.to - tween.from) * smooth(u);
        if (u >= 1) tween = null;
      } else if (targetScrollLevel !== null) {
        const factor = 1 - Math.exp(-dt * 4.5);
        state.level += (targetScrollLevel - state.level) * factor;
        if (Math.abs(targetScrollLevel - state.level) < 0.0005) {
          state.level = targetScrollLevel;
          targetScrollLevel = null;
        }
      }
      apply(t);
    },
    dispose() {
      ctx.scene.remove(group);
      hazeGeo.dispose();
      hazeMat.dispose();
      pGeo.dispose();
      moteMat.dispose();
    },
  };

  apply(0);
  return api;
}

function cloneKey(k: Keyframe): Keyframe {
  const o = {} as Record<string, unknown>;
  for (const key of Object.keys(k) as (keyof Keyframe)[]) {
    const v = k[key];
    o[key] = typeof v === "number" ? v : (v as THREE.Color).clone();
  }
  return o as Keyframe;
}