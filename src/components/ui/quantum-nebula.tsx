import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { cn } from "@/lib/utils";
import { getStoredThemeIsDark } from "@/lib/theme";
import { buildMetatronTargets, buildNeuralMicrograph, type QuantumNebulaState } from "./quantumNebulaStates";

export type QuantumNebulaTheme = "dark" | "light" | "auto";
export type QuantumNebulaPulsePattern = "organic" | "spiral" | "ripple";
export type { QuantumNebulaState };
export {
  QUANTUM_NEBULA_STATES,
  QUANTUM_NEBULA_STATE_LABELS,
} from "./quantumNebulaStates";

/** Dark: 95% bleu + 5% or. Light: 95% noir + 5% or. */
const PARTICLE_PALETTES: Record<"dark" | "light", { dominant: THREE.Color; accent: THREE.Color }> = {
  dark: { dominant: new THREE.Color(0x18bec7), accent: new THREE.Color(0xe8b923) },
  light: { dominant: new THREE.Color(0x000000), accent: new THREE.Color(0xb8860b) },
};

const PARTICLE_ACCENT_RATIO = 0.05;
/** Light mode needs larger points — no additive glow to “inflate” them. */
const LIGHT_PARTICLE_SIZE_SCALE = 21;

function resolveNebulaTheme(theme: QuantumNebulaTheme): "dark" | "light" {
  if (theme === "dark" || theme === "light") return theme;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (root.classList.contains("light")) return "light";
    if (root.classList.contains("dark")) return "dark";
  }
  return getStoredThemeIsDark() ? "dark" : "light";
}

function pickParticleColor(resolved: "dark" | "light", out: THREE.Color): void {
  const { dominant, accent } = PARTICLE_PALETTES[resolved];
  if (Math.random() < PARTICLE_ACCENT_RATIO) {
    out.copy(accent);
    out.offsetHSL((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.08);
  } else {
    out.copy(dominant);
    if (resolved === "dark") {
      out.offsetHSL((Math.random() - 0.5) * 0.025, 0, (Math.random() - 0.5) * 0.06);
    }
    // light dominant stays pure black for max contrast on white
  }
}

export interface QuantumNebulaProps {
  className?: string;
  fullscreen?: boolean;
  cloudHeightRatio?: number;
  theme?: QuantumNebulaTheme;
  state?: QuantumNebulaState;
  audioSrc?: string | null;
  autoPlayAudio?: boolean;
  /** When false, guide/voice clips play once (default true for music beds). */
  audioLoop?: boolean;
  /** Fires when the current non-looping clip reaches the end. */
  onAudioEnded?: () => void;
  /** Fires once when playback actually starts (not on page mount). */
  onAudioPlay?: () => void;
  /** Fired when autoplay is blocked (mobile) or unblocked. */
  onAudioBlocked?: (blocked: boolean) => void;
  /** Current playback time in seconds (for captions). */
  onAudioTimeUpdate?: (currentTimeSec: number) => void;
  audioPaused?: boolean;
  showAudioSpectrum?: boolean;
  audioTuning?: Partial<QuantumNebulaAudioTuning>;
  visualTuning?: Partial<QuantumNebulaVisualTuning>;
  reflexionTuning?: Partial<QuantumNebulaReflexionTuning>;
  children?: ReactNode;
}

export interface QuantumNebulaAudioTuning {
  pulsePattern: QuantumNebulaPulsePattern;
  beatThreshold: number;
  beatAttack: number;
  beatHold: number;
  boomStrength: number;
  boomForce: number;
  boomDecay: number;
  boomWaveFrequency: number;
  boomWaveSpeed: number;
  ambientBoomStrength: number;
  midWaveForce: number;
  trebleJitter: number;
  audioSizeBoost: number;
  volumeGate: number;
  silenceThreshold: number;
  pauseMotionScale: number;
  spiralTwist: number;
  rippleSharpness: number;
  bloomBoost: number;
  /** 0..1 — how strongly boom reveals Metatron instead of a sphere. */
  metatronReveal: number;
  metatronPull: number;
  /** How strong mouvement overlays reflexion (0..1). */
  reflexionAudioScale: number;
}

export interface QuantumNebulaReflexionTuning {
  pulseSpeed: number;
  waveAmplitude: number;
  stateMixRate: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  glowBoost: number;
  sizePulse: number;
  rotationSpeed: number;
  cameraZoom: number;
  /** Thin ring stuck to the pupil. */
  ringInnerWidth: number;
  /** Very thin ring a bit further out. */
  ringMidWidth: number;
  /** Relative radius of the mid ring (0–1 between pupil and outer). */
  ringMidPosition: number;
  /** Thin outer ring, slightly inside the rim. */
  ringOuterThinWidth: number;
  /** Thick outermost ring. */
  ringOuterThickWidth: number;
  /** Gap between the two outer rings. */
  ringOuterGap: number;
  /** Particle share per ring: inner / mid / outerThin / outerThick (normalized). */
  ringDensityInner: number;
  ringDensityMid: number;
  ringDensityOuterThin: number;
  ringDensityOuterThick: number;
}

export const defaultReflexionTuning: QuantumNebulaReflexionTuning = {
  pulseSpeed: 1.85,
  waveAmplitude: 0.045,
  stateMixRate: 0.08,
  bloomStrength: 0.78,
  bloomRadius: 0.46,
  bloomThreshold: 0.08,
  glowBoost: 0.28,
  sizePulse: 0.08,
  rotationSpeed: 0.00022,
  cameraZoom: 0.35,
  ringInnerWidth: 0.022,
  ringMidWidth: 0.008,
  ringMidPosition: 0.3,
  ringOuterThinWidth: 0.018,
  ringOuterThickWidth: 0.095,
  ringOuterGap: 0.038,
  ringDensityInner: 0.2,
  ringDensityMid: 0.1,
  ringDensityOuterThin: 0.16,
  ringDensityOuterThick: 0.54,
};

export interface QuantumNebulaVisualTuning {
  particleCount: number;
  particleSize: number;
  sphereRadius: number;
  /** Absolute black core — particles cannot enter. */
  pupilRadius: number;
  baseHue: number;
  hueVariance: number;
  noiseSpeed: number;
  noiseScale: number;
  friction: number;
  baseForce: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  reflexionBloomStrength: number;
  reflexionBloomRadius: number;
  reflexionBloomThreshold: number;
  cameraDistance: number;
  cameraReturnLerp: number;
  solidRotation: number;
  reflexionPulseSpeed: number;
  reflexionWave: number;
  stateMixRate: number;
  mouvementAmbientPulseSpeed: number;
  mouvementAmbientPulseStrength: number;
  mouvementBassPulse: number;
  mouvementOrbital: number;
  mouvementOrbitalBoost: number;
  mouvementRotation: number;
  mouvementCameraZoom: number;
  mouvementShimmerSpeed: number;
  silenceFramesBeforeBase: number;
}

export const defaultAudioTuning: QuantumNebulaAudioTuning = {
  pulsePattern: "spiral",
  beatThreshold: 0,
  beatAttack: 9.8,
  beatHold: 2.75,
  boomStrength: 2.2,
  boomForce: 0.013,
  boomDecay: 0.605,
  boomWaveFrequency: 0.5,
  boomWaveSpeed: 0.2,
  ambientBoomStrength: 0,
  midWaveForce: 0,
  trebleJitter: 0.0003,
  audioSizeBoost: 0,
  volumeGate: 0,
  silenceThreshold: 0,
  pauseMotionScale: 0,
  spiralTwist: 2.1,
  rippleSharpness: 6,
  bloomBoost: 0.02,
  metatronReveal: 0.7,
  metatronPull: 0.033,
  reflexionAudioScale: 0.24,
};

export const defaultVisualTuning: QuantumNebulaVisualTuning = {
  particleCount: 50000,
  particleSize: 0.02,
  sphereRadius: 1.45,
  pupilRadius: 0.16,
  baseHue: 200,
  hueVariance: 20,
  noiseSpeed: 0.055,
  noiseScale: 1.2,
  friction: 0.95,
  baseForce: 0.00055,
  bloomStrength: 0.6,
  bloomRadius: 0.4,
  bloomThreshold: 0.1,
  reflexionBloomStrength: 0.78,
  reflexionBloomRadius: 0.46,
  reflexionBloomThreshold: 0.08,
  cameraDistance: 5,
  cameraReturnLerp: 0.025,
  solidRotation: 0.0003,
  reflexionPulseSpeed: 1.85,
  reflexionWave: 0.045,
  stateMixRate: 0.08,
  mouvementAmbientPulseSpeed: 1.8,
  mouvementAmbientPulseStrength: 0.12,
  mouvementBassPulse: 0.32,
  mouvementOrbital: 0.00055,
  mouvementOrbitalBoost: 0.0018,
  mouvementRotation: 0.00055,
  mouvementCameraZoom: 0.14,
  mouvementShimmerSpeed: 1.15,
  silenceFramesBeforeBase: 18,
};

const config = {
  motion: {
    cameraOrbitX: 0.2,
    cameraOrbitY: 0.16,
  },
};

export default function GenerativeArtSceneV3({
  className,
  fullscreen = true,
  theme = "auto",
  state = "solid",
  audioSrc = null,
  autoPlayAudio = false,
  audioLoop = true,
  onAudioEnded,
  onAudioPlay,
  onAudioBlocked,
  onAudioTimeUpdate,
  audioPaused = false,
  showAudioSpectrum = false,
  audioTuning,
  visualTuning,
  reflexionTuning,
  children,
}: QuantumNebulaProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioPlayingRef = useRef(false);
  const audioPausedRef = useRef(audioPaused);
  const audioTuningRef = useRef<QuantumNebulaAudioTuning>({
    ...defaultAudioTuning,
    ...audioTuning,
  });
  const visualTuningRef = useRef<QuantumNebulaVisualTuning>({
    ...defaultVisualTuning,
    ...visualTuning,
  });
  const reflexionTuningRef = useRef<QuantumNebulaReflexionTuning>({
    ...defaultReflexionTuning,
    ...reflexionTuning,
  });
  const movementBaseStateRef = useRef<QuantumNebulaState>("solid");
  const stateRef = useRef<QuantumNebulaState>(state);
  const showAudioSpectrumRef = useRef(showAudioSpectrum);
  const onAudioEndedRef = useRef(onAudioEnded);
  const onAudioPlayRef = useRef(onAudioPlay);
  const onAudioBlockedRef = useRef(onAudioBlocked);
  const onAudioTimeUpdateRef = useRef(onAudioTimeUpdate);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(() =>
    resolveNebulaTheme(theme),
  );
  stateRef.current = state;
  showAudioSpectrumRef.current = showAudioSpectrum;
  onAudioEndedRef.current = onAudioEnded;
  onAudioPlayRef.current = onAudioPlay;
  onAudioBlockedRef.current = onAudioBlocked;
  onAudioTimeUpdateRef.current = onAudioTimeUpdate;

  useEffect(() => {
    const sync = () => setResolvedTheme(resolveNebulaTheme(theme));
    sync();
    if (theme !== "auto") return;
    const root = document.documentElement;
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", sync);
    };
  }, [theme]);

  const rebuildKey = `${visualTuning?.particleCount ?? defaultVisualTuning.particleCount}-${
    visualTuning?.baseHue ?? defaultVisualTuning.baseHue
  }-${visualTuning?.hueVariance ?? defaultVisualTuning.hueVariance}-${
    visualTuning?.pupilRadius ?? defaultVisualTuning.pupilRadius
  }-${visualTuning?.sphereRadius ?? defaultVisualTuning.sphereRadius}-${
    reflexionTuning?.ringInnerWidth ?? defaultReflexionTuning.ringInnerWidth
  }-${reflexionTuning?.ringMidWidth ?? defaultReflexionTuning.ringMidWidth}-${
    reflexionTuning?.ringMidPosition ?? defaultReflexionTuning.ringMidPosition
  }-${reflexionTuning?.ringOuterThinWidth ?? defaultReflexionTuning.ringOuterThinWidth}-${
    reflexionTuning?.ringOuterThickWidth ?? defaultReflexionTuning.ringOuterThickWidth
  }-${reflexionTuning?.ringOuterGap ?? defaultReflexionTuning.ringOuterGap}-${
    reflexionTuning?.ringDensityInner ?? defaultReflexionTuning.ringDensityInner
  }-${reflexionTuning?.ringDensityMid ?? defaultReflexionTuning.ringDensityMid}-${
    reflexionTuning?.ringDensityOuterThin ?? defaultReflexionTuning.ringDensityOuterThin
  }-${reflexionTuning?.ringDensityOuterThick ?? defaultReflexionTuning.ringDensityOuterThick}-${resolvedTheme}`;

  useEffect(() => {
    if (state !== "mouvement") {
      movementBaseStateRef.current = state;
    }
  }, [state]);

  useEffect(() => {
    audioPausedRef.current = audioPaused;
    const audioElement = audioElementRef.current;
    if (!audioElement || state !== "mouvement" || !audioSrc) return;

    if (audioPaused) {
      audioElement.pause();
      return;
    }

    if (autoPlayAudio) {
      // Best-effort resume, but never block playback on it (mobile).
      void audioContextRef.current?.resume().catch(() => undefined);
      void audioElement.play().catch(() => undefined);
    }

  }, [audioPaused, audioSrc, autoPlayAudio, state]);

  useEffect(() => {
    audioPlayingRef.current = false;
    analyserRef.current = null;
    audioElementRef.current = null;
    audioContextRef.current = null;

    if (!audioSrc) return;

    const audioElement = new Audio(audioSrc);
    audioElementRef.current = audioElement;
    audioElement.loop = audioLoop;
    audioElement.preload = "auto";
    audioElement.setAttribute("playsinline", "");
    audioElement.setAttribute("webkit-playsinline", "");

    // Web Audio graph is best-effort AND lazy: on mobile an AudioContext created
    // outside a gesture stays "suspended". Connecting the element to a suspended
    // graph makes playback silent, so we only build the graph once the context is
    // actually running (after playback started from a gesture). Otherwise the
    // element plays straight to the speakers, without spectrum reactivity.
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let graphRequested = false;

    const ensureGraph = () => {
      if (graphRequested || audioContext) return;
      graphRequested = true;
      const Ctor: typeof AudioContext | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      let ctx: AudioContext;
      try {
        ctx = new Ctor();
      } catch {
        return;
      }
      const connect = () => {
        if (ctx.state !== "running") {
          void ctx.close().catch(() => undefined);
          graphRequested = false;
          return;
        }
        try {
          const source = ctx.createMediaElementSource(audioElement);
          const node = ctx.createAnalyser();
          node.fftSize = 512;
          node.smoothingTimeConstant = 0.28;
          source.connect(node);
          node.connect(ctx.destination);
          audioContext = ctx;
          analyser = node;
          audioContextRef.current = ctx;
          analyserRef.current = node;
        } catch {
          void ctx.close().catch(() => undefined);
          graphRequested = false;
        }
      };
      void ctx
        .resume()
        .then(connect)
        .catch(() => {
          void ctx.close().catch(() => undefined);
          graphRequested = false;
        });
    };

    const syncPlayingState = () => {
      audioPlayingRef.current = !audioElement.paused && !audioElement.ended;
    };

    const handlePlay = () => {
      syncPlayingState();
      // Playback started (gesture satisfied) → safe to build the reactive graph.
      ensureGraph();
      onAudioBlockedRef.current?.(false);
      onAudioPlayRef.current?.();
    };


    const handleEnded = () => {
      syncPlayingState();
      if (!audioLoop) onAudioEndedRef.current?.();
    };

    const handleError = () => {
      syncPlayingState();
      if (!audioLoop) onAudioEndedRef.current?.();
    };

    const handleTimeUpdate = () => {
      onAudioTimeUpdateRef.current?.(audioElement.currentTime);
    };

    const tryPlay = () => {
      if (audioPausedRef.current) return;
      // Both calls must happen synchronously inside the mobile gesture. Waiting
      // for AudioContext.resume() before play() loses Safari's activation token.
      if (audioContext && audioContext.state === "suspended") {
        void audioContext.resume().catch(() => undefined);
      }
      void audioElement.play().then(
        () => onAudioBlockedRef.current?.(false),
        () => onAudioBlockedRef.current?.(true),
      );
    };

    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", syncPlayingState);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);

    if (autoPlayAudio) {
      audioElement.addEventListener("canplay", tryPlay, { once: true });
      tryPlay();
    }

    // Mobile: autoplay is blocked until a gesture. Keep listening for gestures
    // until playback actually started (a single `once` listener is not enough).
    const resumeOnGesture = () => {
      if (!audioElement.paused && !audioElement.ended) {
        detachGestureListeners();
        return;
      }
      if (autoPlayAudio) tryPlay();
    };
    const gestureEvents: (keyof WindowEventMap)[] = [
      "pointerdown",
      "touchend",
      "keydown",
    ];
    const detachGestureListeners = () => {
      gestureEvents.forEach((evt) =>
        window.removeEventListener(evt, resumeOnGesture),
      );
    };
    gestureEvents.forEach((evt) =>
      window.addEventListener(evt, resumeOnGesture, { passive: true }),
    );

    return () => {
      detachGestureListeners();
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", syncPlayingState);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.pause();
      audioContext?.close().catch(() => undefined);
      if (audioElementRef.current === audioElement) audioElementRef.current = null;
      if (audioContextRef.current === audioContext) audioContextRef.current = null;
      if (analyser && analyserRef.current === analyser) analyserRef.current = null;
      audioPlayingRef.current = false;
    };
  }, [audioSrc, autoPlayAudio, audioLoop]);


  useEffect(() => {
    audioTuningRef.current = {
      ...defaultAudioTuning,
      ...audioTuning,
    };
  }, [audioTuning]);

  useEffect(() => {
    visualTuningRef.current = {
      ...defaultVisualTuning,
      ...visualTuning,
    };
  }, [visualTuning]);

  useEffect(() => {
    reflexionTuningRef.current = {
      ...defaultReflexionTuning,
      ...reflexionTuning,
    };
  }, [reflexionTuning]);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const visual = visualTuningRef.current;
    const isLightTheme = resolvedTheme === "light";
    const scene = new THREE.Scene();
    const bgHex = isLightTheme ? 0xffffff : 0x000000;
    scene.background = new THREE.Color(bgHex);
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = visual.cameraDistance;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setClearColor(bgHex, 1);
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);

    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(currentMount.clientWidth, currentMount.clientHeight),
      visual.bloomStrength,
      visual.bloomRadius,
      visual.bloomThreshold,
    );
    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    // Bloom kills dark particles on white — only use it in dark mode.
    if (!isLightTheme) {
      composer.addPass(bloomPass);
    }
    composerRef.current = composer;

    const particleCount = Math.max(1000, Math.floor(visual.particleCount));
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3).fill(0);
    const baseColor = new THREE.Color();

    const sphereRadius = visual.sphereRadius;
    const initialPupil = Math.max(0.02, Math.min(visual.pupilRadius, sphereRadius * 0.85));
    const minSpawnR2 = initialPupil * initialPupil;
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      let x = 0;
      let y = 0;
      let z = 0;
      let r2 = 0;
      do {
        x = (Math.random() * 2 - 1) * sphereRadius;
        y = (Math.random() * 2 - 1) * sphereRadius;
        z = (Math.random() * 2 - 1) * sphereRadius;
        r2 = x * x + y * y + z * z;
      } while (r2 > sphereRadius * sphereRadius || r2 < minSpawnR2);
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      basePositions[i3] = positions[i3];
      basePositions[i3 + 1] = positions[i3 + 1];
      basePositions[i3 + 2] = positions[i3 + 2];

      pickParticleColor(resolvedTheme, baseColor);
      colors[i3] = baseColor.r;
      colors[i3 + 1] = baseColor.g;
      colors[i3 + 2] = baseColor.b;
    }

    const neural = buildNeuralMicrograph(particleCount, 77, visual.sphereRadius * 0.92, {
      pupilRadius: initialPupil,
      ringInnerWidth: reflexionTuningRef.current.ringInnerWidth,
      ringMidWidth: reflexionTuningRef.current.ringMidWidth,
      ringMidPosition: reflexionTuningRef.current.ringMidPosition,
      ringOuterThinWidth: reflexionTuningRef.current.ringOuterThinWidth,
      ringOuterThickWidth: reflexionTuningRef.current.ringOuterThickWidth,
      ringOuterGap: reflexionTuningRef.current.ringOuterGap,
      ringDensityInner: reflexionTuningRef.current.ringDensityInner,
      ringDensityMid: reflexionTuningRef.current.ringDensityMid,
      ringDensityOuterThin: reflexionTuningRef.current.ringDensityOuterThin,
      ringDensityOuterThick: reflexionTuningRef.current.ringDensityOuterThick,
    });
    const metatronTargets = buildMetatronTargets(particleCount, visual.sphereRadius * 0.92);
    const pointSizes = new Float32Array(particleCount).fill(1);
    const restColors = colors.slice();

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("a_size", new THREE.BufferAttribute(pointSizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_pointSize: { value: visual.particleSize * renderer.getPixelRatio() },
        /** Unscaled size for pupil cull — light scale must not enlarge the hole. */
        u_pointSizeCull: { value: visual.particleSize * renderer.getPixelRatio() },
        u_pupilRadius: { value: initialPupil },
      },
      vertexShader: `
        attribute vec3 color;
        attribute float a_size;
        varying vec3 vColor;
        varying float vAlive;
        uniform float u_pointSize;
        uniform float u_pointSizeCull;
        uniform float u_pupilRadius;

        void main() {
          vColor = color;
          float radius = length(position);
          // Cull with unscaled size so light particle boost doesn't inflate the pupil.
          float cullRadius = u_pupilRadius + u_pointSizeCull * a_size * 0.35;
          if (radius < cullRadius) {
            vAlive = 0.0;
            gl_PointSize = 0.0;
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            return;
          }
          vAlive = 1.0;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = u_pointSize * a_size * (10.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlive;
        void main() {
          if (vAlive < 0.5) discard;
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;
          // Soft edge; keep alpha high so dark particles stay visible on white.
          float alpha = smoothstep(0.5, 0.28, d);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: isLightTheme ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    const sizeScale = isLightTheme ? LIGHT_PARTICLE_SIZE_SCALE : 1;
    const syncPointSize = () => {
      const base = visualTuningRef.current.particleSize * renderer.getPixelRatio();
      particleMaterial.uniforms.u_pointSizeCull.value = base;
      particleMaterial.uniforms.u_pointSize.value = base * sizeScale;
    };
    syncPointSize();

    const pupilHex = isLightTheme ? 0xffffff : 0x000000;
    const pupilGeometry = new THREE.SphereGeometry(1, 64, 64);
    const pupilMaterial = new THREE.MeshBasicMaterial({
      color: pupilHex,
      toneMapped: false,
      depthWrite: true,
      depthTest: true,
      fog: false,
    });
    const pupilMesh = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupilMesh.scale.setScalar(initialPupil);
    pupilMesh.renderOrder = 10;
    scene.add(pupilMesh);

    // Second copy drawn after bloom so glow never leaks into the pupil.
    const pupilOverlayScene = new THREE.Scene();
    const pupilOverlayMesh = new THREE.Mesh(
      pupilGeometry,
      new THREE.MeshBasicMaterial({
        color: pupilHex,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
        fog: false,
      }),
    );
    pupilOverlayMesh.scale.setScalar(initialPupil);
    pupilOverlayScene.add(pupilOverlayMesh);

    let frameId = 0;
    const clock = new THREE.Clock();
    let reflexionMix = 0;

    const curlNoiseFn = (p: THREE.Vector3, speed: number, scale: number) => {
      return new THREE.Vector3(
        Math.sin(p.y * scale + speed),
        Math.cos(p.z * scale + speed),
        Math.sin(p.x * scale + speed),
      ).normalize();
    };

    const averageFrequencyBand = (
      buffer: Uint8Array,
      [start, end]: readonly [number, number],
    ) => {
      let sum = 0;
      const safeEnd = Math.min(end, buffer.length);
      for (let i = start; i < safeEnd; i++) {
        sum += buffer[i] ?? 0;
      }
      return safeEnd > start ? sum / ((safeEnd - start) * 255) : 0;
    };

    const audioBands = {
      kick: [2, 16],
      bass: [2, 28],
      mid: [28, 92],
      treble: [92, 180],
    } as const;

    const drawAudioSpectrum = (
      frequencyBuffer: Uint8Array | null,
      waveformBuffer: Uint8Array | null,
      levels: { kick: number; bass: number; mid: number; treble: number },
      isPlaying: boolean,
    ) => {
      if (!showAudioSpectrumRef.current) return;
      const canvas = spectrumCanvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth * dpr;
      const height = canvas.clientHeight * dpr;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, width, height);
      const padding = 12 * dpr;
      const barAreaWidth = width - padding * 2;
      const barAreaHeight = height - padding * 2 - 18 * dpr;
      if (frequencyBuffer) {
        const barCount = Math.min(64, frequencyBuffer.length);
        const barWidth = barAreaWidth / barCount;
        for (let i = 0; i < barCount; i++) {
          const value = (frequencyBuffer[i] ?? 0) / 255;
          const barHeight = Math.max(2 * dpr, value * barAreaHeight);
          const x = padding + i * barWidth;
          const y = padding + barAreaHeight - barHeight;
          ctx.fillStyle = `hsla(${200 + i * 0.8}, 90%, ${45 + value * 35}%, 0.9)`;
          ctx.fillRect(x, y, Math.max(1, barWidth * 0.72), barHeight);
        }
      }
      if (waveformBuffer) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1.5 * dpr;
        for (let i = 0; i < waveformBuffer.length; i++) {
          const x = padding + (i / waveformBuffer.length) * barAreaWidth;
          const y =
            padding +
            barAreaHeight * 0.5 +
            (((waveformBuffer[i] ?? 128) - 128) / 128) * (barAreaHeight * 0.35);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `${11 * dpr}px ui-sans-serif, system-ui`;
      ctx.fillText(
        `K ${levels.kick.toFixed(2)}  B ${levels.bass.toFixed(2)}  M ${levels.mid.toFixed(2)}  T ${levels.treble.toFixed(2)}`,
        padding,
        height - 6 * dpr,
      );
      ctx.textAlign = "right";
      ctx.fillText(
        isPlaying ? "AUDIO LIVE" : frequencyBuffer ? "AUDIO PAUSED" : "NO AUDIO",
        width - padding,
        16 * dpr,
      );
      ctx.textAlign = "left";
    };

    let bassLevel = 0;
    let midLevel = 0;
    let highLevel = 0;
    let boomLevel = 0;
    let kickLevel = 0;
    let silenceFrames = 0;
    let smoothBoomPulse = 0;
    let smoothMetatronMix = 0;
    let prevState: QuantumNebulaState = stateRef.current;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      const state = stateRef.current;
      const visual = visualTuningRef.current;
      const reflexion = reflexionTuningRef.current;
      const tuning = audioTuningRef.current;
      syncPointSize();

      const pupilRadius = Math.max(
        0.02,
        Math.min(visual.pupilRadius, visual.sphereRadius * 0.85),
      );
      particleMaterial.uniforms.u_pupilRadius.value = pupilRadius;
      pupilMesh.scale.setScalar(pupilRadius);
      pupilOverlayMesh.scale.setScalar(pupilRadius);

      // Keep current cloud when entering mouvement — no Metatron flash from ambient/fallback.
      if (state === "mouvement" && prevState !== "mouvement") {
        boomLevel = 0;
        kickLevel = 0;
        bassLevel = 0;
        midLevel = 0;
        highLevel = 0;
        silenceFrames = 0;
      }
      prevState = state;

      const positionArray = particleSystem.geometry.attributes.position.array as Float32Array;
      const colorArray = particleSystem.geometry.attributes.color.array as Float32Array;
      const sizeArray = particleSystem.geometry.attributes.a_size.array as Float32Array;
      let cinematicEnergy = 0;
      const movementBaseState = movementBaseStateRef.current;
      let effectiveState: QuantumNebulaState = state;
      let audioOverlayActive = false;
      let ambientPulse = 0;
      let boomPulse = 0;
      let audioBoomPulse = 0;
      let bassEnergy = 0;
      let midEnergy = 0;
      let trebleEnergy = 0;
      let kickEnergy = 0;
      let spectrumBuffer: Uint8Array | null = null;
      let waveformBuffer: Uint8Array | null = null;

      const analyser = analyserRef.current;
      const audioElement = audioElementRef.current;
      const hasAudio = Boolean(analyser && audioElement);
      const isAudioPlaying =
        hasAudio &&
        !audioElement!.paused &&
        !audioElement!.ended &&
        audioPlayingRef.current;

      if (state === "mouvement") {
        ambientPulse =
          Math.pow(
            Math.max(0, Math.sin(elapsedTime * visual.mouvementAmbientPulseSpeed)),
            2,
          ) * visual.mouvementAmbientPulseStrength;
        const fallbackBoom =
          Math.pow(
            Math.max(0, Math.sin(elapsedTime * visual.mouvementAmbientPulseSpeed * 0.75)),
            12,
          ) * tuning.ambientBoomStrength;

        if (hasAudio && isAudioPlaying) {
          const buffer = new Uint8Array(analyser!.frequencyBinCount);
          analyser!.getByteFrequencyData(buffer);
          spectrumBuffer = buffer;
          const waveform = new Uint8Array(analyser!.frequencyBinCount);
          analyser!.getByteTimeDomainData(waveform);
          waveformBuffer = waveform;
          const kick = averageFrequencyBand(buffer, audioBands.kick);
          const bass = averageFrequencyBand(buffer, audioBands.bass);
          const mid = averageFrequencyBand(buffer, audioBands.mid);
          const high = averageFrequencyBand(buffer, audioBands.treble);
          kickEnergy = kick;
          bassEnergy = bass;
          midEnergy = mid;
          trebleEnergy = high;
          const kickAttack = Math.max(0, kick - kickLevel);
          kickLevel += (kick - kickLevel) * 0.58;
          bassLevel += (bass - bassLevel) * 0.32;
          midLevel += (mid - midLevel) * 0.22;
          highLevel += (high - highLevel) * 0.2;
          boomLevel = Math.max(
            boomLevel * tuning.boomDecay,
            Math.max(0, kick - tuning.beatThreshold) * tuning.beatHold +
              kickAttack * tuning.beatAttack,
          );
          boomPulse = boomLevel * tuning.boomStrength;
          audioBoomPulse = boomPulse;
          cinematicEnergy = bassLevel * 0.9 + midLevel * 0.7 + highLevel * 0.35;
          const globalEnergy = (bassLevel + midLevel + highLevel) / 3;
          const isPausedByGate = globalEnergy < tuning.volumeGate;
          const pauseScale = isPausedByGate ? tuning.pauseMotionScale : 1;
          bassEnergy *= pauseScale;
          midEnergy *= pauseScale;
          trebleEnergy *= pauseScale;
          kickEnergy *= pauseScale;
          boomPulse *= pauseScale;
          audioBoomPulse *= pauseScale;
          silenceFrames = globalEnergy < tuning.silenceThreshold ? silenceFrames + 1 : 0;
          audioOverlayActive = silenceFrames <= visual.silenceFramesBeforeBase;
          effectiveState = movementBaseState;
        } else if (hasAudio && audioElement!.ended) {
          bassLevel *= 0.9;
          midLevel *= 0.9;
          highLevel *= 0.9;
          boomLevel = 0;
          kickLevel *= 0.9;
          silenceFrames = 0;
          effectiveState = movementBaseState === "reflexion" ? "reflexion" : "solid";
        } else {
          bassLevel *= 0.92;
          midLevel *= 0.92;
          highLevel *= 0.92;
          boomLevel = 0;
          kickLevel *= 0.92;
          // Ambient fallback can move the cloud, but never reveals Metatron.
          boomPulse = hasAudio ? 0 : fallbackBoom;
          audioBoomPulse = 0;
          silenceFrames = 0;
          effectiveState = movementBaseState;
          audioOverlayActive = false;
        }
      } else {
        bassLevel *= 0.92;
        midLevel *= 0.92;
        highLevel *= 0.9;
        boomLevel = 0;
        kickLevel *= 0.92;
        silenceFrames = 0;
      }

      if (showAudioSpectrumRef.current && hasAudio && !spectrumBuffer && analyser) {
        const buffer = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(buffer);
        spectrumBuffer = buffer;
        const waveform = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(waveform);
        waveformBuffer = waveform;
      }

      drawAudioSpectrum(
        spectrumBuffer,
        waveformBuffer,
        {
          kick: kickEnergy || kickLevel,
          bass: bassEnergy || bassLevel,
          mid: midEnergy || midLevel,
          treble: trebleEnergy || highLevel,
        },
        isAudioPlaying,
      );

      const targetReflexion = effectiveState === "reflexion" ? 1 : 0;
      reflexionMix += (targetReflexion - reflexionMix) * reflexion.stateMixRate;
      if (Math.abs(targetReflexion - reflexionMix) < 0.001) reflexionMix = targetReflexion;
      const cloudMix = 1 - reflexionMix;
      const onReflexionBase =
        movementBaseState === "reflexion" ||
        effectiveState === "reflexion" ||
        reflexionMix > 0.45;
      const mouvementScale = onReflexionBase
        ? Math.max(0, Math.min(1, tuning.reflexionAudioScale))
        : 1;

      // Smooth envelopes on réflexion so boom / Metatron ease in and out.
      const boomSmoothRate = onReflexionBase ? 0.14 : 0.55;
      smoothBoomPulse += (boomPulse - smoothBoomPulse) * boomSmoothRate;
      if (Math.abs(boomPulse - smoothBoomPulse) < 0.0005) smoothBoomPulse = boomPulse;
      const driveBoom = onReflexionBase ? smoothBoomPulse : boomPulse;

      const targetMetatronMix =
        state === "mouvement" &&
        audioOverlayActive &&
        audioBoomPulse > 0.02
          ? Math.min(
              1,
              Math.pow(Math.min(1, audioBoomPulse * 0.95), 1.35) * tuning.metatronReveal,
            )
          : 0;
      const metatronSmoothRate = onReflexionBase ? 0.11 : 0.42;
      smoothMetatronMix += (targetMetatronMix - smoothMetatronMix) * metatronSmoothRate;
      if (Math.abs(targetMetatronMix - smoothMetatronMix) < 0.0005) {
        smoothMetatronMix = targetMetatronMix;
      }
      const frameMetatronMix = onReflexionBase ? smoothMetatronMix : targetMetatronMix;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const p = new THREE.Vector3(
          positionArray[i3],
          positionArray[i3 + 1],
          positionArray[i3 + 2],
        );

        const curlForce = curlNoiseFn(
          p,
          elapsedTime * visual.noiseSpeed,
          visual.noiseScale,
        );

        let forceMul = visual.baseForce * cloudMix;
        let returnPull = 0.00025 * cloudMix;
        let metatronMix = frameMetatronMix;

        if (state === "mouvement") {
          const pulse = 1 + ambientPulse + bassLevel * visual.mouvementBassPulse;
          const audioForce = bassEnergy * 2 + midEnergy * 1.5 + trebleEnergy;
          const orbital =
            (visual.mouvementOrbital * 0.35 + midLevel * visual.mouvementOrbitalBoost * 0.22) *
            mouvementScale;
          const shimmer =
            (highLevel * 0.00035 + ambientPulse * 0.00012) * mouvementScale;
          const radialLength = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) + 0.001;
          const xyLength = Math.sqrt(p.x * p.x + p.y * p.y) + 0.001;
          const organicBoom = onReflexionBase
            ? 0.82 +
              0.18 *
                Math.sin(
                  i * 0.013 + elapsedTime * 1.35 + radialLength * tuning.boomWaveFrequency,
                )
            : 0.62 +
              0.38 *
                Math.sin(
                  i * 0.013 + elapsedTime * 2.1 + radialLength * tuning.boomWaveFrequency,
                );
          const boomWave =
            0.35 +
            0.65 *
              Math.pow(
                Math.max(
                  0,
                  Math.sin(
                    radialLength * tuning.boomWaveFrequency - elapsedTime * tuning.boomWaveSpeed,
                  ),
                ),
                onReflexionBase
                  ? Math.max(1.2, tuning.rippleSharpness * 0.55)
                  : tuning.rippleSharpness,
              );
          const boomForce =
            driveBoom * tuning.boomForce * organicBoom * boomWave * mouvementScale;
          // Metatron mix is smoothed once per frame (frameMetatronMix).
          let boomX = p.x / radialLength;
          let boomY = p.y / radialLength;
          let boomZ = (p.z / radialLength) * 0.55;

          if (tuning.pulsePattern === "spiral") {
            const tangentX = -p.y / xyLength;
            const tangentY = p.x / xyLength;
            boomX = boomX * 0.68 + tangentX * tuning.spiralTwist;
            boomY = boomY * 0.68 + tangentY * tuning.spiralTwist;
            boomZ = boomZ * 0.45 + Math.sin(radialLength * 2.2 + elapsedTime) * 0.22;
          } else if (tuning.pulsePattern === "ripple") {
            const ripple =
              Math.sin(
                xyLength * tuning.boomWaveFrequency * 1.5 - elapsedTime * tuning.boomWaveSpeed,
              ) *
                0.5 +
              0.5;
            boomX = (p.x / xyLength) * (0.45 + ripple * 0.75);
            boomY = (p.y / xyLength) * (0.45 + ripple * 0.75);
            boomZ = Math.sin(i * 0.011 + elapsedTime * 1.6) * 0.32;
          }
          velocities[i3 + 2] +=
            Math.sin(elapsedTime * visual.mouvementShimmerSpeed + i * 0.0015) * shimmer;
          const radialRemain = 1 - metatronMix * 0.92;
          velocities[i3] += boomX * boomForce * radialRemain;
          velocities[i3 + 1] += boomY * boomForce * radialRemain;
          velocities[i3 + 2] += boomZ * boomForce * radialRemain;

          const mx = metatronTargets[i3];
          const my = metatronTargets[i3 + 1];
          const mz = metatronTargets[i3 + 2];
          const pull =
            metatronMix *
            tuning.metatronPull *
            (0.55 + Math.min(1, tuning.boomForce / 0.02) * 1.45) *
            (onReflexionBase ? 0.72 : 1);
          velocities[i3] += (mx - p.x) * pull;
          velocities[i3 + 1] += (my - p.y) * pull;
          velocities[i3 + 2] += (mz - p.z) * pull;
          if (metatronMix > 0.55) {
            const snap =
              (metatronMix - 0.55) * (onReflexionBase ? 0.045 : 0.12);
            positionArray[i3] += (mx - positionArray[i3]) * snap;
            positionArray[i3 + 1] += (my - positionArray[i3 + 1]) * snap;
            positionArray[i3 + 2] += (mz - positionArray[i3 + 2]) * snap;
          }
          const wavePhase =
            p.x * 1.7 + p.y * 0.9 + elapsedTime * (1.2 + midEnergy * 3.2) + i * 0.002;
          const midWave =
            Math.sin(wavePhase) * midEnergy * tuning.midWaveForce * mouvementScale;
          velocities[i3] += Math.cos(wavePhase * 0.7) * midWave;
          velocities[i3 + 1] += Math.sin(wavePhase * 0.9) * midWave;
          velocities[i3 + 2] += midWave * 0.45;
          const jitterSeed = Math.sin(i * 12.9898 + elapsedTime * 64.0) * 43758.5453;
          const jitter = (jitterSeed - Math.floor(jitterSeed) - 0.5) * trebleEnergy;
          velocities[i3] += jitter * tuning.trebleJitter * mouvementScale;
          velocities[i3 + 1] -= jitter * tuning.trebleJitter * 0.75 * mouvementScale;
          velocities[i3 + 2] +=
            Math.sin(jitterSeed) * trebleEnergy * tuning.trebleJitter * 0.55 * mouvementScale;
          const reactiveSize =
            1 +
            (boomPulse * 0.6 + audioForce * 0.12) * tuning.audioSizeBoost * mouvementScale;
          sizeArray[i] += (reactiveSize - sizeArray[i]) * (onReflexionBase ? 0.08 : 0.18);
          if (audioOverlayActive) {
            forceMul *= 1 + (pulse - 1) * mouvementScale;
            velocities[i3] += -p.y * orbital;
            velocities[i3 + 1] += p.x * orbital;
          } else {
            forceMul *= 1 + ambientPulse * 0.65 * mouvementScale;
          }
        }

        if (cloudMix > 0.01 || (state === "mouvement" && onReflexionBase)) {
          velocities[i3] += curlForce.x * forceMul;
          velocities[i3 + 1] += curlForce.y * forceMul;
          velocities[i3 + 2] += curlForce.z * forceMul;

          velocities[i3] += (basePositions[i3] - p.x) * returnPull;
          velocities[i3 + 1] += (basePositions[i3 + 1] - p.y) * returnPull;
          velocities[i3 + 2] += (basePositions[i3 + 2] - p.z) * returnPull;

          const damp =
            state === "mouvement" && onReflexionBase
              ? Math.min(0.985, visual.friction * 0.985 + 0.01)
              : visual.friction * (1 - reflexionMix * 0.92);
          velocities[i3] *= damp;
          velocities[i3 + 1] *= damp;
          velocities[i3 + 2] *= damp;

          positionArray[i3] += velocities[i3];
          positionArray[i3 + 1] += velocities[i3 + 1];
          positionArray[i3 + 2] += velocities[i3 + 2];
        } else {
          velocities[i3] = 0;
          velocities[i3 + 1] = 0;
          velocities[i3 + 2] = 0;
        }

        const thought = Math.sin(
          elapsedTime * reflexion.pulseSpeed + neural.phase[i],
        );
        const tip = 1.15 - neural.brightness[i];
        const wave = reflexion.waveAmplitude * tip * reflexionMix;
        let neuralX =
          neural.targets[i3] + Math.cos(elapsedTime * 1.35 + neural.phase[i]) * wave;
        let neuralY =
          neural.targets[i3 + 1] +
          Math.sin(elapsedTime * 1.12 + neural.phase[i] * 0.85) * wave;
        let neuralZ = neural.targets[i3 + 2] + thought * wave * 0.45;
        // Keep neural targets outside the pupil and inside the shared sphere.
        {
          const nr = Math.sqrt(neuralX * neuralX + neuralY * neuralY + neuralZ * neuralZ);
          const keepOut = pupilRadius * 1.2;
          const keepIn = visual.sphereRadius * 0.98;
          if (nr < keepOut) {
            if (nr < 0.0001) {
              neuralX = keepOut;
              neuralY = 0;
              neuralZ = 0;
            } else {
              const s = keepOut / nr;
              neuralX *= s;
              neuralY *= s;
              neuralZ *= s;
            }
          } else if (nr > keepIn) {
            const s = keepIn / nr;
            neuralX *= s;
            neuralY *= s;
            neuralZ *= s;
          }
        }
        // On réflexion+mouvement: ease neural release so Metatron forms smoothly.
        let neuralBlend = reflexionMix;
        if (state === "mouvement" && onReflexionBase && audioOverlayActive) {
          const release = Math.min(
            0.78,
            Math.max(driveBoom * 0.32, metatronMix * 0.82),
          );
          neuralBlend *= 1 - release;
        }
        positionArray[i3] += (neuralX - positionArray[i3]) * neuralBlend;
        positionArray[i3 + 1] += (neuralY - positionArray[i3 + 1]) * neuralBlend;
        positionArray[i3 + 2] += (neuralZ - positionArray[i3 + 2]) * neuralBlend;

        if (reflexionMix > 0.01) {
          const glow =
            1 +
            reflexionMix *
              neural.brightness[i] *
              reflexion.glowBoost *
              (1 + Math.max(0, thought) * 0.18);
          colorArray[i3] += (restColors[i3] * glow - colorArray[i3]) * 0.14;
          colorArray[i3 + 1] += (restColors[i3 + 1] * glow - colorArray[i3 + 1]) * 0.14;
          colorArray[i3 + 2] += (restColors[i3 + 2] * glow - colorArray[i3 + 2]) * 0.14;
          const targetSize =
            1 +
            (neural.sizes[i] * (0.92 + thought * reflexion.sizePulse) - 1) * reflexionMix;
          sizeArray[i] += (targetSize - sizeArray[i]) * 0.14;
        } else {
          colorArray[i3] += (restColors[i3] - colorArray[i3]) * 0.1;
          colorArray[i3 + 1] += (restColors[i3 + 1] - colorArray[i3 + 1]) * 0.1;
          colorArray[i3 + 2] += (restColors[i3 + 2] - colorArray[i3 + 2]) * 0.1;
          if (state !== "mouvement") {
            sizeArray[i] += (1 - sizeArray[i]) * 0.1;
          }
        }

        // Shared spherical container for all states (solid / mouvement / reflexion).
        {
          const maxR = visual.sphereRadius;
          const px = positionArray[i3];
          const py = positionArray[i3 + 1];
          const pz = positionArray[i3 + 2];
          const r = Math.sqrt(px * px + py * py + pz * pz);
          if (r > maxR && r > 0.0001) {
            const s = (maxR / r) * 0.98;
            positionArray[i3] = px * s;
            positionArray[i3 + 1] = py * s;
            positionArray[i3 + 2] = pz * s;
            velocities[i3] *= 0.5;
            velocities[i3 + 1] *= 0.5;
            velocities[i3 + 2] *= 0.5;
          }
        }

        // Light elastic bounce on the pupil surface.
        {
          const px = positionArray[i3];
          const py = positionArray[i3 + 1];
          const pz = positionArray[i3 + 2];
          const r = Math.sqrt(px * px + py * py + pz * pz) + 0.0001;
          const shell = pupilRadius * 1.04;
          if (r < shell) {
            const nx = px / r;
            const ny = py / r;
            const nz = pz / r;
            positionArray[i3] = nx * shell;
            positionArray[i3 + 1] = ny * shell;
            positionArray[i3 + 2] = nz * shell;

            const inward =
              velocities[i3] * nx + velocities[i3 + 1] * ny + velocities[i3 + 2] * nz;
            if (inward < 0) {
              // Soft bounce: reflect only part of the normal speed.
              const restitution = 0.42;
              velocities[i3] -= nx * inward * (1 + restitution);
              velocities[i3 + 1] -= ny * inward * (1 + restitution);
              velocities[i3 + 2] -= nz * inward * (1 + restitution);
              // Tiny outward kick so the rebound stays readable.
              velocities[i3] += nx * 0.00035;
              velocities[i3 + 1] += ny * 0.00035;
              velocities[i3 + 2] += nz * 0.00035;
            }
          } else if (r < pupilRadius * 1.45) {
            // Soft cushion just outside the surface.
            const t = 1 - (r - shell) / (pupilRadius * 1.45 - shell);
            const cushion = Math.max(0, t) * 0.0009;
            const nx = px / r;
            const ny = py / r;
            const nz = pz / r;
            velocities[i3] += nx * cushion;
            velocities[i3 + 1] += ny * cushion;
            velocities[i3 + 2] += nz * cushion;
          }
        }
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
      particleSystem.geometry.attributes.color.needsUpdate = true;
      particleSystem.geometry.attributes.a_size.needsUpdate = true;

      const bloomTarget = isLightTheme
        ? 0
        : visual.bloomStrength * cloudMix + reflexion.bloomStrength * reflexionMix;
      const movementBloomBoost =
        isLightTheme || state !== "mouvement"
          ? 0
          : (boomPulse * tuning.bloomBoost + trebleEnergy * 0.12) * mouvementScale;
      if (!isLightTheme) {
        bloomPass.strength += (bloomTarget + movementBloomBoost - bloomPass.strength) * 0.1;
        bloomPass.radius +=
          (visual.bloomRadius * cloudMix + reflexion.bloomRadius * reflexionMix -
            bloomPass.radius) *
          0.1;
        bloomPass.threshold +=
          (visual.bloomThreshold * cloudMix +
            reflexion.bloomThreshold * reflexionMix -
            bloomPass.threshold) *
          0.1;
      }
      renderer.setClearColor(bgHex, 1);

      const cameraZTarget = visual.cameraDistance - reflexion.cameraZoom * reflexionMix;
      if (state === "mouvement") {
        const rotationBoost =
          (visual.solidRotation +
            visual.mouvementRotation * (0.28 + ambientPulse * 0.4) +
            midLevel * 0.0012) *
          (onReflexionBase ? 0.45 : 1);
        particleSystem.rotation.z += rotationBoost;
        const zoomPulse =
          (ambientPulse +
            bassLevel * visual.mouvementCameraZoom +
            boomPulse * visual.mouvementCameraZoom * 0.45) *
          mouvementScale;
        const camBaseZ = onReflexionBase ? cameraZTarget : visual.cameraDistance;
        camera.position.z = camBaseZ - zoomPulse * 0.35;
        const orbitStrength =
          (audioOverlayActive
            ? 0.005 + cinematicEnergy * 0.035
            : 0.004 + ambientPulse * 0.012) * mouvementScale;
        camera.position.x = Math.sin(elapsedTime * config.motion.cameraOrbitX) * orbitStrength;
        camera.position.y =
          Math.cos(elapsedTime * config.motion.cameraOrbitY) *
          (orbitStrength * 0.75 + midLevel * 0.012 * mouvementScale);
      } else if (reflexionMix > 0.02) {
        particleSystem.rotation.z +=
          reflexion.rotationSpeed * reflexionMix + visual.solidRotation * cloudMix;
        camera.position.x += (0 - camera.position.x) * 0.08;
        camera.position.y += (0 - camera.position.y) * 0.08;
        camera.position.z += (cameraZTarget - camera.position.z) * 0.08;
      } else {
        particleSystem.rotation.z += visual.solidRotation;
        camera.position.x += (0 - camera.position.x) * visual.cameraReturnLerp;
        camera.position.y += (0 - camera.position.y) * visual.cameraReturnLerp;
        camera.position.z +=
          (visual.cameraDistance - camera.position.z) * visual.cameraReturnLerp;
      }
      camera.lookAt(scene.position);

      composer.render();
      // Punch absolute black after bloom so no particle glow can appear inside.
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(pupilOverlayScene, camera);
      renderer.autoClear = true;
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = currentMount.clientWidth;
      const h = currentMount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      if (currentMount && renderer.domElement.parentNode === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      pupilGeometry.dispose();
      pupilMaterial.dispose();
      (pupilOverlayMesh.material as THREE.Material).dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [rebuildKey, resolvedTheme]);

  return (
    <div
      className={cn(
        fullscreen ? "fixed inset-0 h-screen w-screen z-0" : "absolute inset-0 h-full w-full z-0",
        className,
      )}
      style={{ backgroundColor: resolvedTheme === "light" ? "#ffffff" : "#000000" }}
    >
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />
      {showAudioSpectrum && state === "mouvement" ? (
        <canvas
          ref={spectrumCanvasRef}
          className="pointer-events-none absolute bottom-4 left-1/2 z-20 h-40 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm"
          aria-label="Audio spectrum visualizer"
        />
      ) : null}
      {children ? (
        <div className="pointer-events-none relative z-10 flex h-full w-full flex-col">
          <div className="pointer-events-auto">{children}</div>
        </div>
      ) : null}
    </div>
  );
}

export { GenerativeArtSceneV3 as QuantumNebula };
