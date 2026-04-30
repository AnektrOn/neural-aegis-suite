import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Brain, Target, ListChecks, BookOpen, Smartphone, ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const stepDefs: { icon: typeof Zap; titleKey: TranslationKey; descKey: TranslationKey; detailKey: TranslationKey }[] = [
  { icon: Zap, titleKey: "onboarding.step1.title", descKey: "onboarding.step1.description", detailKey: "onboarding.step1.detail" },
  { icon: Brain, titleKey: "onboarding.step2.title", descKey: "onboarding.step2.description", detailKey: "onboarding.step2.detail" },
  { icon: Target, titleKey: "onboarding.step3.title", descKey: "onboarding.step3.description", detailKey: "onboarding.step3.detail" },
  { icon: ListChecks, titleKey: "onboarding.step4.title", descKey: "onboarding.step4.description", detailKey: "onboarding.step4.detail" },
  { icon: BookOpen, titleKey: "onboarding.step5.title", descKey: "onboarding.step5.description", detailKey: "onboarding.step5.detail" },
  { icon: Smartphone, titleKey: "onboarding.step6.title", descKey: "onboarding.step6.description", detailKey: "onboarding.step6.detail" },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
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

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative z-10"
      style={{
        paddingTop: "calc(var(--safe-top) + 1rem)",
        paddingBottom: "calc(var(--safe-bottom) + 1rem)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ethereal-glass p-6 sm:p-10 max-w-lg w-full text-center space-y-6 sm:space-y-8"
      >
        {/* Progress */}
        <div className="flex gap-2 justify-center">
          {stepDefs.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i <= step ? "w-8 bg-primary" : "w-4 bg-border"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <current.icon size={28} strokeWidth={1.5} className="text-primary" />
            </div>

            <div>
              <h2 className="text-neural-title text-xl text-foreground mb-3">{t(current.titleKey)}</h2>
              <p className="text-sm text-foreground/80 mb-2">{t(current.descKey)}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(current.detailKey)}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-4">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              {t("onboarding.back")}
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              {t("onboarding.skip")}
            </button>
          )}

          <button onClick={next} className="btn-neural !px-6 !py-3">
            {step < stepDefs.length - 1 ? (
              <>{t("onboarding.next")} <ArrowRight size={12} /></>
            ) : (
              <>{t("onboarding.start")} <Check size={12} /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
