import { motion } from "framer-motion";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { useLanguage } from "@/i18n/LanguageContext";
import { ArrowRight, Languages, Mic } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import { WelcomeQuantumNebula } from "./WelcomeQuantumNebula";

interface WelcomeHudScreenProps {
  firstName: string;
  t: (key: string, vars?: Record<string, string>) => string;
  onDashboard: () => void;
  onVoiceAgent: () => void;
}

export function WelcomeHudScreen({
  firstName,
  t,
  onDashboard,
  onVoiceAgent,
}: WelcomeHudScreenProps) {
  const { fadeUp } = useAegisMotion();
  const { locale, setLocale } = useLanguage();

  const title = firstName
    ? t("welcome.hud.title", { name: firstName })
    : t("welcome.hud.titleNoName");

  const toggleLanguage = () => setLocale(locale === "fr" ? "en" : "fr");

  return (
    <div className="welcome-hud relative flex min-h-[100dvh] flex-col overflow-hidden">
      <WelcomeQuantumNebula />
      <div className="welcome-hud-bg" aria-hidden />

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center px-5 sm:px-6">
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={locale === "fr" ? "Switch to English" : "Passer en Français"}
          title={locale === "fr" ? "Switch to English" : "Passer en Français"}
          className="pointer-events-auto absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] z-20 inline-flex h-11 min-w-[50px] items-center justify-center gap-1.5 rounded-xl border border-border/25 bg-background/40 px-2 text-muted-foreground/80 backdrop-blur-[14px] transition-colors hover:bg-background/55 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:right-6"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          <Languages size={15} strokeWidth={1.5} aria-hidden />
          <span className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-foreground">
            {locale}
          </span>
        </button>

        <header className="flex w-full max-w-md flex-col items-center pt-[max(1.5rem,env(safe-area-inset-top))]">
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
            {t("welcome.hud.eyebrow")}
          </p>
        </header>

        <motion.main
          {...fadeUp(0.12)}
          className="relative flex w-full max-w-md flex-1 flex-col items-center justify-center text-center"
        >
          <div className="welcome-hud-hero-glow" aria-hidden />
          <h1 className="relative mx-auto max-w-[11.5rem] font-cormorant-display text-[2.5rem] leading-[1.05] tracking-tight text-foreground sm:max-w-none sm:text-5xl">
            {title}
          </h1>
        </motion.main>

        <footer className="flex w-full max-w-md flex-col items-center pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onDashboard}
              className="group inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border/30 bg-background/20 px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm transition-colors duration-200 hover:border-border/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {t("welcome.choice.dashboardCta")}
              <ArrowRight
                size={12}
                strokeWidth={1.75}
                className="opacity-60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:opacity-90"
                aria-hidden
              />
            </button>
            <button
              type="button"
              onClick={onVoiceAgent}
              className="group inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] text-primary backdrop-blur-sm transition-colors duration-200 hover:border-primary/40 hover:bg-primary/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Mic size={12} strokeWidth={1.75} className="opacity-80" aria-hidden />
              {t("welcome.choice.voiceAgentCta")}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
