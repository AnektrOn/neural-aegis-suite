/**
 * GenerativeArtSceneV3 hero backdrop — viewport wave/vortex flow, anti-particles,
 * optional word pupil. Ported from the standalone HTML prototype.
 */
import { useEffect, useRef, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { cn } from "@/lib/utils";
import { getStoredThemeIsDark } from "@/lib/theme";
import {
  buildMetatronTargets,
  buildNeuralMicrograph,
  type QuantumNebulaState,
} from "./quantumNebulaStates";
import {
  buildWordMaskData,
  type QuantumNebulaWordConfig,
} from "./quantumNebulaWordMask";
import {
  defaultViewportFlowTuning,
  initViewportFlowParticles,
  stepViewportFlow,
  VIEWPORT_LIGHT_PARTICLE_SIZE_SCALE,
  VIEWPORT_PARTICLE_FRAGMENT_SHADER,
  VIEWPORT_PARTICLE_VERTEX_SHADER,
  type ViewportFlowMode,
  type ViewportFlowTuning,
} from "./quantumNebulaViewportFlow";

export type QuantumNebulaHeroTheme = "dark" | "light" | "auto";

export interface QuantumNebulaHeroVisualTuning {
  particleCount: number;
  particleSize: number;
  sphereRadius: number;
  pupilRadius: number;
  cameraDistance: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
  reflexionBloomStrength: number;
  reflexionBloomRadius: number;
  reflexionBloomThreshold: number;
}

/** Per-frame word override (scroll story) — read each rAF, do not set React state. */
export interface QuantumNebulaHeroWordDrive {
  text: string;
  offsetX: number;
  offsetY: number;
  reveal: number;
  /** Taille du plan mot (masque canvas) — ex. mobile −33 %. */
  scale?: number;
}

export const DEFAULT_HERO_VISUAL_TUNING: QuantumNebulaHeroVisualTuning = {
  particleCount: 55_000,
  particleSize: 0.054,
  sphereRadius: 1.55,
  pupilRadius: 0.22,
  cameraDistance: 5,
  bloomStrength: 0.56,
  bloomRadius: 0.42,
  bloomThreshold: 0.14,
  reflexionBloomStrength: 0.72,
  reflexionBloomRadius: 0.48,
  reflexionBloomThreshold: 0.1,
};

export interface QuantumNebulaHeroV3Props {
  className?: string;
  fullscreen?: boolean;
  theme?: QuantumNebulaHeroTheme;
  state?: QuantumNebulaState;
  visualTuning?: Partial<QuantumNebulaHeroVisualTuning>;
  flowMode?: ViewportFlowMode;
  flowTuning?: Partial<ViewportFlowTuning>;
  antiParticleColor?: string;
  passBehindWord?: boolean;
  /** Empty text → circular pupil */
  word?: QuantumNebulaWordConfig | null;
  wordDriveRef?: MutableRefObject<QuantumNebulaHeroWordDrive | null>;
  children?: ReactNode;
}

function resolveTheme(theme: QuantumNebulaHeroTheme): "dark" | "light" {
  if (theme === "dark" || theme === "light") return theme;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (root.classList.contains("light")) return "light";
    if (root.classList.contains("dark")) return "dark";
  }
  return getStoredThemeIsDark() ? "dark" : "light";
}

export function QuantumNebulaHeroV3({
  className,
  fullscreen = true,
  theme = "auto",
  state = "repos",
  visualTuning,
  flowMode = "vortex",
  flowTuning,
  antiParticleColor = "#e0dfb1",
  passBehindWord = true,
  word = null,
  wordDriveRef,
  children,
}: QuantumNebulaHeroV3Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const visualRef = useRef({ ...DEFAULT_HERO_VISUAL_TUNING, ...visualTuning });
  visualRef.current = { ...DEFAULT_HERO_VISUAL_TUNING, ...visualTuning };
  const flowTuningRef = useRef({ ...defaultViewportFlowTuning, ...flowTuning });
  flowTuningRef.current = { ...defaultViewportFlowTuning, ...flowTuning };
  const wordRef = useRef(word);
  wordRef.current = word;
  const wordDriveRefStable = useRef(wordDriveRef);
  wordDriveRefStable.current = wordDriveRef;
  const themeRef = useRef(resolveTheme(theme));

  useEffect(() => {
    themeRef.current = resolveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const visual = visualRef.current;
    const resolved = themeRef.current;
    const isLight = resolved === "light";
    const bgHex = isLight ? 0xffffff : 0x000000;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bgHex);

    const camera = new THREE.PerspectiveCamera(
      65,
      Math.max(mount.clientWidth, 1) / Math.max(mount.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.set(0, 0, visual.cameraDistance);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(bgHex, 1);
    renderer.domElement.style.pointerEvents = "none";
    mount.appendChild(renderer.domElement);

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!isLight) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(
          Math.max(1, Math.floor(mount.clientWidth * 0.5)),
          Math.max(1, Math.floor(mount.clientHeight * 0.5)),
        ),
        visual.bloomStrength,
        visual.bloomRadius,
        visual.bloomThreshold,
      );
      composer.addPass(bloomPass);
    }

    const count = Math.max(4000, Math.floor(visual.particleCount));
    const dominant = new THREE.Color(isLight ? 0x0b0f14 : 0x18bec7);
    const anti = new THREE.Color(antiParticleColor);

    const { positions, colors, pointSizes, buffers } = initViewportFlowParticles(
      count,
      9.5,
      4.6,
      dominant,
      anti,
      isLight,
    );
    const velocities = new Float32Array(count * 3);
    const restColors = colors.slice();

    const neural = buildNeuralMicrograph(count, 77, visual.sphereRadius * 0.96, {
      pupilRadius: visual.pupilRadius,
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
    });
    const figureTargets = buildMetatronTargets(count, visual.sphereRadius * 0.95);

    const emptyWord: QuantumNebulaWordConfig = {
      text: "",
      font: "Cinzel",
      scale: 1,
      weight: 500,
      spacingEm: 0,
      italic: false,
      uppercase: true,
      outline: false,
    };
    const wordCfg = word ?? emptyWord;
    let wordMask = buildWordMaskData(wordCfg);
    const wordOffsetX = wordCfg.offsetX ?? 0;
    const wordOffsetY = wordCfg.offsetY ?? 0;

    const sizeScale = isLight ? VIEWPORT_LIGHT_PARTICLE_SIZE_SCALE : 1;
    const pixelRatio = renderer.getPixelRatio();

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_pointSize: {
          value: visual.particleSize * pixelRatio * sizeScale * 34,
        },
        u_pupilRadius: { value: visual.pupilRadius },
        u_wordActive: { value: wordMask.active ? 1 : 0 },
        u_wordReveal: { value: 1 },
        u_wordHalfSize: {
          value: new THREE.Vector2(wordMask.planeW * 0.5, wordMask.planeH * 0.5),
        },
        u_wordCenter: { value: new THREE.Vector2(wordOffsetX, wordOffsetY) },
        u_wordTex: { value: wordMask.texture },
        u_passBehind: { value: passBehindWord ? 1 : 0 },
        u_isLight: { value: isLight ? 1 : 0 },
      },
      vertexShader: VIEWPORT_PARTICLE_VERTEX_SHADER,
      fragmentShader: VIEWPORT_PARTICLE_FRAGMENT_SHADER,
      transparent: true,
      blending: isLight ? THREE.NormalBlending : THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("a_size", new THREE.BufferAttribute(pointSizes, 1));
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    const pupilGeom = new THREE.SphereGeometry(1, 48, 48);
    const pupilMesh = new THREE.Mesh(
      pupilGeom,
      new THREE.MeshBasicMaterial({ color: bgHex, toneMapped: false }),
    );
    pupilMesh.scale.setScalar(visual.pupilRadius);
    pupilMesh.visible = !wordMask.active;
    scene.add(pupilMesh);

    const pupilOverlayScene = new THREE.Scene();
    const pupilOverlayMesh = new THREE.Mesh(
      pupilGeom,
      new THREE.MeshBasicMaterial({
        color: bgHex,
        toneMapped: false,
        depthTest: false,
        depthWrite: false,
      }),
    );
    pupilOverlayMesh.scale.setScalar(visual.pupilRadius);
    pupilOverlayMesh.visible = !wordMask.active;
    pupilOverlayScene.add(pupilOverlayMesh);

    const wordOverlayMaterial = new THREE.MeshBasicMaterial({
      color: bgHex,
      transparent: true,
      opacity: 1,
      alphaTest: 0.22,
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
    });
    const wordOverlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), wordOverlayMaterial);
    wordOverlayMesh.position.set(wordOffsetX, wordOffsetY, 0.01);
    wordOverlayMesh.visible = wordMask.active;
    if (wordMask.active) {
      wordOverlayMesh.scale.set(wordMask.planeW, wordMask.planeH, 1);
      wordOverlayMaterial.alphaMap = wordMask.texture;
    }
    pupilOverlayScene.add(wordOverlayMesh);

    const wordStyleBase = { ...wordCfg };
    let liveText = wordCfg.text;
    let liveScale = wordCfg.scale;
    let liveReveal = 1;
    let wordOffsetLiveX = wordOffsetX;
    let wordOffsetLiveY = wordOffsetY;

    const applyWordLive = (drive: QuantumNebulaHeroWordDrive | null) => {
      const base = wordStyleBase;
      const text = (drive?.text ?? base.text).trim();
      const ox = drive?.offsetX ?? base.offsetX ?? 0;
      const oy = drive?.offsetY ?? base.offsetY ?? 0;
      const reveal = drive?.reveal ?? 1;
      const scale = drive?.scale ?? base.scale;

      if (text !== liveText || scale !== liveScale) {
        liveText = text;
        liveScale = scale;
        if (wordMask.texture) wordMask.texture.dispose();
        wordMask = buildWordMaskData({ ...base, text, scale, offsetX: ox, offsetY: oy });
        particleMaterial.uniforms.u_wordTex.value = wordMask.texture;
        particleMaterial.uniforms.u_wordHalfSize.value.set(
          wordMask.planeW * 0.5,
          wordMask.planeH * 0.5,
        );
        if (wordMask.active) {
          wordOverlayMesh.scale.set(wordMask.planeW, wordMask.planeH, 1);
          wordOverlayMaterial.alphaMap = wordMask.texture;
          wordOverlayMaterial.needsUpdate = true;
        }
        particleMaterial.uniforms.u_wordActive.value = wordMask.active ? 1 : 0;
        pupilMesh.visible = !wordMask.active;
        pupilOverlayMesh.visible = !wordMask.active;
        wordOverlayMesh.visible = wordMask.active;
      }

      wordOffsetLiveX = ox;
      wordOffsetLiveY = oy;
      liveReveal = reveal;
      particleMaterial.uniforms.u_wordCenter.value.set(ox, oy);
      particleMaterial.uniforms.u_wordReveal.value = Math.max(0, Math.min(1, reveal));
      wordOverlayMesh.position.set(ox, oy, 0.01);
      wordOverlayMaterial.opacity = wordMask.active ? reveal : 0;
      wordOverlayMesh.visible = wordMask.active && reveal > 0.03;
    };

    const clock = new THREE.Clock();
    let reflexionMix = 0;
    let vortexMixRef = { current: flowMode === "vortex" ? 1 : 0 };
    let smoothVortexDirRef = { current: flowTuningRef.current.vortexDirMode === "auto" ? 1 : flowTuningRef.current.vortexDirMode };
    const smoothDirRef = { x: 1, y: 0 };
    const colorsDirtyRef = { current: true };
    let bassLevel = 0;
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentState = stateRef.current;
      const targetReflexion = currentState === "reflexion" ? 1 : 0;
      reflexionMix += (targetReflexion - reflexionMix) * 0.075;
      const flowMix = 1 - reflexionMix;
      const figureMix = 0;

      bassLevel *= currentState === "mouvement" ? 0.92 : 0.94;

      if (wordDriveRefStable.current) {
        applyWordLive(wordDriveRefStable.current.current);
      }

      stepViewportFlow({
        count,
        flowMix,
        figureMix,
        reflexionMix,
        elapsedTime: elapsed,
        bassLevel,
        tuning: flowTuningRef.current,
        flowMode,
        positions,
        velocities,
        colors,
        restColors,
        pointSizes,
        buffers,
        figureTargets,
        neural,
        wordMask,
        passBehindWord,
        pupilRadius: visual.pupilRadius,
        smoothVortexDirRef,
        smoothDirRef,
        vortexMixRef,
        colorsDirtyRef,
        reflexionPulseSpeed: 1.85,
        reflexionWaveAmplitude: 0.042,
        reflexionGlowBoost: 0.28,
        reflexionSizePulse: 0.08,
        wordOffsetX: wordOffsetLiveX,
        wordOffsetY: wordOffsetLiveY,
        wordReveal: liveReveal,
      });

      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.a_size.needsUpdate = true;
      particleGeometry.attributes.color.needsUpdate = true;

      if (bloomPass) {
        const baseBloom =
          visual.bloomStrength * flowMix + visual.reflexionBloomStrength * reflexionMix;
        bloomPass.strength += (baseBloom - bloomPass.strength) * 0.1;
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(pupilOverlayScene, camera);
      renderer.autoClear = true;
    };

    const onResize = () => {
      const w = Math.max(mount.clientWidth, 1);
      const h = Math.max(mount.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
    };

    window.addEventListener("resize", onResize);
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      if (wordMask.texture) wordMask.texture.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      pupilGeom.dispose();
      composer?.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [antiParticleColor, flowMode, passBehindWord, theme, word, wordDriveRef]);

  return (
    <div
      className={cn(
        "overflow-hidden bg-black",
        fullscreen ? "fixed inset-0 h-screen w-screen" : "relative h-full w-full",
        className,
      )}
    >
      <div ref={mountRef} className="absolute inset-0 h-full w-full" aria-hidden />
      {children}
    </div>
  );
}

export default QuantumNebulaHeroV3;