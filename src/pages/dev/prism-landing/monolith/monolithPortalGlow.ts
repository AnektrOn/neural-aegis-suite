import * as THREE from "three";

const PORTAL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PORTAL_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
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
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.04 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 q = vec2(
      fbm(uv * vec2(3.0, 6.0) + vec2(0.0, -uTime * 0.08)),
      fbm(uv * vec2(3.0, 6.0) + vec2(4.2, -uTime * 0.06))
    );
    float cloud = fbm(uv * vec2(4.5, 9.0) + q * 1.8 - vec2(0.0, uTime * 0.1));
    float bottomBlast = pow(max(0.0, 1.0 - uv.y * 1.25), 2.4);
    float midGlow = smoothstep(1.0, 0.05, uv.y);
    vec3 deepAmber = vec3(0.42, 0.16, 0.07);
    vec3 warmOrange = vec3(0.96, 0.48, 0.20);
    vec3 brightGold = vec3(1.0, 0.82, 0.52);
    vec3 pureCore = vec3(1.0, 0.98, 0.88);
    vec3 col = mix(deepAmber, warmOrange, midGlow * (0.55 + 0.45 * cloud));
    col = mix(col, brightGold, bottomBlast * 0.85 + cloud * 0.25 * midGlow);
    col = mix(col, pureCore, pow(bottomBlast, 1.8) * 0.95);
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

const SPILL_FRAG = /* glsl */ `
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float horiz = exp(-pow((vUv.x - 0.5) * 3.2, 2.0));
    float vert = pow(max(0.0, 1.0 - vUv.y), 2.0);
    vec3 col = vec3(1.0, 0.62, 0.28);
    gl_FragColor = vec4(col, horiz * vert * 0.22 * uIntensity);
  }
`;

const COLUMN_FRAG = /* glsl */ `
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float horiz = exp(-pow((vUv.x - 0.5) * 3.4, 2.0));
    float vert = 0.22 + 0.78 * pow(max(0.0, 1.0 - vUv.y), 1.5);
    vec3 col = vec3(1.0, 0.58, 0.22);
    gl_FragColor = vec4(col, horiz * vert * 0.16 * uIntensity);
  }
`;

function radialGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255, 210, 150, 1)");
  grad.addColorStop(0.28, "rgba(255, 160, 70, 0.45)");
  grad.addColorStop(0.65, "rgba(255, 120, 40, 0.12)");
  grad.addColorStop(1, "rgba(255, 100, 30, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export type MonolithPortalGlow = {
  update: (time: number, intensity: number, visible: boolean) => void;
  dispose: () => void;
};

/** Additive halo from the cosmic-monolith reference: portal core, base sprite, column, top spill. */
export function createMonolithPortalGlow(
  scene: THREE.Scene,
  slab: THREE.Mesh,
  footY: number,
  pillarY: number,
  towerH: number,
): MonolithPortalGlow {
  const portalUniforms = {
    uTime: { value: 0 },
    uIntensity: { value: 1.15 },
  };
  const portalMat = new THREE.ShaderMaterial({
    uniforms: portalUniforms,
    vertexShader: PORTAL_VERT,
    fragmentShader: PORTAL_FRAG,
    fog: false,
    toneMapped: false,
    depthWrite: false,
  });
  slab.material = portalMat;

  const glowMap = radialGlowTexture();
  const baseMat = new THREE.SpriteMaterial({
    map: glowMap,
    color: 0xffd28a,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });
  const baseSprite = new THREE.Sprite(baseMat);
  baseSprite.position.set(0, footY + 1.6, 2.2);
  baseSprite.scale.set(4.2, 4.2, 1);
  scene.add(baseSprite);

  const mist: THREE.Sprite[] = [];
  for (let i = 0; i < 7; i++) {
    const mat = new THREE.SpriteMaterial({
      map: glowMap,
      color: 0xff8c3b,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set((i - 3) * 4.2, footY + 1.15, -1.2 - Math.abs(i - 3) * 0.8);
    sprite.scale.set(11, 2.4, 1);
    scene.add(sprite);
    mist.push(sprite);
  }

  const columnUniforms = { uIntensity: { value: 1.15 } };
  const column = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, towerH * 0.9),
    new THREE.ShaderMaterial({
      uniforms: columnUniforms,
      vertexShader: PORTAL_VERT,
      fragmentShader: COLUMN_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false,
    }),
  );
  column.position.set(0, pillarY, 1.55);
  scene.add(column);

  const spillUniforms = { uIntensity: { value: 1.15 } };
  const spill = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 8),
    new THREE.ShaderMaterial({
      uniforms: spillUniforms,
      vertexShader: PORTAL_VERT,
      fragmentShader: SPILL_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
      toneMapped: false,
    }),
  );
  spill.position.set(0, footY + towerH + 3.2, 0.4);
  scene.add(spill);

  const baseLight = new THREE.PointLight(0xffb563, 3.6, 18, 1.8);
  baseLight.position.set(0, footY + 1.2, 1.6);
  const midLight = new THREE.PointLight(0xff8433, 2.2, 14, 1.6);
  midLight.position.set(0, pillarY, 0.9);
  const topLight = new THREE.PointLight(0xff9642, 1.6, 12, 1.6);
  topLight.position.set(0, footY + towerH - 1.2, 0.8);
  scene.add(baseLight, midLight, topLight);

  const haloNodes: THREE.Object3D[] = [baseSprite, column, spill, ...mist];

  return {
    update(time, intensity, visible) {
      const glow = Math.max(0, intensity);
      const pulse = 1 + Math.sin(time * 1.7) * 0.035;
      portalUniforms.uTime.value = time;
      portalUniforms.uIntensity.value = glow;
      columnUniforms.uIntensity.value = glow;
      spillUniforms.uIntensity.value = glow;
      baseMat.opacity = Math.min(0.7, 0.5 * glow);
      baseSprite.scale.set(4.2 * pulse, 4.2 * pulse, 1);
      baseLight.intensity = 3.6 * glow * pulse;
      midLight.intensity = 2.2 * glow;
      topLight.intensity = 1.6 * glow;
      for (const node of haloNodes) node.visible = visible;
      for (const sprite of mist) {
        const mat = sprite.material as THREE.SpriteMaterial;
        mat.opacity = 0.07 * Math.min(glow, 1.4);
      }
    },
    dispose() {
      portalMat.dispose();
      baseMat.dispose();
      glowMap.dispose();
      (column.material as THREE.Material).dispose();
      column.geometry.dispose();
      (spill.material as THREE.Material).dispose();
      spill.geometry.dispose();
      for (const sprite of mist) {
        (sprite.material as THREE.Material).dispose();
      }
    },
  };
}
