import {
  useCallback,
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
  type QuantumNebulaState,
} from "@/components/ui/quantum-nebula";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { createAgentVoiceSession } from "@/services/agentSessionService";
import { cn } from "@/lib/utils";
import { synthesizeSpectrumFromVolume } from "@/components/voice/voiceAgentSpectrum";
import { getVoiceAgentNebulaVisualTuning } from "@/components/voice/voiceAgentNebulaPresets";

type UiPhase = "idle" | "connecting" | "connected" | "error";
type VoiceAgentLayout = "card" | "welcome";

const welcomeCtaClass =
  "group inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] backdrop-blur-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50";

function VoiceAgentNebulaDrive({
  externalAudioRef,
  driveRef,
  idleBreathe,
}: {
  externalAudioRef: MutableRefObject<QuantumNebulaExternalAudio>;
  driveRef: MutableRefObject<QuantumNebulaDrive>;
  idleBreathe: number;
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
  statusRef.current = status;
  speakingRef.current = isSpeaking;
  listeningRef.current = isListening;

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
    const tick = () => {
      const connected = statusRef.current === "connected";
      const speaking = speakingRef.current;
      const listening = listeningRef.current;
      const api = audioApiRef.current;

      if (connected && speaking) {
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
        externalAudioRef.current.active = false;
        externalAudioRef.current.frequency = null;
        try {
          driveRef.current.breatheMotion = api.getInputVolume();
        } catch {
          driveRef.current.breatheMotion = 0;
        }
      } else {
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
}: {
  externalAudioRef: MutableRefObject<QuantumNebulaExternalAudio>;
  driveRef: MutableRefObject<QuantumNebulaDrive>;
  fullscreen: boolean;
}) {
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const visualTuning = useMemo(() => getVoiceAgentNebulaVisualTuning(), []);

  const nebulaState: QuantumNebulaState =
    status !== "connected" ? "repos" : isSpeaking ? "mouvement" : "reflexion";

  const nebula = (
    <QuantumNebula
      transparent
      fullscreen={fullscreen}
      theme="auto"
      state={nebulaState}
      audioSrc={null}
      enableAudioAnalyser={false}
      autoPlayAudio={false}
      externalAudioRef={externalAudioRef}
      driveRef={driveRef}
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
}: {
  onPhase: (p: UiPhase, message?: string) => void;
  layout: VoiceAgentLayout;
  errorMessage?: string | null;
}) {
  const { t } = useLanguage();
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking, isListening, isMuted, setMuted } = useConversation();
  const [busy, setBusy] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const end = useCallback(async () => {
    setBusy(true);
    try {
      await endSession();
      onPhase("idle");
      setErrorDetail(null);
    } finally {
      setBusy(false);
    }
  }, [endSession, onPhase]);

  const start = useCallback(async () => {
    setBusy(true);
    setErrorDetail(null);
    onPhase("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      const { conversation_token } = await createAgentVoiceSession();
      await startSession({
        conversationToken: conversation_token,
      });
      onPhase("connected");
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("voiceAgent.errorGeneric");
      onPhase("error", msg);
    } finally {
      setBusy(false);
    }
  }, [onPhase, startSession, t]);

  const connected = status === "connected";
  const connecting = status === "connecting" || busy;
  const statusLabel = connected
    ? isSpeaking
      ? t("voiceAgent.statusSpeaking")
      : isListening
        ? t("voiceAgent.statusListening")
        : t("voiceAgent.statusConnected")
    : connecting
      ? t("voiceAgent.connecting")
      : null;

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
                disabled={busy}
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
  onPhase,
  errorMessage,
}: {
  title: string;
  debugFooter?: ReactNode;
  backHref: string;
  showHero: boolean;
  onPhase: (p: UiPhase, message?: string) => void;
  errorMessage?: string | null;
}) {
  const { t } = useLanguage();
  const { reduceMotion } = useAegisMotion();
  const externalAudioRef = useRef<QuantumNebulaExternalAudio>({
    active: false,
    frequency: null,
  });
  const driveRef = useRef<QuantumNebulaDrive>({});

  return (
    <div className="welcome-hud relative flex min-h-[100dvh] flex-col overflow-hidden">
      <VoiceAgentNebulaDrive
        externalAudioRef={externalAudioRef}
        driveRef={driveRef}
        idleBreathe={0.16}
      />
      <VoiceAgentNebula externalAudioRef={externalAudioRef} driveRef={driveRef} fullscreen />
      <div className="welcome-hud-bg" aria-hidden />

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center px-5 sm:px-6">
        <header className="flex w-full max-w-md flex-col items-center pt-[max(1.5rem,env(safe-area-inset-top))]">
          <Link
            to={backHref}
            className="mb-4 inline-flex items-center gap-1.5 self-start font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
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
            {showHero ? (
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

        <footer className="flex w-full max-w-md flex-col items-center gap-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          {showHero && debugFooter ? (
            <div className="w-full max-w-sm px-1 text-center">{debugFooter}</div>
          ) : null}
          <VoiceAgentControls onPhase={onPhase} layout="welcome" errorMessage={!showHero ? errorMessage : null} />
        </footer>
      </div>
    </div>
  );
}

function VoiceAgentCard({
  className,
  onPhase,
  errorMessage,
}: {
  className?: string;
  onPhase: (p: UiPhase, message?: string) => void;
  errorMessage?: string | null;
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
        <VoiceAgentNebulaDrive externalAudioRef={externalAudioRef} driveRef={driveRef} idleBreathe={0} />
        <VoiceAgentNebula externalAudioRef={externalAudioRef} driveRef={driveRef} fullscreen={false} />
      </div>
      <div className="mt-4">
        <VoiceAgentControls onPhase={onPhase} layout="card" />
      </div>
    </section>
  );
}

export type VoiceAgentProps = {
  className?: string;
  layout?: VoiceAgentLayout;
  /** Welcome layout — hero title (e.g. Hello, {name}). */
  welcomeTitle?: string;
  backHref?: string;
  /** Shown above the start CTA while hero is visible (e.g. dev agent id). */
  debugFooter?: ReactNode;
};

export function VoiceAgent({
  className,
  layout = "card",
  welcomeTitle,
  backHref = "/welcome",
  debugFooter,
}: VoiceAgentProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<UiPhase>("idle");
  const [phaseMessage, setPhaseMessage] = useState<string | null>(null);

  const onPhase = useCallback((p: UiPhase, message?: string) => {
    setPhase(p);
    setPhaseMessage(message ?? null);
  }, []);

  const title = welcomeTitle ?? t("voiceAgent.title");
  const showHero = phase === "idle" || phase === "error";

  return (
    <ConversationProvider
      onError={(error) => {
        setPhase("error");
        setPhaseMessage(error ?? t("voiceAgent.errorGeneric"));
      }}
    >
      {layout === "welcome" ? (
        <VoiceAgentWelcomeHud
          title={title}
          debugFooter={debugFooter}
          backHref={backHref}
          showHero={showHero}
          onPhase={onPhase}
          errorMessage={phase === "error" ? phaseMessage : null}
        />
      ) : (
        <VoiceAgentCard
          className={className}
          onPhase={onPhase}
          errorMessage={phase === "error" ? phaseMessage : null}
        />
      )}
    </ConversationProvider>
  );
}
