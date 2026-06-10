import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { getUserMaturityProfile, type UserMaturityProfile } from "@/lib/userMaturity";
import { WelcomeHudScreen } from "@/features/welcome/components/WelcomeHudScreen";
import {
  fetchWelcomeHubStats,
  type WelcomeHubStats,
} from "@/features/welcome/services/welcomeHubStats";

export default function Welcome() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const navigate = useNavigate();

  const [maturity, setMaturity] = useState<UserMaturityProfile | null>(null);
  const [stats, setStats] = useState<WelcomeHubStats | null>(null);
  const [loading, setLoading] = useState(true);

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
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user, locale]);

  const goDashboard = () => navigate("/", { replace: true });
  const goPersona = () => navigate("/persona", { replace: true });
  const goAssessment = () => navigate("/onboarding/assessment", { replace: true });

  if (loading || !user || !maturity || !stats) {
    return (
      <div className="welcome-hud flex min-h-[100dvh] items-center justify-center">
        <div className="welcome-hud-bg fixed inset-0" aria-hidden />
        <div className="relative z-10 w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
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
  );
}
