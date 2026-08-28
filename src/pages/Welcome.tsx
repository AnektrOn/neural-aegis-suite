import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { getUserMaturityProfile, type UserMaturityProfile } from "@/lib/userMaturity";
import { WelcomeHudScreen } from "@/features/welcome/components/WelcomeHudScreen";
import PulseFeatureAnnounceModal from "@/components/PulseFeatureAnnounceModal";
import {
  fetchWelcomeHubStats,
  type WelcomeHubStats,
} from "@/features/welcome/services/welcomeHubStats";
import { WelcomeQuantumNebula } from "@/features/welcome/components/WelcomeQuantumNebula";
import { useGuardianOptional, needsGuardianOnboarding } from "@/features/guardian";
import { GUARDIAN_ONBOARDING_PATH } from "@/lib/welcomeHud";
import { useQuizCompletion } from "@/hooks/useQuizCompletion";

export default function Welcome() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const guardian = useGuardianOptional();

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

  const [maturity, setMaturity] = useState<UserMaturityProfile | null>(null);
  const [stats, setStats] = useState<WelcomeHubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true);
    setLoadError(false);

    (async () => {
      try {
        const [profile, hubStats] = await Promise.all([
          getUserMaturityProfile(user.id),
          fetchWelcomeHubStats(user.id, locale),
        ]);
        if (!alive) return;
        setMaturity(profile);
        setStats(hubStats);
      } catch (err) {
        console.error("[Welcome] load failed", err);
        if (alive) setLoadError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, locale, reloadKey]);

  const goDashboard = () => navigate("/dashboard", { replace: true });
  const goPersona = () => navigate("/persona", { replace: true });
  const goAssessment = () => navigate("/onboarding/assessment", { replace: true });

  if (!user) {
    return null;
  }

  if (loadError && !loading) {
    return (
      <div className="welcome-hud flex min-h-[100dvh] items-center justify-center px-6">
        <WelcomeQuantumNebula />
        <div className="welcome-hud-bg fixed inset-0" aria-hidden />
        <div className="relative z-10 flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="font-barlow text-sm text-destructive">{t("welcome.loadError")}</p>
          <button
            type="button"
            className="rounded-xl border border-destructive/40 bg-background/80 px-4 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-destructive hover:bg-destructive/10"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (loading || !maturity || !stats) {
    return (
      <div className="welcome-hud flex min-h-[100dvh] items-center justify-center">
        <WelcomeQuantumNebula />
        <div className="welcome-hud-bg fixed inset-0" aria-hidden />
        <div
          className="relative z-10 w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"
          role="status"
          aria-label={t("welcome.loading")}
        />
      </div>
    );
  }

  return (
    <>
      <WelcomeHudScreen
        firstName={firstName}
        maturity={maturity}
        stats={stats}
        isFR={locale === "fr"}
        t={t}
        onPersona={goPersona}
        onDashboard={goDashboard}
        onAssessment={goAssessment}
        onSlideComplete={goDashboard}
      />
      <PulseFeatureAnnounceModal />
    </>
  );
}
