import * as THREE from "three";

const SOAK_VERT = `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const SOAK_FRAG = `
uniform vec2 uCenter;
uniform float uInner;
uniform float uOuter;
uniform vec3 uFogColor;
varying vec3 vWorldPos;

void main() {
  float r = length(vWorldPos.xz - uCenter);
  float a = smoothstep(uInner, uOuter, r);
  a = a * a * (3.0 - 2.0 * a);
  if (a < 0.004) discard;
  gl_FragColor = vec4(uFogColor, a * 0.94);
}
`;

export type LandingHorizonSoak = {
  mesh: THREE.Mesh;
  dispose: () => void;
};

/** Anneau bas et large : prolonge le sol dans la couleur brouillard au-delà du mesh terrain. */
export function createLandingHorizonSoak(
  centerX: number,
  centerZ: number,
  fogColor: THREE.Color,
  options?: { size?: number; innerRadius?: number; outerRadius?: number; y?: number },
): LandingHorizonSoak {
  const size = options?.size ?? 200;
  const inner = options?.innerRadius ?? 30;
  const outer = options?.outerRadius ?? 58;
  const y = options?.y ?? -0.22;

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: {
      uCenter: { value: new THREE.Vector2(centerX, centerZ) },
      uInner: { value: inner },
      uOuter: { value: outer },
      uFogColor: { value: fogColor.clone() },
    },
    vertexShader: SOAK_VERT,
    fragmentShader: SOAK_FRAG,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(centerX, y, centerZ);
  mesh.renderOrder = 0;
  mesh.frustumCulled = false;

  return {
    mesh,
    dispose() {
      mesh.geometry.dispose();
      mat.dispose();
    },
  };
}
