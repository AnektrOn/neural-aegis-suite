/**
 * Sculpture Hero — liquid particle hero
 * by guglielmogiannattasio.it
 *
 * The sculpture is rebuilt from ~100k GPU-simulated particles sampled from
 * its own pixels. The cursor turns the material liquid; it settles back into
 * the crisp image. Without WebGL2 the static image is shown.
 */

import * as React from "react"

/* ────────────────────────────────────────────────────────────────────
   Engine (WebGL2 GPGPU particles)
   ──────────────────────────────────────────────────────────────────── */

type Rect = { x: number; y: number; w: number; h: number }

interface EngineOptions {
  interactive: boolean
  strength: number
  radius: number
  density: number
  dotSize: number
  spread: number
  turbulence: number
  returnSpeed: number
  streaks: boolean
  restStyle: "image" | "particles"
  ambient: boolean
  ambientIntensity: number
  speed: number
  intro: boolean
  reducedMotion: boolean
  bg: [number, number, number]
  /** null = detected from the image corners */
  imgBg: [number, number, number] | null
  /** 0 – 2: how much the whole sculpture flows while the cursor is over it */
  liquid: number
  /** Inverted interaction: chaos at rest, pointer stabilizes the crisp image. */
  stabilizeOnPointer: boolean
  /** Inverted interaction: vortex dispersion until hold progress brings order. */
  stabilizeOnHold: boolean
  getHoldOrder: (() => number) | null
  /** 0 – 2, spiral vortex strength when stabilizeOnHold. */
  vortexIntensity: number
  /** 1 – 7, hold only: higher = slower / later particle unification. */
  holdUnifyExponent: number
  /** stabilizeOnHold: never unify past this (1 = full crystal from particles). */
  holdOrderCap: number
  /** 0 = off, 1 = log, 2 = cinematic, 3 = aegis */
  colorGradePreset: number
  /** 0 – 1 LUT / grade mix */
  colorGradeStrength: number
}

export type SculptureColorGrade = "none" | "log" | "cinematic" | "aegis"

function colorGradePresetId(p: SculptureColorGrade): number {
  switch (p) {
    case "log":
      return 1
    case "cinematic":
      return 2
    case "aegis":
      return 3
    default:
      return 0
  }
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function hexToRgb(hex: string, fallback: [number, number, number]): [number, number, number] {
  if (typeof hex !== "string") return fallback
  const s = hex.trim()
  let m = s.match(/^#?([0-9a-f]{3})$/i)
  if (m) {
    const [r, g, b] = m[1].split("").map((c) => parseInt(c + c, 16) / 255)
    return [r, g, b]
  }
  m = s.match(/^#?([0-9a-f]{6})([0-9a-f]{2})?$/i)
  if (m) {
    const n = parseInt(m[1], 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
  if (m) return [+m[1] / 255, +m[2] / 255, +m[3] / 255]
  return fallback
}

/* ── shaders ─────────────────────────────────────────────────────────── */

const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
vec2 ambientField(vec2 uv, float t){
  vec2 q = uv*vec2(3.2,1.7);
  vec2 a = vec2(vnoise(q+vec2(t*0.11,0.0))-0.5, vnoise(q+vec2(5.2,t*0.08)+3.1)-0.5);
  vec2 q2 = uv*vec2(7.5,4.0) + vec2(-t*0.19, t*0.13);
  vec2 b = vec2(vnoise(q2+1.7)-0.5, vnoise(q2+9.3)-0.5);
  return a + b*0.45;
}
`

/* energy of the material at a point: shared by image and particles so the
   cross-fade is exactly complementary */
const ENERGY = `
float energyAt(vec2 rectPx, vec2 mouse, float radius, float presence, float wakeEnergy){
  vec2 d = rectPx - mouse;
  float f = exp(-dot(d,d)/(radius*radius))*presence;
  return smoothstep(0.06, 0.5, f*1.15 + wakeEnergy*1.7);
}
`

const QUAD_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`

/* Flow map (cursor wake). RGBA8: velocity encoded around 128, energy in B. */
const FLOW_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform vec2 uSize;
uniform float uRadius;
uniform float uPresence;
uniform float uDecay;
vec2 decV(vec4 c){ return (c.rg*255.0-128.0)/127.0; }
void main(){
  vec2 v0 = decV(texture(uPrev, vUv));
  vec2 uv = vUv - v0*uTexel*2.5;
  vec4 c = texture(uPrev, uv)*0.52
    + 0.12*(texture(uPrev, uv+vec2(uTexel.x,0.0)) + texture(uPrev, uv-vec2(uTexel.x,0.0))
          + texture(uPrev, uv+vec2(0.0,uTexel.y)) + texture(uPrev, uv-vec2(0.0,uTexel.y)));
  vec2 v = decV(c);
  float p = c.b;
  vec2 d = (vUv-uMouse)*uSize;
  float f = exp(-dot(d,d)/(uRadius*uRadius))*uPresence;
  float sp = clamp(length(uVel)*2.5, 0.0, 1.0);
  v += uVel*f*0.22;
  p = max(p, f*sp);
  v *= uDecay;
  p *= uDecay;
  v = sign(v)*max(abs(v)-1.2/127.0, 0.0);
  p = max(p-1.2/255.0, 0.0);
  v = clamp(v, -1.0, 1.0);
  o = vec4((v*127.0+128.0)/255.0, p, 1.0);
}
`

/* GPGPU step: state = (offset.xy, velocity.xy) in rect CSS px. */
const SIM_FS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uFlow;
uniform vec2 uSize;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uStrength;
uniform float uSpread;
uniform float uTurb;
uniform float uReturn;
uniform float uTime;
uniform float uDt;
uniform float uIntro;
uniform float uOrder;
uniform float uVortex;
${NOISE}
vec2 curl(vec2 p){
  const float e = 0.35;
  float a = vnoise(p+vec2(0.0,e)) - vnoise(p-vec2(0.0,e));
  float b = vnoise(p+vec2(e,0.0)) - vnoise(p-vec2(e,0.0));
  return vec2(a, -b)/(2.0*e);
}
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 hm = texelFetch(uHome, ij, 0);
  if(hm.w <= 0.0){ o = vec4(0.0); return; }
  vec4 st = texelFetch(uState, ij, 0);
  vec2 off = st.xy;
  vec2 vel = st.zw;
  float sd = hm.z;
  float light = 0.45 + sd*1.1;

  vec2 p = hm.xy*uSize + off;
  vec4 fl = texture(uFlow, clamp(p/uSize, 0.0, 1.0));
  vec2 wake = (fl.rg*255.0-128.0)/127.0;
  float pr = fl.b;

  vec2 toM = p - uMouse;
  float r2 = dot(toM,toM);
  float f = exp(-r2/(uRadius*uRadius))*uPresence;
  vec2 n = toM*inversesqrt(r2+1.0);
  float e = clamp(pr*2.0 + f, 0.0, 1.0);

  vec2 acc = vec2(0.0);
  // blown outward and swirled around the cursor
  acc += n*f*1.25*uStrength*uSpread*light;
  acc += vec2(-n.y, n.x)*f*1.45*uStrength*uSpread*(0.4+sd);
  // carried by the liquid wake
  acc += (wake*42.0*uSpread*light - vel)*e*0.08;
  // curl-noise turbulence where the material is disturbed (and during the intro)
  vec2 q = p*0.0095 + vec2(uTime*0.35, -uTime*0.2);
  vec2 c = curl(q) + 0.5*curl(q*2.3 + 7.1);
  acc += c*(e*1.2*uSpread + uIntro*1.5)*uTurb*light;
  float disorder = (1.0 - uOrder) * uVortex;
  if(disorder > 0.001){
    vec2 center = uSize * 0.5;
    vec2 fromC = p - center;
    float r = length(fromC) + 2.5;
    vec2 tang = vec2(-fromC.y, fromC.x) / r;
    float rmax = max(uSize.x, uSize.y) * 0.48;
    float fall = 1.0 - smoothstep(rmax * 0.12, rmax, r);
    acc += tang * disorder * (1.35 + sd * 0.45) * light * fall;
    acc += (fromC / r) * disorder * 0.38 * light * fall;
    vec2 qv = p * 0.007 + vec2(uTime * 0.22, -uTime * 0.16);
    vec2 cv = curl(qv);
    acc += cv * disorder * 0.95 * uTurb * light;
  }
  // elastic return home
  float k = (0.006 + 0.02*uReturn)*(0.65+sd*0.7)*(1.0 - uIntro*0.75);
  acc -= off*k;

  vel += acc*uDt;
  vel *= pow(mix(0.93, 0.955, e), uDt);
  off += vel*uDt;
  if(dot(off,off) < 0.0004 && dot(vel,vel) < 0.0004){ off = vec2(0.0); vel = vec2(0.0); }
  o = vec4(off, vel);
}
`

/* Particles: one instanced quad per particle, a capsule stretched along velocity. */
const PART_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform sampler2D uState;
uniform sampler2D uHome;
uniform sampler2D uCol;
uniform sampler2D uFlow;
uniform int uTexW;
uniform vec4 uRect;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uDot;
uniform float uTime;
uniform float uAmbient;
uniform float uStreak;
uniform float uIntroVis;
uniform float uRest;
uniform vec3 uTint;
out vec2 vLocal;
out float vHalfLen;
out float vR;
out vec3 vCol;
out float vA;
${NOISE}
${ENERGY}
void main(){
  int id = gl_InstanceID;
  ivec2 ij = ivec2(id % uTexW, id / uTexW);
  vec4 hm = texelFetch(uHome, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  vec4 cl = texelFetch(uCol, ij, 0);

  float wakeE = texture(uFlow, hm.xy).b;
  float E = energyAt(hm.xy*uRect.zw, uMouse, uRadius, uPresence, wakeE);
  float lift = smoothstep(0.35, 2.5, length(st.xy));
  float a = max(max(E, lift), max(uRest, 1.0-uIntroVis));
  if(a < 0.01 || hm.w <= 0.0){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }

  vec2 base = uRect.xy + hm.xy*uRect.zw + st.xy;
  base -= ambientField(hm.xy, uTime)*10.0*uAmbient;

  vec2 v = st.zw;
  float sp = length(v);
  vec2 dir = sp > 0.001 ? v/sp : vec2(1.0,0.0);
  float r = uDot*hm.w*0.5;
  float len = min(sp*1.25, 18.0)*uStreak;
  vec2 lc = aCorner*vec2(r + len*0.5 + 1.0, r + 1.0);
  vec2 center = base - dir*len*0.5;
  vec2 world = center + dir*lc.x + vec2(-dir.y, dir.x)*lc.y;

  vec2 clip = world/uRes*2.0-1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = lc;
  vHalfLen = len*0.5;
  vR = r;
  vec3 col = cl.rgb*uTint;
  // fast material catches the light, like liquid metal
  float glint = smoothstep(2.0, 16.0, sp);
  col = mix(col, min(col*1.18 + vec3(0.07,0.075,0.085), vec3(1.0)), glint*0.75);
  vCol = col;
  vA = a;
}
`

const PART_FS = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vHalfLen;
in float vR;
in vec3 vCol;
in float vA;
uniform float uDpr;
out vec4 o;
void main(){
  vec2 q = vec2(max(abs(vLocal.x)-vHalfLen, 0.0), vLocal.y);
  float d = length(q) - vR;
  float a = clamp(0.5 - d*uDpr, 0.0, 1.0);
  // comet tail: the trailing end thins out
  float tail = vHalfLen > 0.0 ? clamp(0.5 - vLocal.x/(2.0*(vHalfLen+vR)), 0.0, 1.0) : 0.0;
  a *= 1.0 - tail*0.55;
  a *= vA;
  if(a < 0.004) discard;
  o = vec4(vCol*a, a);
}
`

/* Image pass: the crisp sculpture, gently lensed, fading out where the
   material has turned liquid. */
const IMAGE_FS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uImg;
uniform sampler2D uFlow;
uniform vec2 uRes;
uniform float uDpr;
uniform vec4 uRect;
uniform vec3 uBg;
uniform vec3 uImgBg;
uniform vec2 uMouse;
uniform float uPresence;
uniform float uRadius;
uniform float uStrength;
uniform float uTime;
uniform float uAmbient;
uniform float uIntroVis;
uniform float uRest;
uniform float uAlphaMode;
${NOISE}
${ENERGY}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y*uDpr - gl_FragCoord.y)/uDpr;
  vec2 size = uRect.zw;
  vec2 uv = (px-uRect.xy)/size;
  if(uv.x < -0.05 || uv.x > 1.05 || uv.y < -0.12 || uv.y > 1.12){ o = vec4(0.0); return; }
  vec4 fl = texture(uFlow, clamp(uv,0.0,1.0));
  vec2 vel = (fl.rg*255.0-128.0)/127.0;
  vec2 rp = uv*size;
  vec2 toM = rp - uMouse;
  float fall = exp(-dot(toM,toM)/(uRadius*uRadius))*uPresence;
  vec2 disp = -toM*0.22*uStrength*fall - vel*10.0*uStrength;
  disp += ambientField(uv, uTime)*10.0*uAmbient;
  vec2 suv = uv + disp/size;
  vec4 tx = texture(uImg, suv);
  vec3 col = tx.rgb;
  vec2 e = smoothstep(vec2(0.0), vec2(0.004,0.01), suv) * smoothstep(vec2(1.0), vec2(0.996,0.99), suv);
  // cut-out images carry their own alpha; flat-background images are keyed by colour
  float key = uAlphaMode > 0.5 ? tx.a : smoothstep(0.012, 0.05, length(col-uImgBg));
  float k = key*e.x*e.y;
  float E = energyAt(rp, uMouse, uRadius, uPresence, fl.b);
  float show = (1.0 - max(E, uRest))*uIntroVis;
  vec3 mat = uAlphaMode > 0.5 ? col : col*(uBg/max(uImgBg, vec3(0.001)));
  // premultiplied: empty areas stay transparent so the page (and the backdrop word) shows through
  float A = k*show;
  o = vec4(mat*A, A);
}
`

/* Full-screen color grade (LUT-style presets) over the composed scene. */
const GRADE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uScene;
uniform float uStrength;
uniform int uPreset;
uniform vec2 uRes;
uniform float uTime;

float lum(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec3 gradeLog(vec3 c){
  c = max(c, vec3(1e-4));
  vec3 x = log(c * 14.0) / log(14.0);
  return pow(clamp(x * 1.06 - 0.035, 0.0, 1.0), vec3(1.0 / 2.2));
}

vec3 gradeCinematic(vec3 c){
  float l = lum(c);
  vec3 sh = c * vec3(0.9, 1.02, 1.1);
  vec3 hi = mix(c, c * vec3(1.06, 0.98, 0.9) + vec3(0.03, 0.015, 0.0), smoothstep(0.4, 1.0, l));
  return mix(sh, hi, 0.7);
}

vec3 gradeAegis(vec3 c){
  float l = lum(c);
  c = pow(max(c, vec3(0.0)), vec3(1.08));
  c *= vec3(0.86, 0.93, 1.08);
  c = mix(c, c + vec3(0.02, 0.04, 0.06), smoothstep(0.15, 0.9, l));
  vec2 q = (vUv - 0.5) * vec2(1.0, uRes.y / max(uRes.x, 1.0));
  c *= 1.0 - smoothstep(0.55, 1.15, length(q)) * 0.38;
  float g = fract(sin(dot(floor(vUv * uRes * 0.75), vec2(12.9898, 78.233))) * 43758.5453);
  c += (g - 0.5) * 0.018;
  return c;
}

void main(){
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  vec4 t = texture(uScene, uv);
  vec3 src = t.rgb;
  vec3 graded = src;
  if(uPreset == 1) graded = gradeLog(src);
  else if(uPreset == 2) graded = gradeCinematic(src);
  else if(uPreset == 3) graded = gradeAegis(src);
  vec3 outc = mix(src, graded, uStrength);
  o = vec4(outc, t.a);
}
`

/* ── helpers ─────────────────────────────────────────────────────────── */

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): Prog {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh)
      gl.deleteShader(sh)
      throw new Error("Shader: " + log)
    }
    return sh
  }
  const p = gl.createProgram()!
  const v = make(gl.VERTEX_SHADER, vs)
  const f = make(gl.FRAGMENT_SHADER, fs)
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.bindAttribLocation(p, 0, "aPos")
  gl.linkProgram(p)
  gl.deleteShader(v)
  gl.deleteShader(f)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("Link: " + gl.getProgramInfoLog(p))
  const u: Record<string, WebGLUniformLocation | null> = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)
    if (info) u[info.name] = gl.getUniformLocation(p, info.name)
  }
  return { p, u }
}

/* ── engine ──────────────────────────────────────────────────────────── */

const TEX_W = 1024
const SETTLE_FRAMES = 270

class LiquidEngine {
  lastImage: HTMLImageElement | null = null
  /** Called once, after the first frame has actually been drawn. */
  onFirstFrame: (() => void) | null = null

  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private opts: EngineOptions
  private onFail: () => void
  private lowPower = false
  private stateFormat: { internal: number; type: number } = { internal: 0, type: 0 }

  private pFlow!: Prog
  private pSim!: Prog
  private pPart!: Prog
  private pImg!: Prog
  private pGrade!: Prog
  private vao!: WebGLVertexArrayObject
  private sceneTex: WebGLTexture | null = null
  private sceneFb: WebGLFramebuffer | null = null
  private sceneW = 0
  private sceneH = 0
  private quad!: WebGLBuffer

  private imgTex: WebGLTexture | null = null
  private flowTex: WebGLTexture[] = []
  private flowFb: WebGLFramebuffer[] = []
  private flowW = 256
  private flowH = 104
  private flowIdx = 0
  private flowDirty = false

  private homeTex: WebGLTexture | null = null
  private colTex: WebGLTexture | null = null
  private stateTex: WebGLTexture[] = []
  private stateFb: WebGLFramebuffer[] = []
  private stateIdx = 0
  private texH = 1
  private n = 0
  private gridW = 1
  private stateDirty = false
  private alphaMode = false
  private imgBg: [number, number, number] = [0.918, 0.914, 0.906]
  private flowing = 0

  private aspect = 2.5
  private rect: Rect = { x: 0, y: 0, w: 1, h: 1 }
  private cssW = 1
  private cssH = 1

  private target = { x: -9999, y: -9999 }
  private mouse = { x: -9999, y: -9999 }
  private prevMouse = { x: -9999, y: -9999 }
  private mvel = { x: 0, y: 0 }
  private presence = 0
  private presenceTarget = 0
  private burst = 0
  private lastInput = -1e9
  private settle = 1e9
  private touchRelease = 0

  private time = 0
  private introT = 1
  /** Smoothed 0→1 while hold progresses (avoids snapping image / sim). */
  private holdOrderSm = 0
  private raf = 0
  private running = false
  private last = 0
  private skip = 0
  private visible = true
  private ready = false
  private destroyed = false
  private lost = false

  constructor(canvas: HTMLCanvasElement, opts: EngineOptions, onFail: () => void) {
    this.canvas = canvas
    this.opts = opts
    this.onFail = onFail
    // alpha: an unpresented canvas stays transparent, so the static image under it shows
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null
    if (!gl) throw new Error("WebGL2 unavailable")
    this.gl = gl
    const nav = navigator as Navigator & { deviceMemory?: number }
    this.lowPower =
      (nav.hardwareConcurrency || 8) <= 4 ||
      (nav.deviceMemory || 8) <= 4 ||
      window.matchMedia("(pointer: coarse)").matches
    this.initGL()
    canvas.addEventListener("webglcontextlost", this.onLost, false)
  }

  private onLost = (e: Event) => {
    e.preventDefault()
    this.lost = true
    this.stop()
    this.onFail()
  }

  private initGL() {
    const gl = this.gl
    // float render targets: RGBA16F is enough (offsets in px, sub-pixel precision)
    const full = gl.getExtension("EXT_color_buffer_float")
    const half = full ? null : gl.getExtension("EXT_color_buffer_half_float")
    if (!full && !half) throw new Error("No float render targets")
    this.stateFormat = { internal: gl.RGBA16F, type: gl.HALF_FLOAT }

    this.pFlow = compile(gl, QUAD_VS, FLOW_FS)
    this.pSim = compile(gl, QUAD_VS, SIM_FS)
    this.pPart = compile(gl, PART_VS, PART_FS)
    this.pImg = compile(gl, QUAD_VS, IMAGE_FS)
    this.pGrade = compile(gl, QUAD_VS, GRADE_FS)

    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)
    this.quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    for (let i = 0; i < 2; i++) {
      const t = this.makeTex(gl.RGBA8, this.flowW, this.flowH, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.LINEAR)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      this.flowTex.push(t)
      this.flowFb.push(fb)
    }
    this.clearFlow()
  }

  private makeTex(
    internal: number,
    w: number,
    h: number,
    format: number,
    type: number,
    data: ArrayBufferView | null,
    filter: number
  ) {
    const gl = this.gl
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  private clearFlow() {
    const gl = this.gl
    for (const fb of this.flowFb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, this.flowW, this.flowH)
      gl.clearColor(128 / 255, 128 / 255, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.flowDirty = false
  }

  private clearState() {
    const gl = this.gl
    for (const fb of this.stateFb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, TEX_W, this.texH)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.stateDirty = false
  }

  setImage(img: HTMLImageElement) {
    if (this.destroyed || this.lost) return
    const gl = this.gl
    this.lastImage = img
    this.aspect = img.naturalWidth / img.naturalHeight || 2.5
    this.flowH = Math.max(32, Math.round(this.flowW / this.aspect))
    for (const t of this.flowTex) {
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.flowW, this.flowH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    }
    this.clearFlow()
    if (this.imgTex) gl.deleteTexture(this.imgTex)
    this.imgTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.buildParticles(img)
    this.ready = true
    if (this.opts.stabilizeOnHold && !this.opts.reducedMotion) {
      this.seedExplodedState()
      this.introT = 1
      this.stateDirty = true
    } else if (this.opts.stabilizeOnPointer && !this.opts.reducedMotion) {
      this.seedExplodedState()
      this.introT = 1
    } else if (this.opts.intro && !this.opts.reducedMotion) {
      this.startIntro()
    }
    this.wake()
  }

  /** One particle per material pixel of a grid laid over the image. */
  private buildParticles(img: HTMLImageElement) {
    const gl = this.gl
    const baseGrid = this.lowPower ? 640 : 1000
    const gw = Math.round(baseGrid * Math.sqrt(clamp(this.opts.density, 0.15, 2)))
    const gh = Math.max(1, Math.round(gw / this.aspect))
    this.gridW = gw
    let data: Uint8ClampedArray
    try {
      const c = document.createElement("canvas")
      c.width = gw
      c.height = gh
      const ctx = c.getContext("2d", { willReadFrequently: true })!
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, gw, gh)
      data = ctx.getImageData(0, 0, gw, gh).data
    } catch {
      throw new Error("Image is not CORS-readable")
    }
    // a cut-out (transparent) image is sampled by alpha, a flat one by colour distance
    let transparent = 0
    for (let i = 3; i < data.length; i += 4 * 7) if (data[i] < 250) transparent++
    this.alphaMode = transparent > data.length / (4 * 7) / 20
    if (this.opts.imgBg) this.imgBg = this.opts.imgBg
    else if (!this.alphaMode) {
      // flat background: average the four corners
      let r = 0, g = 0, b = 0, n = 0
      const pw = Math.max(2, Math.round(gw * 0.012))
      for (const [cx, cy] of [[0, 0], [gw - pw, 0], [0, gh - pw], [gw - pw, gh - pw]]) {
        for (let y = cy; y < cy + pw; y++)
          for (let x = cx; x < cx + pw; x++) {
            const i = (y * gw + x) * 4
            r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
          }
      }
      this.imgBg = [r / n / 255, g / n / 255, b / n / 255]
    }
    const home: number[] = []
    const col: number[] = []
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const i = (y * gw + x) * 4
        const r = data[i] / 255
        const g = data[i + 1] / 255
        const b = data[i + 2] / 255
        if (this.alphaMode) {
          const a = data[i + 3] / 255
          if (a < 0.12) continue
          if (a < 0.5 && Math.random() > a * 2) continue
        } else {
          const dev = Math.hypot(r - this.imgBg[0], g - this.imgBg[1], b - this.imgBg[2])
          if (dev < 0.03) continue
          if (dev < 0.07 && Math.random() > (dev - 0.03) / 0.04) continue
        }
        const jx = (Math.random() - 0.5) * 0.6
        const jy = (Math.random() - 0.5) * 0.6
        home.push((x + 0.5 + jx) / gw, (y + 0.5 + jy) / gh, Math.random(), 0.85 + Math.random() * 0.3)
        col.push(data[i], data[i + 1], data[i + 2], 255)
      }
    }
    const n = home.length / 4
    this.n = n
    this.texH = Math.max(1, Math.ceil(n / TEX_W))
    const total = TEX_W * this.texH
    const homeArr = new Float32Array(total * 4)
    homeArr.set(home)
    const colArr = new Uint8Array(total * 4)
    colArr.set(col)

    for (const t of [this.homeTex, this.colTex, ...this.stateTex]) if (t) gl.deleteTexture(t)
    for (const f of this.stateFb) gl.deleteFramebuffer(f)
    this.stateTex = []
    this.stateFb = []
    this.homeTex = this.makeTex(gl.RGBA32F, TEX_W, this.texH, gl.RGBA, gl.FLOAT, homeArr, gl.NEAREST)
    this.colTex = this.makeTex(gl.RGBA8, TEX_W, this.texH, gl.RGBA, gl.UNSIGNED_BYTE, colArr, gl.NEAREST)
    for (let i = 0; i < 2; i++) {
      const t = this.makeTex(this.stateFormat.internal, TEX_W, this.texH, gl.RGBA, this.stateFormat.type, null, gl.NEAREST)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Float FBO incomplete")
      this.stateTex.push(t)
      this.stateFb.push(fb)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.homeData = homeArr
    this.clearState()
  }

  private homeData: Float32Array | null = null

  private startIntro() {
    const gl = this.gl
    const home = this.homeData
    if (!home) return
    const w = this.rect.w > 10 ? this.rect.w : 1300
    const total = TEX_W * this.texH
    const st = new Float32Array(total * 4)
    for (let i = 0; i < this.n; i++) {
      const hx = home[i * 4] - 0.5
      const hy = home[i * 4 + 1] - 0.5
      const sd = home[i * 4 + 2]
      const ang = (Math.random() - 0.5) * 0.9 + (hx > 0 ? 0 : Math.PI)
      const dist = w * (0.04 + Math.random() * 0.14) * (0.5 + Math.abs(hx) * 1.4)
      st[i * 4] = Math.cos(ang) * dist + hx * w * 0.25 * sd
      st[i * 4 + 1] = Math.sin(ang) * dist * 0.55 + hy * 120 * (Math.random() - 0.5)
    }
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.texImage2D(gl.TEXTURE_2D, 0, this.stateFormat.internal, TEX_W, this.texH, 0, gl.RGBA, gl.FLOAT, st)
    this.introT = 0
    this.stateDirty = true
  }

  /** Wide scatter + velocity — default pose when stabilizeOnPointer (hover reassembles). */
  private seedExplodedState() {
    const gl = this.gl
    const home = this.homeData
    if (!home || !this.n) return
    const w = this.rect.w > 10 ? this.rect.w : 1300
    const h = this.rect.h > 10 ? this.rect.h : 900
    const span = Math.max(w, h)
    const total = TEX_W * this.texH
    const st = new Float32Array(total * 4)
    for (let i = 0; i < this.n; i++) {
      const hx = home[i * 4] - 0.5
      const hy = home[i * 4 + 1] - 0.5
      const sd = home[i * 4 + 2]
      const ang = Math.random() * Math.PI * 2
      const dist = span * (0.22 + Math.random() * 0.62) * (0.55 + Math.abs(hx) * 1.1 + sd * 0.15)
      st[i * 4] = Math.cos(ang) * dist + hx * span * 0.42
      st[i * 4 + 1] = Math.sin(ang) * dist * 0.9 + hy * span * 0.35 * (Math.random() - 0.5)
      const sp = 3 + Math.random() * 14
      st[i * 4 + 2] = Math.cos(ang + 0.4) * sp
      st[i * 4 + 3] = Math.sin(ang - 0.3) * sp
    }
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.texImage2D(gl.TEXTURE_2D, 0, this.stateFormat.internal, TEX_W, this.texH, 0, gl.RGBA, gl.FLOAT, st)
    this.stateDirty = true
    this.clearFlow()
  }

  setOptions(o: Partial<EngineOptions>) {
    const rebuild =
      (o.density !== undefined && o.density !== this.opts.density) ||
      (o.imgBg !== undefined && String(o.imgBg) !== String(this.opts.imgBg))
    this.opts = { ...this.opts, ...o }
    if (rebuild && this.ready && this.lastImage) {
      try {
        this.buildParticles(this.lastImage)
      } catch {
        this.onFail()
      }
    }
    this.wake()
  }

  resize(cssW: number, cssH: number, rect: Rect) {
    this.cssW = Math.max(1, cssW)
    this.cssH = Math.max(1, cssH)
    this.rect = rect
    let dpr = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 2)
    const px = this.cssW * this.cssH * dpr * dpr
    if (px > 4.5e6) dpr = Math.max(1, Math.sqrt(4.5e6 / (this.cssW * this.cssH)))
    const w = Math.round(this.cssW * dpr)
    const h = Math.round(this.cssH * dpr)
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
      this.releaseSceneTarget()
    }
    this.draw()
  }

  private useColorGrade() {
    const o = this.opts
    return o.colorGradePreset > 0 && o.colorGradeStrength > 0.001
  }

  private releaseSceneTarget() {
    const gl = this.gl
    if (this.sceneTex) gl.deleteTexture(this.sceneTex)
    if (this.sceneFb) gl.deleteFramebuffer(this.sceneFb)
    this.sceneTex = null
    this.sceneFb = null
    this.sceneW = 0
    this.sceneH = 0
  }

  private ensureSceneTarget(w: number, h: number) {
    if (this.sceneW === w && this.sceneH === h && this.sceneFb && this.sceneTex) return
    this.releaseSceneTarget()
    const gl = this.gl
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const fb = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.sceneTex = t
    this.sceneFb = fb
    this.sceneW = w
    this.sceneH = h
  }

  private drawColorGrade() {
    const gl = this.gl
    const o = this.opts
    if (!this.sceneTex || !this.sceneFb) return
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.disable(gl.BLEND)
    const G = this.pGrade
    gl.useProgram(G.p)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTex)
    gl.uniform1i(G.u.uScene, 0)
    gl.uniform1f(G.u.uStrength, clamp(o.colorGradeStrength, 0, 1))
    gl.uniform1i(G.u.uPreset, o.colorGradePreset)
    gl.uniform2f(G.u.uRes, this.cssW, this.cssH)
    gl.uniform1f(G.u.uTime, this.time)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  setVisible(v: boolean) {
    this.visible = v
    if (v) this.wake()
    else this.stop()
  }

  pointer(type: "move" | "down" | "up" | "leave", x: number, y: number, touch: boolean) {
    if (!this.opts.interactive || this.lost) return
    const now = performance.now()
    const holdMode = this.opts.stabilizeOnHold
    if (type === "leave" || type === "up") {
      if (touch) this.touchRelease = now + 260
      else if (!holdMode) this.presenceTarget = 0
      if (this.opts.stabilizeOnPointer && !holdMode && type === "leave") this.seedExplodedState()
      this.wake()
      return
    }
    if (this.mouse.x < -9000 || type === "down") {
      this.mouse.x = this.prevMouse.x = x
      this.mouse.y = this.prevMouse.y = y
    }
    this.target.x = x
    this.target.y = y
    if (!holdMode) {
      this.presenceTarget = 1
      this.lastInput = now
      this.settle = 0
      if (type === "down") {
        this.burst = 1
        this.touchRelease = 0
      }
    }
    this.wake()
  }

  private wake() {
    if (!this.ready || this.running || !this.visible || this.destroyed || this.lost) {
      if (this.ready && !this.running) this.draw()
      return
    }
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private radiusPx() {
    return this.opts.radius * clamp(this.rect.w / 1400, 0.6, 1.25)
  }

  private strength() {
    return this.opts.strength * (this.opts.reducedMotion ? 0.5 : 1)
  }

  private rawPresence() {
    return Math.max(this.presence, this.burst)
  }

  private invertedStabilize() {
    return this.opts.stabilizeOnPointer || this.opts.stabilizeOnHold
  }

  /** Disturbance level passed to sim/shaders (inverted stabilize modes). */
  private disturbPresence() {
    const raw = this.rawPresence()
    if (!this.invertedStabilize()) return raw
    const order = this.opts.stabilizeOnHold ? this.holdOrderDraw() : this.orderPresence()
    return clamp(0.98 * (1 - order), 0, 1)
  }

  private holdOrderDraw() {
    const cap = this.holdOrderCapValue()
    const raw = this.opts.stabilizeOnHold ? this.holdOrderSm : this.orderPresence()
    return Math.min(raw, cap)
  }

  private holdOrderCapValue() {
    return clamp(this.opts.holdOrderCap, 0, 1)
  }

  /** 0 = vortex chaos, 1 = hold / pointer brings order. */
  private orderPresence() {
    let order = 0
    if (this.opts.stabilizeOnHold && this.opts.getHoldOrder) {
      order = clamp(this.opts.getHoldOrder(), 0, 1)
    } else if (this.opts.stabilizeOnPointer) {
      order = clamp(this.rawPresence(), 0, 1)
    }
    if (this.opts.stabilizeOnHold) order = Math.min(order, this.holdOrderCapValue())
    return order
  }

  private frame = (now: number) => {
    if (!this.running) return
    const rawMs = now - this.last
    const dt = clamp(rawMs / 16.6667, 0.25, 3)
    this.last = now
    const o = this.opts
    const ambientOn = o.ambient && !o.reducedMotion

    if (this.touchRelease && now > this.touchRelease) {
      this.presenceTarget = 0
      this.touchRelease = 0
      if (o.stabilizeOnPointer && !o.stabilizeOnHold) this.seedExplodedState()
    }
    const ease = 1 - Math.pow(1 - 0.22, dt)
    this.mouse.x += (this.target.x - this.mouse.x) * ease
    this.mouse.y += (this.target.y - this.mouse.y) * ease
    const vx = (this.mouse.x - this.prevMouse.x) / dt
    const vy = (this.mouse.y - this.prevMouse.y) / dt
    this.prevMouse.x = this.mouse.x
    this.prevMouse.y = this.mouse.y
    this.mvel.x += (clamp(vx, -60, 60) - this.mvel.x) * 0.5
    this.mvel.y += (clamp(vy, -60, 60) - this.mvel.y) * 0.5
    const pk = this.presenceTarget > this.presence ? 0.1 : 0.035
    this.presence += (this.presenceTarget - this.presence) * (1 - Math.pow(1 - pk, dt))
    if (this.presence < 0.001 && this.presenceTarget === 0) this.presence = 0
    const fk = this.presenceTarget > this.flowing ? 0.05 : 0.018
    this.flowing += (this.presenceTarget - this.flowing) * (1 - Math.pow(1 - fk, dt))
    if (this.flowing < 0.002 && this.presenceTarget === 0) this.flowing = 0
    if (this.introT < 1) this.introT = Math.min(1, this.introT + Math.min(rawMs, 100) / 3200)

    const cap = this.holdOrderCapValue()
    const orderRaw = this.orderPresence()
    if (o.stabilizeOnHold) {
      const unifyExp = clamp(o.holdUnifyExponent, 1, 7)
      const up = 1 - Math.pow(1 - 0.05 / unifyExp, dt)
      const down = 1 - Math.pow(1 - 0.11, dt)
      const k = orderRaw > this.holdOrderSm ? up : down
      this.holdOrderSm = Math.min(cap, this.holdOrderSm + (orderRaw - this.holdOrderSm) * k)
    } else {
      this.holdOrderSm = orderRaw
    }
    const chaos = this.disturbPresence()
    const order = this.holdOrderDraw()
    const vortexRun = o.stabilizeOnHold && order < 0.995
    const interacting =
      this.presence > 0.001 ||
      this.burst > 0 ||
      (this.invertedStabilize() && chaos > 0.12) ||
      vortexRun
    // settle is counted in simulated frames, so slow devices never snap mid-return
    this.settle = interacting ? 0 : this.settle + dt
    const active =
      interacting ||
      this.settle < SETTLE_FRAMES ||
      this.introT < 1 ||
      vortexRun ||
      (o.stabilizeOnPointer && !o.stabilizeOnHold && (ambientOn || chaos > 0.12))

    if (!active) {
      if (this.flowDirty) this.clearFlow()
      if (this.stateDirty) this.clearState()
      if (!ambientOn) {
        this.draw()
        this.firstFrame()
        this.stop()
        return
      }
      this.raf = requestAnimationFrame(this.frame)
      if (this.skip++ % 2) return
      this.time += (dt * 2 * o.speed) / 60
      this.draw()
      this.firstFrame()
      return
    }
    this.raf = requestAnimationFrame(this.frame)
    // the field speeds up while the material is being stirred
    this.time += (dt * o.speed * (1 + this.flowing * 1.6)) / 60
    this.stepFlow(dt)
    this.stepSim(dt)
    this.burst = Math.max(0, this.burst - 0.1 * dt)
    this.draw()
    this.firstFrame()
  }

  private firstFrame() {
    if (this.onFirstFrame) {
      const cb = this.onFirstFrame
      this.onFirstFrame = null
      // one more frame so the compositor has presented the canvas
      requestAnimationFrame(() => cb())
    }
  }

  private stepFlow(dt: number) {
    const gl = this.gl
    const P = this.pFlow
    const dst = 1 - this.flowIdx
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.flowFb[dst])
    gl.viewport(0, 0, this.flowW, this.flowH)
    gl.disable(gl.BLEND)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uPrev, 0)
    gl.uniform2f(P.u.uTexel, 1 / this.flowW, 1 / this.flowH)
    const r = this.rect
    gl.uniform2f(P.u.uMouse, (this.mouse.x - r.x) / r.w, (this.mouse.y - r.y) / r.h)
    gl.uniform2f(P.u.uVel, clamp(this.mvel.x / 40, -1, 1), clamp(this.mvel.y / 40, -1, 1))
    gl.uniform2f(P.u.uSize, r.w, r.h)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    gl.uniform1f(P.u.uPresence, this.disturbPresence())
    gl.uniform1f(P.u.uDecay, Math.pow(0.968, dt))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.flowIdx = dst
    this.flowDirty = true
  }

  private stepSim(dt: number) {
    if (!this.n) return
    const gl = this.gl
    const P = this.pSim
    const o = this.opts
    const r = this.rect
    const dst = 1 - this.stateIdx
    const intro = o.reducedMotion || !o.intro ? 0 : Math.pow(1 - this.introT, 2)
    const order = this.holdOrderDraw()
    const unifyExp = clamp(o.holdUnifyExponent, 1, 7)
    const physOrder = o.stabilizeOnHold ? Math.pow(order, unifyExp) : order
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.stateFb[dst])
    gl.viewport(0, 0, TEX_W, this.texH)
    gl.disable(gl.BLEND)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.uniform1i(P.u.uState, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.homeTex)
    gl.uniform1i(P.u.uHome, 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uFlow, 2)
    gl.uniform2f(P.u.uSize, r.w, r.h)
    gl.uniform2f(P.u.uMouse, this.mouse.x - r.x, this.mouse.y - r.y)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    gl.uniform1f(P.u.uPresence, this.disturbPresence())
    const strengthMul = this.invertedStabilize() ? mix(1, 0.06, physOrder) : 1
    gl.uniform1f(P.u.uStrength, this.strength() * (1 + this.burst * 1.5) * strengthMul)
    gl.uniform1f(P.u.uSpread, clamp(o.spread, 0, 2))
    const turbScale = this.invertedStabilize() ? mix(1.35, 0.22, physOrder) : 1
    gl.uniform1f(P.u.uTurb, clamp(o.turbulence, 0, 2) * (o.reducedMotion ? 0.3 : 1) * turbScale)
    const returnPow = o.stabilizeOnHold ? unifyExp : 0.82
    const returnLo = o.stabilizeOnHold ? 0.006 : 0.04
    const returnMul = this.invertedStabilize() ? mix(returnLo, 4.5, Math.pow(physOrder, returnPow)) : 1
    gl.uniform1f(P.u.uReturn, clamp(o.returnSpeed, 0, 8) * returnMul)
    gl.uniform1f(P.u.uTime, this.time)
    gl.uniform1f(P.u.uDt, dt)
    gl.uniform1f(P.u.uIntro, intro)
    gl.uniform1f(P.u.uOrder, physOrder)
    gl.uniform1f(
      P.u.uVortex,
      o.stabilizeOnHold ? clamp(o.vortexIntensity > 0 ? o.vortexIntensity : o.spread, 0, 2.5) : 0
    )
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.stateIdx = dst
    this.stateDirty = true
  }

  private draw() {
    if (!this.ready || this.lost || this.destroyed) return
    const gl = this.gl
    const o = this.opts
    const r = this.rect
    const rm = o.reducedMotion
    const introVis = rm || !o.intro ? 1 : Math.pow(this.introT, 2.2)
    const base = o.ambient && !rm ? clamp(o.ambientIntensity, 0, 2) : 0
    const orderDraw = this.holdOrderDraw()
    const pres = this.disturbPresence()
    const amb =
      base +
      (this.invertedStabilize() ? pres : this.flowing) *
        0.85 *
        clamp(o.liquid, 0, 2) *
        (rm ? 0.3 : 1)
    let rest = o.restStyle === "particles" ? 1 : 0
    let restPart = rest
    let imageVis = introVis
    let particleVis = introVis
    let imagePresence = pres
    if (this.invertedStabilize()) {
      if (o.stabilizeOnHold) {
        // Hold: particle field only — never reveal the crisp image pass.
        imageVis = 0
        particleVis = introVis
        rest = orderDraw < 0.12 ? 1 : 0
        restPart = rest
        imagePresence = 0
      } else {
        rest = orderDraw < 0.08 ? 1 : 0
        restPart = rest
        imageVis = smoothstep(0.62, 0.98, orderDraw)
        particleVis = 1 - smoothstep(0.42, 0.9, orderDraw)
      }
    }
    const [br, bg, bb] = o.bg
    const [ir, ig, ib] = this.imgBg
    const dpr = this.canvas.width / this.cssW
    const mx = this.mouse.x - r.x
    const my = this.mouse.y - r.y

    const grade = this.useColorGrade()
    if (grade) this.ensureSceneTarget(this.canvas.width, this.canvas.height)
    gl.bindFramebuffer(gl.FRAMEBUFFER, grade && this.sceneFb ? this.sceneFb : null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(br, bg, bb, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindVertexArray(this.vao)
    gl.disable(gl.BLEND)

    const I = this.pImg
    gl.useProgram(I.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.imgTex)
    gl.uniform1i(I.u.uImg, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(I.u.uFlow, 1)
    gl.uniform2f(I.u.uRes, this.cssW, this.cssH)
    gl.uniform1f(I.u.uDpr, dpr)
    gl.uniform4f(I.u.uRect, r.x, r.y, r.w, r.h)
    gl.uniform3f(I.u.uBg, br, bg, bb)
    gl.uniform3f(I.u.uImgBg, ir, ig, ib)
    gl.uniform2f(I.u.uMouse, mx, my)
    gl.uniform1f(I.u.uPresence, imagePresence)
    gl.uniform1f(I.u.uRadius, this.radiusPx())
    gl.uniform1f(I.u.uStrength, this.strength())
    gl.uniform1f(I.u.uTime, this.time)
    gl.uniform1f(I.u.uAmbient, amb)
    gl.uniform1f(I.u.uIntroVis, imageVis)
    gl.uniform1f(I.u.uRest, rest)
    gl.uniform1f(I.u.uAlphaMode, this.alphaMode ? 1 : 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    if (!this.n || particleVis < 0.004) {
      if (grade) this.drawColorGrade()
      return
    }
    if (!this.invertedStabilize() && !this.stateDirty && rest === 0 && introVis >= 1) {
      if (grade) this.drawColorGrade()
      return
    }

    const P = this.pPart
    gl.useProgram(P.p)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.uniform1i(P.u.uState, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.homeTex)
    gl.uniform1i(P.u.uHome, 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.colTex)
    gl.uniform1i(P.u.uCol, 2)
    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uFlow, 3)
    gl.uniform1i(P.u.uTexW, TEX_W)
    gl.uniform4f(P.u.uRect, r.x, r.y, r.w, r.h)
    gl.uniform2f(P.u.uRes, this.cssW, this.cssH)
    gl.uniform2f(P.u.uMouse, mx, my)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    const partPresence = o.stabilizeOnHold ? pres * (0.25 + 0.75 * particleVis) : pres
    gl.uniform1f(P.u.uPresence, partPresence)
    const spacing = r.w / this.gridW
    gl.uniform1f(P.u.uDot, spacing * 1.45 * clamp(o.dotSize, 0.2, 3))
    gl.uniform1f(P.u.uTime, this.time)
    gl.uniform1f(P.u.uAmbient, amb)
    const streakMul = this.invertedStabilize() ? mix(0.15, 1, orderDraw) : 1
    gl.uniform1f(P.u.uStreak, (o.streaks ? 1 : 0) * (0.45 + 0.55 * particleVis) * streakMul)
    gl.uniform1f(P.u.uIntroVis, particleVis)
    gl.uniform1f(P.u.uRest, restPart)
    gl.uniform1f(P.u.uDpr, dpr)
    if (this.alphaMode) gl.uniform3f(P.u.uTint, 1, 1, 1)
    else gl.uniform3f(P.u.uTint, br / Math.max(ir, 0.001), bg / Math.max(ig, 0.001), bb / Math.max(ib, 0.001))
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n)
    gl.disable(gl.BLEND)
    if (grade) this.drawColorGrade()
  }

  destroy() {
    this.destroyed = true
    this.stop()
    this.canvas.removeEventListener("webglcontextlost", this.onLost)
    const gl = this.gl
    if (!this.lost) {
      gl.deleteBuffer(this.quad)
      gl.deleteVertexArray(this.vao)
      for (const t of [...this.flowTex, ...this.stateTex, this.imgTex, this.homeTex, this.colTex, this.sceneTex])
        if (t) gl.deleteTexture(t)
      for (const f of [...this.flowFb, ...this.stateFb, this.sceneFb]) if (f) gl.deleteFramebuffer(f)
      for (const p of [this.pFlow, this.pSim, this.pPart, this.pImg, this.pGrade]) if (p) gl.deleteProgram(p.p)
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext()
  }
}

/* ────────────────────────────────────────────────────────────────────
   Public API
   ──────────────────────────────────────────────────────────────────── */

export interface SculptureHeroLink {
  label: string
  href: string
}

export interface SculptureHeroProps {
  /** Sculpture image (light theme). Must be CORS-enabled when hosted on another domain. */
  src?: string
  /** Optional image for the dark theme. */
  darkSrc?: string
  /** Optional image for phones (portrait layouts), light and dark. */
  mobileSrc?: string
  mobileDarkSrc?: string
  imageAlt?: string
  /** Only for images without transparency: the flat background colour inside the image. */
  imageBackground?: string

  brand?: string
  navLinks?: SculptureHeroLink[]
  navCta?: SculptureHeroLink
  showNav?: boolean

  eyebrow?: string
  headline?: string
  /** Words of the headline to set in the italic accent face. */
  headlineAccent?: string
  body?: string
  primaryCta?: SculptureHeroLink
  secondaryCta?: SculptureHeroLink
  hint?: string
  hintTouch?: string

  /** Light-theme background. */
  background?: string
  /** Dark-theme background. */
  darkBackground?: string
  /** Theme on load. */
  theme?: "light" | "dark"
  /** Show the light/dark switch in the nav. */
  themeToggle?: boolean
  textColor?: string
  accentColor?: string
  headingFont?: string
  accentFont?: string
  bodyFont?: string
  /** Load the default Google Fonts (Geist + Instrument Serif, both OFL). */
  loadFonts?: boolean

  /** 1 = default size for the breakpoint. */
  sculptureScale?: number
  mobileSculptureScale?: number
  /** Offset in % of the hero width / height. */
  sculptureX?: number
  sculptureY?: number

  interactive?: boolean
  /** 0 – 2 */
  strength?: number
  /** Radius of the disturbance, in px at 1440px wide. */
  radius?: number
  /** 0 – 2, multiplies the particle count. */
  particleDensity?: number
  /** 0 – 3, size of each particle relative to the grid. */
  dotSize?: number
  /** 0 – 2, how far particles travel when disturbed. */
  particleSpread?: number
  /** 0 – 2, liquid swirl of the disturbed material. */
  turbulence?: number
  /** 0 – 2, how much the whole sculpture flows while hovered. */
  liquid?: number
  /** Stretch fast particles into liquid streaks. */
  streaks?: boolean
  /** At rest: the crisp image, or the particle field itself. */
  restStyle?: "image" | "particles"
  /** 0 – 8, how quickly particles unify while holding (lower = slower). */
  returnSpeed?: number
  /** 1 – 7, hold only: higher = unification ramps later / longer. */
  holdUnifyExponent?: number
  /** stabilizeOnHold: cap unification (1 = full layout). */
  holdOrderCap?: number
  ambient?: boolean
  /** 0 – 2 */
  ambientIntensity?: number
  /** 0.25 – 3 */
  speed?: number
  /** 0 – 2.5, spiral vortex when stabilizeOnHold (independent of particleSpread). */
  vortexIntensity?: number
  /** Assembly animation on load. */
  intro?: boolean
  /** Chaos at rest; pointer reveals / stabilizes the image. */
  stabilizeOnPointer?: boolean
  /** Vortex dispersion until long-press progress (0–1) stabilizes the image. */
  stabilizeOnHold?: boolean
  /** Read each frame when stabilizeOnHold (e.g. intro useHoldProgress). */
  getHoldOrder?: () => number
  /** Full-viewport sculpture only (no editorial landing chrome). */
  layoutMode?: "editorial" | "stage"
  /** Never show the static fallback image (intro hold scenes). */
  hideFallbackImage?: boolean

  /** LUT-style color grade over the whole canvas (`log` ≈ log→display, `aegis` for intro crystal). */
  colorGrade?: SculptureColorGrade
  /** 0 – 1 mix strength for colorGrade. */
  colorGradeStrength?: number

  /** Hero height. Default fills the screen exactly, no scrolling. */
  height?: string
  /** Giant faint word behind the sculpture. Empty to hide. */
  backdropText?: string
  showCredit?: boolean
  className?: string
  style?: React.CSSProperties
}

const DEFAULTS = {
  src: "https://cdn.21st.dev/assets/mirror/ae/ae8c3de9003460e59182e950ccd345f68f27f9d0e4808b64c92c962a4eca7120.webp",
  darkSrc: "https://cdn.21st.dev/assets/mirror/a1/a1fa387b6e417b26a25f317559c87cce4d241c1052c52a2b3bc2966b2aaf9b65.webp",
  mobileSrc: "https://cdn.21st.dev/assets/mirror/b0/b0c8d8e5d64b8cec906a3b390e3dc7c9a5af08334bf0632873c601782cb4bc46.webp",
  mobileDarkSrc: "https://cdn.21st.dev/assets/mirror/9a/9a82cb59be1bfde59855b79d7a565e487155a89f4d52eac74dcc10e267b2b6d1.webp",
  imageAlt: "Abstract sculpture of interwoven metallic filaments and particles",
  imageBackground: "#EAE9E7",
  brand: "Forma®",
  navLinks: [
    { label: "Work", href: "#" },
    { label: "Studio", href: "#" },
    { label: "Approach", href: "#" },
    { label: "Journal", href: "#" },
  ],
  navCta: { label: "Contact", href: "#" },
  eyebrow: "Independent studio — Est. 2019",
  headline: "Form that\nanswers back.",
  headlineAccent: "answers back.",
  body: "We shape products, identities and spaces with the precision of engineering and the patience of craft — work that holds up under attention.",
  primaryCta: { label: "Start a project", href: "#" },
  secondaryCta: { label: "Selected work", href: "#" },
  hint: "Move across the form",
  hintTouch: "Touch the form",
  background: "#EBE9E5",
  darkBackground: "#111110",
  textColor: "#151514",
  accentColor: "#151514",
  headingFont: "'Geist', 'Helvetica Neue', Arial, sans-serif",
  accentFont: "'Instrument Serif', 'Times New Roman', serif",
  bodyFont: "'Geist', 'Helvetica Neue', Arial, sans-serif",
}

/* ────────────────────────────────────────────────────────────────────
   Layout
   ──────────────────────────────────────────────────────────────────── */

/** The sculpture sits centred in the band between the nav and the copy,
 *  as wide as the hero (it may bleed off the sides on small screens). */
function computeRect(
  w: number,
  h: number,
  aspect: number,
  band: { top: number; bottom: number },
  p: { scale: number; mobileScale: number; x: number; y: number }
): Rect {
  const bandH = Math.max(80, band.bottom - band.top)
  let rw: number
  let maxH: number
  if (w >= 1024) {
    rw = w * 1.02 * p.scale
    maxH = bandH * 1.1 * p.scale
  } else if (w >= 640) {
    rw = w * 1.3 * p.scale
    maxH = bandH * 1.15 * p.scale
  } else if (aspect < 1.3) {
    // portrait image for phones: fills the width, may tuck under the headline
    rw = w * 1.0 * p.mobileScale
    maxH = bandH * 1.0 * p.mobileScale
  } else {
    rw = w * 1.9 * p.mobileScale
    maxH = bandH * 1.2 * p.mobileScale
  }
  if (rw / aspect > maxH) rw = maxH * aspect
  const rh = rw / aspect
  const cx = w * (0.5 + p.x / 100)
  const cy = (band.top + band.bottom) / 2 + h * (p.y / 100)
  return { x: cx - rw / 2, y: cy - rh / 2, w: rw, h: rh }
}

/** Centred sculpture filling most of the viewport (intro / stage). */
function computeRectStage(
  w: number,
  h: number,
  aspect: number,
  p: { scale: number; mobileScale: number; x: number; y: number }
) {
  const mob = w < 640
  const scale = mob ? p.mobileScale : p.scale
  const maxH = h * 0.82 * scale
  const maxW = w * 0.72 * scale
  let rh = maxH
  let rw = rh * aspect
  if (rw > maxW) {
    rw = maxW
    rh = rw / aspect
  }
  const cx = w * (0.5 + p.x / 100)
  const cy = h * (0.5 + p.y / 100)
  return { x: cx - rw / 2, y: cy - rh / 2, w: rw, h: rh }
}

/* ────────────────────────────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────────────────────────────── */

const CSS = `
.sh-root{position:relative;width:100%;height:var(--sh-h);overflow:hidden;isolation:isolate;container-type:size;transition:background-color .6s ease,color .6s ease;
  background:var(--sh-bg);color:var(--sh-fg);font-family:var(--sh-body);-webkit-font-smoothing:antialiased;
  touch-action:pan-y;display:flex;flex-direction:column;box-sizing:border-box}
.sh-root *,.sh-root *::before,.sh-root *::after{box-sizing:border-box}
.sh-stage{position:absolute;inset:0;z-index:0;pointer-events:none}
.sh-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .5s ease}
.sh-fallback{position:absolute;display:block;max-width:none;user-select:none;-webkit-user-drag:none;transition:opacity .5s ease}
.sh-root[data-gl="on"] .sh-canvas{opacity:1}
.sh-root[data-gl="on"] .sh-fallback{opacity:0}
.sh-root[data-swap="1"] .sh-canvas{opacity:0;transition-duration:.25s}
.sh-root[data-swap="1"] .sh-fallback{opacity:0;transition-duration:.25s}
.sh-backdrop{position:absolute;left:50%;z-index:0;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;user-select:none;
  font-family:var(--sh-head);font-weight:600;letter-spacing:-.06em;line-height:.8;color:color-mix(in srgb,var(--sh-fg) 5%,transparent)}
.sh-nav{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:24px;
  padding:26px clamp(20px,3.2cqw,48px) 0}
.sh-brand{font-family:var(--sh-head);font-weight:600;font-size:17px;letter-spacing:-.02em;color:inherit;text-decoration:none}
.sh-links{display:flex;align-items:center;gap:clamp(18px,2.4cqw,36px);list-style:none;margin:0;padding:0}
.sh-link{color:inherit;text-decoration:none;font-size:13.5px;letter-spacing:-.005em;opacity:.72;transition:opacity .2s}
.sh-link:hover{opacity:1}
.sh-theme{display:inline-grid;place-items:center;width:34px;height:34px;padding:0;border-radius:50%;cursor:pointer;color:inherit;background:transparent;
  border:1px solid color-mix(in srgb,var(--sh-fg) 22%,transparent);transition:background .25s,color .25s}
.sh-theme:hover{background:var(--sh-fg);color:var(--sh-bg)}
.sh-theme:focus-visible{outline:2px solid var(--sh-fg);outline-offset:4px}
.sh-navcta{color:inherit;text-decoration:none;font-size:13.5px;padding:8px 14px;border:1px solid color-mix(in srgb,var(--sh-fg) 22%,transparent);
  border-radius:999px;transition:background .25s,color .25s}
.sh-navcta:hover{background:var(--sh-fg);color:var(--sh-bg)}
.sh-hint{position:absolute;z-index:1;transform:translate(-50%,0);display:flex;align-items:center;gap:10px;white-space:nowrap;
  font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.5;pointer-events:none;transition:opacity .8s ease}
.sh-hint::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;animation:sh-pulse 2.4s ease-in-out infinite}
.sh-root[data-touched="1"] .sh-hint{opacity:0}
@keyframes sh-pulse{0%,100%{transform:scale(.6);opacity:.45}50%{transform:scale(1);opacity:1}}
.sh-spacer{flex:1 1 auto;min-height:0}
.sh-content{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);align-items:end;
  gap:clamp(24px,4cqw,72px);padding:0 clamp(20px,3.2cqw,48px) clamp(28px,3.4cqw,52px)}
.sh-eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.62;margin:0 0 clamp(14px,1.6cqw,22px);
  display:flex;align-items:center;gap:12px}
.sh-eyebrow::before{content:"";width:28px;height:1px;background:currentColor;opacity:.7}
.sh-h1{font-family:var(--sh-head);font-weight:500;font-size:clamp(40px,min(6.6cqw,11.5cqh),124px);line-height:.92;letter-spacing:-.045em;margin:0;
  text-wrap:balance}
.sh-h1 .sh-line{display:block}
.sh-accent{font-family:var(--sh-accent);font-style:italic;font-weight:400;letter-spacing:-.02em;color:var(--sh-acc)}
.sh-aside{max-width:400px;justify-self:end;padding-bottom:.6em}
.sh-body{font-size:clamp(15px,1.1cqw,17px);line-height:1.5;letter-spacing:-.01em;margin:0 0 26px;opacity:.78;text-wrap:pretty}
.sh-ctas{display:flex;flex-wrap:wrap;align-items:center;gap:22px}
.sh-btn{display:inline-flex;align-items:center;gap:10px;height:46px;padding:0 22px;border-radius:999px;background:var(--sh-fg);
  color:var(--sh-bg);text-decoration:none;font-size:14.5px;font-weight:500;letter-spacing:-.01em;transition:transform .3s cubic-bezier(.2,.7,.2,1),opacity .2s}
.sh-btn:hover{transform:translateY(-1px)}
.sh-btn svg,.sh-txt svg{transition:transform .3s cubic-bezier(.2,.7,.2,1)}
.sh-btn:hover svg,.sh-txt:hover svg{transform:translateX(3px)}
.sh-txt{display:inline-flex;align-items:center;gap:8px;color:inherit;text-decoration:none;font-size:14.5px;font-weight:500;
  letter-spacing:-.01em;padding:4px 0;border-bottom:1px solid color-mix(in srgb,var(--sh-fg) 30%,transparent)}
.sh-root a:focus-visible{outline:2px solid var(--sh-fg);outline-offset:4px}
.sh-credit{position:absolute;z-index:2;right:clamp(20px,3.2cqw,48px);bottom:10px;font-size:10px;letter-spacing:.06em;
  color:inherit;opacity:.38;text-decoration:none}
.sh-credit:hover{opacity:.8}
@container (max-width:1023px){
  .sh-content{grid-template-columns:1fr;gap:28px}
  .sh-aside{justify-self:start;max-width:520px;padding-bottom:0}
  .sh-h1{font-size:clamp(40px,min(9.5cqw,9cqh),96px)}
}
@container (max-width:767px){
  .sh-links li:not(.sh-keep){display:none}
}
@container (max-width:639px){
  .sh-nav{padding-top:20px}
  .sh-h1{font-size:clamp(36px,min(12.5cqw,7.2cqh),60px);line-height:.94}
  .sh-body{font-size:15px;margin-bottom:20px}
  .sh-eyebrow{font-size:11px}
  .sh-ctas{gap:18px}
  .sh-btn{height:48px}
  .sh-content{padding-bottom:40px}
  .sh-credit{right:auto;left:50%;transform:translateX(-50%)}
}
@media (prefers-reduced-motion:reduce){
  .sh-hint::before{animation:none}
  .sh-canvas,.sh-fallback,.sh-btn,.sh-btn svg,.sh-txt svg{transition:none}
}
`

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
    <path d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.2 3.2l1.1 1.1M11.7 11.7l1.1 1.1M3.2 12.8l1.1-1.1M11.7 4.3l1.1-1.1"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
)

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13.6 10.1A5.9 5.9 0 0 1 5.9 2.4a5.9 5.9 0 1 0 7.7 7.7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
)

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/* ────────────────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────────────────── */

let fontsInjected = false
function injectFonts() {
  if (fontsInjected || typeof document === "undefined") return
  fontsInjected = true
  const id = "sh-fonts"
  if (document.getElementById(id)) return
  const l = document.createElement("link")
  l.id = id
  l.rel = "stylesheet"
  l.href =
    "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap"
  document.head.appendChild(l)
}

function renderHeadline(text: string, accent: string) {
  const lines = text.split("\n")
  return lines.map((line, li) => {
    let content: React.ReactNode = line
    const a = accent && accent.trim()
    if (a) {
      const idx = line.indexOf(a)
      if (idx >= 0) {
        content = (
          <>
            {line.slice(0, idx)}
            <span className="sh-accent">{a}</span>
            {line.slice(idx + a.length)}
          </>
        )
      }
    }
    return (
      <span className="sh-line" key={li}>
        {content}
      </span>
    )
  })
}

export default function SculptureHero(props: SculptureHeroProps) {
  const {
    src = DEFAULTS.src,
    darkSrc = DEFAULTS.darkSrc,
    mobileSrc = DEFAULTS.mobileSrc,
    mobileDarkSrc = DEFAULTS.mobileDarkSrc,
    imageAlt = DEFAULTS.imageAlt,
    imageBackground,
    brand = DEFAULTS.brand,
    navLinks = DEFAULTS.navLinks,
    navCta = DEFAULTS.navCta,
    showNav = true,
    eyebrow = DEFAULTS.eyebrow,
    headline = DEFAULTS.headline,
    headlineAccent = DEFAULTS.headlineAccent,
    body = DEFAULTS.body,
    primaryCta = DEFAULTS.primaryCta,
    secondaryCta = DEFAULTS.secondaryCta,
    hint = DEFAULTS.hint,
    hintTouch = DEFAULTS.hintTouch,
    background: lightBackground = DEFAULTS.background,
    darkBackground = DEFAULTS.darkBackground,
    theme = "light",
    themeToggle = true,
    textColor,
    accentColor,
    headingFont = DEFAULTS.headingFont,
    accentFont = DEFAULTS.accentFont,
    bodyFont = DEFAULTS.bodyFont,
    loadFonts = true,
    sculptureScale = 1,
    mobileSculptureScale = 1,
    sculptureX = 0,
    sculptureY = 0,
    interactive = true,
    strength = 1,
    radius = 220,
    particleDensity = 1,
    particleSpread = 1,
    dotSize = 1,
    turbulence = 1,
    liquid = 1,
    streaks = true,
    restStyle = "image",
    returnSpeed = 1,
    ambient = false,
    ambientIntensity = 1,
    speed = 1,
    vortexIntensity = 1.2,
    intro = false,
    stabilizeOnPointer = false,
    stabilizeOnHold = false,
    getHoldOrder,
    holdUnifyExponent = 2.35,
    holdOrderCap = 1,
    colorGrade = "none",
    colorGradeStrength = 0,
    layoutMode = "editorial",
    hideFallbackImage = false,
    height = "100svh",
    backdropText = "forma",
    showCredit = true,
    className,
    style,
  } = props

  const isStage = layoutMode === "stage"

  const rootRef = React.useRef<HTMLElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)
  const hintRef = React.useRef<HTMLDivElement>(null)
  const navRef = React.useRef<HTMLElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const backdropRef = React.useRef<HTMLDivElement>(null)
  const engineRef = React.useRef<LiquidEngine | null>(null)
  const aspectRef = React.useRef(1983 / 793)
  const [isTouch, setIsTouch] = React.useState(false)

  const layout = React.useRef({ scale: sculptureScale, mobileScale: mobileSculptureScale, x: sculptureX, y: sculptureY })
  layout.current = {
    scale: clamp(sculptureScale, 0.3, 3),
    mobileScale: clamp(mobileSculptureScale, 0.3, 3),
    x: sculptureX,
    y: sculptureY,
  }

  const [mode, setMode] = React.useState<"light" | "dark">(theme)
  React.useEffect(() => setMode(theme), [theme])
  const background = mode === "dark" ? darkBackground : lightBackground
  const bgRgb = React.useMemo(() => hexToRgb(background, [0.92, 0.91, 0.9]), [background])
  // text follows the background unless set: light on dark grounds, dark on light ones
  const darkBg = bgRgb[0] * 0.2126 + bgRgb[1] * 0.7152 + bgRgb[2] * 0.0722 < 0.45
  const fg = textColor || (darkBg ? "#F1EFEA" : DEFAULTS.textColor)
  const acc = accentColor || fg
  const imgBgRgb = React.useMemo(
    () => (imageBackground ? hexToRgb(imageBackground, [0.918, 0.914, 0.906]) : null),
    [imageBackground]
  )
  const [isMobile, setIsMobile] = React.useState(false)
  const mobileRef = React.useRef(false)
  // pick the image for the current theme and layout, falling back sensibly
  const activeSrc =
    (isMobile && mode === "dark" && (mobileDarkSrc || darkSrc)) ||
    (isMobile && mode === "light" && mobileSrc) ||
    (mode === "dark" && darkSrc) ||
    src

  const engineOpts = (rm: boolean): EngineOptions => ({
    interactive,
    strength: clamp(strength, 0, 2),
    radius: clamp(radius, 40, 600),
    density: clamp(particleDensity, 0.15, 2),
    dotSize: clamp(dotSize, 0.2, 3),
    spread: clamp(particleSpread, 0, 2),
    turbulence: clamp(turbulence, 0, 2),
    liquid: clamp(liquid, 0, 2),
    streaks,
    restStyle,
    returnSpeed: clamp(returnSpeed, 0, 8),
    holdUnifyExponent: clamp(holdUnifyExponent, 1, 7),
    holdOrderCap: clamp(holdOrderCap, 0, 1),
    colorGradePreset: colorGradePresetId(colorGrade),
    colorGradeStrength: clamp(colorGradeStrength, 0, 1),
    ambient,
    ambientIntensity: clamp(ambientIntensity, 0, 2),
    speed: clamp(speed, 0.25, 3),
    vortexIntensity: clamp(vortexIntensity, 0, 2.5),
    intro,
    reducedMotion: rm,
    bg: bgRgb,
    imgBg: imgBgRgb,
    stabilizeOnPointer,
    stabilizeOnHold,
    getHoldOrder: getHoldOrder ?? null,
  })
  const optsRef = React.useRef(engineOpts)
  optsRef.current = engineOpts
  const getHoldOrderRef = React.useRef(getHoldOrder)
  getHoldOrderRef.current = getHoldOrder
  ;(optsRef.current as unknown as EngineOptions).getHoldOrder = () => getHoldOrderRef.current?.() ?? 0
  const layoutModeRef = React.useRef(layoutMode)
  layoutModeRef.current = layoutMode

  React.useEffect(() => {
    if (loadFonts) injectFonts()
  }, [loadFonts])

  const relayout = React.useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const w = root.clientWidth
    const h = root.clientHeight
    const mob = w < 640
    if (mob !== mobileRef.current) {
      mobileRef.current = mob
      setIsMobile(mob)
    }
    const stageLayout = layoutModeRef.current === "stage"
    const nav = navRef.current
    const content = contentRef.current
    const band = stageLayout
      ? { top: 0, bottom: h }
      : {
          top: nav ? nav.offsetTop + nav.offsetHeight + 8 : 16,
          bottom: content ? content.offsetTop - 8 : h,
        }
    // a portrait sculpture on phones dissolves into the top of the copy
    if (!stageLayout && mob && aspectRef.current < 1.3 && content) band.bottom += content.offsetHeight * 0.3
    const rect = stageLayout
      ? computeRectStage(w, h, aspectRef.current, layout.current)
      : computeRect(w, h, aspectRef.current, band, layout.current)
    const bd = backdropRef.current
    if (bd) {
      const chars = Math.max(1, (bd.textContent || "").length)
      bd.style.fontSize = Math.min((band.bottom - band.top) * 0.95, (w * 0.92) / (chars * 0.56)) + "px"
      bd.style.top = (band.top + band.bottom) / 2 + "px"
    }
    const img = imgRef.current
    if (img) {
      img.style.left = rect.x + "px"
      img.style.top = rect.y + "px"
      img.style.width = rect.w + "px"
      img.style.height = rect.h + "px"
    }
    const hintEl = hintRef.current
    if (hintEl) {
      // the portrait phone sculpture runs into the copy: no room for the cue there
      hintEl.style.display = mob && aspectRef.current < 1.3 ? "none" : ""
      hintEl.style.left = clamp(rect.x + rect.w / 2, 80, w - 80) + "px"
      hintEl.style.top = Math.min(rect.y + rect.h * 0.95, band.bottom - 20) + "px"
    }
    engineRef.current?.resize(w, h, rect)
  }, [])

  // engine lifecycle (re-created only when the image changes)
  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage) return
    // a fresh canvas per engine: a released WebGL context can never be reused
    const canvas = document.createElement("canvas")
    canvas.className = "sh-canvas"
    stage.appendChild(canvas)
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)")
    setIsTouch(coarse.matches)
    let engine: LiquidEngine | null = null
    const fail = () => {
      root.dataset.gl = "off"
    }
    try {
      engine = new LiquidEngine(canvas, optsRef.current(mq.matches), fail)
      engineRef.current = engine
    } catch {
      fail()
    }

    const ro = new ResizeObserver(() => relayout())
    ro.observe(root)
    // the band moves when fonts load or the copy reflows
    if (navRef.current) ro.observe(navRef.current)
    if (contentRef.current) ro.observe(contentRef.current)
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) engine?.setVisible(e.isIntersecting && !document.hidden)
    })
    io.observe(root)
    const onVis = () => engine?.setVisible(!document.hidden)
    document.addEventListener("visibilitychange", onVis)
    const onMq = () => engine?.setOptions({ reducedMotion: mq.matches })
    mq.addEventListener?.("change", onMq)

    const pos = (e: PointerEvent) => {
      const b = root.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top] as const
    }
    let touched = false
    const markTouched = () => {
      if (!touched) {
        touched = true
        root.dataset.touched = "1"
      }
    }
    const onMove = (e: PointerEvent) => {
      const [x, y] = pos(e)
      const touch = e.pointerType === "touch"
      if (touch && e.buttons === 0 && e.pressure === 0) return
      engine?.pointer("move", x, y, touch)
      markTouched()
    }
    const onDown = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("down", x, y, e.pointerType === "touch")
      markTouched()
    }
    const onUp = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("up", x, y, e.pointerType === "touch")
    }
    const onLeave = (e: PointerEvent) => {
      const [x, y] = pos(e)
      engine?.pointer("leave", x, y, e.pointerType === "touch")
    }
    root.addEventListener("pointermove", onMove, { passive: true })
    root.addEventListener("pointerdown", onDown, { passive: true })
    root.addEventListener("pointerup", onUp, { passive: true })
    root.addEventListener("pointercancel", onUp, { passive: true })
    root.addEventListener("pointerleave", onLeave, { passive: true })

    return () => {
      ro.disconnect()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      mq.removeEventListener?.("change", onMq)
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerdown", onDown)
      root.removeEventListener("pointerup", onUp)
      root.removeEventListener("pointercancel", onUp)
      root.removeEventListener("pointerleave", onLeave)
      engine?.destroy()
      engineRef.current = null
      canvas.remove()
      delete root.dataset.gl
    }
  }, [relayout])

  // (re)load the sculpture whenever the theme or layout asks for another image;
  // the canvas dips out while the static image covers the swap
  React.useEffect(() => {
    const root = rootRef.current
    const engine = engineRef.current
    if (!root) return
    let cancelled = false
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.decoding = "async"
    const swapping = root.dataset.gl === "on"
    if (swapping) root.dataset.swap = "1"
    image.onload = () => {
      if (cancelled) return
      aspectRef.current = image.naturalWidth / image.naturalHeight || aspectRef.current
      relayout()
      if (engine && root.dataset.gl !== "off") {
        try {
          engine.onFirstFrame = () => {
            if (cancelled) return
            root.dataset.gl = "on"
            delete root.dataset.swap
          }
          engine.setImage(image)
          relayout()
        } catch {
          root.dataset.gl = "off"
        }
      } else delete root.dataset.swap
    }
    image.onerror = () => {
      delete root.dataset.swap
    }
    // let the fade-out start before the GPU upload
    const t = window.setTimeout(() => (image.src = activeSrc), swapping ? 280 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
      image.onload = null
      image.onerror = null
    }
  }, [activeSrc, relayout])

  // live option updates without re-creating the engine
  React.useEffect(() => {
    const e = engineRef.current
    if (!e) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    e.setOptions(optsRef.current(rm))
  }, [
    interactive,
    strength,
    radius,
    particleDensity,
    dotSize,
    particleSpread,
    turbulence,
    liquid,
    streaks,
    restStyle,
    returnSpeed,
    holdUnifyExponent,
    holdOrderCap,
    colorGrade,
    colorGradeStrength,
    ambient,
    ambientIntensity,
    speed,
    vortexIntensity,
    intro,
    stabilizeOnPointer,
    stabilizeOnHold,
    getHoldOrder,
    bgRgb,
    imgBgRgb,
  ])

  React.useEffect(() => {
    relayout()
  }, [sculptureScale, mobileSculptureScale, sculptureX, sculptureY, relayout])

  const vars = {
    "--sh-bg": background,
    "--sh-fg": fg,
    "--sh-acc": acc,
    "--sh-head": headingFont,
    "--sh-accent": accentFont,
    "--sh-body": bodyFont,
    "--sh-h": height,
  } as React.CSSProperties

  const hintText = isTouch ? hintTouch : hint

  return (
    <section ref={rootRef} className={"sh-root" + (className ? " " + className : "")} style={{ ...vars, ...style }}>
      <style>{CSS}</style>
      {backdropText ? (
        <div ref={backdropRef} className="sh-backdrop" aria-hidden="true">
          {backdropText}
        </div>
      ) : null}
      <div ref={stageRef} className="sh-stage" aria-hidden="true">
        <img
          ref={imgRef}
          className="sh-fallback"
          src={activeSrc}
          alt=""
          crossOrigin="anonymous"
          draggable={false}
          style={hideFallbackImage ? { opacity: 0, visibility: "hidden" } : undefined}
        />
      </div>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{imageAlt}</span>

      {showNav && (
        <nav ref={navRef} className="sh-nav" aria-label="Primary">
          <a className="sh-brand" href="#">
            {brand}
          </a>
          <ul className="sh-links">
            {navLinks.map((l, i) => (
              <li key={i}>
                <a className="sh-link" href={l.href}>
                  {l.label}
                </a>
              </li>
            ))}
            {themeToggle && (
              <li className="sh-keep">
                <button
                  type="button"
                  className="sh-theme"
                  aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                  onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
                >
                  {mode === "dark" ? <SunIcon /> : <MoonIcon />}
                </button>
              </li>
            )}
            {navCta && navCta.label && (
              <li className="sh-keep">
                <a className="sh-navcta" href={navCta.href}>
                  {navCta.label}
                </a>
              </li>
            )}
          </ul>
        </nav>
      )}

      {!isStage && interactive && hintText ? (
        <div ref={hintRef} className="sh-hint" aria-hidden="true">
          {hintText}
        </div>
      ) : null}

      {!isStage ? <div className="sh-spacer" /> : null}

      {!isStage ? (
        <div ref={contentRef} className="sh-content">
          <div>
            {eyebrow ? <p className="sh-eyebrow">{eyebrow}</p> : null}
            <h1 className="sh-h1">{renderHeadline(headline, headlineAccent)}</h1>
          </div>
          <div className="sh-aside">
            {body ? <p className="sh-body">{body}</p> : null}
            <div className="sh-ctas">
              {primaryCta && primaryCta.label ? (
                <a className="sh-btn" href={primaryCta.href}>
                  {primaryCta.label}
                  <Arrow />
                </a>
              ) : null}
              {secondaryCta && secondaryCta.label ? (
                <a className="sh-txt" href={secondaryCta.href}>
                  {secondaryCta.label}
                  <Arrow />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showCredit && !isStage && (
        <a className="sh-credit" href="https://guglielmogiannattasio.it" target="_blank" rel="noopener">
          by guglielmogiannattasio.it
        </a>
      )}
    </section>
  )
}