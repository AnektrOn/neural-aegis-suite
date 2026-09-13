import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Fingerprint,
  Flower2,
  Smartphone,
  ArrowRight,
  Check,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import type { TranslationKey } from "@/i18n/translations";

/** Condensed product tour — four pillars (nav/dashboard, persona, practices, account). */
const stepDefs: {
  icon: typeof LayoutDashboard;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  detailKey: TranslationKey;
}[] = [
  {
    icon: LayoutDashboard,
    titleKey: "onboarding.tour.2.title",
    descKey: "onboarding.tour.2.description",
    detailKey: "onboarding.tour.2.detail",
  },
  {
    icon: Fingerprint,
    titleKey: "onboarding.tour.4.title",
    descKey: "onboarding.tour.4.description",
    detailKey: "onboarding.tour.4.detail",
  },
  {
    icon: Flower2,
    titleKey: "onboarding.tour.6.title",
    descKey: "onboarding.tour.6.description",
    detailKey: "onboarding.tour.6.detail",
  },
  {
    icon: Smartphone,
    titleKey: "onboarding.tour.9.title",
    descKey: "onboarding.tour.9.description",
    detailKey: "onboarding.tour.9.detail",
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t } = useLanguage();
  const { reduceMotion } = useAegisMotion();
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < stepDefs.length - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const current = stepDefs[step];
  const panelMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 } }
    : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative z-10"
      style={{
        paddingTop: "calc(var(--safe-top) + 1rem)",
        paddingBottom: "calc(var(--safe-bottom) + 1rem)",
      }}
    >
      <motion.div
        {...panelMotion}
        className="ethereal-glass p-6 sm:p-10 max-w-lg w-full text-center space-y-6 sm:space-y-8"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onComplete}
            className="min-h-[44px] px-4 text-label uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {t("onboarding.skip")}
          </button>
        </div>

        <div className="flex gap-1.5 justify-center flex-wrap" aria-hidden>
          {stepDefs.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= step ? "w-6 sm:w-8 bg-primary" : "w-3 sm:w-4 bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            {...(reduceMotion
              ? { initial: false, animate: { opacity: 1 } }
              : {
                  initial: { opacity: 0, x: 30 },
                  animate: { opacity: 1, x: 0 },
                  exit: { opacity: 0, x: -30 },
                  transition: { duration: 0.3 },
                })}
            className="space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <current.icon size={28} strokeWidth={1.5} className="text-primary" />
            </div>

            <div>
              <h2 className="text-neural-title text-xl text-foreground mb-3">{t(current.titleKey)}</h2>
              <p className="text-sm text-foreground/80 mb-2">{t(current.descKey)}</p>
              <p className="text-caption text-muted-foreground leading-relaxed">{t(current.detailKey)}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="flex items-center">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="min-h-[44px] px-4 text-label uppercase text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {t("onboarding.back")}
              </button>
            ) : (
              <span className="text-caption text-muted-foreground tabular-nums px-2">
                {step + 1}/{stepDefs.length}
              </span>
            )}
          </div>

          <button type="button" onClick={next} className="btn-neural !px-6 !py-3 min-h-[44px] cursor-pointer">
            {step < stepDefs.length - 1 ? (
              <>
                {t("onboarding.next")} <ArrowRight size={12} />
              </>
            ) : (
              <>
                {t("onboarding.start")} <Check size={12} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
