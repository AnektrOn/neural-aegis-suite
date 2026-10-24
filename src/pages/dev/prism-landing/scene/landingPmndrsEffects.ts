import { BlendFunction, Effect } from "postprocessing";
import * as THREE from "three";

const FOG_SCATTER_FRAG = /* glsl */ `
uniform vec2 uResolution;
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uScattering;
uniform float uStrength;
uniform float uHorizonVeil;

vec3 sampleBlur(vec2 uv, float radiusPx) {
  vec2 texel = radiusPx / uResolution;
  vec3 acc = vec3(0.0);
  acc += texture2D(inputBuffer, uv + texel * vec2(-1.0, -1.0)).rgb * 0.0625;
  acc += texture2D(inputBuffer, uv + texel * vec2( 0.0, -1.0)).rgb * 0.125;
  acc += texture2D(inputBuffer, uv + texel * vec2( 1.0, -1.0)).rgb * 0.0625;
  acc += texture2D(inputBuffer, uv + texel * vec2(-1.0,  0.0)).rgb * 0.125;
  acc += texture2D(inputBuffer, uv).rgb * 0.25;
  acc += texture2D(inputBuffer, uv + texel * vec2( 1.0,  0.0)).rgb * 0.125;
  acc += texture2D(inputBuffer, uv + texel * vec2(-1.0,  1.0)).rgb * 0.0625;
  acc += texture2D(inputBuffer, uv + texel * vec2( 0.0,  1.0)).rgb * 0.125;
  acc += texture2D(inputBuffer, uv + texel * vec2( 1.0,  1.0)).rgb * 0.0625;
  return acc;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (uStrength <= 0.0001 && uHorizonVeil <= 0.0001) {
    outputColor = inputColor;
    return;
  }
  vec3 sharp = inputColor.rgb;
  vec3 outCol = sharp;

  if (uStrength > 0.0001 && uScattering > 0.0001) {
    float distY = 1.0 - uv.y;
    float distX = abs(uv.x - 0.5) * 1.35;
    float pseudoDepth = mix(12.0, 95.0, clamp(distY * 0.85 + distX * 0.35, 0.0, 1.0));
    float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * pseudoDepth * pseudoDepth);
    fogFactor = clamp(fogFactor, 0.0, 1.0);
    float blurPx = uScattering * fogFactor * 2.8;
    vec3 blurred = sampleBlur(uv, blurPx);
    blurred = mix(blurred, uFogColor, fogFactor * 0.28);
    outCol = mix(sharp, blurred, fogFactor * uStrength);
  }

  vec2 sc = uv - 0.5;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float frameEdge = smoothstep(0.48, 1.02, length(sc * vec2(aspect * 0.58 + 0.42, 1.0)) * 1.32);
  float skyBand = smoothstep(0.42, 0.95, 1.0 - uv.y);
  float horizonVeil = clamp(max(frameEdge * 0.8, skyBand * 0.5), 0.0, 1.0);
  outCol = mix(outCol, uFogColor, horizonVeil * uHorizonVeil);

  outputColor = vec4(outCol, inputColor.a);
}
`;

export class LandingFogScatterEffect extends Effect {
  readonly uniformsRecord: Record<string, { value: unknown }>;

  constructor() {
    const uniforms = new Map<string, THREE.Uniform>([
      ["uResolution", new THREE.Uniform(new THREE.Vector2(1, 1))],
      ["uFogDensity", new THREE.Uniform(0.02)],
      ["uFogColor", new THREE.Uniform(new THREE.Color(0x17140f))],
      ["uScattering", new THREE.Uniform(2.0)],
      ["uStrength", new THREE.Uniform(0.0)],
      ["uHorizonVeil", new THREE.Uniform(0)],
    ]);
    super("LandingFogScatter", FOG_SCATTER_FRAG, {
      blendFunction: BlendFunction.NORMAL,
      uniforms,
    });
    this.uniformsRecord = {};
    for (const [k, u] of uniforms) {
      this.uniformsRecord[k] = u;
    }
  }
}

const GRADE_FRAG_BASE = /* glsl */ `
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
uniform float uLUTStrength;
uniform float uToneAgx;
#ifdef USE_LUT3D
uniform sampler3D uLUT;
uniform float uLUTSize;
#endif

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

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);
  float edgeMask = smoothstep(0.18, 0.72, r2);
  vec2 off = c * r2 * uCA * edgeMask;
  vec3 col = vec3(
    texture2D(inputBuffer, uv + off).r,
    texture2D(inputBuffer, uv).g,
    texture2D(inputBuffer, uv - off).b
  );

  col = uToneAgx > 0.5 ? agxTone(col) : acesFilmic(col);
  col = linearToSRGB(col);

  col.r += uTemp * 0.14;
  col.b -= uTemp * 0.14;
  col.g += uTint * 0.10;
  col.r -= uTint * 0.05;
  col.b -= uTint * 0.05;
  col = clamp(col, 0.0, 1.0);

  float l = luma(col);
  float hiMask = smoothstep(0.45, 0.95, l);
  float shMask = 1.0 - smoothstep(0.05, 0.45, l);
  col += hiMask * uHighlights * 0.35;
  col += shMask * uShadows * 0.35;
  float whMask = smoothstep(0.7, 1.0, l);
  float bkMask = 1.0 - smoothstep(0.0, 0.25, l);
  col += whMask * uWhites * 0.4;
  col += bkMask * uBlacks * 0.35;
  col = clamp(col, 0.0, 1.0);

  col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);
  l = luma(col);

  vec3 gray = vec3(l);
  float satAmt = clamp(uSaturation, 0.0, 2.0);
  col = mix(gray, col, satAmt);
  float maxC = max(col.r, max(col.g, col.b));
  float minC = min(col.r, min(col.g, col.b));
  float sat = maxC - minC;
  float vib = clamp(uVibrance, 0.0, 1.0) * (1.0 - sat);
  col = mix(gray, col, 1.0 + vib);

  l = luma(col);
  vec3 shadowTint = col * uShadowTintMul;
  vec3 highTint = col * uHighTintMul;
  col = mix(shadowTint, highTint, smoothstep(0.06, 0.6, l));

  float fade = clamp(uFade, 0.0, 0.25);
  col = col * (1.0 - fade * 1.2) + vec3(fade);

#ifdef USE_LUT3D
  if (uLUTStrength > 0.001) {
    float lutScale = (uLUTSize - 1.0) / uLUTSize;
    vec3 lutCoord = clamp(col, 0.0, 1.0) * lutScale + 0.5 / uLUTSize;
    col = mix(col, texture(uLUT, lutCoord).rgb, clamp(uLUTStrength, 0.0, 1.0));
  }
#endif

  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float vigLen = length(c * vec2(aspect * 0.55 + 0.45, 1.0));
  float vig = smoothstep(0.52, 1.12, vigLen);
  col *= 1.0 - uVignette * vig * vig;

  l = luma(col);
  float gScale = max(uGrainSize, 0.25);
  vec2 gUv = gl_FragCoord.xy / gScale + fract(uTime) * vec2(113.0, 271.0);
  float g = hash12(gUv) - 0.5;
  col += g * uGrain * (1.0 - l * 0.65);

  outputColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function buildGradeUniforms(enableLut3d: boolean) {
  const map = new Map<string, THREE.Uniform>([
    ["uTime", new THREE.Uniform(0)],
    ["uExposure", new THREE.Uniform(1.0)],
    ["uVignette", new THREE.Uniform(0.46)],
    ["uGrain", new THREE.Uniform(0.038)],
    ["uGrainSize", new THREE.Uniform(1.15)],
    ["uTemp", new THREE.Uniform(0.05)],
    ["uTint", new THREE.Uniform(-0.02)],
    ["uContrast", new THREE.Uniform(1.05)],
    ["uHighlights", new THREE.Uniform(-0.08)],
    ["uShadows", new THREE.Uniform(0.06)],
    ["uWhites", new THREE.Uniform(0.0)],
    ["uBlacks", new THREE.Uniform(0.04)],
    ["uSaturation", new THREE.Uniform(0.74)],
    ["uVibrance", new THREE.Uniform(0.12)],
    ["uFade", new THREE.Uniform(0.02)],
    ["uCA", new THREE.Uniform(0.0012)],
    ["uShadowTintMul", new THREE.Uniform(new THREE.Vector3(0.96, 0.985, 1.03))],
    ["uHighTintMul", new THREE.Uniform(new THREE.Vector3(1.06, 0.99, 0.9))],
    ["uResolution", new THREE.Uniform(new THREE.Vector2(1, 1))],
    ["uLUTStrength", new THREE.Uniform(0)],
    ["uToneAgx", new THREE.Uniform(0)],
  ]);
  if (enableLut3d) {
    map.set("uLUT", new THREE.Uniform(null));
    map.set("uLUTSize", new THREE.Uniform(17));
  }
  return map;
}

export class LandingGradeEffect extends Effect {
  readonly uniformsRecord: Record<string, { value: unknown }>;
  private lutEnabled: boolean;

  constructor(enableLut3d: boolean) {
    const defines = new Map<string, string>();
    if (enableLut3d) defines.set("USE_LUT3D", "");
    const uniforms = buildGradeUniforms(enableLut3d);
    super("LandingGrade", GRADE_FRAG_BASE, {
      blendFunction: BlendFunction.NORMAL,
      defines,
      uniforms,
    });
    this.lutEnabled = enableLut3d;
    this.uniformsRecord = {};
    for (const [k, u] of uniforms) {
      this.uniformsRecord[k] = u;
    }
  }

  setLutTexture(tex: THREE.Data3DTexture | null, size: number) {
    if (!this.lutEnabled) return;
    const lu = this.uniforms.get("uLUT");
    const ls = this.uniforms.get("uLUTSize");
    if (lu) lu.value = tex;
    if (ls) ls.value = size;
  }
}
