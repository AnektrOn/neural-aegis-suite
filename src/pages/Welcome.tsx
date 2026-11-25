import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { WelcomeHudScreen } from "@/features/welcome/components/WelcomeHudScreen";
import OnboardingFlow from "@/components/OnboardingFlow";
import { WelcomePostTourModals } from "@/features/welcome/components/WelcomePostTourModals";
import { WelcomeQuantumNebula } from "@/features/welcome/components/WelcomeQuantumNebula";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { useGuardianOptional, needsGuardianOnboarding } from "@/features/guardian";
import { GUARDIAN_ONBOARDING_PATH } from "@/lib/welcomeHud";
import { useQuizCompletion } from "@/hooks/useQuizCompletion";
import {
  hasFinishedStartOnboardingLocal,
  isExecutiveOnboardingDone,
} from "@/store/useOnboardingStore";
import { isProductTourDone, markProductTourDone } from "@/lib/productTour";
import { useSubscription } from "@/hooks/useSubscription";
import { LogosAmbassadorOfferDialog } from "@/features/logos/LogosAmbassadorOfferDialog";

export default function Welcome() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const guardian = useGuardianOptional();
  const { reduceMotion } = useAegisMotion();
  const userId = user?.id ?? null;
  const [tourDismissedForUser, setTourDismissedForUser] = useState<string | null>(null);
  const tourDone =
    !userId ? true : tourDismissedForUser === userId || isProductTourDone(userId);

  const { loading: quizLoading, completed: quizCompleted } = useQuizCompletion();
  const { hasLogos } = useSubscription();
  const [logosOfferOpen, setLogosOfferOpen] = useState(false);

  const execOnboardingDone = isExecutiveOnboardingDone(userId);
  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const androidStartMissing =
    isNativeAndroid && !hasFinishedStartOnboardingLocal(userId);

  useEffect(() => {
    if (!guardian || !guardian.hydrated) return;
    // Android: finish pre-login /start before Guardian voice onboarding.
    if (androidStartMissing) {
      navigate("/start", { replace: true });
      return;
    }
    // Les membres ayant déjà terminé le questionnaire ne sont jamais renvoyés
    // vers l'onboarding Guardian (nouveau navigateur = état local vide).
    if (quizLoading || quizCompleted || execOnboardingDone) return;
    if (needsGuardianOnboarding(guardian.state)) {
      navigate(GUARDIAN_ONBOARDING_PATH, { replace: true });
    }
  }, [guardian, navigate, quizLoading, quizCompleted, execOnboardingDone, androidStartMissing]);

  const firstName = useMemo(() => {
    if (!user) return "";
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const candidates = [
      meta?.["first_name"],
      typeof meta?.["full_name"] === "string"
        ? (meta["full_name"] as string).split(" ")[0]
        : undefined,
      user.email?.split("@")[0],
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return c.trim();
    }
    return "";
  }, [user]);

  const goDashboard = () => navigate("/dashboard", { replace: true });
  const goVoiceAgent = () => {
    if (hasLogos) {
      navigate("/welcome/voice-agent");
      return;
    }
    setLogosOfferOpen(true);
  };

  const completeProductTour = () => {
    if (!userId) return;
    markProductTourDone(userId);
    setTourDismissedForUser(userId);
  };

  if (!user) {
    return null;
  }

  // Si le guardian n'est pas encore hydraté, ou s'il a besoin d'onboarding mais que le quiz a déjà été complété,
  // ne pas bloquer indéfiniment la page Welcome dans un spinner sans fin.
  const guardianPending =
    Boolean(guardian && !guardian.hydrated && quizLoading && !execOnboardingDone) ||
    Boolean(
      guardian?.hydrated &&
        needsGuardianOnboarding(guardian.state) &&
        !quizCompleted &&
        !quizLoading &&
        !execOnboardingDone,
    );

  if (guardianPending) {
    return (
      <div className="welcome-hud flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6">
        <WelcomeQuantumNebula />
        <div className="welcome-hud-bg fixed inset-0" aria-hidden />
        <div
          className={`relative z-10 w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full ${reduceMotion ? "" : "animate-spin"}`}
          role="status"
          aria-label={t("welcome.loading")}
        />
        <button
          type="button"
          onClick={goDashboard}
          className="relative z-10 min-h-11 rounded-full border border-border/40 bg-background/30 px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm hover:text-foreground"
        >
          {t("welcome.skipToDashboard")}
        </button>
      </div>
    );
  }

  if (!tourDone) {
    return (
      <div className="welcome-hud min-h-[100dvh]">
        <WelcomeQuantumNebula />
        <div className="welcome-hud-bg fixed inset-0" aria-hidden />
        <OnboardingFlow onComplete={completeProductTour} />
      </div>
    );
  }

  return (
    <>
      <WelcomeHudScreen
        firstName={firstName}
        t={t}
        onDashboard={goDashboard}
        onVoiceAgent={goVoiceAgent}
      />
      <WelcomePostTourModals />
      <LogosAmbassadorOfferDialog open={logosOfferOpen} onOpenChange={setLogosOfferOpen} />
    </>
  );
}
