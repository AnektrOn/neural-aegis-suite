import { Activity, Check } from "lucide-react";
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
} from "../../onboardingPrimitives";

interface Step4Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

const SYMPTOM_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "hyper_control", labelKey: "execOnboarding.step4.symptom.hyper_control" },
  { value: "escalation_avoidance", labelKey: "execOnboarding.step4.symptom.escalation_avoidance" },
  { value: "cognitive_dispersion", labelKey: "execOnboarding.step4.symptom.cognitive_dispersion" },
  { value: "emotional_overinvestment", labelKey: "execOnboarding.step4.symptom.emotional_overinvestment" },
  { value: "insomnia_rumination", labelKey: "execOnboarding.step4.symptom.insomnia_rumination" },
  { value: "somatic_tension", labelKey: "execOnboarding.step4.symptom.somatic_tension" },
];

const FRICTION_ARCHETYPES: { value: string; labelKey: TranslationKey }[] = [
  { value: "control", labelKey: "execOnboarding.step4.friction.control" },
  { value: "avoidance", labelKey: "execOnboarding.step4.friction.avoidance" },
  { value: "burnout_risk", labelKey: "execOnboarding.step4.friction.burnout_risk" },
  { value: "people_pleasing", labelKey: "execOnboarding.step4.friction.people_pleasing" },
];

const PEAK_WINDOWS: { value: string; labelKey: TranslationKey }[] = [
  { value: "morning_startup", labelKey: "execOnboarding.step4.peak.morning_startup" },
  { value: "midday_overload", labelKey: "execOnboarding.step4.peak.midday_overload" },
  { value: "late_evening", labelKey: "execOnboarding.step4.peak.late_evening" },
  { value: "sunday_anticipation", labelKey: "execOnboarding.step4.peak.sunday_anticipation" },
];

export default function Step4SomaticFriction({ onSyncPatch }: Step4Props) {
  const { t } = useLanguage();
  const stressSymptoms = useOnboardingStore((s) => s.stress_symptoms);
  const dominantFriction = useOnboardingStore((s) => s.dominant_decision_friction);
  const peakFocusTime = useOnboardingStore((s) => s.peak_focus_time);
  const toggleStressSymptom = useOnboardingStore((s) => s.toggleStressSymptom);
  const updateFields = useOnboardingStore((s) => s.updateFields);

  const handleToggleSymptom = (symptom: string) => {
    toggleStressSymptom(symptom);
    const next = useOnboardingStore.getState();
    onSyncPatch({
      stress_symptoms: next.stress_symptoms,
      dominant_decision_friction: next.dominant_decision_friction,
    });
  };

  const handleSelectFriction = (value: string) => {
    const patch = { dominant_decision_friction: value };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleSelectPeak = (value: string) => {
    const patch = { peak_focus_time: value };
    updateFields(patch);
    onSyncPatch(patch);
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.step4.kicker")}</p>
        <h1 className={ONBOARDING_H1_CLASS}>{t("execOnboarding.step4.title")}</h1>
        <p className="text-sm sm:text-[15px] leading-relaxed text-[#161614]/70 dark:text-[#f5f2eb]/70">
          {t("execOnboarding.step4.subtitle")}
        </p>
      </header>

      <div className={`${ONBOARDING_CARD_CLASS} space-y-5`}>
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
            {t("execOnboarding.step4.symptomsLabel")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SYMPTOM_OPTIONS.map((opt) => {
              const active = stressSymptoms.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleToggleSymptom(opt.value)}
                  className={`${ONBOARDING_CHIP_BASE} ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <span>{t(opt.labelKey)}</span>
                  {active && (
                    <Check className="h-4 w-4 shrink-0 text-[#9e7828] dark:text-[#c9a24b]" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#9e7828] dark:text-[#c9a24b]" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
              {t("execOnboarding.step4.archetypeHintTitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FRICTION_ARCHETYPES.map((opt) => {
              const active = dominantFriction === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectFriction(opt.value)}
                  className={`${ONBOARDING_CHIP_BASE} ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <span>{t(opt.labelKey)}</span>
                  {active && (
                    <Check className="h-4 w-4 shrink-0 text-[#9e7828] dark:text-[#c9a24b]" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
            {t("execOnboarding.step4.peakLabel")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PEAK_WINDOWS.map((opt) => {
              const active = peakFocusTime === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectPeak(opt.value)}
                  className={`${ONBOARDING_CHIP_BASE} ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <span>{t(opt.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
