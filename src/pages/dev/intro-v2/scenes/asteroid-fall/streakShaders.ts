export const ASTEROID_STREAK_VERTEX = `
uniform float uTime;
uniform float uCount;
uniform vec3 uDir;
uniform float uSway;
uniform float uFog;
uniform float uUnit;
uniform vec4 uPref[50];
attribute vec3 aStart;
attribute vec4 aMotion;
attribute vec3 aSeed;
varying vec2 vUV;
varying vec3 vWorld;
varying float vLayer;
varying float vLen;
varying float vHw;
varying float vFog;
varying float vFade;
varying vec3 vSeed;

void main() {
  float u = position.x;
  float side = position.y;
  float len = aMotion.x;
  float hw = aMotion.y;
  float layer = aMotion.z;

  vec4 pr = uPref[int(layer + 0.5)];
  float T0 = 0.1 * uTime + (4.0 * aStart.x - 3.0 * aStart.y) / (uUnit * 100.0);
  float c2 = cos(2.0 * T0);
  float s2 = sin(2.0 * T0);
  float wx = 0.02 * (c2 * pr.x - s2 * pr.y);
  float wy = 0.02 * (c2 * pr.z - s2 * pr.w);
  vec3 shift = vec3(-4.0 * vec2(3.0 * wx + 4.0 * wy, 4.0 * wx - 3.0 * wy) * uUnit,
                    3.0 * (wx - wy) * uUnit) * uSway;
  vec3 head = aStart + shift;

  vec3 tailDir = -uDir;
  float sW = mix(-2.0, len, u);
  vec3 center = head + tailDir * sW;

  vec3 toCam = cameraPosition - center;
  vec3 sideDir = cross(uDir, toCam);
  float sl = length(sideDir);
  sideDir = sl > 1e-4 ? sideDir / sl : vec3(0.6, 0.8, 0.0);

  vec3 p = center + sideDir * side * hw;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);

  vUV = vec2(u, side);
  vWorld = center;
  vLayer = layer;
  vLen = len;
  vHw = hw;
  vSeed = aSeed;
  vFog = exp(-length(toCam) * uFog);
  vFade = clamp(uCount - aMotion.w, 0.0, 1.0);
}
`;

export const ASTEROID_STREAK_FRAGMENT = `
precision highp float;

uniform float uTime;
uniform float uUnit;
uniform sampler2D iChannel0;
varying vec2 vUV;
varying vec3 vWorld;
varying float vLayer;
varying float vLen;
varying float vHw;
varying float vFog;
varying float vFade;
varying vec3 vSeed;

void main() {
  float sW = mix(-2.0, vLen, vUV.x);
  float rW = abs(vUV.y) * vHw;
  float PS = 5.0 / (100.0 * uUnit);
  vec2 p = vec2(rW, -sW) * PS;

  float i = vLayer;
  vec4 C = vec4(1., 2., 3., 0.);
  vec4 W = sin(i) * C;
  vec3 col = cos(W.rgb) + 1.0;

  float pyw = (4.0 * vWorld.x - 3.0 * vWorld.y) / (uUnit * 100.0);
  float T = 0.1 * uTime + pyw;

  float k = textureLod(iChannel0, p / exp(W.x) + vec2(i, uTime) / 8.0 + vSeed.xy, 0.0).r * 40.0;

  float S = exp(sin(i + i * T + vSeed.z * 6.2831))
            / (length(max(p, p / vec2(2.0, k))) + 1e-5) / 1e4;

  vec3 c = col * S;
  vec3 outc = tanh(c * c);

  float win = (1.0 - smoothstep(0.7, 1.0, abs(vUV.y)))
            * smoothstep(0.0, 0.06, vUV.x)
            * (1.0 - smoothstep(0.8, 1.0, vUV.x));

  float eased = smoothstep(0.0, 1.0, vFade);
  gl_FragColor = vec4(outc * win * vFog * eased, 1.0);
}
`;
