import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { markProductTourDone } from "@/lib/productTour";
import { finalizeOnboarding } from "@/services/onboardingService";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import {
  ONBOARDING_CARD_CLASS,
  ONBOARDING_KICKER_CLASS,
  ONBOARDING_PRIMARY_BTN_CLASS,
  ONBOARDING_SECONDARY_BTN_CLASS,
} from "../onboardingPrimitives";

interface OnboardingAhaSynthesisProps {
  userId: string | null;
  onSynthesisReady: (clarityScore: number) => void;
  onReturnToSteps: () => void;
}

const SYNTHESIS_MIN_DURATION_MS = 3000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function computeLocalSovereigntyScore(): number {
  const responses = Object.values(
    useOnboardingStore.getState().raw_dilemma_responses,
  );
  if (responses.length === 0) return 64;
  const rawSum = responses.reduce(
    (sum, item) => sum + (item.optionPosition || item.intensity || 2),
    0,
  );
  return Math.min(
    94,
    Math.max(38, Math.round((rawSum / (responses.length * 3)) * 88)),
  );
}

export default function OnboardingAhaSynthesis({
  userId,
  onSynthesisReady,
  onReturnToSteps,
}: OnboardingAhaSynthesisProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { reduceMotion } = useAegisMotion();
  const fullName = useOnboardingStore((s) => s.full_name);

  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [attempt, setAttempt] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSynthesisReadyRef = useRef(onSynthesisReady);
  onSynthesisReadyRef.current = onSynthesisReady;

  const runCalibration = useCallback(async () => {
    setErrorMsg(null);
    setPhase(1);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setPhase(1);
    setErrorMsg(null);

    const t1 = setTimeout(() => {
      if (!cancelled) setPhase(2);
    }, 750);
    const t2 = setTimeout(() => {
      if (!cancelled) setPhase(3);
    }, 1500);
    const t3 = setTimeout(() => {
      if (!cancelled) setPhase(4);
    }, 2250);

    const localScore = computeLocalSovereigntyScore();

    const syncWork = userId
      ? finalizeOnboarding(userId)
      : Promise.resolve({ success: true, clarity_score: localScore });

    Promise.all([delay(SYNTHESIS_MIN_DURATION_MS), syncWork])
      .then(async ([, res]) => {
        if (cancelled) return;

        if (userId) {
          markProductTourDone(userId);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["dashboard-mobile"] }),
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
            queryClient.invalidateQueries({ queryKey: ["dashboard-digest"] }),
            queryClient.invalidateQueries({ queryKey: ["dashboard-people"] }),
            queryClient.invalidateQueries({ queryKey: ["decision-journal"] }),
            queryClient.invalidateQueries({ queryKey: ["bio-executive-hero"] }),
            queryClient.invalidateQueries({ queryKey: ["aegis-health"] }),
            queryClient.invalidateQueries({ queryKey: ["persona-tracking-stats"] }),
          ]);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("aegis:refresh"));
          }
        }

        if (!cancelled) {
          const score =
            typeof res.clarity_score === "number"
              ? Math.round(res.clarity_score)
              : localScore;
          onSynthesisReadyRef.current(score);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        const msg =
          err instanceof Error && err.message
            ? err.message
            : "CALIBRATION_INTERRUPTED";
        setErrorMsg(msg);
      });

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [attempt, queryClient, userId]);

  const phaseTitles = {
    1: t("execOnboarding.aha.phase1.title"),
    2: t("execOnboarding.aha.phase2.title"),
    3: t("execOnboarding.aha.phase3.title"),
    4: t("execOnboarding.aha.phase4.title"),
  } as const;

  const memberDisplayName =
    fullName.trim() || t("execOnboarding.aha.defaultMember");

  if (errorMsg) {
    return (
      <div className="mx-auto flex min-h-[70dvh] max-w-xl flex-col justify-center px-4 py-8">
        <div className={`${ONBOARDING_CARD_CLASS} space-y-5 text-center`}>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-2">
            <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.aha.kicker")}</p>
            <h1 className="font-cormorant text-2xl sm:text-3xl font-light text-[#161614] dark:text-[#f5f2eb]">
              {t("execOnboarding.aha.errorTitle")}
            </h1>
            <p className="font-mono text-xs text-[#161614]/60 dark:text-[#f5f2eb]/60">
              {errorMsg}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={onReturnToSteps}
              className={`${ONBOARDING_SECONDARY_BTN_CLASS} flex-1`}
            >
              <span>{t("execOnboarding.aha.backToEdit")}</span>
            </button>
            <button
              type="button"
              onClick={() => void runCalibration()}
              className={`${ONBOARDING_PRIMARY_BTN_CLASS} flex-1`}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              <span>{t("execOnboarding.aha.errorRetry")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[75dvh] max-w-xl flex-col justify-center px-4 py-10">
      <div
        role="status"
        aria-live="polite"
        className={`${ONBOARDING_CARD_CLASS} space-y-7 py-8 px-5 sm:px-8`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.aha.kicker")}</p>
          <span className="font-mono text-xs font-medium tabular-nums text-[#9e7828] dark:text-[#c9a24b]">
            {`0${phase} / 04`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#9e7828]/40 bg-[#9e7828]/10 dark:border-[#c9a24b]/40 dark:bg-[#c9a24b]/10">
            <span
              className={
                reduceMotion
                  ? "h-3 w-3 rounded-full bg-[#9e7828] dark:bg-[#c9a24b]"
                  : "h-3 w-3 rounded-full bg-[#9e7828] dark:bg-[#c9a24b] animate-pulse"
              }
            />
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="font-cormorant text-2xl sm:text-[28px] font-light leading-tight text-[#161614] dark:text-[#f5f2eb]">
              {phaseTitles[phase]}
            </h1>
            <p className="text-sm text-[#161614]/70 dark:text-[#f5f2eb]/70">
              {t("execOnboarding.aha.subtitle", { name: memberDisplayName })}
            </p>
          </div>
        </div>

        <ol className="space-y-2.5 border-t border-[#161614]/10 pt-5 dark:border-white/[0.08]">
          {([1, 2, 3, 4] as const).map((stepNumber) => {
            const done = phase > stepNumber;
            const current = phase === stepNumber;
            return (
              <li
                key={stepNumber}
                className={
                  "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-colors " +
                  (current
                    ? "border-[#9e7828]/60 bg-[#9e7828]/10 text-[#161614] dark:border-[#c9a24b]/55 dark:bg-[#c9a24b]/12 dark:text-[#f5f2eb]"
                    : done
                      ? "border-[#161614]/10 bg-transparent text-[#161614]/80 dark:border-white/[0.06] dark:text-[#f5f2eb]/80"
                      : "border-transparent bg-transparent text-[#161614]/40 dark:text-[#f5f2eb]/40")
                }
              >
                <CheckCircle2
                  className={
                    done || current
                      ? "h-4 w-4 shrink-0 text-[#9e7828] dark:text-[#c9a24b]"
                      : "h-4 w-4 shrink-0 text-[#161614]/25 dark:text-[#f5f2eb]/25"
                  }
                  aria-hidden
                />
                <span className="truncate font-medium">
                  {phaseTitles[stepNumber]}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
