import { Check } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageContext";
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
} from "../../onboardingPrimitives";

interface Step5Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

export const CURATED_DILEMMA_KEYS = ["q1", "q2", "q3"] as const;
/** @deprecated Alias kept for test compatibility */
export const CURATED_DILEMMA_POSITIONS = [1, 2, 3] as const;

interface MirrorDilemma {
  id: (typeof CURATED_DILEMMA_KEYS)[number];
  position: 1 | 2 | 3;
  dimension: string;
  shadowKey: TranslationKey;
  questionKey: TranslationKey;
  options: { score: 1 | 2 | 3; labelKey: TranslationKey }[];
}

const MIRROR_DILEMMAS: MirrorDilemma[] = [
  {
    id: "q1",
    position: 1,
    dimension: "prostitute",
    shadowKey: "execOnboarding.step5.q1.shadow",
    questionKey: "execOnboarding.step5.q1.question",
    options: [
      { score: 1, labelKey: "execOnboarding.step5.q1.opt1" },
      { score: 2, labelKey: "execOnboarding.step5.q1.opt2" },
      { score: 3, labelKey: "execOnboarding.step5.q1.opt3" },
    ],
  },
  {
    id: "q2",
    position: 2,
    dimension: "saboteur",
    shadowKey: "execOnboarding.step5.q2.shadow",
    questionKey: "execOnboarding.step5.q2.question",
    options: [
      { score: 1, labelKey: "execOnboarding.step5.q2.opt1" },
      { score: 2, labelKey: "execOnboarding.step5.q2.opt2" },
      { score: 3, labelKey: "execOnboarding.step5.q2.opt3" },
    ],
  },
  {
    id: "q3",
    position: 3,
    dimension: "victim",
    shadowKey: "execOnboarding.step5.q3.shadow",
    questionKey: "execOnboarding.step5.q3.question",
    options: [
      { score: 1, labelKey: "execOnboarding.step5.q3.opt1" },
      { score: 2, labelKey: "execOnboarding.step5.q3.opt2" },
      { score: 3, labelKey: "execOnboarding.step5.q3.opt3" },
    ],
  },
];

export default function Step5DecisionDilemmas({ onSyncPatch }: Step5Props) {
  const { t } = useLanguage();
  const responses = useOnboardingStore((s) => s.raw_dilemma_responses);
  const setDilemmaResponse = useOnboardingStore((s) => s.setDilemmaResponse);

  const answeredCount = MIRROR_DILEMMAS.filter(
    (d) => Boolean(responses[d.id]),
  ).length;

  const handleAnswer = (dilemma: MirrorDilemma, score: 1 | 2 | 3) => {
    setDilemmaResponse(dilemma.id, {
      questionPosition: dilemma.position,
      dimension: dilemma.dimension,
      optionPosition: score,
      intensity: score,
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
              total: MIRROR_DILEMMAS.length,
            })}
          </span>
        </div>
        <h1 className={ONBOARDING_H1_CLASS}>{t("execOnboarding.step5.title")}</h1>
        <p className="text-sm sm:text-[15px] leading-relaxed text-[#161614]/70 dark:text-[#f5f2eb]/70">
          {t("execOnboarding.step5.subtitle")}
        </p>
      </header>

      <div className={`${ONBOARDING_CARD_CLASS} space-y-4`}>
        {MIRROR_DILEMMAS.map((dilemma, idx) => {
          const currentScore = responses[dilemma.id]?.optionPosition;
          return (
            <div key={dilemma.id} className={`${ONBOARDING_SUBCARD_CLASS} space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#161614]/8 text-[#161614]/75 dark:bg-white/[0.08] dark:text-[#f5f2eb]/80 tabular-nums">
                  {`0${idx + 1}`}
                </span>
                <span className="font-mono text-[11px] text-[#9e7828] dark:text-[#c9a24b]">
                  {t(dilemma.shadowKey)}
                </span>
              </div>

              <p className="text-sm sm:text-[15px] font-medium leading-snug text-[#161614] dark:text-[#f5f2eb]">
                {t(dilemma.questionKey)}
              </p>

              <div className="space-y-2">
                {dilemma.options.map((opt) => {
                  const picked = currentScore === opt.score;
                  return (
                    <button
                      key={opt.score}
                      type="button"
                      aria-pressed={picked}
                      onClick={() => handleAnswer(dilemma, opt.score)}
                      className={`${ONBOARDING_CHIP_BASE} items-start py-3 text-xs sm:text-sm ${picked ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                    >
                      <span className="text-left leading-relaxed">{t(opt.labelKey)}</span>
                      {picked && (
                        <Check
                          className="h-4 w-4 shrink-0 mt-0.5 text-[#9e7828] dark:text-[#c9a24b]"
                          aria-hidden
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
