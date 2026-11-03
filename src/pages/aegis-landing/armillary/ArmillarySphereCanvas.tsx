import { useEffect, useRef } from "react";
import {
  ARMILLARY_TEXTURES,
  AUTO_CAM_SPEED,
  CAM_DIST_MAX,
  CAM_DIST_MIN,
  DEFAULT_RING_EULERS,
  DEFAULT_SPIN,
  DEFAULT_SPHERE_OFFSET,
  DEG,
  HOVER_AMPLITUDE,
  HOVER_SPEED,
  LANDING_CAM,
  LANDING_CORE_COLOR,
  LANDING_CORE_GLOW,
  RING_SPECS,
  SPHERE_Y_BASE,
  landingCamForAspect,
  type EulerDeg,
  type RingId,
} from "./armillaryConstants";
import { createArmillaryRenderer } from "./createArmillaryRenderer";
import { clamp, hexToRgb, mat4, smoothDamp } from "./armillaryMath";

/** WebGL host for the armillary. Camera initials are mount-only; pose/color/spin update in-place. */
export type ArmillarySphereCanvasProps = {
  className?: string;
  coreColor?: string;
  glow?: number;
  ringTargets?: Record<RingId, EulerDeg>;
  sphereTarget?: EulerDeg;
  spin?: Record<RingId, number>;
  autoCamera?: boolean;
  interactive?: boolean;
  /** Radians. Changing this remounts the renderer. */
  initialAzimuth?: number;
  /** Radians. Changing this remounts the renderer. */
  initialPolar?: number;
  /** Changing this remounts the renderer. */
  initialDistance?: number;
  /** Look-at. Changing this remounts the renderer — pass a stable tuple. */
  initialTarget?: [number, number, number];
  autoCameraSpeed?: number;
  /** Lower quality: no MSAA, two halo passes, DPR cap 1.5. */
  quality?: "high" | "low";
  /** Called once if WebGL or textures fail. Parent should keep a still underneath. */
  onError?: () => void;
  /** Called once after the first successful frame. */
  onReady?: () => void;
  /** When true, lerp camera target/distance from the wrapper aspect (landing hero). */
  adaptFraming?: boolean;
  /** Idle bob. Off for still hub poses. */
  hover?: boolean;
};

const DEFAULT_AZ = LANDING_CAM.az;
const DEFAULT_POL = LANDING_CAM.pol;
const DEFAULT_DIST = LANDING_CAM.dist;

export function ArmillarySphereCanvas({
  className,
  coreColor = LANDING_CORE_COLOR,
  glow = LANDING_CORE_GLOW,
  ringTargets = DEFAULT_RING_EULERS,
  sphereTarget = DEFAULT_SPHERE_OFFSET,
  spin = DEFAULT_SPIN,
  autoCamera = true,
  interactive = true,
  initialAzimuth = DEFAULT_AZ,
  initialPolar = DEFAULT_POL,
  initialDistance = DEFAULT_DIST,
  initialTarget,
  autoCameraSpeed = AUTO_CAM_SPEED,
  quality = "high",
  onError,
  onReady,
  adaptFraming = false,
  hover = true,
}: ArmillarySphereCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const propsRef = useRef({
    ringTargets,
    sphereTarget,
    spin,
    autoCamera,
    autoCameraSpeed,
    coreColor,
    glow,
    interactive,
    quality,
    adaptFraming,
    hover,
  });
  propsRef.current = {
    ringTargets,
    sphereTarget,
    spin,
    autoCamera,
    autoCameraSpeed,
    coreColor,
    glow,
    interactive,
    quality,
    adaptFraming,
    hover,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    let cancelled = false;
    let renderer: ReturnType<typeof createArmillaryRenderer> | null = null;
    let raf = 0;
    let running = false;
    let inView = true;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let onVisibility: (() => void) | null = null;
    const onPointerDownRef = { current: null as ((e: PointerEvent) => void) | null };
    const onPointerMoveRef = { current: null as ((e: PointerEvent) => void) | null };
    const onPointerUpRef = { current: null as ((e: PointerEvent) => void) | null };
    const onWheelRef = { current: null as ((e: WheelEvent) => void) | null };

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Texture introuvable : ${src}`));
        img.src = src;
      });

    const run = async () => {
      const low = propsRef.current.quality === "low";
      try {
        const [albedo, roughness, normal] = await Promise.all([
          loadImage(ARMILLARY_TEXTURES.albedo),
          loadImage(ARMILLARY_TEXTURES.roughness),
          loadImage(ARMILLARY_TEXTURES.normal),
        ]);
        if (cancelled) return;
        renderer = createArmillaryRenderer(
          canvas,
          { albedo, roughness, normal },
          { antialias: !low, haloCount: low ? 2 : 3 },
        );
      } catch (err) {
        console.error(err);
        onErrorRef.current?.();
        return;
      }
      if (cancelled) {
        renderer?.dispose();
        return;
      }

      const active = renderer;
      const state = {
        rot: {
          outer: { ...DEFAULT_RING_EULERS.outer },
          middle: { ...DEFAULT_RING_EULERS.middle },
          inner: { ...DEFAULT_RING_EULERS.inner },
        } as Record<RingId, EulerDeg>,
        sphere: { ...DEFAULT_SPHERE_OFFSET },
        spinAcc: { ...DEFAULT_SPIN },
      };

      const targetBase = initialTarget ?? LANDING_CAM.target;
      const cam = {
        az: initialAzimuth,
        pol: initialPolar,
        dist: initialDistance,
        target: [...targetBase] as number[],
      };

      let ringMats = RING_SPECS.map(() => mat4.euler(0, 0, 0));
      let corePos = [0, 0, 0];

      const ringEulerWithSpin = (id: RingId) => ({
        x: state.rot[id].x,
        y: state.rot[id].y + state.spinAcc[id],
        z: state.rot[id].z,
      });

      const recomputeTransforms = (hoverY: number) => {
        const lift = mat4.trans(state.sphere.x, SPHERE_Y_BASE + hoverY + state.sphere.y, state.sphere.z);
        let chain = lift;
        ringMats = RING_SPECS.map((ring) => {
          const e = ringEulerWithSpin(ring.id);
          chain = mat4.mul(chain, mat4.euler(e.x, e.y, e.z));
          return chain;
        });
        corePos = [state.sphere.x, SPHERE_Y_BASE + hoverY + state.sphere.y, state.sphere.z];
      };

      const camPosition = () => [
        cam.target[0] + cam.dist * Math.sin(cam.pol) * Math.sin(cam.az),
        cam.target[1] + cam.dist * Math.cos(cam.pol),
        cam.target[2] + cam.dist * Math.sin(cam.pol) * Math.cos(cam.az),
      ];

      const applyFraming = () => {
        if (!propsRef.current.adaptFraming) return;
        const aspect = root.clientWidth / Math.max(1, root.clientHeight);
        const framed = landingCamForAspect(aspect);
        cam.dist = framed.dist;
        cam.target[0] = framed.targetX;
      };

      const resize = () => {
        const cap = propsRef.current.quality === "low" || window.innerWidth < 1440 ? 1.5 : 2;
        const dpr = Math.min(window.devicePixelRatio || 1, cap);
        const w = Math.max(1, Math.floor(root.clientWidth * dpr));
        const h = Math.max(1, Math.floor(root.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) active.resize(w, h);
        applyFraming();
      };

      const pointers = new Map<number, [number, number]>();
      let pinchDist = 0;

      const onPointerDown = (e: PointerEvent) => {
        if (!propsRef.current.interactive) return;
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, [e.clientX, e.clientY]);
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          pinchDist = Math.hypot(a[0] - b[0], a[1] - b[1]);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!propsRef.current.interactive || !pointers.has(e.pointerId)) return;
        const prev = pointers.get(e.pointerId)!;
        if (pointers.size === 1) {
          cam.az -= (e.clientX - prev[0]) * 0.006;
          cam.pol = clamp(cam.pol - (e.clientY - prev[1]) * 0.006, 0.05, Math.PI - 0.05);
        }
        pointers.set(e.pointerId, [e.clientX, e.clientY]);
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (pinchDist) cam.dist = clamp(cam.dist * (pinchDist / d), CAM_DIST_MIN, CAM_DIST_MAX);
          pinchDist = d;
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        pointers.delete(e.pointerId);
        pinchDist = 0;
      };

      const onWheel = (e: WheelEvent) => {
        if (!propsRef.current.interactive) return;
        e.preventDefault();
        cam.dist = clamp(cam.dist * Math.exp(e.deltaY * 0.001), CAM_DIST_MIN, CAM_DIST_MAX);
      };

      if (propsRef.current.interactive) {
        onPointerDownRef.current = onPointerDown;
        onPointerMoveRef.current = onPointerMove;
        onPointerUpRef.current = onPointerUp;
        onWheelRef.current = onWheel;
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", onPointerUp);
        canvas.addEventListener("wheel", onWheel, { passive: false });
      }

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let last = performance.now();
      let notifiedReady = false;

      const paint = (now: number, dt: number) => {
        const p = propsRef.current;
        if (!reduceMotion) {
          RING_SPECS.forEach((ring) => {
            (["x", "y", "z"] as const).forEach((axis) => {
              state.rot[ring.id][axis] = smoothDamp(
                state.rot[ring.id][axis],
                p.ringTargets[ring.id][axis],
                4,
                dt,
              );
            });
            state.spinAcc[ring.id] += p.spin[ring.id] * dt;
          });
          (["x", "y", "z"] as const).forEach((axis) => {
            state.sphere[axis] = smoothDamp(state.sphere[axis], p.sphereTarget[axis], 4, dt);
          });
          if (p.autoCamera) cam.az += dt * p.autoCameraSpeed;
        } else {
          RING_SPECS.forEach((ring) => {
            state.rot[ring.id] = { ...p.ringTargets[ring.id] };
          });
          state.sphere = { ...p.sphereTarget };
        }

        const hoverY =
          reduceMotion || !p.hover ? 0 : Math.sin(now * 0.001 * HOVER_SPEED) * HOVER_AMPLITUDE;
        applyFraming();
        const baseY = propsRef.current.adaptFraming
          ? landingCamForAspect(root.clientWidth / Math.max(1, root.clientHeight)).targetY
          : targetBase[1];
        cam.target[1] = baseY + hoverY * 0.35;
        recomputeTransforms(hoverY);

        const aspect = canvas.width / canvas.height;
        const eye = camPosition();
        const vp = mat4.mul(
          mat4.persp(34 * DEG, aspect, 0.1, 100),
          mat4.lookAt(eye, cam.target, [0, 1, 0]),
        );

        active.render({
          vp,
          camPos: eye,
          ringMats,
          corePos,
          color: hexToRgb(p.coreColor),
          glow: p.glow,
        });
        if (!notifiedReady) {
          notifiedReady = true;
          onReadyRef.current?.();
        }
      };

      const frame = (now: number) => {
        raf = 0;
        if (cancelled || document.hidden || !inView) {
          running = false;
          return;
        }
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        paint(now, dt);
        running = true;
        raf = requestAnimationFrame(frame);
      };

      const ensureLoop = () => {
        if (cancelled || running || document.hidden || !inView) return;
        last = performance.now();
        running = true;
        raf = requestAnimationFrame(frame);
      };

      onVisibility = () => {
        if (document.hidden) {
          if (raf) cancelAnimationFrame(raf);
          raf = 0;
          running = false;
          return;
        }
        ensureLoop();
      };

      ro = new ResizeObserver(() => {
        resize();
        if (!running) paint(performance.now(), 0);
      });
      ro.observe(root);
      resize();

      io = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (inView) ensureLoop();
          else {
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            running = false;
          }
        },
        { threshold: 0.05 },
      );
      io.observe(root);

      document.addEventListener("visibilitychange", onVisibility);
      ensureLoop();
    };

    void run();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      if (onVisibility) document.removeEventListener("visibilitychange", onVisibility);
      if (onPointerDownRef.current) canvas.removeEventListener("pointerdown", onPointerDownRef.current);
      if (onPointerMoveRef.current) canvas.removeEventListener("pointermove", onPointerMoveRef.current);
      if (onPointerUpRef.current) {
        canvas.removeEventListener("pointerup", onPointerUpRef.current);
        canvas.removeEventListener("pointercancel", onPointerUpRef.current);
      }
      if (onWheelRef.current) canvas.removeEventListener("wheel", onWheelRef.current);
      renderer?.dispose();
    };
  }, [initialAzimuth, initialPolar, initialDistance, initialTarget, quality]);

  return (
    <div ref={rootRef} className={className}>
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        style={{
          display: "block",
          background: "transparent",
          touchAction: "none",
          cursor: interactive ? "grab" : "default",
        }}
        aria-hidden
      />
    </div>
  );
}
