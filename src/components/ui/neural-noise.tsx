import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { cn } from "@/lib/utils";
import { holdChapterMix, type HoldState } from "@/features/intro/useHoldProgress";
import type { IntroPhase } from "@/features/intro/useIntroMachine";

export type NeuralNoiseProps = {
  color?: [number, number, number];
  /** Up to 4 overlay tints (extra neuron fields on hold). */
  overlayColors?: [number, number, number][];
  /** @deprecated use overlayColors[0] */
  color2?: [number, number, number];
  /** 0–1 reveals overlay neuron fields (static, or cap when `hold` is set). */
  overlayMix?: number;
  /** 0–1 lowers noise threshold on the base field only. */
  densityBoost?: number;
  /** Intro: drive overlay/density from hold progress × these caps. */
  hold?: MutableRefObject<HoldState>;
  phase?: IntroPhase;
  overlayMixMax?: number;
  densityBoostMax?: number;
  lowPower?: boolean;
  opacity?: number;
  speed?: number;
  className?: string;
};

type UniformMap = Record<string, WebGLUniformLocation | null>;

export function NeuralNoise({
  color = [0.9, 0.2, 0.4],
  overlayColors,
  color2 = color,
  overlayMix = 0,
  densityBoost = 0,
  hold,
  phase = "entry",
  overlayMixMax,
  densityBoostMax,
  lowPower = false,
  opacity = 0.95,
  speed = 0.001,
  className,
}: NeuralNoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const uniformsRef = useRef<UniformMap | null>(null);
  const rafRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0, tX: 0, tY: 0 });
  const holdRef = useRef(hold);
  const phaseRef = useRef(phase);
  const overlayCapRef = useRef(overlayMixMax ?? overlayMix);
  const densityCapRef = useRef(densityBoostMax ?? densityBoost);
  const staticOverlayRef = useRef(overlayMix);
  const staticDensityRef = useRef(densityBoost);
  holdRef.current = hold;
  phaseRef.current = phase;
  overlayCapRef.current = overlayMixMax ?? overlayMix;
  densityCapRef.current = densityBoostMax ?? densityBoost;
  staticOverlayRef.current = overlayMix;
  staticDensityRef.current = densityBoost;
  const layers = useMemo(
    () =>
      overlayColors && overlayColors.length >= 4
        ? overlayColors
        : [color2, color2, color2, color2],
    [overlayColors, color2],
  );

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const pointer = pointerRef.current;
    const gl = initShader(canvasEl);
    if (!gl) return;
    glRef.current = gl;

    const cleanupEvents = setupEvents(pointer);
    resizeCanvas(canvasEl, gl, uniformsRef.current, lowPower);

    const resizeListener = () => resizeCanvas(canvasEl, gl, uniformsRef.current, lowPower);
    window.addEventListener("resize", resizeListener);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", resizeListener);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, lowPower ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);

    if (uniformsRef.current) {
      gl.uniform3f(uniformsRef.current.u_color, color[0], color[1], color[2]);
      gl.uniform3f(uniformsRef.current.u_color2, layers[0][0], layers[0][1], layers[0][2]);
      gl.uniform3f(uniformsRef.current.u_color3, layers[1][0], layers[1][1], layers[1][2]);
      gl.uniform3f(uniformsRef.current.u_color4, layers[2][0], layers[2][1], layers[2][2]);
      gl.uniform3f(uniformsRef.current.u_color5, layers[3][0], layers[3][1], layers[3][2]);
      gl.uniform1f(uniformsRef.current.u_speed, speed);
    }

    const render = () => {
      const uniforms = uniformsRef.current;
      const glCtx = glRef.current;
      if (!glCtx || !uniforms) return;
      pointer.x += (pointer.tX - pointer.x) * 0.2;
      pointer.y += (pointer.tY - pointer.y) * 0.2;
      const h = holdRef.current;
      const progress = h ? holdChapterMix(h.current, phaseRef.current) : 0;
      const overlay =
        h != null
          ? progress * overlayCapRef.current
          : staticOverlayRef.current;
      const density =
        h != null
          ? Math.max(lowPower ? 0.38 : 0.28, progress * densityCapRef.current)
          : staticDensityRef.current;
      glCtx.uniform1f(uniforms.u_overlay_mix, overlay);
      glCtx.uniform1f(uniforms.u_density_boost, density);
      glCtx.uniform1f(uniforms.u_time, performance.now());
      const { w, h: vh, ox, oy } = viewportSize();
      glCtx.uniform2f(
        uniforms.u_pointer_position,
        (pointer.x - ox) / w,
        1 - (pointer.y - oy) / vh,
      );
      glCtx.clearColor(0, 0, 0, 0);
      glCtx.clear(glCtx.COLOR_BUFFER_BIT);
      glCtx.drawArrays(glCtx.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resizeListener);
      vv?.removeEventListener("resize", resizeListener);
      cleanupEvents();
      glRef.current = null;
      uniformsRef.current = null;
    };

    function initShader(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
      const vsSource = `
      precision mediump float;
      varying vec2 vUv;
      attribute vec2 a_position;
      void main() {
        vUv = 0.5 * (a_position + 1.0);
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
      const fsSource = buildNeuralFragmentShader(lowPower);

      const context =
        canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
      if (!context || !(context instanceof WebGLRenderingContext)) {
        console.error("WebGL not supported");
        return null;
      }

      const vertexShader = createShader(context, vsSource, context.VERTEX_SHADER);
      const fragmentShader = createShader(context, fsSource, context.FRAGMENT_SHADER);
      if (!vertexShader || !fragmentShader) return null;

      const shaderProgram = createProgram(context, vertexShader, fragmentShader);
      if (!shaderProgram) return null;

      uniformsRef.current = getUniforms(context, shaderProgram);
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const vertexBuffer = context.createBuffer();
      context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
      context.bufferData(context.ARRAY_BUFFER, vertices, context.STATIC_DRAW);
      context.useProgram(shaderProgram);
      const positionLocation = context.getAttribLocation(shaderProgram, "a_position");
      context.enableVertexAttribArray(positionLocation);
      context.vertexAttribPointer(positionLocation, 2, context.FLOAT, false, 0, 0);
      return context;
    }
  }, [color, layers, speed, lowPower]);

  useEffect(() => {
    const gl = glRef.current;
    const uniforms = uniformsRef.current;
    if (!gl || !uniforms?.u_color || !uniforms?.u_speed) return;
    gl.uniform3f(uniforms.u_color, color[0], color[1], color[2]);
    gl.uniform3f(uniforms.u_color2, layers[0][0], layers[0][1], layers[0][2]);
    gl.uniform3f(uniforms.u_color3, layers[1][0], layers[1][1], layers[1][2]);
    gl.uniform3f(uniforms.u_color4, layers[2][0], layers[2][1], layers[2][2]);
    gl.uniform3f(uniforms.u_color5, layers[3][0], layers[3][1], layers[3][2]);
    gl.uniform1f(uniforms.u_overlay_mix, overlayMix);
    gl.uniform1f(uniforms.u_density_boost, densityBoost);
    gl.uniform1f(uniforms.u_speed, speed);
  }, [color, layers, overlayMix, densityBoost, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      style={{ opacity }}
    />
  );
}

function buildNeuralFragmentShader(lite: boolean): string {
  const octaves = lite ? 13 : 15;
  const [cut1, cut2, cut3, cut4] = lite ? [0.52, 0.5, 0.51, 0.49] : [0.58, 0.56, 0.57, 0.55];

  return `
      precision mediump float;
      varying vec2 vUv;
      uniform float u_time;
      uniform float u_ratio;
      uniform vec2 u_pointer_position;
      uniform vec3 u_color;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      uniform vec3 u_color4;
      uniform vec3 u_color5;
      uniform float u_overlay_mix;
      uniform float u_density_boost;
      uniform float u_speed;
      vec2 rotate(vec2 uv, float th) {
        return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
      }
      float branchAmp(float raw) {
        float n = 1.2 * pow(raw, 3.0);
        n += pow(n, 10.0);
        return n;
      }
      float neuro_shape(vec2 uv, float t, float p) {
        vec2 sine_acc = vec2(0.0);
        vec2 res = vec2(0.0);
        float scale = 8.0;
        for (int j = 0; j < ${octaves}; j++) {
          uv = rotate(uv, 1.0);
          sine_acc = rotate(sine_acc, 1.0);
          vec2 layer = uv * scale + float(j) + sine_acc - t;
          sine_acc += sin(layer) + 2.4 * p;
          res += (0.5 + 0.5 * cos(layer)) / scale;
          scale *= 1.2;
        }
        return res.x + res.y;
      }
      float layerAmp(vec2 uv, float t, float p, float cut, float vign, float gate) {
        float raw = neuro_shape(uv, t, p);
        return max(0.0, branchAmp(raw) - cut) * vign * gate;
      }
      void main() {
        vec2 uv = 0.5 * vUv;
        uv.x *= u_ratio;
        vec2 pointer = vUv - u_pointer_position;
        pointer.x *= u_ratio;
        float p = clamp(length(pointer), 0.0, 1.0);
        p = 0.5 * pow(1.0 - p, 2.0);
        float t = u_speed * u_time;
        float vign = 1.0 - length(vUv - 0.5);
        float rawA = neuro_shape(uv, t, p);
        float ampA = max(0.0, branchAmp(rawA) - (0.46 - u_density_boost * 0.22));
        ampA *= vign;
        float mixAll = clamp(u_overlay_mix, 0.0, 1.0);
        float a1 = layerAmp(uv * 1.12 + vec2(0.31, -0.17), t + 420.0, p * 0.45, ${cut1}, vign, smoothstep(0.0, 0.22, mixAll));
        float a2 = layerAmp(uv * 0.94 + vec2(-0.24, 0.39), t + 880.0, p * 0.38, ${cut2}, vign, smoothstep(0.12, 0.38, mixAll));
        float a3 = layerAmp(uv * 1.18 + vec2(0.08, 0.52), t + 1260.0, p * 0.42, ${cut3}, vign, smoothstep(0.24, 0.52, mixAll));
        float a4 = layerAmp(uv * 0.88 + vec2(-0.41, -0.28), t + 1680.0, p * 0.36, ${cut4}, vign, smoothstep(0.36, 0.68, mixAll));
        vec3 col = u_color * ampA;
        col += u_color2 * a1 + u_color3 * a2 + u_color4 * a3 + u_color5 * a4;
        float alpha = max(ampA, max(max(a1, a2), max(a3, a4)));
        gl_FragColor = vec4(col, alpha);
      }
    `;
}

function viewportSize() {
  const vv = window.visualViewport;
  return {
    w: Math.max(1, vv?.width ?? window.innerWidth),
    h: Math.max(1, vv?.height ?? window.innerHeight),
    ox: vv?.offsetLeft ?? 0,
    oy: vv?.offsetTop ?? 0,
  };
}

function createShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram): UniformMap {
  const uniforms: UniformMap = {};
  const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < uniformCount; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return uniforms;
}

function resizeCanvas(
  canvasEl: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  uniforms: UniformMap | null,
  lowPower = false,
) {
  const { w, h } = viewportSize();
  const devicePixelRatio = Math.min(window.devicePixelRatio, lowPower ? 1.35 : 2);
  canvasEl.width = Math.max(1, Math.floor(w * devicePixelRatio));
  canvasEl.height = Math.max(1, Math.floor(h * devicePixelRatio));
  if (uniforms?.u_ratio) {
    gl.uniform1f(uniforms.u_ratio, canvasEl.width / canvasEl.height);
  }
  gl.viewport(0, 0, canvasEl.width, canvasEl.height);
}

function setupEvents(pointer: { tX: number; tY: number }) {
  const updateMousePosition = (x: number, y: number) => {
    pointer.tX = x;
    pointer.tY = y;
  };
  const pointermove = (e: PointerEvent) => updateMousePosition(e.clientX, e.clientY);
  const touchmove = (e: TouchEvent) => {
    if (e.targetTouches[0]) {
      updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    }
  };
  const touchstart = (e: TouchEvent) => {
    if (e.targetTouches[0]) {
      updateMousePosition(e.targetTouches[0].clientX, e.targetTouches[0].clientY);
    }
  };
  const click = (e: MouseEvent) => updateMousePosition(e.clientX, e.clientY);
  window.addEventListener("pointermove", pointermove, { passive: true });
  window.addEventListener("touchmove", touchmove, { passive: true });
  window.addEventListener("touchstart", touchstart, { passive: true });
  window.addEventListener("click", click);
  return () => {
    window.removeEventListener("pointermove", pointermove);
    window.removeEventListener("touchmove", touchmove);
    window.removeEventListener("touchstart", touchstart);
    window.removeEventListener("click", click);
  };
}
