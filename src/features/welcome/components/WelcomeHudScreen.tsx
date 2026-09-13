import { motion } from "framer-motion";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { ArrowRight } from "lucide-react";
import aegisLogo from "@/assets/aegis-logo.png";
import { WelcomeQuantumNebula } from "./WelcomeQuantumNebula";

interface WelcomeHudScreenProps {
  firstName: string;
  t: (key: string, vars?: Record<string, string>) => string;
  onDashboard: () => void;
}

export function WelcomeHudScreen({
  firstName,
  t,
  onDashboard,
}: WelcomeHudScreenProps) {
  const { fadeUp } = useAegisMotion();

  const title = firstName
    ? t("welcome.hud.title", { name: firstName })
    : t("welcome.hud.titleNoName");

  return (
    <div className="welcome-hud relative flex min-h-[100dvh] flex-col overflow-hidden">
      <WelcomeQuantumNebula />
      <div className="welcome-hud-bg" aria-hidden />

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col items-center px-5 sm:px-6">
        <header className="flex w-full max-w-md flex-col items-center pt-[max(1.5rem,env(safe-area-inset-top))]">
          <img
            src={aegisLogo}
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
        </footer>
      </div>
    </div>
  );
}
