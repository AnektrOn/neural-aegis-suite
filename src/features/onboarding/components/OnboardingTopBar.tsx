import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Volume2 } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import { useLanguage } from "@/i18n/LanguageContext";
import { getGuardianAudioSrc } from "@/features/guardian/guardianAudio";
import type { GuardianGender } from "@/features/guardian/types";
import type { OnboardingStep } from "@/store/useOnboardingStore";
import {
  mapStepToGuardianAudioStep,
  ONBOARDING_KICKER_CLASS,
  pickLocaleCopy,
  TOTAL_ONBOARDING_STEPS,
} from "../onboardingPrimitives";

interface OnboardingTopBarProps {
  currentStep: OnboardingStep;
  /** When set, progress pills reflect micro-steps instead of the legacy 5 steps. */
  progressIndex?: number;
  progressTotal?: number;
  isSyncing?: boolean;
  hideAudioControls?: boolean;
}

const STEP_NUMBERS: OnboardingStep[] = [1, 2, 3, 4, 5];

export default function OnboardingTopBar({
  currentStep,
  progressIndex,
  progressTotal,
  isSyncing = false,
  hideAudioControls = false,
}: OnboardingTopBarProps) {
  const { locale, setLocale, t } = useLanguage();
  const [voiceGender, setVoiceGender] = useState<GuardianGender>("female");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioStep = mapStepToGuardianAudioStep(currentStep);
  const audioSrc = getGuardianAudioSrc(voiceGender, locale, audioStep);
  const guideName =
    voiceGender === "female"
      ? t("execOnboarding.audioSwitchFemale")
      : t("execOnboarding.audioSwitchMale");

  // Reset playback state safely when track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, [audioSrc]);

  const handleTogglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleToggleVoice = useCallback(() => {
    setVoiceGender((prev) => (prev === "female" ? "male" : "female"));
  }, []);

  const handleToggleLocale = useCallback(() => {
    setLocale(pickLocaleCopy(locale, "en", "fr") as "fr" | "en");
  }, [locale, setLocale]);

  return (
    <header
      className={
        "sticky top-0 z-30 border-b border-[#161614]/10 bg-[#f5f2eb]/92 backdrop-blur-md " +
        "dark:border-white/[0.08] dark:bg-[#0b0b0a]/92 pt-[calc(env(safe-area-inset-top)+0.65rem)] pb-3 px-4 sm:px-6"
      }
    >
      <div className="mx-auto max-w-2xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <AegisLogo className="h-6 sm:h-7 w-auto shrink-0" />
            <span className="font-mono text-xs font-medium tabular-nums text-[#161614]/70 dark:text-[#f5f2eb]/70">
              {t("execOnboarding.stepCounter", {
                step: progressIndex ?? currentStep,
                total: progressTotal ?? TOTAL_ONBOARDING_STEPS,
              })}
            </span>
            {isSyncing && (
              <span className={`${ONBOARDING_KICKER_CLASS} hidden sm:inline`}>
                {t("execOnboarding.savingBadge")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!hideAudioControls && (
              <>
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  preload="none"
                  onEnded={() => setIsPlaying(false)}
                />
                <button
                  type="button"
                  onClick={() => void handleTogglePlay()}
                  aria-pressed={isPlaying}
                  className={
                    "min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors " +
                    "border-[#161614]/12 bg-white/80 text-[#161614] hover:border-[#9e7828]/60 " +
                    "dark:border-white/[0.10] dark:bg-[#161614] dark:text-[#f5f2eb] dark:hover:border-[#c9a24b]/60"
                  }
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5 text-[#9e7828] dark:text-[#c9a24b]" aria-hidden />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-[#9e7828] dark:text-[#c9a24b]" aria-hidden />
                  )}
                  <span className="hidden xs:inline sm:inline">
                    {isPlaying
                      ? t("execOnboarding.audioPause", { guide: guideName })
                      : t("execOnboarding.audioPlay", { guide: guideName })}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleVoice}
                  aria-label={t("execOnboarding.audioToggleVoiceAria")}
                  className={
                    "min-h-[44px] rounded-xl border px-2.5 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors " +
                    "border-[#161614]/12 bg-white/80 text-[#161614]/75 hover:text-[#161614] " +
                    "dark:border-white/[0.10] dark:bg-[#161614] dark:text-[#f5f2eb]/75 dark:hover:text-[#f5f2eb]"
                  }
                >
                  {guideName}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleToggleLocale}
              aria-label={t("execOnboarding.langToggleAria")}
              className={
                "min-h-[44px] min-w-[44px] rounded-xl border px-2.5 py-2 font-mono text-xs font-medium uppercase transition-colors " +
                "border-[#161614]/12 bg-white/80 text-[#161614]/80 hover:border-[#9e7828]/60 " +
                "dark:border-white/[0.10] dark:bg-[#161614] dark:text-[#f5f2eb]/80 dark:hover:border-[#c9a24b]/60"
              }
            >
              {pickLocaleCopy(locale, "EN", "FR")}
            </button>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label={t("execOnboarding.progressAria")}
          aria-valuemin={1}
          aria-valuemax={progressTotal ?? TOTAL_ONBOARDING_STEPS}
          aria-valuenow={progressIndex ?? currentStep}
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${progressTotal ?? TOTAL_ONBOARDING_STEPS}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: progressTotal ?? TOTAL_ONBOARDING_STEPS }, (_, i) => i + 1).map((stepNum) => {
            const active = stepNum <= (progressIndex ?? currentStep);
            return (
              <span
                key={stepNum}
                className={
                  active
                    ? "h-1 rounded-full bg-[#9e7828] dark:bg-[#c9a24b] transition-colors duration-200"
                    : "h-1 rounded-full bg-[#161614]/12 dark:bg-white/[0.10] transition-colors duration-200"
                }
              />
            );
          })}
        </div>
      </div>
    </header>
  );
}
