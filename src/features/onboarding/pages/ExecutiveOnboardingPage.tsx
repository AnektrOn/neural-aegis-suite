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
  TOTAL_ONBOARDING_MICRO_STEPS,
} from "../onboardingPrimitives";
import OnboardingTopBar from "../components/OnboardingTopBar";
import OnboardingAhaSynthesis from "../components/OnboardingAhaSynthesis";
import OnboardingCockpitPreview from "../components/OnboardingCockpitPreview";
import {
  MicroBirthDate,
  MicroDilemma,
  MicroEmail,
  MicroFullName,
  MicroLocation,
  MicroOccupation,
  MicroStakeholderName,
  MicroSymptoms,
  MicroUrgentTitle,
} from "../microSteps/ExecutiveMicroScreens";
import { dilemmaKeyForMicroStep, microStepToLegacyStep } from "../microSteps/microStepRouting";
import { useExecutiveOnboardingFunnelTracking } from "../hooks/useExecutiveOnboardingFunnelTracking";
import { markExecutiveOnboardingCompleteTracked } from "@/lib/executiveOnboardingFunnel";

export default function ExecutiveOnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale, t } = useLanguage();
  const navigate = useNavigate();

  const occupation = useOnboardingStore((s) => s.occupation);
  const fullName = useOnboardingStore((s) => s.full_name);
  const email = useOnboardingStore((s) => s.email);
  const birthDate = useOnboardingStore((s) => s.birth_date);
  const location = useOnboardingStore((s) => s.location);
  const primaryStakeholders = useOnboardingStore((s) => s.primary_stakeholders);
  const urgentDecisionTitle = useOnboardingStore((s) => s.urgent_decision_title);
  const stressSymptoms = useOnboardingStore((s) => s.stress_symptoms);
  const dominantFriction = useOnboardingStore((s) => s.dominant_decision_friction);
  const rawDilemmas = useOnboardingStore((s) => s.raw_dilemma_responses);

  const bindUser = useOnboardingStore((s) => s.bindUser);
  const setStep = useOnboardingStore((s) => s.setStep);
  const updateFields = useOnboardingStore((s) => s.updateFields);
  const hydrateFromRemote = useOnboardingStore((s) => s.hydrateFromRemote);
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  const [checkingRemote, setCheckingRemote] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [isSyncingBadge, setIsSyncingBadge] = useState(false);
  const [microStep, setMicroStep] = useState(1);

  const finalizedRef = useRef(false);
  const syncBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = user?.id ?? null;
  const localDone = isExecutiveOnboardingDone(userId);

  useExecutiveOnboardingFunnelTracking({
    microStep,
    locale,
    contactEmail: email,
    fullName,
    occupation,
    isSynthesizing,
    previewScore,
    finalized: finalizedRef.current,
  });

  // Hydrate remote draft if signed in; remain fully functional pre-login via localStorage.
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
        const snapshot = useOnboardingStore.getState();
        const metaName =
          typeof user?.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "";
        const prefill: Partial<OnboardingProfileFields> = {};
        if (!snapshot.email && user?.email) {
          prefill.email = user.email;
          prefill.team_size = user.email;
        }
        if (!snapshot.full_name && metaName) {
          prefill.full_name = metaName;
          prefill.annual_revenue_bracket = metaName;
        }
        if (Object.keys(prefill).length > 0) {
          updateFields(prefill);
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
  }, [
    authLoading,
    bindUser,
    hydrateFromRemote,
    navigate,
    resetOnboarding,
    updateFields,
    user?.email,
    user?.user_metadata?.full_name,
    userId,
  ]);

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
      if (finalizedRef.current || isSynthesizing || previewScore !== null) return;
      if (microStep > 1) {
        setMicroStep((s) => Math.max(1, s - 1));
      }
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      if (removeListener) void removeListener();
    };
  }, [microStep, isSynthesizing, previewScore]);

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
    switch (microStep) {
      case 1:
        return Boolean(occupation);
      case 2:
        return fullName.trim().length > 0;
      case 3:
        return email.trim().includes("@");
      case 4:
        return birthDate.trim().length > 0;
      case 5:
        return location.trim().length > 0;
      case 6:
        return primaryStakeholders.some((s) => s.name.trim().length > 0);
      case 7:
        return urgentDecisionTitle.trim().length > 0;
      case 8:
        return stressSymptoms.length > 0 || Boolean(dominantFriction);
      case 9:
        return Boolean(rawDilemmas.q1);
      case 10:
        return Boolean(rawDilemmas.q2);
      case 11:
        return Boolean(rawDilemmas.q3);
      default:
        return false;
    }
  })();

  const handleSynthesisReady = useCallback((score: number) => {
    finalizedRef.current = true;
    setIsSynthesizing(false);
    setPreviewScore(score);
  }, []);

  const handleReturnToSteps = useCallback(() => {
    finalizedRef.current = false;
    setIsSynthesizing(false);
  }, []);

  const handleEnterNextStage = useCallback(() => {
    markExecutiveOnboardingCompleteTracked();
    if (userId) {
      // Post-login completion of /start → Guardian voice onboarding (not dashboard)
      navigate("/onboarding", { replace: true });
      return;
    }
    // Pre-login flow: keep draft in localStorage, open signup with fields prefilled
    navigate("/auth?signup=1&redirect=/onboarding", { replace: true });
  }, [navigate, userId]);

  const handleReplay = useCallback(() => {
    finalizedRef.current = false;
    setPreviewScore(null);
    setIsSynthesizing(false);
    setMicroStep(1);
    setStep(1);
  }, [setStep]);

  const handleNext = () => {
    if (!canProceed) return;

    if (microStep < TOTAL_ONBOARDING_MICRO_STEPS) {
      const nextMicro = microStep + 1;
      const legacyStep = microStepToLegacyStep(nextMicro);
      setMicroStep(nextMicro);
      setStep(legacyStep);
      if (userId) {
        syncStepToSupabase({ onboarding_step_reached: legacyStep }, userId);
      }
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
    if (microStep <= 1 || isSynthesizing || previewScore !== null) return;
    const nextMicro = microStep - 1;
    const legacyStep = microStepToLegacyStep(nextMicro);
    setMicroStep(nextMicro);
    setStep(legacyStep);
    if (userId) {
      syncStepToSupabase({ onboarding_step_reached: legacyStep }, userId);
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

  if (localDone && !isSynthesizing && previewScore === null) {
    return <Navigate to="/dashboard" replace />;
  }

  const hideFooter = isSynthesizing || previewScore !== null;

  return (
    <div className={`${ONBOARDING_SHELL_CLASS} flex flex-col`}>
      <OnboardingTopBar
        currentStep={microStepToLegacyStep(microStep)}
        progressIndex={microStep}
        progressTotal={TOTAL_ONBOARDING_MICRO_STEPS}
        isSyncing={isSyncingBadge}
        hideAudioControls={hideFooter}
      />

      <main
        className={`mx-auto w-full max-w-2xl flex-1 px-4 sm:px-6 pt-6 ${hideFooter ? "pb-10" : "pb-32"}`}
      >
        {isSynthesizing ? (
          <OnboardingAhaSynthesis
            userId={userId}
            onSynthesisReady={handleSynthesisReady}
            onReturnToSteps={handleReturnToSteps}
          />
        ) : previewScore !== null ? (
          <OnboardingCockpitPreview
            clarityScore={previewScore}
            isAuthenticated={Boolean(userId)}
            onContinue={handleEnterNextStage}
            onReplay={handleReplay}
          />
        ) : (
          <>
            {microStep === 1 && <MicroOccupation onSyncPatch={handleSyncPatch} />}
            {microStep === 2 && <MicroFullName onSyncPatch={handleSyncPatch} />}
            {microStep === 3 && <MicroEmail onSyncPatch={handleSyncPatch} />}
            {microStep === 4 && <MicroBirthDate onSyncPatch={handleSyncPatch} />}
            {microStep === 5 && <MicroLocation onSyncPatch={handleSyncPatch} />}
            {microStep === 6 && <MicroStakeholderName onSyncPatch={handleSyncPatch} />}
            {microStep === 7 && <MicroUrgentTitle onSyncPatch={handleSyncPatch} />}
            {microStep === 8 && <MicroSymptoms onSyncPatch={handleSyncPatch} />}
            {dilemmaKeyForMicroStep(microStep) ? (
              <MicroDilemma
                dilemmaKey={dilemmaKeyForMicroStep(microStep)!}
                onSyncPatch={handleSyncPatch}
              />
            ) : null}
          </>
        )}
      </main>

      {!hideFooter && (
        <footer
          className={
            "fixed inset-x-0 bottom-0 z-30 border-t border-[#161614]/10 bg-[#f5f2eb]/95 backdrop-blur-md " +
            "dark:border-white/[0.08] dark:bg-[#0b0b0a]/95 px-4 sm:px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)]"
          }
        >
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            {microStep > 1 && (
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
                {microStep === TOTAL_ONBOARDING_MICRO_STEPS
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
