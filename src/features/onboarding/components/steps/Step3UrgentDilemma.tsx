import { ArrowRight } from "lucide-react";
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
  ONBOARDING_INPUT_CLASS,
  ONBOARDING_KICKER_CLASS,
  pickLocaleCopy,
} from "../../onboardingPrimitives";
import { getOccupationPreset } from "../../occupationPresets";

interface Step3Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

const COST_OPTIONS: { key: TranslationKey }[] = [
  { key: "execOnboarding.step3.cost.sleep" },
  { key: "execOnboarding.step3.cost.money" },
  { key: "execOnboarding.step3.cost.integrity" },
  { key: "execOnboarding.step3.cost.time" },
];

export default function Step3UrgentDilemma({ onSyncPatch }: Step3Props) {
  const { locale, t } = useLanguage();
  const occupation = useOnboardingStore((s) => s.occupation);
  const title = useOnboardingStore((s) => s.urgent_decision_title);
  const stakes = useOnboardingStore((s) => s.urgent_decision_stakes);
  const updateFields = useOnboardingStore((s) => s.updateFields);

  const preset = getOccupationPreset(occupation);
  const localizedExamples = preset.decisions.map((item) =>
    pickLocaleCopy(locale, item.fr, item.en),
  );
  const firstExample = localizedExamples[0] ?? "";

  const handleTitleChange = (nextTitle: string) => {
    const patch = { urgent_decision_title: nextTitle };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleSelectCost = (costLabel: string) => {
    const patch = { urgent_decision_stakes: costLabel };
    updateFields(patch);
    onSyncPatch(patch);
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.step3.kicker")}</p>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md border border-[#9e7828]/30 bg-[#9e7828]/10 text-[#9e7828] dark:border-[#c9a24b]/30 dark:bg-[#c9a24b]/10 dark:text-[#c9a24b]">
            {occupation}
          </span>
        </div>
        <h1 className={ONBOARDING_H1_CLASS}>{t("execOnboarding.step3.title")}</h1>
        <p className="text-sm sm:text-[15px] leading-relaxed text-[#161614]/70 dark:text-[#f5f2eb]/70">
          {t("execOnboarding.step3.subtitle")}
        </p>
      </header>

      <div className={`${ONBOARDING_CARD_CLASS} space-y-5`}>
        <div className="space-y-2">
          <label
            htmlFor="urgent-decision-title"
            className="block text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75"
          >
            {t("execOnboarding.step3.titleLabel")}
          </label>
          <textarea
            id="urgent-decision-title"
            rows={3}
            maxLength={220}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={t("execOnboarding.step3.titlePlaceholder", {
              example: firstExample,
            })}
            className={ONBOARDING_INPUT_CLASS}
          />
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#161614]/55 dark:text-[#f5f2eb]/55">
            {t("execOnboarding.step3.presetsLabel", { occupation })}
          </p>
          <div className="flex flex-col gap-2">
            {localizedExamples.map((exampleText) => {
              const active = title.trim() === exampleText.trim();
              return (
                <button
                  key={exampleText}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleTitleChange(exampleText)}
                  className={`${ONBOARDING_CHIP_BASE} justify-start text-xs sm:text-sm ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-[#9e7828] dark:text-[#c9a24b]"
                    aria-hidden
                  />
                  <span className="text-left leading-snug">{exampleText}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
            {t("execOnboarding.step3.stakesLabel")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {COST_OPTIONS.map(({ key }) => {
              const costLabel = t(key);
              const active = stakes === costLabel;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectCost(costLabel)}
                  className={`${ONBOARDING_CHIP_BASE} ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <span>{costLabel}</span>
                  {active && (
                    <span className="font-mono text-[10px] font-bold text-[#9e7828] dark:text-[#c9a24b]">
                      {t("execOnboarding.step3.costTag")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
