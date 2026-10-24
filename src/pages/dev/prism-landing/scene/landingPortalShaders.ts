/** Shaders portail / ciel / IBL — alignés sur `createCosmicMonolithScene`. */

export const LANDING_PORTAL_VERT = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const LANDING_PORTAL_FRAG = `
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
    float edgeVignette = smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x);
    col *= (0.72 + 0.28 * edgeVignette);
    col *= 1.0 + bottomBlast * 1.8;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

export const LANDING_SKY_VERT = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const LANDING_SKY_FRAG = `
  uniform vec3 uHorizon;
  uniform vec3 uZenith;
  varying vec3 vDir;
  void main() {
    float h = clamp(vDir.y, 0.0, 1.0);
    gl_FragColor = vec4(mix(uHorizon, uZenith, pow(h, 0.45)), 1.0);
  }
`;

export const LANDING_ENV_FRAG = `
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float el = asin(clamp(d.y, -1.0, 1.0));
    vec3 skyCol = mix(vec3(0.050, 0.052, 0.058), vec3(0.008, 0.009, 0.013), smoothstep(0.0, 0.85, el));
    vec3 groundCol = vec3(0.032, 0.021, 0.013);
    vec3 col = mix(groundCol, skyCol, smoothstep(-0.2, 0.05, el));
    float azBack = atan(d.x, -d.z);
    float strip = (1.0 - smoothstep(0.012, 0.06, abs(azBack)))
                * smoothstep(-0.05, 0.04, el)
                * (1.0 - smoothstep(0.35, 1.15, el));
    col += vec3(1.3, 0.62, 0.22) * strip * 8.0;
    float wideGlow = (1.0 - smoothstep(0.0, 0.65, abs(azBack)))
                   * (1.0 - smoothstep(0.0, 0.7, abs(el - 0.15)));
    col += vec3(0.9, 0.42, 0.15) * wideGlow * 1.5;
    float azFront = atan(d.x, d.z);
    float moonRim = (1.0 - smoothstep(0.0, 1.2, abs(azFront - 0.35)))
                  * smoothstep(0.15, 0.65, el)
                  * (1.0 - smoothstep(0.65, 1.2, el));
    col += vec3(0.30, 0.34, 0.40) * moonRim * 1.1;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export const LANDING_SPILL_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const LANDING_SPILL_FRAG = `
  varying vec2 vUv;
  void main() {
    float horiz = exp(-pow((vUv.x - 0.5) * 3.8, 2.0));
    float vert = pow(max(0.0, 1.0 - vUv.y), 2.2);
    vec3 col = vec3(0.95, 0.58, 0.28);
    gl_FragColor = vec4(col, horiz * vert * 0.2);
  }
`;
