import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIntroMachine } from "@/features/intro/useIntroMachine";
import { useHoldProgress } from "@/features/intro/useHoldProgress";
import { useIntroAudio } from "@/features/intro/useIntroAudio";
import { INTRO_V2_CHAPTERS, type IntroV2ChapterId } from "./introV2Copy";
import IntroV2Overlay from "./IntroV2Overlay";
import IntroV2Fallback from "./IntroV2Fallback";
import { INTRO_V2_PALETTE } from "./introV2Palette";
import { INTRO_V2_ASTEROIDS_HOLD_SEC } from "./introV2AsteroidsPreset";
import { INTRO_V2_FLOW_HOLD_SEC } from "./introV2FlowPreset";
import {
  FLOW_GPGPU_DEV_DEFAULT,
  FlowGpgpuPlaygroundPanel,
  type FlowGpgpuDevState,
} from "./FlowGpgpuPlaygroundPanel";
import { toast } from "sonner";
import { INTRO_V2_NEURAL_HOLD_SEC } from "./introV2NeuralPreset";
import { INTRO_V2_SCULPTURE_HOLD_SEC } from "./introV2SculpturePreset";
import { useIntroViewportHeight } from "./useIntroViewportHeight";
import { markIntroSeen } from "@/features/intro/introSeen";

type IntroV2Variant = "lab" | "production";

function holdDurationForChapter(id: IntroV2ChapterId | undefined): number {
  switch (id) {
    case "asteroids":
      return INTRO_V2_ASTEROIDS_HOLD_SEC;
    case "sculpture":
      return INTRO_V2_SCULPTURE_HOLD_SEC;
    case "flow":
      return INTRO_V2_FLOW_HOLD_SEC;
    case "neural":
      return INTRO_V2_NEURAL_HOLD_SEC;
    default:
      return 3.2;
  }
}

const IntroV2Stage = lazy(() => import("./IntroV2Stage"));

const TITLE_MS = 3200;
const NARRATE_LINE_MS = 2400;

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function matches(query: string): boolean {
  return typeof window !== "undefined" && window.matchMedia?.(query).matches === true;
}

export default function IntroV2Page({ variant = "lab" }: { variant?: IntroV2Variant }) {
  const isProduction = variant === "production";
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [env] = useState(() => ({
    cinematic: supportsWebGL() && !matches("(prefers-reduced-motion: reduce)"),
    isTouch: matches("(pointer: coarse)"),
    lowPower: matches("(pointer: coarse)") || matches("(max-width: 768px)"),
  }));
  const [flowPlaygroundOpen, setFlowPlaygroundOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("flowTune") === "1",
  );
  const [flowDev, setFlowDev] = useState<FlowGpgpuDevState>(FLOW_GPGPU_DEV_DEFAULT);
  const viewportHeight = useIntroViewportHeight();

  const [state, dispatch] = useIntroMachine(INTRO_V2_CHAPTERS.length);
  const chapter = INTRO_V2_CHAPTERS[state.chapterIndex];

  const onInteractDone = useCallback(() => dispatch({ type: "INTERACT_DONE" }), [dispatch]);
  const holdDurationSec = holdDurationForChapter(chapter?.id);
  const hold = useHoldProgress({
    enabled: state.phase === "interact",
    duration: holdDurationSec,
    onComplete: onInteractDone,
  });

  const audio = useIntroAudio();
  const { playVoice, stopVoice, start: startAudio } = audio;

  const enter = useCallback(() => {
    startAudio();
    dispatch({ type: "ENTER" });
  }, [startAudio, dispatch]);

  const finish = useCallback(() => {
    if (isProduction) markIntroSeen();
    navigate(isProduction ? "/" : "/dev", { replace: true });
  }, [isProduction, navigate]);

  const enterAegis = useCallback(() => {
    if (isProduction) markIntroSeen();
    navigate("/", { replace: true });
  }, [isProduction, navigate]);

  useEffect(() => {
    if (state.phase === "chapterTitle" || state.phase === "entry") {
      hold.current.progress = 0;
      hold.current.latched = 0;
    }
    if (state.phase === "end") {
      hold.current.progress = 1;
      hold.current.latched = 1;
    }
  }, [state.phase, state.chapterIndex, hold]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
    };
  }, []);

  useEffect(() => {
    if (state.phase === "chapterTitle" && chapter) playVoice(chapter.id);
    if (state.phase === "entry" || state.phase === "end") stopVoice();
  }, [state.phase, chapter, playVoice, stopVoice]);

  useEffect(() => {
    if (state.phase === "chapterTitle") {
      const id = window.setTimeout(() => dispatch({ type: "TITLE_DONE" }), TITLE_MS);
      return () => window.clearTimeout(id);
    }
    if (isProduction && state.phase === "end") markIntroSeen();
  }, [state.phase, state.chapterIndex, chapter, dispatch, isProduction]);

  useEffect(() => {
    if (isProduction && state.chapterIndex === INTRO_V2_CHAPTERS.length - 1) {
      void import("@/pages/Landing");
    }
  }, [isProduction, state.chapterIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") dispatch({ type: "SKIP_CHAPTER" });
      if (e.key === "Enter" && state.phase === "entry") enter();
      if (e.key === "Enter" && state.phase === "narrate") dispatch({ type: "NARRATE_DONE" });
      if (
        !isProduction &&
        (e.key === "t" || e.key === "T") &&
        chapter?.id === "flow" &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        setFlowPlaygroundOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, dispatch, enter, state.phase, chapter?.id, isProduction]);

  const copyFlowJson = async (keyframes: object) => {
    const payload = {
      scene: "intro-v2-flow",
      holdDurationSec: INTRO_V2_FLOW_HOLD_SEC,
      holdAnimEnabled: flowDev.holdAnimEnabled === true,
      live: {
        focus: flowDev.focus,
        aperture: flowDev.aperture,
        simSize: flowDev.simSize,
        speed: flowDev.speed,
      },
      keyframes,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success(isFR ? "Réglages copiés (JSON)" : "Settings copied (JSON)");
    } catch {
      toast.error(isFR ? "Copie impossible" : "Could not copy");
    }
  };

  if (!env.cinematic) return <IntroV2Fallback isFR={isFR} onFinish={isProduction ? enterAegis : undefined} />;

  const veilClass =
    state.phase === "chapterTitle"
      ? "opacity-60"
      : state.phase === "narrate"
        ? "opacity-55"
        : state.phase === "entry" || state.phase === "end"
          ? "opacity-40"
          : "opacity-0";

  const stageChapter: IntroV2ChapterId | null =
    state.phase === "entry"
      ? "asteroids"
      : state.phase === "end"
        ? "neural"
        : (chapter?.id ?? "asteroids");

  const pageBg =
    stageChapter === "sculpture" && state.phase !== "entry" && state.phase !== "end"
      ? "#000000"
      : INTRO_V2_PALETTE.heroBgCss;

  const shellHeight =
    viewportHeight != null ? `${viewportHeight}px` : undefined;

  return (
    <div
      className={`relative min-h-[100svh] h-[100dvh] touch-none overflow-hidden overscroll-none ${
        state.phase === "interact" && !env.isTouch ? "cursor-none" : ""
      }`}
      style={{
        backgroundColor: pageBg,
        height: shellHeight,
        minHeight: shellHeight ?? undefined,
      }}
    >
      <Suspense fallback={null}>
        <IntroV2Stage
          chapter={stageChapter}
          hold={hold}
          phase={state.phase}
          lowPower={env.lowPower}
          className="absolute inset-0 z-0"
          flowDevKnobs={!isProduction && stageChapter === "flow" && flowPlaygroundOpen ? flowDev : undefined}
        />
      </Suspense>
      <div
        className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-1000 ${veilClass}`}
        style={{ backgroundColor: INTRO_V2_PALETTE.heroBgCss }}
      />
      {!isProduction && chapter?.id === "flow" && (
        <button
          type="button"
          data-intro-hold-ignore
          onClick={() => setFlowPlaygroundOpen((o) => !o)}
          className="pointer-events-auto fixed left-[max(1rem,env(safe-area-inset-left,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] z-[60] rounded-md border border-white/20 bg-black/50 px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm transition hover:bg-black/70"
        >
          {flowPlaygroundOpen
            ? isFR
              ? "Masquer réglages (T)"
              : "Hide tuning (T)"
            : isFR
              ? "Réglages flux (T)"
              : "Flow tuning (T)"}
        </button>
      )}
      {!isProduction && chapter?.id === "flow" && flowPlaygroundOpen ? (
        <div className="pointer-events-auto fixed left-0 top-12 z-[55] max-h-[calc(100dvh-3rem)]">
          <FlowGpgpuPlaygroundPanel
            fr={isFR}
            state={flowDev}
            onChange={(partial) => setFlowDev((prev) => ({ ...prev, ...partial }))}
            onReset={() => setFlowDev(FLOW_GPGPU_DEV_DEFAULT)}
            onCopyJson={(keyframes) => void copyFlowJson(keyframes)}
            showHoldDuration={false}
            className="max-h-[calc(100dvh-3rem)] w-[min(100vw,22rem)] overflow-y-auto border-r border-white/15 bg-[#0a0d12]/92 p-4 backdrop-blur-md"
          />
        </div>
      ) : null}
      <IntroV2Overlay
        state={state}
        hold={hold}
        isFR={isFR}
        isTouch={env.isTouch}
        narrateLineMs={NARRATE_LINE_MS}
        audioPrefs={audio.prefs}
        onToggleMusic={() => audio.setMusic(!audio.prefs.music)}
        onEnter={enter}
        onNext={() => dispatch({ type: "NARRATE_DONE" })}
        onSkipChapter={() => dispatch({ type: "SKIP_CHAPTER" })}
        onSkipIntro={finish}
        onFinish={enterAegis}
        onRestart={() => dispatch({ type: "RESTART" })}
      />
    </div>
  );
}
