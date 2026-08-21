export const NOISE_3D_GLSL = /* glsl */ `
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }
`;

export const AEGIS_DISPLACEMENT_GLSL = /* glsl */ `
  float aegisStrataPattern(
    vec3 pos,
    float stripesFrequency,
    float stripeSharpness,
    float noiseScale,
    float time
  ) {
    vec3 np = pos * noiseScale + vec3(0.0, time * 0.04, 0.0);
    float warp = fbm(np * 1.4) * mix(0.08, 0.22, stripeSharpness);
    float y = (pos.y + warp) * stripesFrequency;

    float layer = fract(y);
    float edge = abs(layer - 0.5) * 2.0;
    float plate = pow(1.0 - edge, mix(1.2, 14.0, stripeSharpness));

    float fineY = (pos.y + fbm(np * 2.8) * 0.06) * stripesFrequency * 2.35;
    float fine = pow(1.0 - abs(fract(fineY) - 0.5) * 2.0, 6.0) * 0.35;

    float ridged = 1.0 - abs(fbm(np * 3.5));
    ridged = pow(ridged, mix(1.5, 3.5, stripeSharpness));

    return clamp(plate * 0.72 + fine + ridged * 0.28, 0.0, 1.0);
  }

  float aegisDisplaceAmount(
    vec3 pos,
    float time,
    float noiseScale,
    float displacementScale,
    float stripesFrequency,
    float stripeSharpness,
    float noiseWeight,
    float polarHigh,
    float polarLow,
    float equatorFlare
  ) {
    float strata = aegisStrataPattern(pos, stripesFrequency, stripeSharpness, noiseScale, time);
    float organic = snoise(pos * noiseScale * 1.6 + time * 0.08) * 0.5 + 0.5;
    float pattern = mix(strata, mix(strata, organic, 0.55), noiseWeight);
    float disp = pattern * displacementScale;

    float absY = abs(normalize(pos).y);
    disp *= 1.0 + equatorFlare * pow(1.0 - absY, 1.8);
    float polarMask = smoothstep(polarHigh, polarLow, absY);
    return disp * polarMask;
  }

  float aegisDisplace(
    vec3 pos,
    vec3 norm,
    float time,
    float noiseScale,
    float displacementScale,
    float stripesFrequency,
    float stripeSharpness,
    float noiseWeight,
    float polarHigh,
    float polarLow,
    float equatorFlare
  ) {
    return aegisDisplaceAmount(
      pos, time, noiseScale, displacementScale,
      stripesFrequency, stripeSharpness, noiseWeight,
      polarHigh, polarLow, equatorFlare
    );
  }

  vec3 aegisDisplacedNormal(
    vec3 pos,
    vec3 norm,
    float time,
    float noiseScale,
    float displacementScale,
    float stripesFrequency,
    float stripeSharpness,
    float noiseWeight,
    float polarHigh,
    float polarLow,
    float equatorFlare
  ) {
    float eps = 0.0035;
    vec3 up = abs(norm.y) > 0.92 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 t1 = normalize(cross(norm, up));
    vec3 t2 = cross(norm, t1);

    float d0 = aegisDisplaceAmount(pos, time, noiseScale, displacementScale, stripesFrequency, stripeSharpness, noiseWeight, polarHigh, polarLow, equatorFlare);
    float d1 = aegisDisplaceAmount(pos + t1 * eps, time, noiseScale, displacementScale, stripesFrequency, stripeSharpness, noiseWeight, polarHigh, polarLow, equatorFlare);
    float d2 = aegisDisplaceAmount(pos + t2 * eps, time, noiseScale, displacementScale, stripesFrequency, stripeSharpness, noiseWeight, polarHigh, polarLow, equatorFlare);

    vec3 p0 = pos + norm * d0;
    vec3 p1 = pos + t1 * eps + normalize(pos + t1 * eps) * d1;
    vec3 p2 = pos + t2 * eps + normalize(pos + t2 * eps) * d2;

    return normalize(cross(p1 - p0, p2 - p0));
  }
`;

export const AEGIS_CORE_VERTEX_SHADER = /* glsl */ `
  precision highp float;

  ${NOISE_3D_GLSL}
  ${AEGIS_DISPLACEMENT_GLSL}

  uniform float time;
  uniform float noiseScale;
  uniform float displacementScale;
  uniform float stripesFrequency;
  uniform float stripeSharpness;
  uniform float noiseWeight;
  uniform float polarHigh;
  uniform float polarLow;
  uniform float equatorFlare;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vStrata;
  varying float vCavity;

  void main() {
    float disp = aegisDisplace(
      position, normal, time, noiseScale, displacementScale,
      stripesFrequency, stripeSharpness, noiseWeight,
      polarHigh, polarLow, equatorFlare
    );

    vec3 displaced = position + normal * disp;
    vec3 displacedNormal = aegisDisplacedNormal(
      position, normal, time, noiseScale, displacementScale,
      stripesFrequency, stripeSharpness, noiseWeight,
      polarHigh, polarLow, equatorFlare
    );

    vNormal = normalize(normalMatrix * displacedNormal);
    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = mvPos.xyz;

    vStrata = aegisStrataPattern(position, stripesFrequency, stripeSharpness, noiseScale, time);
    vCavity = 1.0 - vStrata;

    gl_Position = projectionMatrix * mvPos;
  }
`;

export const AEGIS_CORE_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform vec3 colorBase;
  uniform vec3 colorDark;
  uniform vec3 colorHighlight;
  uniform vec3 keyLightDir;
  uniform vec3 fillLightDir;
  uniform vec3 rimLightDir;

  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vStrata;
  varying float vCavity;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(-vViewPosition);

    vec3 keyDir = normalize(keyLightDir);
    vec3 fillDir = normalize(fillLightDir);
    vec3 rimDir = normalize(rimLightDir);

    float NdotL = max(dot(N, keyDir), 0.0);
    float fillL = max(dot(N, fillDir), 0.0) * 0.45;
    float rimL = pow(max(dot(N, rimDir), 0.0), 2.2) * 0.35;

    vec3 H = normalize(keyDir + V);
    float spec = pow(max(dot(N, H), 0.0), mix(24.0, 64.0, vStrata)) * 0.22;

    float ao = mix(0.25, 1.0, vStrata);
    ao *= mix(1.0, 0.55, vCavity * 0.85);

    vec3 albedo = mix(colorDark, colorBase, vStrata);
    albedo = mix(albedo, colorHighlight, NdotL * 0.35 + rimL);

    vec3 diffuse = albedo * (NdotL * 0.95 + fillL + 0.12) * ao;
    vec3 finalColor = diffuse + colorHighlight * spec;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const AEGIS_SHELL_VERTEX_PATCH = /* glsl */ `
  ${NOISE_3D_GLSL}
  ${AEGIS_DISPLACEMENT_GLSL}

  uniform float aegisTime;
  uniform float aegisNoiseScale;
  uniform float aegisDisplacementScale;
  uniform float aegisStripesFrequency;
  uniform float aegisStripeSharpness;
  uniform float aegisNoiseWeight;
  uniform float aegisPolarHigh;
  uniform float aegisPolarLow;
  uniform float aegisEquatorFlare;
`;
