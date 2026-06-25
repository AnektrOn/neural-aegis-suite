import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Target, Wrench, BookOpen, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAegisHealthScore } from "@/hooks/useAegisHealthScore";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { ArcGauge } from "@/features/welcome/components/ArcGauge";
import { WelcomeGlassTile } from "@/features/welcome/components/WelcomeGlassTile";
import { SlideToStart } from "@/features/welcome/components/SlideToStart";
import QuickLogModal from "@/components/QuickLogModal";
import aegisLogo from "@/assets/aegis-logo.png";

/**
 * Test page: Luxurious, minimalist, futuristic mobile dashboard
 * inspired by the Welcome screen. Mounted at /dashboard-lux.
 * Does NOT replace the existing dashboard.
 */
export default function DashboardLux() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { fadeUp, slideUp } = useAegisMotion();

  const dashData = useDashboardData(user?.id, isMobile, locale);
  const { score: aegisScore } = useAegisHealthScore(user?.id);

  const [quickLog, setQuickLog] = useState(false);

  const firstName = useMemo(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const raw =
      (meta?.["first_name"] as string | undefined) ??
      (typeof meta?.["full_name"] === "string"
        ? (meta["full_name"] as string).split(" ")[0]
        : undefined) ??
      user?.email?.split("@")[0] ??
      "";
    return raw.trim();
  }, [user]);

  const moodAvg = dashData.mobile?.moodAvg ?? dashData.stats?.moodAvg ?? "—";
  const habitsDone = dashData.mobile?.habitsDone ?? dashData.stats?.habitsDone ?? "0/0";
  const openDecisions = dashData.mobile?.openDecisions ?? dashData.stats?.openDecisions ?? "0";

  const [habitsNum, habitsMax] = (() => {
    const m = String(habitsDone).match(/(\d+)\D+(\d+)/);
    if (m) return [Number(m[1]), Math.max(Number(m[2]), 1)];
    return [0, 1];
  })();
  const moodNum = (() => {
    const n = Number(String(moodAvg).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  })();
  const decisionsCount = Number(String(openDecisions).match(/\d+/)?.[0] ?? 0);

  const greetingTitle = firstName
    ? t("welcome.hud.title", { name: firstName })
    : t("welcome.hud.titleNoName");

  const L = {
    eyebrow: isFR ? "Aegis · Vue" : "Aegis · View",
    mood: t("mood.label"),
    habits: isFR ? "Habitudes" : "Habits",
    decisions: isFR ? "Décisions" : "Decisions",
    decisionsDetail: isFR ? "Ouvertes" : "Open",
    toolbox: t("toolbox.title"),
    toolboxDetail: t("toolbox.viewTodo"),
    journal: t("journal.title"),
    journalDetail: isFR ? "Dernière entrée" : "Latest entry",
    moodCta: isFR ? "Saisir" : "Log",
    open: isFR ? "Ouvrir" : "Open",
    slide: isFR ? "Glisser pour saisir" : "Slide to log",
  };

  return (
    <div className="welcome-hud relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div className="welcome-hud-bg" aria-hidden />

      <header className="relative z-10 flex flex-col items-center pt-[max(1rem,env(safe-area-inset-top))] px-6">
        <img src={aegisLogo} alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
        <p className="mt-2 font-display text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
          Neural Aegis
        </p>
      </header>

      <div className="relative z-10 grid grid-cols-2 gap-2 px-4 pt-4 max-w-lg mx-auto w-full">
        <button
          type="button"
          onClick={() => navigate("/mood")}
          className="rounded-xl transition-opacity hover:opacity-90"
        >
          <ArcGauge
            value={moodNum}
            max={10}
            accent="neural"
            label={L.mood}
            centerPrimary={String(moodAvg)}
            centerSecondary="/10"
            showProgressPct={false}
          />
        </button>
        <button
          type="button"
          onClick={() => navigate("/habits")}
          className="rounded-xl transition-opacity hover:opacity-90"
        >
          <ArcGauge
            value={habitsNum}
            max={habitsMax}
            accent="primary"
            label={L.habits}
            centerPrimary={String(habitsNum)}
            centerSecondary={`/${habitsMax}`}
          />
        </button>
      </div>

      <motion.section
        {...fadeUp(0.15)}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-8 min-h-[180px]"
      >
        <div className="welcome-hud-hero-glow" aria-hidden />
        <div className="relative text-center max-w-md space-y-3">
          <div className="inline-flex items-center gap-2 text-primary mb-1">
            <Sparkles className="w-4 h-4" strokeWidth={1.5} aria-hidden />
            <span className="font-display text-[10px] uppercase tracking-[0.28em]">
              {L.eyebrow}
              {aegisScore ? ` · ${Math.round(aegisScore.overall_score)}` : ""}
            </span>
          </div>
          <h1 className="font-cormorant-display text-4xl sm:text-5xl text-foreground leading-[1.05] tracking-tight">
            {greetingTitle}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed font-body max-w-sm mx-auto">
            {t("welcome.hud.subtitle")}
          </p>
        </div>
      </motion.section>

      <motion.footer
        {...slideUp(0.35)}
        className="relative z-10 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 max-w-lg mx-auto w-full"
      >
        <div className="grid grid-cols-2 gap-3">
          <WelcomeGlassTile
            title={L.decisions}
            headline={String(decisionsCount)}
            detail={L.decisionsDetail}
            actionLabel={L.open}
            icon={<Target size={22} strokeWidth={1.25} aria-hidden />}
            onClick={() => navigate("/decisions")}
          />
          <WelcomeGlassTile
            title={L.toolbox}
            headline={L.toolboxDetail}
            actionLabel={L.open}
            icon={<Wrench size={22} strokeWidth={1.25} aria-hidden />}
            onClick={() => navigate("/toolbox")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <WelcomeGlassTile
            title={L.journal}
            headline={L.journalDetail}
            actionLabel={L.open}
            icon={<BookOpen size={22} strokeWidth={1.25} aria-hidden />}
            onClick={() => navigate("/journal")}
          />
          <WelcomeGlassTile
            title={L.mood}
            headline={String(moodAvg)}
            actionLabel={L.moodCta}
            icon={<Heart size={22} strokeWidth={1.25} aria-hidden />}
            onClick={() => setQuickLog(true)}
          />
        </div>

        <SlideToStart label={L.slide} onComplete={() => setQuickLog(true)} />
      </motion.footer>

      <QuickLogModal open={quickLog} onClose={() => setQuickLog(false)} />
    </div>
  );
}
