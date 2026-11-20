import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { toolsKicker, toolsLead, toolsTitle } from "./toolsDesign";

export type ToolWizardStep = {
  id: string;
  kicker?: string;
  title: string;
  description?: string;
  content: ReactNode;
  /** Return false to block « Continuer » (default true). */
  canContinue?: () => boolean;
};

interface ToolStepWizardProps {
  steps: ToolWizardStep[];
  /** Dernier écran : résultats (plein viewport comme les étapes). */
  resultStep: {
    kicker?: string;
    title: string;
    description?: string;
    content: ReactNode;
  };
  onResultsVisible?: () => void;
  className?: string;
}

export function ToolStepWizard({
  steps,
  resultStep,
  onResultsVisible,
  className,
}: ToolStepWizardProps) {
  const { t, locale } = useLanguage();
  const totalScreens = steps.length + 1;
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const onResults = onResultsVisible;
  const isResult = index === steps.length;
  const current = isResult ? null : steps[index];

  useEffect(() => {
    if (isResult) onResults?.();
  }, [isResult, onResults]);

  const canContinue = isResult
    ? true
    : (current?.canContinue?.() ?? true);

  const goNext = useCallback(() => {
    if (!canContinue) return;
    if (index < steps.length) setIndex((i) => i + 1);
  }, [canContinue, index, steps.length]);

  const goBack = useCallback(() => {
    if (index === 0) {
      navigate("/tools");
      return;
    }
    setIndex((i) => i - 1);
  }, [index, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && canContinue && !isResult) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canContinue, goNext, isResult]);

  const progressPct = ((index + 1) / totalScreens) * 100;

  return (
    <MotionWS
      className={cn(
        "flex min-h-[calc(100dvh-4.25rem)] flex-col",
        className,
      )}
      aria-label={t("tools.stepWizardAria")}
    >
      <div className="border-b border-border/40 bg-background/40 px-4 py-3 backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-text-secondary)]">
            {isResult
              ? locale === "en"
                ? "Summary"
                : "Synthèse"
              : locale === "en"
                ? `Step ${index + 1} / ${steps.length}`
                : `Étape ${index + 1} / ${steps.length}`}
          </span>
          <span className="font-mono text-xs tabular-nums text-[color:var(--aegis-bronze-ink)]">
            {Math.round(progressPct)} %
          </span>
        </div>
        <MotionWS
          className="mx-auto mt-2 h-1 max-w-lg overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </MotionWS>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 md:px-6 md:py-10",
          isResult ? "justify-center" : "justify-start",
        )}
      >
        <div className="mx-auto w-full max-w-lg">
          {(isResult ? resultStep : current) && (
            <header className="mb-6 text-center md:mb-8 md:text-left">
              <p className={toolsKicker}>
                {isResult
                  ? resultStep.kicker ?? (locale === "en" ? "Results" : "Résultats")
                  : current?.kicker ?? (locale === "en" ? "Your context" : "Votre contexte")}
              </p>
              <h2 className={`${toolsTitle} mt-3 text-[clamp(1.5rem,5vw,2.25rem)]`}>
                {isResult ? resultStep.title : current?.title}
              </h2>
              {(isResult ? resultStep.description : current?.description) ? (
                <p className={`${toolsLead} mt-4`}>
                  {isResult ? resultStep.description : current?.description}
                </p>
              ) : null}
            </header>
          )}

          <div className="w-full">{isResult ? resultStep.content : current?.content}</div>
        </div>
      </div>

      <UnconditionalFooterNav
        backLabel={index === 0 ? "Retour aux outils" : "Retour"}
        isResult={isResult}
        canContinue={canContinue}
        onBack={goBack}
        onNext={goNext}
        onRestart={() => setIndex(0)}
      />
    </MotionWS>
  );
}

function UnconditionalFooterNav({
  backLabel,
  isResult,
  canContinue,
  onBack,
  onNext,
  onRestart,
}: {
  backLabel: string;
  isResult: boolean;
  canContinue: boolean;
  onBack: () => void;
  onNext: () => void;
  onRestart: () => void;
}) {
  return (
    <footer className="sticky bottom-0 border-t border-border/40 bg-background/85 px-4 py-4 backdrop-blur-md md:px-6">
      <CardinalFlex className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "inline-flex min-h-[44px] max-w-[50%] items-center gap-2 rounded-xl border border-border/50 bg-card/70 px-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground sm:max-w-none sm:px-4",
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">{backLabel}</span>
        </button>

        {isResult ? (
          <button type="button" onClick={onRestart} className="btn-solaire min-h-[44px] px-5">
            Recommencer
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="btn-solaire min-h-[44px] px-5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continuer
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </CardinalFlex>
    </footer>
  );
}

function MotionWS({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}

function CardinalFlex({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}
