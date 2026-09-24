import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { INTRO_CHAPTERS } from "./intro.copy";
import { useIntroMachine } from "./useIntroMachine";
import { useHoldProgress } from "./useHoldProgress";
import { markIntroSeen } from "./introSeen";
import IntroOverlay from "./IntroOverlay";
import IntroFallback from "./IntroFallback";

const IntroStage = lazy(() => import("./IntroStage"));

const TITLE_MS = 3200;
const NARRATE_LINE_MS = 1700;
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

export default function IntroPage() {
  const navigate = useNavigate();
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [env] = useState(() => ({
    cinematic: supportsWebGL() && !matches("(prefers-reduced-motion: reduce)"),
    isTouch: matches("(pointer: coarse)"),
    lowPower: matches("(pointer: coarse)") || matches("(max-width: 768px)"),
  }));

  const [state, dispatch] = useIntroMachine(INTRO_CHAPTERS.length);
  const chapter = INTRO_CHAPTERS[state.chapterIndex];

  const onInteractDone = useCallback(() => dispatch({ type: "INTERACT_DONE" }), [dispatch]);
  const hold = useHoldProgress({ enabled: state.phase === "interact", onComplete: onInteractDone });

  const finish = useCallback(() => {
    markIntroSeen();
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (state.phase === "chapterTitle" || state.phase === "entry") hold.current.progress = 0;
    if (state.phase === "end") hold.current.progress = 1;
  }, [state.phase, state.chapterIndex, hold]);

  useEffect(() => {
    if (state.phase === "chapterTitle") {
      const id = window.setTimeout(() => dispatch({ type: "TITLE_DONE" }), TITLE_MS);
      return () => window.clearTimeout(id);
    }
    if (state.phase === "end") markIntroSeen();
  }, [state.phase, state.chapterIndex, chapter, dispatch]);

  useEffect(() => {
    if (state.chapterIndex === INTRO_CHAPTERS.length - 1) void import("@/pages/Landing");
  }, [state.chapterIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") dispatch({ type: "SKIP_CHAPTER" });
      if (e.key === "Enter" && state.phase === "entry") dispatch({ type: "ENTER" });
      if (e.key === "Enter" && state.phase === "narrate") dispatch({ type: "NARRATE_DONE" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, dispatch, state.phase]);

  if (!env.cinematic) return <IntroFallback isFR={isFR} onFinish={finish} />;

  // Storm -> ocean is a continuous light transition, so the veil stays thin around it.
  const lightBridge =
    (state.phase === "narrate" && chapter?.id === "storm") || (state.phase === "chapterTitle" && chapter?.id === "current");
  const veilClass = lightBridge
    ? "opacity-20"
    : state.phase === "chapterTitle"
      ? "opacity-60"
      : state.phase === "narrate"
        ? "opacity-55"
        : state.phase === "entry" || state.phase === "end"
          ? "opacity-40"
          : "opacity-0";

  const stageChapter =
    state.phase === "entry" ? "storm" : state.phase === "end" ? "roots" : (chapter?.id ?? "storm");

  return (
    <div
      className={`relative h-[100dvh] touch-none overflow-hidden bg-[#05060a] ${
        state.phase === "interact" ? "cursor-none" : ""
      }`}
    >
      <Suspense fallback={null}>
        <IntroStage chapter={stageChapter} hold={hold} lowPower={env.lowPower} className="absolute inset-0 z-0" />
      </Suspense>
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-[#05060a] transition-opacity duration-1000 ${veilClass}`}
      />
      {state.phase === "chapterTitle" && chapter?.id === "current" ? (
        <motion.div
          key="light-bridge"
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: "radial-gradient(ellipse at 50% 45%, hsl(40 90% 88%) 0%, hsl(30 70% 62%) 55%, hsl(20 45% 30%) 100%)" }}
        />
      ) : null}
      <IntroOverlay
        state={state}
        hold={hold}
        isFR={isFR}
        isTouch={env.isTouch}
        narrateLineMs={NARRATE_LINE_MS}
        onEnter={() => dispatch({ type: "ENTER" })}
        onNext={() => dispatch({ type: "NARRATE_DONE" })}
        onSkipChapter={() => dispatch({ type: "SKIP_CHAPTER" })}
        onSkipIntro={finish}
        onFinish={finish}
        onRestart={() => dispatch({ type: "RESTART" })}
      />
    </div>
  );
}
