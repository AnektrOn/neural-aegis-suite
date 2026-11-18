import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ConversationProvider,
  useConversation,
  useConversationControls,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { ArrowLeft, Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import QuantumNebula, {
  type QuantumNebulaDrive,
  type QuantumNebulaExternalAudio,
  type QuantumNebulaShapeBuilder,
  type QuantumNebulaState,
  type QuantumNebulaVisualTuning,
} from "@/components/ui/quantum-nebula";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { createAgentVoiceSession } from "@/services/agentSessionService";
import { cn } from "@/lib/utils";
import { synthesizeSpectrumFromVolume } from "@/components/voice/voiceAgentSpectrum";
import { getVoiceAgentNebulaVisualTuning } from "@/components/voice/voiceAgentNebulaPresets";
import { WELCOME_NEBULA_VISUAL_TUNING } from "@/features/welcome/components/WelcomeQuantumNebula";
import { LogosClientToolsRegistrar } from "@/features/logos/LogosClientToolsRegistrar";
import type { LogosOpeningInjection } from "@/features/logos/logosSessionInjection";
import { useAuth } from "@/contexts/AuthContext";
import { VoiceFeedbackRecorder } from "@/features/logos/voiceFeedbackService";
import { VoiceFeedbackContext } from "@/features/logos/VoiceFeedbackContext";

type UiPhase = "idle" | "path_choice" | "connecting" | "connected" | "error";
type VoiceAgentLayout = "card" | "welcome";
type VoiceDynamicVariables = Record<string, string | number | boolean>;

export type VoiceAgentLiveOverlayHelpers = {
  endLive: () => void;
  /** Start ElevenLabs (or lab live) after a path / blank choice. */
  startWithChoice: (injection?: LogosOpeningInjection) => void;
};

function resolveFirstName(
  user: NonNullable<ReturnType<typeof useAuth>["user"]> | null | undefined,
  override?: string,
): string {
  if (override?.trim()) return override.trim();
  if (!user) return "toi";
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const candidates = [
    meta?.["first_name"],
    typeof meta?.["full_name"] === "string" ? (meta["full_name"] as string).split(/\s+/)[0] : undefined,
    typeof meta?.["name"] === "string" ? (meta["name"] as string).split(/\s+/)[0] : undefined,
    user.email?.split("@")[0],
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim() && !c.includes("@")) return c.trim();
  }
  return "toi";
}

const welcomeCtaClass =
  "group inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] backdrop-blur-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50";

function VoiceAgentNebulaDrive({
  externalAudioRef,
  driveRef,
  idleBreathe,
  simulateLive,
  pathCardsMorph,
}: {
  externalAudioRef: MutableRefObject<QuantumNebulaExternalAudio>;
  driveRef: MutableRefObject<QuantumNebulaDrive>;
  idleBreathe: number;
  /** Lab: fake “agent speaking” audio drive without ElevenLabs. */
  simulateLive?: boolean;
  /** Lab: morph nebula into three path cards instead of free mouvement. */
  pathCardsMorph?: boolean;
}) {
  const { status } = useConversationStatus();
  const { isSpeaking, isListening } = useConversationMode();
  const {
    getOutputByteFrequencyData,
    getOutputVolume,
    getInputVolume,
  } = useConversationControls();

  const statusRef = useRef(status);
  const speakingRef = useRef(isSpeaking);
  const listeningRef = useRef(isListening);
  const simulateLiveRef = useRef(Boolean(simulateLive));
  const pathCardsMorphRef = useRef(Boolean(pathCardsMorph));
  statusRef.current = status;
  speakingRef.current = isSpeaking;
  listeningRef.current = isListening;
  simulateLiveRef.current = Boolean(simulateLive);
  pathCardsMorphRef.current = Boolean(pathCardsMorph);

  const audioApiRef = useRef({
    getOutputByteFrequencyData,
    getOutputVolume,
    getInputVolume,
  });
  audioApiRef.current = {
    getOutputByteFrequencyData,
    getOutputVolume,
    getInputVolume,
  };

  useEffect(() => {
    let frame = 0;
    const startedAt = performance.now();
    const tick = () => {
      const connected = statusRef.current === "connected";
      const speaking = speakingRef.current;
      const listening = listeningRef.current;
      const api = audioApiRef.current;
      const cardsOverlay =
        simulateLiveRef.current && pathCardsMorphRef.current;

      if (cardsOverlay) {
        // Path chooser uses per-card nebulas — keep fullscreen drive idle.
        externalAudioRef.current.active = false;
        externalAudioRef.current.frequency = null;
        driveRef.current.shapeId = undefined;
        driveRef.current.morphBlend = 0;
        driveRef.current.figureReveal = 0;
        driveRef.current.pupilScale = undefined;
        driveRef.current.turbulence = undefined;
        driveRef.current.centerPull = undefined;
        driveRef.current.spin = undefined;
        driveRef.current.radialScale = undefined;
        driveRef.current.breatheMotion = idleBreathe;
      } else if (simulateLiveRef.current) {
        driveRef.current.shapeId = undefined;
        driveRef.current.morphBlend = 0;
        driveRef.current.figureReveal = 0;
        driveRef.current.pupilScale = undefined;
        driveRef.current.turbulence = undefined;
        driveRef.current.centerPull = undefined;
        driveRef.current.spin = undefined;
        driveRef.current.radialScale = undefined;
        const t = (performance.now() - startedAt) / 1000;
        const volume = 0.28 + 0.22 * (0.5 + 0.5 * Math.sin(t * 2.4));
        externalAudioRef.current.active = true;
        externalAudioRef.current.frequency = synthesizeSpectrumFromVolume(volume);
        driveRef.current.breatheMotion = 0;
      } else if (connected && speaking) {
        driveRef.current.shapeId = undefined;
        driveRef.current.morphBlend = 0;
        driveRef.current.figureReveal = 0;
        externalAudioRef.current.active = true;
        let frequency: Uint8Array | null = null;
        try {
          const raw = api.getOutputByteFrequencyData();
          if (raw?.length) frequency = raw;
        } catch {
          frequency = null;
        }
        if (!frequency?.length) {
          try {
            frequency = synthesizeSpectrumFromVolume(api.getOutputVolume());
          } catch {
            frequency = synthesizeSpectrumFromVolume(0.35);
          }
        }
        externalAudioRef.current.frequency = frequency;
        driveRef.current.breatheMotion = 0;
      } else if (connected && listening) {
        driveRef.current.shapeId = undefined;
        driveRef.current.morphBlend = 0;
        driveRef.current.figureReveal = 0;
        externalAudioRef.current.active = false;
        externalAudioRef.current.frequency = null;
        try {
          driveRef.current.breatheMotion = api.getInputVolume();
        } catch {
          driveRef.current.breatheMotion = 0;
        }
      } else {
        driveRef.current.shapeId = undefined;
        driveRef.current.morphBlend = 0;
        driveRef.current.figureReveal = 0;
        driveRef.current.pupilScale = undefined;
        driveRef.current.turbulence = undefined;
        driveRef.current.centerPull = undefined;
        driveRef.current.spin = undefined;
        driveRef.current.radialScale = undefined;
        externalAudioRef.current.active = false;
        externalAudioRef.current.frequency = null;
        driveRef.current.breatheMotion = idleBreathe;
      }

      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [driveRef, externalAudioRef, idleBreathe]);

  return null;
}

function VoiceAgentNebula({
  externalAudioRef,
  driveRef,
  fullscreen,
  simulateLive,
  matchWelcomeVisual,
  pathCardsMorph,
  shapeLibrary,
  visualTuningOverride,
  hideFullscreenNebula,
}: {
  externalAudioRef: MutableRefObject<QuantumNebulaExternalAudio>;
  driveRef: MutableRefObject<QuantumNebulaDrive>;
  fullscreen: boolean;
  simulateLive?: boolean;
  /** Lab: same visual tuning as WelcomeQuantumNebula. */
  matchWelcomeVisual?: boolean;
  pathCardsMorph?: boolean;
  shapeLibrary?: Record<string, QuantumNebulaShapeBuilder>;
  visualTuningOverride?: Partial<QuantumNebulaVisualTuning>;
  /** Lab: glass path cards supply their own nebulas. */
  hideFullscreenNebula?: boolean;
}) {
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const visualTuning = useMemo(() => {
    const base = matchWelcomeVisual
      ? WELCOME_NEBULA_VISUAL_TUNING
      : getVoiceAgentNebulaVisualTuning();
    return { ...base, ...visualTuningOverride };
  }, [matchWelcomeVisual, visualTuningOverride]);

  const nebulaState: QuantumNebulaState = simulateLive
    ? "mouvement"
    : status !== "connected"
      ? "repos"
      : isSpeaking
        ? "mouvement"
        : "reflexion";

  if (hideFullscreenNebula) {
    return null;
  }

  const nebula = (
    <QuantumNebula
      transparent={!matchWelcomeVisual}
      fullscreen={fullscreen}
      theme="auto"
      state={nebulaState}
      audioSrc={null}
      enableAudioAnalyser={false}
      autoPlayAudio={false}
      externalAudioRef={externalAudioRef}
      driveRef={driveRef}
      shapeLibrary={shapeLibrary}
      visualTuning={visualTuning}
      className={cn("pointer-events-none", fullscreen ? "z-0" : undefined)}
    />
  );

  if (fullscreen) return nebula;

  return (
    <div className="relative h-56 w-full overflow-hidden rounded-md sm:h-72">{nebula}</div>
  );
}

function VoiceAgentControls({
  onPhase,
  layout,
  errorMessage,
  dynamicVariables,
  enableCall,
  simulateLive,
  requirePathChoice,
  startSessionRef,
  bindOnly = false,
}: {
  onPhase: (p: UiPhase, message?: string) => void;
  layout: VoiceAgentLayout;
  errorMessage?: string | null;
  dynamicVariables: VoiceDynamicVariables;
  enableCall: boolean;
  /** Lab preview: UI treats session as live without ElevenLabs. */
  simulateLive: boolean;
  /** Welcome: Start opens path chooser before minting a session. */
  requirePathChoice: boolean;
  /** Exposes start-with-injection to the path chooser overlay. */
  startSessionRef?: MutableRefObject<
    ((injection?: LogosOpeningInjection) => Promise<void>) | null
  >;
  /** Mount session start binder without rendering mic CTAs. */
  bindOnly?: boolean;
}) {
  const { t } = useLanguage();
  const { startSession, endSession } = useConversationControls();
  const beginFeedback = useContext(VoiceFeedbackContext);
  const { status } = useConversationStatus();
  const { isSpeaking, isListening, isMuted, setMuted } = useConversation();
  const [busy, setBusy] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const dynamicVariablesRef = useRef(dynamicVariables);
  dynamicVariablesRef.current = dynamicVariables;

  const end = useCallback(async () => {
    const afterEnd: UiPhase = requirePathChoice ? "path_choice" : "idle";
    if (!enableCall) {
      onPhase(afterEnd);
      return;
    }
    setBusy(true);
    try {
      await endSession();
      onPhase(afterEnd);
      setErrorDetail(null);
    } finally {
      setBusy(false);
    }
  }, [enableCall, endSession, onPhase, requirePathChoice]);

  const startWithInjection = useCallback(
    async (injection?: LogosOpeningInjection) => {
      if (!enableCall) {
        onPhase("connected");
        return;
      }
      setBusy(true);
      setErrorDetail(null);
      onPhase("connecting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());

        const { conversation_token } = await createAgentVoiceSession();
        const vars: VoiceDynamicVariables = {
          first_name: "toi",
          ...dynamicVariablesRef.current,
          ...injection?.dynamicVariables,
        };
        if (!String(vars.first_name || "").trim()) vars.first_name = "toi";
        if (vars.session_mode == null) vars.session_mode = "open";
        if (vars.opening_prompt == null) vars.opening_prompt = "";
        beginFeedback?.(injection?.feedbackContext);
        startSession({
          conversationToken: conversation_token,
          dynamicVariables: vars,
          ...(injection?.overrides ? { overrides: injection.overrides } : {}),
        });
        onPhase("connected");
      } catch (e) {
        const msg = e instanceof Error ? e.message : t("voiceAgent.errorGeneric");
        onPhase("error", msg);
      } finally {
        setBusy(false);
      }
    },
    [beginFeedback, enableCall, onPhase, startSession, t],
  );

  useEffect(() => {
    if (!startSessionRef) return;
    startSessionRef.current = startWithInjection;
    return () => {
      startSessionRef.current = null;
    };
  }, [startSessionRef, startWithInjection]);

  const start = useCallback(async () => {
    if (requirePathChoice) {
      onPhase("path_choice");
      return;
    }
    if (!enableCall) {
      onPhase("connected");
      return;
    }
    await startWithInjection();
  }, [enableCall, onPhase, requirePathChoice, startWithInjection]);

  const connected = enableCall ? status === "connected" : simulateLive;
  const connecting = enableCall && (status === "connecting" || busy);
  const statusLabel = connected
    ? !enableCall
      ? t("voiceAgent.statusSpeaking")
      : isSpeaking
        ? t("voiceAgent.statusSpeaking")
        : isListening
          ? t("voiceAgent.statusListening")
          : t("voiceAgent.statusConnected")
    : connecting
      ? t("voiceAgent.connecting")
      : null;

  if (bindOnly) return null;

  if (layout === "welcome") {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        {statusLabel ? (
          <p className="font-display text-[10px] uppercase tracking-[0.28em] text-muted-foreground" role="status">
            {statusLabel}
          </p>
        ) : null}
        {errorDetail || errorMessage ? (
          <p className="max-w-sm text-center text-xs text-destructive" role="alert">
            {errorDetail ?? errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {connected ? (
            <>
              <button
                type="button"
                disabled={busy || !enableCall}
                onClick={() => setMuted(!isMuted)}
                className={cn(
                  welcomeCtaClass,
                  "border-border/30 bg-background/20 text-muted-foreground hover:border-border/50 hover:text-foreground",
                )}
              >
                {isMuted ? <MicOff size={12} strokeWidth={1.75} aria-hidden /> : <Mic size={12} strokeWidth={1.75} aria-hidden />}
                {isMuted ? t("voiceAgent.unmute") : t("voiceAgent.mute")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void end()}
                className={cn(
                  welcomeCtaClass,
                  "border-primary/25 bg-primary/10 text-primary hover:border-primary/40 hover:bg-primary/15",
                )}
              >
                {busy ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden />
                ) : (
                  <PhoneOff size={12} strokeWidth={1.75} aria-hidden />
                )}
                {t("voiceAgent.end")}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={connecting}
              onClick={() => void start()}
              className={cn(
                welcomeCtaClass,
                "border-primary/25 bg-primary/10 text-primary hover:border-primary/40 hover:bg-primary/15",
              )}
            >
              {connecting ? (
                <Loader2 size={12} className="animate-spin" aria-hidden />
              ) : (
                <Mic size={12} strokeWidth={1.75} className="opacity-80" aria-hidden />
              )}
              {connecting ? t("voiceAgent.connecting") : t("voiceAgent.start")}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground" role="status">
          {statusLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => setMuted(!isMuted)}>
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isMuted ? t("voiceAgent.unmute") : t("voiceAgent.mute")}
          </Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={() => void end()}>
            <PhoneOff className="h-4 w-4" />
            {t("voiceAgent.end")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" disabled={connecting} onClick={() => void start()}>
        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        {connecting ? t("voiceAgent.connecting") : t("voiceAgent.start")}
      </Button>
      {errorDetail ? (
        <p className="text-sm text-destructive" role="alert">
          {errorDetail}
        </p>
      ) : null}
    </div>
  );
}

function VoiceAgentWelcomeHud({
  title,
  debugFooter,
  backHref,
  showHero,
  phase,
  onPhase,
  errorMessage,
  dynamicVariables,
  enableCall,
  simulateLive,
  matchWelcomeVisual,
  hideHeroTitle,
  pathCardsMorph,
  requirePathChoice,
  shapeLibrary,
  visualTuningOverride,
  liveOverlay,
}: {
  title: string;
  debugFooter?: ReactNode;
  backHref: string;
  showHero: boolean;
  phase: UiPhase;
  onPhase: (p: UiPhase, message?: string) => void;
  errorMessage?: string | null;
  dynamicVariables: VoiceDynamicVariables;
  enableCall: boolean;
  simulateLive: boolean;
  matchWelcomeVisual: boolean;
  hideHeroTitle: boolean;
  pathCardsMorph: boolean;
  requirePathChoice: boolean;
  shapeLibrary?: Record<string, QuantumNebulaShapeBuilder>;
  visualTuningOverride?: Partial<QuantumNebulaVisualTuning>;
  liveOverlay?: (helpers: VoiceAgentLiveOverlayHelpers) => ReactNode;
}) {
  const { t } = useLanguage();
  const { reduceMotion } = useAegisMotion();
  const externalAudioRef = useRef<QuantumNebulaExternalAudio>({
    active: false,
    frequency: null,
  });
  const driveRef = useRef<QuantumNebulaDrive>({});
  const startSessionRef = useRef<
    ((injection?: LogosOpeningInjection) => Promise<void>) | null
  >(null);
  const showTitle = showHero && !hideHeroTitle && Boolean(title.trim());
  const showPathChooser = Boolean(
    pathCardsMorph &&
      liveOverlay &&
      (phase === "path_choice" || simulateLive),
  );
  const endLive = useCallback(() => onPhase("idle"), [onPhase]);
  const startWithChoice = useCallback(
    (injection?: LogosOpeningInjection) => {
      void startSessionRef.current?.(injection);
    },
    [],
  );

  return (
    <div
      className={cn(
        "welcome-hud relative flex min-h-[100dvh] flex-col overflow-hidden",
        showPathChooser && "bg-black",
      )}
    >
      <VoiceAgentNebulaDrive
        externalAudioRef={externalAudioRef}
        driveRef={driveRef}
        idleBreathe={matchWelcomeVisual ? 0 : 0.16}
        simulateLive={simulateLive}
        pathCardsMorph={pathCardsMorph}
      />
      <VoiceAgentNebula
        externalAudioRef={externalAudioRef}
        driveRef={driveRef}
        fullscreen
        simulateLive={simulateLive}
        matchWelcomeVisual={matchWelcomeVisual}
        pathCardsMorph={pathCardsMorph}
        shapeLibrary={shapeLibrary}
        visualTuningOverride={visualTuningOverride}
        hideFullscreenNebula={showPathChooser}
      />
      {showPathChooser ? (
        <div className="pointer-events-none fixed inset-0 z-0 bg-black" aria-hidden />
      ) : (
        <div className="welcome-hud-bg" aria-hidden />
      )}

      {showPathChooser ? liveOverlay?.({ endLive, startWithChoice }) : null}

      <div
        className={cn(
          "relative z-10 flex min-h-[100dvh] w-full flex-col items-center px-5 sm:px-6",
          showPathChooser && "pointer-events-none",
        )}
      >
        <header
          className={cn(
            "flex w-full max-w-md flex-col items-center pt-[max(1.5rem,env(safe-area-inset-top))]",
            showPathChooser && "opacity-0",
          )}
        >
          <Link
            to={backHref}
            className="pointer-events-auto mb-4 inline-flex items-center gap-1.5 self-start font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {t("welcome.voiceAgent.back")}
          </Link>
          <AegisLogo
            alt="AEGIS"
            className="h-10 w-10 rounded-lg object-contain"
            width={40}
            height={40}
          />
          <p className="mt-2.5 font-display text-[10px] uppercase tracking-[0.38em] text-muted-foreground">
            Neural Aegis
          </p>
          <p className="mt-3 font-display text-[10px] uppercase tracking-[0.3em] text-primary/80">
            {t("welcome.voiceAgent.hudEyebrow")}
          </p>
        </header>

        <main className="relative flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {showTitle ? (
              <motion.div
                key="hero"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: reduceMotion ? 0 : 0.28 }}
                className="relative flex w-full flex-col items-center"
              >
                <div className="welcome-hud-hero-glow" aria-hidden />
                <h1 className="relative mx-auto max-w-[11.5rem] font-cormorant-display text-[2.5rem] leading-[1.05] tracking-tight text-foreground sm:max-w-none sm:text-5xl">
                  {title}
                </h1>
              </motion.div>
            ) : (
              <motion.div
                key="live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative h-px w-full"
                aria-hidden
              />
            )}
          </AnimatePresence>
          {errorMessage && showHero ? (
            <p className="relative mt-4 text-sm text-destructive" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </main>

        {!showPathChooser ? (
          <footer className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
            {showHero && debugFooter ? (
              <div className="w-full max-w-sm px-1 text-center">{debugFooter}</div>
            ) : null}
            <VoiceAgentControls
              onPhase={onPhase}
              layout="welcome"
              errorMessage={!showHero ? errorMessage : null}
              dynamicVariables={dynamicVariables}
              enableCall={enableCall}
              simulateLive={simulateLive}
              requirePathChoice={requirePathChoice}
              startSessionRef={startSessionRef}
            />
          </footer>
        ) : null}
        {showPathChooser ? (
          <VoiceAgentControls
            onPhase={onPhase}
            layout="welcome"
            errorMessage={null}
            dynamicVariables={dynamicVariables}
            enableCall={enableCall}
            simulateLive={simulateLive}
            requirePathChoice={requirePathChoice}
            startSessionRef={startSessionRef}
            bindOnly
          />
        ) : null}
      </div>
    </div>
  );
}

function VoiceAgentCard({
  className,
  onPhase,
  errorMessage,
  dynamicVariables,
  enableCall,
  simulateLive,
}: {
  className?: string;
  onPhase: (p: UiPhase, message?: string) => void;
  errorMessage?: string | null;
  dynamicVariables: VoiceDynamicVariables;
  enableCall: boolean;
  simulateLive: boolean;
}) {
  const { t } = useLanguage();
  const externalAudioRef = useRef<QuantumNebulaExternalAudio>({
    active: false,
    frequency: null,
  });
  const driveRef = useRef<QuantumNebulaDrive>({});

  return (
    <section
      className={cn("rounded-lg border border-border bg-card p-4 shadow-sm", className)}
      aria-label={t("voiceAgent.sectionLabel")}
    >
      <h2 className="text-base font-semibold text-foreground">{t("voiceAgent.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("voiceAgent.subtitle")}</p>
      {errorMessage ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="mt-4">
        <VoiceAgentNebulaDrive
          externalAudioRef={externalAudioRef}
          driveRef={driveRef}
          idleBreathe={0}
          simulateLive={simulateLive}
        />
        <VoiceAgentNebula
          externalAudioRef={externalAudioRef}
          driveRef={driveRef}
          fullscreen={false}
          simulateLive={simulateLive}
        />
      </div>
      <div className="mt-4">
        <VoiceAgentControls
          onPhase={onPhase}
          layout="card"
          dynamicVariables={dynamicVariables}
          enableCall={enableCall}
          simulateLive={simulateLive}
          requirePathChoice={false}
        />
      </div>
    </section>
  );
}

export type VoiceAgentProps = {
  className?: string;
  layout?: VoiceAgentLayout;
  /** Welcome layout — hero title (e.g. Hello, {name}). Empty / hideHeroTitle → no title. */
  welcomeTitle?: string;
  backHref?: string;
  /** Shown above the start CTA while hero is visible (e.g. dev agent id). */
  debugFooter?: ReactNode;
  /** Optional override; VoiceAgent always resolves first_name itself as fallback. */
  dynamicVariables?: VoiceDynamicVariables;
  /** When false, keep HUD / nebula / CTA chrome but never start an ElevenLabs session. */
  enableCall?: boolean;
  /** Use Welcome nebula visual tuning (sphere/camera). */
  matchWelcomeVisual?: boolean;
  /** Hide the welcome hero title entirely. */
  hideHeroTitle?: boolean;
  /** Morph into path cards during path_choice / simulated live. */
  pathCardsMorph?: boolean;
  /** Start CTA opens path chooser before creating an ElevenLabs session. */
  requirePathChoice?: boolean;
  shapeLibrary?: Record<string, QuantumNebulaShapeBuilder>;
  visualTuning?: Partial<QuantumNebulaVisualTuning>;
  /** Path chooser / live overlay (path_choice or lab simulateLive). */
  liveOverlay?: (helpers: VoiceAgentLiveOverlayHelpers) => ReactNode;
  onPhaseChange?: (phase: UiPhase) => void;
};

export type VoiceAgentUiPhase = UiPhase;

export function VoiceAgent({
  className,
  layout = "card",
  welcomeTitle,
  backHref = "/welcome",
  debugFooter,
  dynamicVariables,
  enableCall = true,
  matchWelcomeVisual = false,
  hideHeroTitle = false,
  pathCardsMorph = false,
  requirePathChoice = false,
  shapeLibrary,
  visualTuning,
  liveOverlay,
  onPhaseChange,
}: VoiceAgentProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  // Welcome already has "Talk to my agent" — land on path chooser, skip a second Start.
  const [phase, setPhase] = useState<UiPhase>(
    requirePathChoice ? "path_choice" : "idle",
  );
  const [phaseMessage, setPhaseMessage] = useState<string | null>(null);
  const recorder = useMemo(() => user && enableCall
    ? new VoiceFeedbackRecorder(user.id, (error) => console.error("Voice feedback save failed", error))
    : null, [user?.id, enableCall]);
  useEffect(() => () => recorder?.finish(), [recorder]);

  const onPhase = useCallback(
    (p: UiPhase, message?: string) => {
      setPhase(p);
      setPhaseMessage(message ?? null);
      onPhaseChange?.(p);
    },
    [onPhaseChange],
  );

  const resolvedDynamicVariables = useMemo<VoiceDynamicVariables>(() => {
    const fromProp =
      typeof dynamicVariables?.first_name === "string"
        ? dynamicVariables.first_name
        : undefined;
    return {
      session_mode: "open",
      opening_prompt: "",
      ...dynamicVariables,
      first_name: resolveFirstName(user, fromProp),
    };
  }, [dynamicVariables, user]);

  const title = hideHeroTitle ? "" : (welcomeTitle ?? t("voiceAgent.title"));
  const showHero = phase === "idle" || phase === "error";
  const simulateLive = !enableCall && phase === "connected";

  return (
    <VoiceFeedbackContext.Provider value={recorder ? (context) => recorder.begin(context) : null}>
    <ConversationProvider
      dynamicVariables={resolvedDynamicVariables}
      onConnect={({ conversationId }) => recorder?.connect(conversationId)}
      onMessage={(event) => recorder?.message(event)}
      onDisconnect={() => { recorder?.finish(); onPhase("idle"); }}
      onError={(error) => {
        recorder?.finish();
        setPhase("error");
        const msg =
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : t("voiceAgent.errorGeneric");
        setPhaseMessage(msg);
        onPhaseChange?.("error");
      }}
    >
      {enableCall ? <LogosClientToolsRegistrar /> : null}
      {layout === "welcome" ? (
        <VoiceAgentWelcomeHud
          title={title}
          debugFooter={debugFooter}
          backHref={backHref}
          showHero={showHero}
          phase={phase}
          onPhase={onPhase}
          errorMessage={phase === "error" ? phaseMessage : null}
          dynamicVariables={resolvedDynamicVariables}
          enableCall={enableCall}
          simulateLive={simulateLive}
          matchWelcomeVisual={matchWelcomeVisual}
          hideHeroTitle={hideHeroTitle}
          pathCardsMorph={pathCardsMorph}
          requirePathChoice={requirePathChoice}
          shapeLibrary={shapeLibrary}
          visualTuningOverride={visualTuning}
          liveOverlay={liveOverlay}
        />
      ) : (
        <VoiceAgentCard
          className={className}
          onPhase={onPhase}
          errorMessage={phase === "error" ? phaseMessage : null}
          dynamicVariables={resolvedDynamicVariables}
          enableCall={enableCall}
          simulateLive={simulateLive}
        />
      )}
    </ConversationProvider>
    </VoiceFeedbackContext.Provider>
  );
}
