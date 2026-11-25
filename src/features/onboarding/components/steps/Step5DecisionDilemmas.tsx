import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageContext";
import { V4_QUESTIONS } from "@/features/archetype-assessment/domain/questionsV4";
import {
  useOnboardingStore,
  type OnboardingProfileFields,
} from "@/store/useOnboardingStore";
import {
  ONBOARDING_CARD_CLASS,
  ONBOARDING_CHIP_ACTIVE,
  ONBOARDING_CHIP_BASE,
  ONBOARDING_CHIP_IDLE,
  ONBOARDING_H1_CLASS,
  ONBOARDING_KICKER_CLASS,
  ONBOARDING_SUBCARD_CLASS,
  pickLocaleCopy,
} from "../../onboardingPrimitives";

interface Step5Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

/** Curated 6 executive leadership dilemmas extracted from V4 archetypes assessment. */
export const CURATED_DILEMMA_POSITIONS = [1, 7, 8, 16, 21, 22] as const;

const INTENSITY_OPTIONS: { level: 1 | 2 | 3; labelKey: TranslationKey }[] = [
  { level: 1, labelKey: "execOnboarding.step5.intensity.1" },
  { level: 2, labelKey: "execOnboarding.step5.intensity.2" },
  { level: 3, labelKey: "execOnboarding.step5.intensity.3" },
];

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export default function Step5DecisionDilemmas({ onSyncPatch }: Step5Props) {
  const { locale, t } = useLanguage();
  const responses = useOnboardingStore((s) => s.raw_dilemma_responses);
  const setDilemmaResponse = useOnboardingStore((s) => s.setDilemmaResponse);

  const dilemmas = useMemo(() => {
    const byPosition = new Map(V4_QUESTIONS.map((q) => [q.position, q]));
    return CURATED_DILEMMA_POSITIONS.map((pos) => byPosition.get(pos)).filter(
      (q): q is NonNullable<typeof q> => Boolean(q),
    );
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const currentQuestion = dilemmas[activeIndex] ?? dilemmas[0];

  const answeredCount = dilemmas.filter(
    (q) => Boolean(responses[String(q.position)]),
  ).length;

  if (!currentQuestion) return null;

  const qKey = String(currentQuestion.position);
  const currentAnswer = responses[qKey];
  const promptText = pickLocaleCopy(
    locale,
    currentQuestion.prompt_fr,
    currentQuestion.prompt_en,
  );

  const handleSelectOption = (optionPosition: number) => {
    setDilemmaResponse(qKey, {
      questionPosition: currentQuestion.position,
      dimension: currentQuestion.dimension ?? "leadership",
      optionPosition,
      intensity: currentAnswer?.intensity ?? 2,
      answeredAt: new Date().toISOString(),
    });
    onSyncPatch({
      raw_dilemma_responses: useOnboardingStore.getState().raw_dilemma_responses,
    });
  };

  const handleSelectIntensity = (intensity: 1 | 2 | 3) => {
    if (!currentAnswer) return;
    setDilemmaResponse(qKey, {
      ...currentAnswer,
      intensity,
      answeredAt: new Date().toISOString(),
    });
    onSyncPatch({
      raw_dilemma_responses: useOnboardingStore.getState().raw_dilemma_responses,
    });
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.step5.kicker")}</p>
          <span className="font-mono text-xs tabular-nums text-[#9e7828] dark:text-[#c9a24b]">
            {t("execOnboarding.step5.answeredCount", {
              answered: answeredCount,
              total: dilemmas.length,
            })}
          </span>
        </div>
        <h1 className={ONBOARDING_H1_CLASS}>{t("execOnboarding.step5.title")}</h1>
        <p className="text-sm sm:text-[15px] leading-relaxed text-[#161614]/70 dark:text-[#f5f2eb]/70">
          {t("execOnboarding.step5.subtitle")}
        </p>
      </header>

      <div className={`${ONBOARDING_CARD_CLASS} space-y-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {dilemmas.map((q, idx) => {
              const isCurrent = idx === activeIndex;
              const isAnswered = Boolean(responses[String(q.position)]);
              return (
                <button
                  key={q.position}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={t("execOnboarding.step5.progressLabel", {
                    current: idx + 1,
                    total: dilemmas.length,
                  })}
                  aria-current={isCurrent ? "step" : undefined}
                  className={
                    "min-h-[44px] min-w-[44px] rounded-xl border font-mono text-xs font-medium tabular-nums transition-all " +
                    (isCurrent
                      ? "border-[#9e7828] bg-[#9e7828] text-white dark:border-[#c9a24b] dark:bg-[#c9a24b] dark:text-[#0b0b0a]"
                      : isAnswered
                        ? "border-[#9e7828]/50 bg-[#9e7828]/12 text-[#9e7828] dark:border-[#c9a24b]/50 dark:bg-[#c9a24b]/15 dark:text-[#c9a24b]"
                        : "border-[#161614]/12 bg-white/80 text-[#161614]/65 dark:border-white/[0.08] dark:bg-[#1e1e1c] dark:text-[#f5f2eb]/65")
                  }
                >
                  {`0${idx + 1}`}
                </button>
              );
            })}
          </div>

          <span className="font-mono text-xs tabular-nums text-[#161614]/60 dark:text-[#f5f2eb]/60">
            {t("execOnboarding.step5.progressLabel", {
              current: activeIndex + 1,
              total: dilemmas.length,
            })}
          </span>
        </div>

        <div className={`${ONBOARDING_SUBCARD_CLASS} space-y-3`}>
          {currentQuestion.dimension && (
            <p className={ONBOARDING_KICKER_CLASS}>{currentQuestion.dimension}</p>
          )}
          <p className="text-base sm:text-[17px] font-medium leading-snug text-[#161614] dark:text-[#f5f2eb]">
            {promptText}
          </p>
        </div>

        <div className="space-y-2.5">
          {currentQuestion.options.map((opt, optIdx) => {
            const active = currentAnswer?.optionPosition === opt.position;
            const letter = OPTION_LETTERS[optIdx] ?? String(optIdx + 1);
            const optionLabel = pickLocaleCopy(locale, opt.label_fr, opt.label_en);
            return (
              <button
                key={opt.position}
                type="button"
                aria-pressed={active}
                onClick={() => handleSelectOption(opt.position)}
                className={`${ONBOARDING_CHIP_BASE} items-start py-3 ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
              >
                <span className="flex items-start gap-2.5 text-left">
                  <span className="font-mono text-xs font-bold uppercase text-[#9e7828] dark:text-[#c9a24b] mt-0.5 shrink-0">
                    {letter}.
                  </span>
                  <span className="leading-snug">{optionLabel}</span>
                </span>
                {active && (
                  <Check className="h-4 w-4 shrink-0 mt-0.5 text-[#9e7828] dark:text-[#c9a24b]" aria-hidden />
                )}
              </button>
            );
          })}
        </div>

        {currentAnswer && (
          <div className="space-y-2 pt-1 border-t border-[#161614]/10 dark:border-white/[0.08]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/70 dark:text-[#f5f2eb]/70">
              {t("execOnboarding.step5.intensityLabel")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {INTENSITY_OPTIONS.map((item) => {
                const active = currentAnswer.intensity === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleSelectIntensity(item.level)}
                    className={`${ONBOARDING_CHIP_BASE} justify-center text-center text-xs ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                  >
                    <span>{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            disabled={activeIndex === 0}
            onClick={() => setActiveIndex((idx) => Math.max(0, idx - 1))}
            className={
              "min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium " +
              "border-[#161614]/12 text-[#161614]/80 hover:border-[#9e7828]/50 disabled:opacity-35 disabled:pointer-events-none " +
              "dark:border-white/[0.10] dark:text-[#f5f2eb]/80 transition-colors"
            }
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            <span>{t("execOnboarding.step5.prevDilemma")}</span>
          </button>

          <button
            type="button"
            disabled={activeIndex >= dilemmas.length - 1}
            onClick={() =>
              setActiveIndex((idx) => Math.min(dilemmas.length - 1, idx + 1))
            }
            className={
              "min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium " +
              "border-[#161614]/12 text-[#161614]/80 hover:border-[#9e7828]/50 disabled:opacity-35 disabled:pointer-events-none " +
              "dark:border-white/[0.10] dark:text-[#f5f2eb]/80 transition-colors"
            }
          >
            <span>{t("execOnboarding.step5.nextDilemma")}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
