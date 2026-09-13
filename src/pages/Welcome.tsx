import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { isProductTourDone, markProductTourDone } from "@/lib/productTour";

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

  useEffect(() => {
    if (!guardian || !guardian.hydrated) return;
    // Les membres ayant déjà terminé le questionnaire ne sont jamais renvoyés
    // vers l'onboarding Guardian (nouveau navigateur = état local vide).
    if (quizLoading || quizCompleted) return;
    if (needsGuardianOnboarding(guardian.state)) {
      navigate(GUARDIAN_ONBOARDING_PATH, { replace: true });
    }
  }, [guardian, navigate, quizLoading, quizCompleted]);

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

  const completeProductTour = () => {
    if (!userId) return;
    markProductTourDone(userId);
    setTourDismissedForUser(userId);
  };

  if (!user) {
    return null;
  }

  const guardianPending =
    Boolean(guardian && !guardian.hydrated) ||
    Boolean(guardian?.hydrated && needsGuardianOnboarding(guardian.state));

  if (guardianPending) {
    return (
      <div className="welcome-hud flex min-h-[100dvh] items-center justify-center">
        <WelcomeQuantumNebula />
        <div className="welcome-hud-bg fixed inset-0" aria-hidden />
        <div
          className={`relative z-10 w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full ${reduceMotion ? "" : "animate-spin"}`}
          role="status"
          aria-label={t("welcome.loading")}
        />
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
      />
      <WelcomePostTourModals />
    </>
  );
}
