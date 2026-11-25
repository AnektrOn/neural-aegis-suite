import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  isExecutiveOnboardingDone,
  markExecutiveOnboardingDone,
  useOnboardingStore,
  type OnboardingProfileFields,
  type OnboardingStep,
} from "@/store/useOnboardingStore";
import {
  fetchExecutiveOnboardingRemote,
  syncStepToSupabase,
} from "@/services/onboardingService";
import {
  ONBOARDING_PRIMARY_BTN_CLASS,
  ONBOARDING_SECONDARY_BTN_CLASS,
  ONBOARDING_SHELL_CLASS,
  TOTAL_ONBOARDING_STEPS,
} from "../onboardingPrimitives";
import OnboardingTopBar from "../components/OnboardingTopBar";
import OnboardingAhaSynthesis from "../components/OnboardingAhaSynthesis";
import Step1OperationalTheater from "../components/steps/Step1OperationalTheater";
import Step2RelationalMap from "../components/steps/Step2RelationalMap";
import Step3UrgentDilemma from "../components/steps/Step3UrgentDilemma";
import Step4SomaticFriction from "../components/steps/Step4SomaticFriction";
import Step5DecisionDilemmas, {
  CURATED_DILEMMA_POSITIONS,
} from "../components/steps/Step5DecisionDilemmas";

export default function ExecutiveOnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const currentStep = useOnboardingStore((s) => s.currentStep);
  const roleTitle = useOnboardingStore((s) => s.role_title);
  const teamSize = useOnboardingStore((s) => s.team_size);
  const primaryStakeholders = useOnboardingStore((s) => s.primary_stakeholders);
  const urgentDecisionTitle = useOnboardingStore((s) => s.urgent_decision_title);
  const stressSymptoms = useOnboardingStore((s) => s.stress_symptoms);
  const dominantFriction = useOnboardingStore((s) => s.dominant_decision_friction);
  const rawDilemmas = useOnboardingStore((s) => s.raw_dilemma_responses);

  const bindUser = useOnboardingStore((s) => s.bindUser);
  const setStep = useOnboardingStore((s) => s.setStep);
  const hydrateFromRemote = useOnboardingStore((s) => s.hydrateFromRemote);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  const [checkingRemote, setCheckingRemote] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSyncingBadge, setIsSyncingBadge] = useState(false);

  const finalizedRef = useRef(false);
  const syncBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = user?.id ?? null;
  const localDone = isExecutiveOnboardingDone(userId);

  // Hydrate draft from Supabase and guard completed users across fresh browsers.
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setCheckingRemote(false);
      return;
    }

    bindUser(userId);

    if (isExecutiveOnboardingDone(userId)) {
      setCheckingRemote(false);
      return;
    }

    let cancelled = false;
    setCheckingRemote(true);

    fetchExecutiveOnboardingRemote(userId)
      .then((remote) => {
        if (cancelled) return;
        if (remote.onboardingCompleted) {
          markExecutiveOnboardingDone(userId);
          resetOnboarding();
          navigate("/dashboard", { replace: true });
          return;
        }
        if (remote.profile) {
          hydrateFromRemote(userId, remote.profile);
        }
      })
      .catch(() => {
        // Keep localStorage draft responsive when offline
      })
      .finally(() => {
        if (!cancelled) setCheckingRemote(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, bindUser, hydrateFromRemote, navigate, resetOnboarding, userId]);

  useEffect(() => {
    return () => {
      if (syncBadgeTimerRef.current) clearTimeout(syncBadgeTimerRef.current);
    };
  }, []);

  // Intercept Android hardware back button during steps & post-finalization.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let removeListener: (() => Promise<void>) | undefined;

    void CapacitorApp.addListener("backButton", () => {
      if (finalizedRef.current || isSynthesizing) return;
      if (currentStep > 1) {
        setStep((currentStep - 1) as OnboardingStep);
      }
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      if (removeListener) void removeListener();
    };
  }, [currentStep, isSynthesizing, setStep]);

  const handleSyncPatch = useCallback(
    (patch: Partial<OnboardingProfileFields>) => {
      if (!userId) return;
      setIsSyncingBadge(true);
      if (syncBadgeTimerRef.current) clearTimeout(syncBadgeTimerRef.current);
      syncBadgeTimerRef.current = setTimeout(() => setIsSyncingBadge(false), 900);
      syncStepToSupabase(
        { ...patch, onboarding_step_reached: useOnboardingStore.getState().currentStep },
        userId,
      );
    },
    [userId],
  );

  const canProceed = (() => {
    switch (currentStep) {
      case 1:
        return Boolean(roleTitle && teamSize);
      case 2:
        return primaryStakeholders.some((s) => s.name.trim().length > 0);
      case 3:
        return urgentDecisionTitle.trim().length > 0;
      case 4:
        return stressSymptoms.length > 0 || Boolean(dominantFriction);
      case 5:
        return CURATED_DILEMMA_POSITIONS.every((pos) =>
          Boolean(rawDilemmas[String(pos)]),
        );
    }
  })();

  const handleFinalized = useCallback(() => {
    finalizedRef.current = true;
  }, []);

  const handleReturnToSteps = useCallback(() => {
    finalizedRef.current = false;
    setIsSynthesizing(false);
  }, []);

  const handleNext = () => {
    if (!canProceed || !userId) return;
    if (currentStep < TOTAL_ONBOARDING_STEPS) {
      const nextStep = (currentStep + 1) as OnboardingStep;
      setStep(nextStep);
      syncStepToSupabase({ onboarding_step_reached: nextStep }, userId);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (syncBadgeTimerRef.current) clearTimeout(syncBadgeTimerRef.current);
    setIsSyncingBadge(false);
    setIsSynthesizing(true);
  };

  const handlePrev = () => {
    if (currentStep <= 1 || isSynthesizing) return;
    const prevStep = (currentStep - 1) as OnboardingStep;
    setStep(prevStep);
    if (userId) {
      syncStepToSupabase({ onboarding_step_reached: prevStep }, userId);
    }
  };

  if (authLoading || checkingRemote) {
    return (
      <main className={`${ONBOARDING_SHELL_CLASS} flex items-center justify-center px-6`}>
        <div role="status" className="text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#c9a24b]/25 border-t-[#c9a24b]" />
          <p className="text-xs font-mono uppercase tracking-wider text-[#161614]/65 dark:text-[#f5f2eb]/65">
            {t("execOnboarding.hydrateLoading")}
          </p>
        </div>
      </main>
    );
  }

  if (!userId) {
    return <Navigate to="/auth" replace />;
  }

  if (localDone && !isSynthesizing) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={`${ONBOARDING_SHELL_CLASS} flex flex-col`}>
      <OnboardingTopBar
        currentStep={currentStep}
        isSyncing={isSyncingBadge}
        hideAudioControls={isSynthesizing}
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-6 pt-6 pb-32">
        {isSynthesizing ? (
          <OnboardingAhaSynthesis
            userId={userId}
            onFinalized={handleFinalized}
            onReturnToSteps={handleReturnToSteps}
          />
        ) : (
          <>
            {currentStep === 1 && (
              <Step1OperationalTheater onSyncPatch={handleSyncPatch} />
            )}
            {currentStep === 2 && (
              <Step2RelationalMap onSyncPatch={handleSyncPatch} />
            )}
            {currentStep === 3 && (
              <Step3UrgentDilemma onSyncPatch={handleSyncPatch} />
            )}
            {currentStep === 4 && (
              <Step4SomaticFriction onSyncPatch={handleSyncPatch} />
            )}
            {currentStep === 5 && (
              <Step5DecisionDilemmas onSyncPatch={handleSyncPatch} />
            )}
          </>
        )}
      </main>

      {!isSynthesizing && (
        <footer
          className={
            "fixed inset-x-0 bottom-0 z-30 border-t border-[#161614]/10 bg-[#f5f2eb]/95 backdrop-blur-md " +
            "dark:border-white/[0.08] dark:bg-[#0b0b0a]/95 px-4 sm:px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]"
          }
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className={ONBOARDING_SECONDARY_BTN_CLASS}
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t("execOnboarding.back")}</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canProceed}
              onClick={handleNext}
              className={`${ONBOARDING_PRIMARY_BTN_CLASS} flex-1`}
            >
              <span>
                {currentStep === TOTAL_ONBOARDING_STEPS
                  ? t("execOnboarding.finalize")
                  : t("execOnboarding.continue")}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
