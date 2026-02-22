import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Brain, Target, ListChecks, BookOpen, ArrowRight, Check } from "lucide-react";

const steps = [
  {
    icon: Zap,
    title: "Bienvenue sur Aegis",
    description: "Votre copilote neuronal pour la prise de décision, le leadership et le bien-être.",
    detail: "Aegis vous aide à suivre votre humeur, structurer vos décisions, développer des habitudes et cultiver votre réseau professionnel.",
  },
  {
    icon: Brain,
    title: "Suivez votre humeur",
    description: "Enregistrez votre état émotionnel quotidien avec le tracker d'humeur.",
    detail: "Notez votre humeur, sommeil, stress et alimentation pour identifier vos patterns et optimiser votre énergie.",
  },
  {
    icon: Target,
    title: "Structurez vos décisions",
    description: "Le log de décisions vous aide à prioriser et agir avec clarté.",
    detail: "Classez vos décisions par priorité et responsabilité. Suivez leur évolution et réduisez la paralysie décisionnelle.",
  },
  {
    icon: ListChecks,
    title: "Développez vos habitudes",
    description: "Des habitudes personnalisées assignées par votre coach.",
    detail: "Complétez vos habitudes quotidiennes et suivez votre progression au fil du temps.",
  },
  {
    icon: BookOpen,
    title: "Journalisez vos réflexions",
    description: "Le journal vous aide à capturer vos pensées et insights.",
    detail: "Écrivez librement, ajoutez des tags et suivez l'évolution de votre pensée stratégique.",
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ethereal-glass p-10 max-w-lg w-full text-center space-y-8"
      >
        {/* Progress */}
        <div className="flex gap-2 justify-center">
          {steps.map((_, i) => (
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
              <h2 className="text-neural-title text-xl text-foreground mb-3">{current.title}</h2>
              <p className="text-sm text-foreground/80 mb-2">{current.description}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{current.detail}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-4">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Retour
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Passer
            </button>
          )}

          <button onClick={next} className="btn-neural !px-6 !py-3">
            {step < steps.length - 1 ? (
              <>Suivant <ArrowRight size={12} /></>
            ) : (
              <>Commencer <Check size={12} /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
