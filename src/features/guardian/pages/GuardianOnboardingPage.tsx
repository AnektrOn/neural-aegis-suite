import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { isGuestUser } from "@/lib/authVisitor";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGuardian } from "../GuardianProvider";
import { getActiveCaption, getGuardianCaptions } from "../captions";
import { GuardianActivateModal } from "../components/GuardianActivateModal";
import { GuardianGenderModal } from "../components/GuardianGenderModal";
import { GuardianLanguageModal } from "../components/GuardianLanguageModal";
import { GuardianPostQuizModal } from "../components/GuardianPostQuizModal";
import { GuardianStepShell } from "../components/GuardianStepShell";
import { GuardianDailyLogModal } from "../components/GuardianDailyLogModal";
import { GuardianDecisionLogModal } from "../components/GuardianDecisionLogModal";
import { GuardianDashboardCta } from "../components/GuardianDashboardCta";
import { GuardianNebula } from "../components/GuardianNebula";
import { GuardianCaptions } from "../components/GuardianCaptions";
import type { GuardianStep } from "../types";

export const GUARDIAN_ONBOARDING_PATH = "/onboarding";

const AUDIO_PHASES = new Set(["step1", "step2", "step3", "step4"]);
const POST_AUDIO_CTA_DELAY_MS = 3000;
const AUDIO_FAILSAFE_MS = 90_000;

/**
 * Guardian onboarding page.
 * Parts 3–4: log panels while she speaks (desktop rails / mobile blur sheet).
 */
export default function GuardianOnboardingPage() {
  const { user } = useAuth();
  const { t, setLocale } = useLanguage();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const {
    state,
    phase,
    audioSrc,
    setSpeaking,
    acceptGuardian,
    declineGuardian,
    selectGender,
    selectLocale,
    skipGuardian,
    goToQuiz,
    choosePostQuiz,
    advanceFromStep2,
    completeDailyLog,
    completeDecisionLog,
    completeGuardian,
    adminSkipToPart2,
  } = useGuardian();

  const audioEnabled = AUDIO_PHASES.has(phase) && Boolean(audioSrc);
  const clipKey = `${phase}:${audioSrc ?? "none"}`;
  const clipKeyRef = useRef(clipKey);
  clipKeyRef.current = clipKey;
  const advancedClipRef = useRef<string | null>(null);

  const [voiceStarted, setVoiceStarted] = useState(false);
  const [voiceEnded, setVoiceEnded] = useState(false);
  const [ctaReady, setCtaReady] = useState(false);
  const [audioTimeSec, setAudioTimeSec] = useState(0);
  const [audioPaused, setAudioPaused] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  /** Desktop: keep daily rail visible into part 4. */
  const [pinDailyRail, setPinDailyRail] = useState(false);
  /** Only set when the *current* clip's `ended` fires — never reuse previous step. */
  const [completedClipKey, setCompletedClipKey] = useState<string | null>(null);

  const captionCues = useMemo(
    () => getGuardianCaptions(state.gender, state.locale, state.step as GuardianStep),
    [state.gender, state.locale, state.step],
  );
  const activeCaption =
    voiceStarted && !voiceEnded ? getActiveCaption(captionCues, audioTimeSec) : null;

  useEffect(() => {
    if (!audioEnabled) {
      setVoiceStarted(false);
      setVoiceEnded(false);
      setCtaReady(true);
      setSpeaking(false);
      setAudioTimeSec(0);
      setAudioPaused(false);
      setCompletedClipKey(null);
      advancedClipRef.current = null;
      return;
    }
    setVoiceStarted(false);
    setVoiceEnded(false);
    setCtaReady(false);
    setSpeaking(false);
    setAudioTimeSec(0);
    setAudioPaused(false);
    setAudioBlocked(false);
    setCompletedClipKey(null);
    advancedClipRef.current = null;
  }, [audioEnabled, clipKey, setSpeaking]);

  useEffect(() => {
    if (!audioEnabled || !voiceEnded) return;
    setSpeaking(false);
    // Parts 3–4 advance via log panels; other steps use CTA delay.
    if (phase === "step3" || phase === "step4") {
      setCtaReady(true);
      return;
    }
    const timer = window.setTimeout(() => setCtaReady(true), POST_AUDIO_CTA_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [audioEnabled, voiceEnded, setSpeaking, phase]);

  useEffect(() => {
    if (!audioEnabled || voiceEnded) return;
    const timer = window.setTimeout(() => {
      setVoiceEnded(true);
      setCompletedClipKey(clipKeyRef.current);
    }, AUDIO_FAILSAFE_MS);
    return () => window.clearTimeout(timer);
  }, [audioEnabled, clipKey, voiceEnded]);

  // Part 3 finished → part 4 (only for this clip, not leftover ended from part 2).
  useEffect(() => {
    if (phase !== "step3") return;
    if (completedClipKey !== clipKey) return;
    if (advancedClipRef.current === clipKey) return;
    advancedClipRef.current = clipKey;
    if (!isMobile) setPinDailyRail(true);
    else setPinDailyRail(false);
    completeDailyLog();
  }, [phase, completedClipKey, clipKey, isMobile, completeDailyLog]);

  // Part 4 finished → dashboard CTA.
  useEffect(() => {
    if (phase !== "step4" || state.decisionDone) return;
    if (completedClipKey !== clipKey) return;
    if (advancedClipRef.current === clipKey) return;
    advancedClipRef.current = clipKey;
    setPinDailyRail(false);
    completeDecisionLog();
  }, [phase, state.decisionDone, completedClipKey, clipKey, completeDecisionLog]);

  useEffect(() => {
    if (phase !== "step3" && phase !== "step4") {
      setPinDailyRail(false);
    }
  }, [phase]);

  const quizPath = user && isGuestUser(user) ? "/quiz" : "/onboarding/assessment";
  const showAfterAudio = !audioEnabled || ctaReady;

  // Daily: visible for whole step3 (while speaking). Desktop also pinned into step4.
  const showDailyLog =
    phase === "step3" || (pinDailyRail && phase === "step4" && !state.decisionDone);

  // Decision: from the start of step4 while she speaks (desktop left / mobile sheet).
  const showDecisionModal = phase === "step4" && !state.decisionDone;

  const showDashboardCta =
    phase === "step4" && state.decisionDone && showAfterAudio;

  const nebulaState =
    voiceStarted && !voiceEnded ? ("mouvement" as const) : ("solid" as const);

  const dailyPlacement = isMobile ? "mobile" : "right";
  const decisionPlacement = isMobile ? "mobile" : "left";

  // Guests never get Guardian onboarding — send them straight to the quiz.
  const isGuestAccount = Boolean(user) && (isGuestUser(user) || user?.is_anonymous === true);
  useEffect(() => {
    if (isGuestAccount) navigate("/quiz", { replace: true });
  }, [isGuestAccount, navigate]);

  useEffect(() => {

    if (phase !== "done") return;
    if (state.status === "declined" || state.status === "skipped") {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (state.status === "completed" && state.postQuizChoice === "autonomous") {
      navigate("/welcome", { replace: true });
      return;
    }
    if (state.status === "completed") {
      navigate("/dashboard", { replace: true });
      return;
    }
    navigate("/welcome", { replace: true });
  }, [phase, state.status, state.postQuizChoice, navigate]);

  const exitToTextOnboarding = () => {
    declineGuardian();
  };

  const exitSkip = () => {
    skipGuardian();
  };

  if (!user) return null;

  if (phase === "done" || phase === "idle") {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center bg-white dark:bg-black">
        <GuardianNebula state="solid" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-white dark:bg-black">
      <GuardianNebula
        key={audioSrc ?? "idle"}
        state={nebulaState}
        audioSrc={audioEnabled ? audioSrc : null}
        autoPlayAudio={audioEnabled}
        audioLoop={false}
        audioPaused={audioPaused}
        onAudioBlocked={setAudioBlocked}
        onAudioPlay={() => {
          setAudioBlocked(false);
          setVoiceStarted(true);
          setSpeaking(true);
          setAudioPaused(false);
        }}
        onAudioEnded={() => {
          setVoiceEnded(true);
          setCompletedClipKey(clipKeyRef.current);
        }}
        onAudioTimeUpdate={setAudioTimeSec}
        className="z-0"
      />

      <GuardianCaptions text={activeCaption?.text ?? null} />

      {audioEnabled && audioBlocked && !voiceStarted ? (
        <button
          type="button"
          onPointerDown={() => setAudioPaused(false)}
          onTouchEnd={() => setAudioPaused(false)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        >
          <span className="rounded-full border border-white/20 bg-black/70 px-6 py-3 font-display text-sm tracking-wide text-white shadow-2xl">
            {t("guardian.audio.tapToStart")}
          </span>
        </button>
      ) : null}

      <GuardianActivateModal
        open={phase === "activate"}
        onAccept={acceptGuardian}
        onDecline={exitToTextOnboarding}
      />

      <GuardianGenderModal
        open={phase === "gender"}
        onSelect={selectGender}
        onSkip={exitSkip}
      />

      <GuardianLanguageModal
        open={phase === "language"}
        onSelect={(locale) => {
          setLocale(locale);
          selectLocale(locale);
        }}
        onSkip={exitSkip}
      />

      <GuardianPostQuizModal
        open={phase === "post_quiz"}
        onReturnToGuardian={() => choosePostQuiz("guardian")}
        onAutonomous={() => {
          choosePostQuiz("autonomous");
        }}
      />

      {phase === "step1" && showAfterAudio ? (
        <GuardianStepShell
          title={t("guardian.step1.title")}
          body={t("guardian.step1.body")}
          primaryLabel={t("guardian.step1.cta")}
          onPrimary={() => {
            goToQuiz();
            navigate(quizPath, { replace: true });
          }}
          onSkip={exitSkip}
        />
      ) : null}

      {isAdmin && phase === "step1" && state.gender && state.locale ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="pointer-events-auto border-amber-500/40 bg-background/80 text-amber-800 hover:bg-amber-500/10 dark:border-amber-400/40 dark:bg-black/70 dark:text-amber-200 dark:hover:bg-amber-400/10 dark:hover:text-amber-100"
            onClick={() => {
              adminSkipToPart2();
            }}
          >
            {t("guardian.admin.skipPart2")}
          </Button>
        </div>
      ) : null}

      {phase === "step2" && showAfterAudio ? (
        <GuardianStepShell
          title={t("guardian.step2.title")}
          body={t("guardian.step2.body")}
          primaryLabel={t("guardian.step2.cta")}
          onPrimary={() => {
            advanceFromStep2();
          }}
          onSkip={exitSkip}
        />
      ) : null}

      <GuardianDailyLogModal open={showDailyLog} placement={dailyPlacement} />

      <GuardianDecisionLogModal open={showDecisionModal} placement={decisionPlacement} />

      {showDashboardCta ? (
        <GuardianDashboardCta
          onGoDashboard={() => {
            completeGuardian();
          }}
          onSkip={exitSkip}
        />
      ) : null}

      {audioEnabled && !voiceEnded ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[210] flex justify-end gap-2 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          {voiceStarted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="pointer-events-auto h-10 w-10 text-foreground/80 hover:text-foreground"
              aria-label={audioPaused ? t("guardian.audio.resume") : t("guardian.audio.pause")}
              onClick={() => setAudioPaused((p) => !p)}
            >
              {audioPaused ? <Play size={18} /> : <Pause size={18} />}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="pointer-events-auto text-muted-foreground hover:text-foreground"
            onClick={exitSkip}
          >
            {t("guardian.skip")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
