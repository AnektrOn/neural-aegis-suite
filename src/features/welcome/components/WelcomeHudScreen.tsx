import { motion } from "framer-motion";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { Eye, LayoutDashboard, Sparkles, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import aegisLogo from "@/assets/aegis-logo.png";
import type { UserMaturityProfile } from "@/lib/userMaturity";
import type { WelcomeHubStats } from "../services/welcomeHubStats";
import { ArcGauge } from "./ArcGauge";
import { WelcomeGlassTile } from "./WelcomeGlassTile";
import { SlideToStart } from "./SlideToStart";

interface WelcomeHudScreenProps {
  firstName: string;
  maturity: UserMaturityProfile;
  stats: WelcomeHubStats;
  isFR: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
  onPersona: () => void;
  onDashboard: () => void;
  onAssessment: () => void;
  onSlideComplete: () => void;
}

export function WelcomeHudScreen({
  firstName,
  maturity,
  stats,
  isFR,
  t,
  onPersona,
  onDashboard,
  onAssessment,
  onSlideComplete,
}: WelcomeHudScreenProps) {
  const { fadeUp, slideUp } = useAegisMotion();
  const hasPersona = maturity.hasArchetypeProfile;

  const title = firstName
    ? t("welcome.hud.title", { name: firstName })
    : t("welcome.hud.titleNoName");

  const pulseProgressMax = stats.pulseDeckMax;
  const toolboxProgressMax = Math.max(stats.toolboxActiveTotal, 1);
  const toolboxAccent =
    stats.toolboxTodoCount > 0 ? ("warning" as const) : ("primary" as const);
  const toolboxLinkState = stats.toolboxFocusId
    ? { openToolboxId: stats.toolboxFocusId }
    : undefined;

  return (
    <div className="welcome-hud relative flex min-h-[100dvh] flex-col overflow-hidden">
      <div className="welcome-hud-bg" aria-hidden />

      <header className="relative z-10 flex flex-col items-center pt-[max(1.25rem,env(safe-area-inset-top))] px-6">
        <img
          src={aegisLogo}
          alt="AEGIS"
          className="h-9 w-9 rounded-lg object-contain"
        />
        <p className="mt-2 font-display text-[9px] uppercase tracking-[0.35em] text-muted-foreground">
          Neural Aegis
        </p>
      </header>

      <div className="relative z-10 grid grid-cols-2 gap-2 px-4 pt-4 max-w-lg mx-auto w-full">
        <Link to="/pulse" className="rounded-xl transition-opacity hover:opacity-90">
          <ArcGauge
            className="welcome-arc-gauge"
            value={stats.pulseCardCount}
            max={pulseProgressMax}
            accent="neural"
            label={t("welcome.hud.gaugePulse")}
            centerPrimary={String(stats.pulseCardCount)}
            centerSecondary={t("welcome.hud.pulseOf", {
              max: String(pulseProgressMax),
            })}
            sublabel={
              stats.pulseCardCount > 0 ? t("welcome.hud.cardsReady") : t("welcome.hud.deckEmpty")
            }
          />
        </Link>
        <Link
          to="/toolbox"
          state={toolboxLinkState}
          className="rounded-xl transition-opacity hover:opacity-90"
        >
          <ArcGauge
            value={stats.toolboxTodoCount}
            max={toolboxProgressMax}
            accent={toolboxAccent}
            label={t("welcome.hud.gaugeToolbox")}
            centerPrimary={String(stats.toolboxTodoCount)}
            centerSecondary={t("welcome.hud.toolboxTodoOf", {
              total: String(stats.toolboxActiveTotal),
            })}
            sublabel={
              stats.toolboxTodoCount > 0
                ? stats.toolboxWaitingCount > 0
                  ? t("toolbox.deliveryWaitingBadge")
                  : t("toolbox.viewTodo")
                : t("welcome.hud.toolboxNoneWaiting")
            }
          />
        </Link>
      </div>

      <motion.section
        {...fadeUp(0.15)}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-6 min-h-[200px]"
      >
        <div className="welcome-hud-hero-glow" aria-hidden />
        <div className="relative text-center max-w-md space-y-3">
          <div className="inline-flex items-center gap-2 text-primary mb-1">
            <Sparkles className="w-4 h-4" strokeWidth={1.5} aria-hidden />
            <span className="font-display text-[10px] uppercase tracking-[0.28em]">
              {t("welcome.hud.eyebrow")}
            </span>
          </div>
          <h1 className="font-cormorant-display text-4xl sm:text-5xl text-foreground leading-[1.05] tracking-tight">
            {title}
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
          {hasPersona ? (
            <WelcomeGlassTile
              title={t("welcome.hud.tileIdentityTitle")}
              headline={t("welcome.hud.tileIdentityHeadline")}
              detail={t("welcome.choice.personaBody")}
              actionLabel={t("welcome.choice.personaCta")}
              icon={<Eye size={22} strokeWidth={1.25} aria-hidden />}
              onClick={onPersona}
            />
          ) : (
            <WelcomeGlassTile
              title={t("welcome.hud.tileProfileTitle")}
              headline={t("welcome.hud.tileProfileHeadline")}
              detail={t("welcome.hud.tileProfileDetail")}
              actionLabel={t("welcome.cta.start")}
              icon={<ClipboardList size={22} strokeWidth={1.25} aria-hidden />}
              onClick={onAssessment}
            />
          )}
          <WelcomeGlassTile
            title={t("welcome.hud.tileSystemTitle")}
            headline={t("welcome.hud.tileSystemHeadline")}
            detail={t("welcome.choice.dashboardBody")}
            actionLabel={t("welcome.choice.dashboardCta")}
            icon={<LayoutDashboard size={22} strokeWidth={1.25} aria-hidden />}
            onClick={onDashboard}
          />
        </div>

        <SlideToStart label={t("welcome.hud.slideLabel")} onComplete={onSlideComplete} />
      </motion.footer>
    </div>
  );
}
