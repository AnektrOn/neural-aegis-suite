export const VERT_OBS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv; attribute vec3 aTan;
uniform mat4 uModel; uniform mat4 uVP; uniform mat3 uN;
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vT;
void main(){
  vec4 w = uModel * vec4(aPos,1.0);
  vW = w.xyz;
  vN = uN * aNor;
  vT = uN * aTan;
  vUv = aUv;
  gl_Position = uVP * w;
}`;

const FRAG_PRECISION = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

export const FRAG_OBS =
  FRAG_PRECISION +
  `
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying vec3 vT;
uniform vec3 uCam; uniform vec3 uCore; uniform vec3 uCol; uniform float uGlow;
uniform sampler2D uAlbedo; uniform sampler2D uRough; uniform sampler2D uNorTex;
vec3 env(vec3 d){
  vec3 c = mix(vec3(0.78, 0.72, 0.66), vec3(0.96, 0.93, 0.88), d.y * 0.5 + 0.5);
  c += vec3(1.0, 0.88, 0.68) * 0.7 * smoothstep(0.70, 0.96, dot(d, normalize(vec3(0.42, 0.78, 0.38))));
  return c;
}
void main(){
  vec3 T = normalize(vT);
  vec3 N = normalize(vN);
  vec3 B = normalize(cross(N, T));
  vec3 nTex = texture2D(uNorTex, vUv).xyz * 2.0 - 1.0;
  N = normalize(mat3(T, B, N) * nTex);
  vec3 V = normalize(uCam - vW);
  if (dot(N,V) < 0.0) N = -N;
  float nv = max(dot(N,V), 0.0);
  vec3 R = reflect(-V, N);
  float F = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  vec3 albedo = pow(texture2D(uAlbedo, vUv).rgb, vec3(2.2));
  float rough = texture2D(uRough, vUv).r;
  float shine = mix(18.0, 90.0, 1.0 - rough);
  vec3 col = albedo * 0.22;
  col += env(R) * F * mix(0.35, 1.15, 1.0 - rough);
  vec3 L = uCore - vW; float d2 = dot(L,L); L = normalize(L);
  float att = 1.0 / (1.0 + 0.18 * d2);
  float k = 0.55 + uGlow * 0.85;
  vec3 H = normalize(L + V);
  float diff = max(dot(N,L), 0.0);
  float spec = pow(max(dot(N,H), 0.0), shine);
  col += albedo * uCol * diff * att * k * 1.15;
  col += uCol * spec * att * k * mix(0.35, 2.4, 1.0 - rough);
  col = col / (1.0 + col);
  col = pow(col, vec3(1.0/2.2));
  gl_FragColor = vec4(col, 1.0);
}`;

export const FRAG_FLAT =
  FRAG_PRECISION +
  `
uniform vec3 uColor; uniform float uInt;
void main(){ gl_FragColor = vec4(uColor * uInt, 1.0); }`;

export const FRAG_CORE =
  FRAG_PRECISION +
  `
varying vec3 vW; varying vec3 vN;
uniform vec3 uCam; uniform vec3 uCol; uniform float uGlow;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(uCam - vW);
  float nv = max(dot(N,V), 0.0);
  float rim = pow(1.0 - nv, 1.6);
  vec3 hot = vec3(1.0, 0.93, 0.72);
  vec3 c = mix(uCol * (1.2 + uGlow * 0.45), hot, pow(nv, 2.4) * 0.5);
  c += uCol * rim * (0.4 + uGlow * 0.28);
  c *= 0.95 + uGlow * 0.28;
  gl_FragColor = vec4(min(c, vec3(1.15)), 1.0);
}`;

export const FRAG_HALO =
  FRAG_PRECISION +
  `
varying vec3 vW; varying vec3 vN;
uniform vec3 uCam; uniform vec3 uCol; uniform float uPow; uniform float uAmt;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(uCam - vW);
  float nv = abs(dot(N,V));
  float a = pow(nv, uPow) * uAmt;
  gl_FragColor = vec4(uCol * a, 0.0);
}`;
