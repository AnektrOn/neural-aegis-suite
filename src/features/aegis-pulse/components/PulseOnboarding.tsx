import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  MoveHorizontal,
  RotateCw,
  Library,
  Hexagon,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { SacredGeometry } from "./SacredGeometry";

const stepDefs: {
  icon: typeof Zap;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  detailKey: TranslationKey;
  visual?: "swipe" | "flip";
}[] = [
  {
    icon: Zap,
    titleKey: "pulse.onboarding.step1.title",
    descKey: "pulse.onboarding.step1.description",
    detailKey: "pulse.onboarding.step1.detail",
  },
  {
    icon: MoveHorizontal,
    titleKey: "pulse.onboarding.step2.title",
    descKey: "pulse.onboarding.step2.description",
    detailKey: "pulse.onboarding.step2.detail",
    visual: "swipe",
  },
  {
    icon: RotateCw,
    titleKey: "pulse.onboarding.step3.title",
    descKey: "pulse.onboarding.step3.description",
    detailKey: "pulse.onboarding.step3.detail",
    visual: "flip",
  },
  {
    icon: Library,
    titleKey: "pulse.onboarding.step4.title",
    descKey: "pulse.onboarding.step4.description",
    detailKey: "pulse.onboarding.step4.detail",
  },
  {
    icon: Hexagon,
    titleKey: "pulse.onboarding.step5.title",
    descKey: "pulse.onboarding.step5.description",
    detailKey: "pulse.onboarding.step5.detail",
  },
  {
    icon: RefreshCw,
    titleKey: "pulse.onboarding.step6.title",
    descKey: "pulse.onboarding.step6.description",
    detailKey: "pulse.onboarding.step6.detail",
  },
];

interface PulseOnboardingProps {
  onComplete: () => void;
}

function SwipeHintVisual() {
  const { t } = useLanguage();
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-8 py-2">
      <div className="flex flex-col items-center gap-2">
        <div className="w-11 h-11 rounded-full border border-border-subtle bg-bg-surface flex items-center justify-center text-muted-foreground">
          <X size={20} strokeWidth={1.5} />
        </div>
        <span className="font-barlow text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {t("pulse.swipeIgnore")}
        </span>
      </div>
      <div className="w-14 h-20 rounded-lg border border-border-subtle bg-bg-surface/80 flex items-center justify-center opacity-60">
        <div className="w-8 h-8 opacity-40">
          <SacredGeometry type="MENTALISM" isGlowing={false} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="w-11 h-11 rounded-full border border-accent-primary/30 bg-accent-primary/10 flex items-center justify-center text-accent-primary">
          <CheckCircle2 size={20} strokeWidth={1.5} />
        </div>
        <span className="font-barlow text-[9px] uppercase tracking-[0.14em] text-accent-primary">
          {t("pulse.swipeAssimilate")}
        </span>
      </div>
    </div>
  );
}

function FlipHintVisual() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="w-16 h-24 rounded-lg border border-border-subtle bg-bg-surface flex flex-col items-center justify-center gap-2">
        <RotateCw size={16} className="text-muted-foreground animate-pulse" />
        <span className="font-barlow text-[8px] uppercase tracking-[0.12em] text-muted-foreground px-2 text-center">
          {t("pulse.reveal")}
        </span>
      </div>
      <p className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
        {t("pulse.onboarding.flipHint")}
      </p>
    </div>
  );
}

export function PulseOnboarding({ onComplete }: PulseOnboardingProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < stepDefs.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = stepDefs[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[80] bg-bg-base flex flex-col">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.35) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] max-w-[500px] max-h-[500px] rounded-full blur-[100px] pointer-events-none bg-[hsla(var(--neural-glow)/0.06)]" />

      <div
        className="relative z-10 flex flex-col flex-1 max-w-lg md:max-w-xl mx-auto w-full px-4 sm:px-6"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 1.5rem)",
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1.25rem)",
        }}
      >
        <div className="flex items-center justify-between py-2 mb-4">
          <span className="font-barlow text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {t("pulse.onboarding.badge")}
          </span>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
            {step + 1} / {stepDefs.length}
          </span>
        </div>

        <div className="flex gap-1.5 justify-center mb-6 sm:mb-8">
          {stepDefs.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= step ? "w-8 bg-accent-primary" : "w-4 bg-border-subtle"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28 }}
              className="dashboard-panel p-6 sm:p-8 md:p-10 text-center space-y-5 sm:space-y-6"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto">
                <Icon size={26} strokeWidth={1.5} className="text-accent-primary" />
              </div>

              {current.visual === "swipe" && <SwipeHintVisual />}
              {current.visual === "flip" && <FlipHintVisual />}
              {step === 0 && (
                <div className="w-16 h-16 mx-auto opacity-25">
                  <SacredGeometry type="MENTALISM" glowIntensity={0.6} />
                </div>
              )}

              <div className="space-y-3">
                <h2 className="font-cormorant text-xl sm:text-2xl text-text-primary tracking-wide">
                  {t(current.titleKey)}
                </h2>
                <p className="text-sm sm:text-base text-text-secondary font-sans leading-relaxed">
                  {t(current.descKey)}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans leading-relaxed max-w-md mx-auto">
                  {t(current.detailKey)}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-4 pt-6 sm:pt-8">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="min-h-[44px] px-4 font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground hover:text-text-primary transition-colors"
            >
              {t("onboarding.back")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="min-h-[44px] px-4 font-barlow text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground hover:text-text-primary transition-colors"
            >
              {t("onboarding.skip")}
            </button>
          )}

          <button
            type="button"
            onClick={next}
            className="dashboard-cta--inline dashboard-cta min-h-[44px] px-6 sm:px-8 py-3 font-barlow text-xs uppercase tracking-[0.14em] flex items-center gap-2"
          >
            {step < stepDefs.length - 1 ? (
              <>
                {t("onboarding.next")} <ArrowRight size={14} strokeWidth={1.5} />
              </>
            ) : (
              <>
                {t("pulse.onboarding.start")} <Check size={14} strokeWidth={1.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
