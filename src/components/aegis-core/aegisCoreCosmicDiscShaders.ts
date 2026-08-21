/**
 * Cosmic Disc Shaders for Aegis Core "Seed" State
 * Reproduces the "020 VOXED" visualization:
 * - Central black void
 * - Orange/amber inner ring
 * - White/silver crystalline radial rays
 */

export const COSMIC_DISC_NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise2D(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm2D(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      value += amplitude * snoise2D(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
`;

export const COSMIC_DISC_VERTEX_SHADER = /* glsl */ `
  precision highp float;

  ${COSMIC_DISC_NOISE_GLSL}

  uniform float time;
  uniform float spikeHeight;
  uniform float spikeCount;
  uniform float voidRadius;
  uniform float rayZoneStart;

  varying vec2 vUv;
  varying float vRadius;
  varying float vAngle;
  varying float vSpikeIntensity;

  void main() {
    vUv = uv;
    
    vec2 centered = uv - 0.5;
    vRadius = length(centered) * 2.0;
    vAngle = atan(centered.y, centered.x);
    
    vec3 pos = position;
    
    // Displacement for crystalline spikes in the ray zone
    if (vRadius > rayZoneStart && vRadius < 0.98) {
      float normalizedR = (vRadius - rayZoneStart) / (0.98 - rayZoneStart);
      
      // Angular spike pattern
      float angularFreq = spikeCount;
      float spike = sin(vAngle * angularFreq) * 0.5 + 0.5;
      spike = pow(spike, 8.0);
      
      // Add noise variation
      float noise = fbm2D(vec2(vAngle * 10.0, vRadius * 5.0 + time * 0.1), 4);
      noise = noise * 0.5 + 0.5;
      
      // Secondary finer spikes
      float fineSpike = sin(vAngle * angularFreq * 3.0 + noise * 6.28) * 0.5 + 0.5;
      fineSpike = pow(fineSpike, 12.0) * 0.4;
      
      // Combine spikes with radial falloff
      float radialFalloff = pow(normalizedR, 0.5) * pow(1.0 - normalizedR, 0.3);
      vSpikeIntensity = (spike + fineSpike) * radialFalloff * noise;
      
      // Apply Z displacement
      pos.z += vSpikeIntensity * spikeHeight;
    } else {
      vSpikeIntensity = 0.0;
    }
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const COSMIC_DISC_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  ${COSMIC_DISC_NOISE_GLSL}

  uniform float time;
  uniform float voidRadius;
  uniform float amberZoneEnd;
  uniform float rayZoneStart;
  uniform float rayIntensity;
  uniform float spikeCount;

  // Colors
  uniform vec3 colorVoid;
  uniform vec3 colorAmberDark;
  uniform vec3 colorAmberBright;
  uniform vec3 colorAmberHot;
  uniform vec3 colorRayWhite;
  uniform vec3 colorRaySilver;

  varying vec2 vUv;
  varying float vRadius;
  varying float vAngle;
  varying float vSpikeIntensity;

  void main() {
    vec2 centered = vUv - 0.5;
    float r = length(centered) * 2.0;
    float angle = atan(centered.y, centered.x);
    
    vec3 color = colorVoid;
    float alpha = 1.0;
    
    // Discard pixels outside the disc
    if (r > 1.0) {
      discard;
    }
    
    // === CENTRAL VOID (small dark singularity) ===
    if (r < voidRadius) {
      color = colorVoid;
      // Hard edge with subtle glow at boundary
      float voidEdge = smoothstep(voidRadius * 0.7, voidRadius, r);
      color = mix(colorVoid, colorAmberDark * 0.15, voidEdge * 0.5);
    }
    // === AMBER/ORANGE INNER RING (warm glowing core) ===
    else if (r < amberZoneEnd) {
      float t = (r - voidRadius) / (amberZoneEnd - voidRadius);
      
      // Rich amber gradient with hot core
      vec3 amber = mix(colorAmberDark * 1.5, colorAmberBright, pow(t, 0.5));
      
      // Intense hot spots near void
      float hotSpot = pow(1.0 - t, 3.0);
      amber = mix(amber, colorAmberHot * 1.3, hotSpot);
      
      // Strong radial streaks emanating from void
      float streakNoise = fbm2D(vec2(angle * 12.0 + time * 0.02, t * 3.0), 4);
      streakNoise = streakNoise * 0.5 + 0.5;
      
      float streak = sin(angle * spikeCount * 0.7 + streakNoise * 4.0) * 0.5 + 0.5;
      streak = pow(streak, 3.0);
      
      // Secondary thinner streaks
      float fineStreak = sin(angle * spikeCount * 2.0 + streakNoise * 8.0) * 0.5 + 0.5;
      fineStreak = pow(fineStreak, 5.0) * 0.5;
      
      float combinedStreak = streak + fineStreak;
      amber = mix(amber, colorAmberHot * 1.4, combinedStreak * t * 0.5);
      
      // Brightness variation
      float brightness = 1.0 + streakNoise * 0.3 + combinedStreak * 0.2;
      color = amber * brightness;
    }
    // === TRANSITION ZONE (amber to crystalline) ===
    else if (r < rayZoneStart) {
      float t = (r - amberZoneEnd) / (rayZoneStart - amberZoneEnd);
      
      // Dramatic transition
      vec3 transitionColor = mix(colorAmberBright * 0.8, colorAmberDark * 0.4, pow(t, 0.6));
      
      // Early crystalline hints
      float rayNoise = fbm2D(vec2(angle * 20.0, r * 6.0 + time * 0.01), 5);
      rayNoise = rayNoise * 0.5 + 0.5;
      
      float earlyRay = sin(angle * spikeCount) * 0.5 + 0.5;
      earlyRay = pow(earlyRay, 4.0);
      
      // Mix in silver/white hints
      vec3 rayHint = mix(colorAmberBright * 0.6, colorRaySilver * 0.8, t);
      transitionColor = mix(transitionColor, rayHint, earlyRay * rayNoise * 0.6);
      
      color = transitionColor;
    }
    // === CRYSTALLINE RAY ZONE (main visual impact) ===
    else if (r < 0.95) {
      float t = (r - rayZoneStart) / (0.95 - rayZoneStart);
      
      // Multi-layer crystalline spikes
      float noiseBase = fbm2D(vec2(angle * 25.0 + time * 0.005, r * 8.0), 5);
      noiseBase = noiseBase * 0.5 + 0.5;
      
      // Primary bold rays
      float spike1 = sin(angle * spikeCount + noiseBase * 2.0) * 0.5 + 0.5;
      spike1 = pow(spike1, 4.0);
      
      // Secondary medium rays
      float spike2 = sin(angle * spikeCount * 2.5 + noiseBase * 4.0) * 0.5 + 0.5;
      spike2 = pow(spike2, 6.0) * 0.7;
      
      // Tertiary fine detail
      float spike3 = sin(angle * spikeCount * 5.0 + noiseBase * 8.0) * 0.5 + 0.5;
      spike3 = pow(spike3, 10.0) * 0.4;
      
      // Quaternary micro-detail
      float spike4 = sin(angle * spikeCount * 11.0 + noiseBase * 12.0) * 0.5 + 0.5;
      spike4 = pow(spike4, 14.0) * 0.25;
      
      // Combine all spike layers
      float combinedSpike = spike1 + spike2 + spike3 + spike4;
      combinedSpike = clamp(combinedSpike, 0.0, 1.0);
      
      // Radial brightness (stronger rays towards edge)
      float radialBrightness = pow(t, 0.3);
      
      // Background between rays (dark with amber hints)
      vec3 rayBase = mix(colorAmberDark * 0.2, vec3(0.02), t * 0.8);
      
      // Bright ray color (amber to white/silver gradient based on radius)
      vec3 rayInner = mix(colorAmberBright * 0.9, colorRaySilver, pow(t, 0.5));
      vec3 rayOuter = mix(colorRaySilver, colorRayWhite, pow(t, 0.8));
      vec3 rayBright = mix(rayInner, rayOuter, t);
      
      // Apply spike intensity
      float finalIntensity = combinedSpike * radialBrightness * rayIntensity;
      finalIntensity *= noiseBase * 0.4 + 0.6;
      
      color = mix(rayBase, rayBright, finalIntensity);
      
      // Amber glow in gaps between rays (near center of ray zone)
      float gapGlow = (1.0 - combinedSpike) * (1.0 - t) * 0.4;
      color = mix(color, colorAmberBright * 0.5, gapGlow);
      
      // Intense bloom on brightest spikes
      if (finalIntensity > 0.65) {
        float bloom = (finalIntensity - 0.65) * 0.8;
        color += colorRayWhite * bloom;
      }
    }
    // === OUTER EDGE (fade to black with residual rays) ===
    else {
      float edgeFade = smoothstep(0.95, 1.0, r);
      
      // Residual faint rays at edge
      float noiseEdge = fbm2D(vec2(angle * 20.0, r * 5.0), 4) * 0.5 + 0.5;
      float edgeRay = sin(angle * spikeCount + noiseEdge * 3.0) * 0.5 + 0.5;
      edgeRay = pow(edgeRay, 6.0) * (1.0 - edgeFade);
      
      color = mix(colorRaySilver * 0.25, colorVoid, edgeFade);
      color += colorRayWhite * edgeRay * 0.15;
      
      alpha = 1.0 - pow(edgeFade, 0.5);
    }
    
    // === GLOBAL EFFECTS ===
    
    // Subtle pulsing glow
    float pulse = sin(time * 0.3) * 0.5 + 0.5;
    color *= 1.0 + pulse * 0.03;
    
    // Ensure valid color range with HDR headroom
    color = clamp(color, 0.0, 2.0);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

// Default uniform values for the cosmic disc - tuned to match "020 VOXED" reference
export const COSMIC_DISC_DEFAULT_UNIFORMS = {
  time: 0,
  voidRadius: 0.055,
  amberZoneEnd: 0.24,
  rayZoneStart: 0.32,
  rayIntensity: 1.4,
  spikeCount: 100,
  spikeHeight: 0.12,
  colorVoid: [0.0, 0.0, 0.0],
  colorAmberDark: [0.22, 0.10, 0.03],
  colorAmberBright: [0.92, 0.58, 0.18],
  colorAmberHot: [1.0, 0.78, 0.32],
  colorRayWhite: [0.98, 0.97, 0.95],
  colorRaySilver: [0.82, 0.85, 0.88],
};
