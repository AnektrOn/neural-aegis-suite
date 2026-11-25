import { Anchor, Check, HelpCircle, Scale, ShieldAlert } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageContext";
import {
  useOnboardingStore,
  type OnboardingProfileFields,
} from "@/store/useOnboardingStore";
import {
  ONBOARDING_CARD_CLASS,
  ONBOARDING_CHIP_ACTIVE,
  ONBOARDING_CHIP_IDLE,
  ONBOARDING_H1_CLASS,
  ONBOARDING_KICKER_CLASS,
} from "../../onboardingPrimitives";

interface Step4Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

const SHADOW_OPTIONS: {
  id: "saboteur" | "prostitute" | "victim" | "child";
  titleKey: TranslationKey;
  descKey: TranslationKey;
  clinicalKey: TranslationKey;
  Icon: typeof ShieldAlert;
}[] = [
  {
    id: "saboteur",
    titleKey: "execOnboarding.step4.shadow.saboteur.title",
    descKey: "execOnboarding.step4.shadow.saboteur.desc",
    clinicalKey: "execOnboarding.step4.shadow.saboteur.clinical",
    Icon: ShieldAlert,
  },
  {
    id: "prostitute",
    titleKey: "execOnboarding.step4.shadow.prostitute.title",
    descKey: "execOnboarding.step4.shadow.prostitute.desc",
    clinicalKey: "execOnboarding.step4.shadow.prostitute.clinical",
    Icon: Scale,
  },
  {
    id: "victim",
    titleKey: "execOnboarding.step4.shadow.victim.title",
    descKey: "execOnboarding.step4.shadow.victim.desc",
    clinicalKey: "execOnboarding.step4.shadow.victim.clinical",
    Icon: Anchor,
  },
  {
    id: "child",
    titleKey: "execOnboarding.step4.shadow.child.title",
    descKey: "execOnboarding.step4.shadow.child.desc",
    clinicalKey: "execOnboarding.step4.shadow.child.clinical",
    Icon: HelpCircle,
  },
];

export default function Step4SomaticFriction({ onSyncPatch }: Step4Props) {
  const { t } = useLanguage();
  const stressSymptoms = useOnboardingStore((s) => s.stress_symptoms);
  const toggleStressSymptom = useOnboardingStore((s) => s.toggleStressSymptom);
  const updateFields = useOnboardingStore((s) => s.updateFields);

  const handleToggleShadow = (id: "saboteur" | "prostitute" | "victim" | "child") => {
    const wasSelected = stressSymptoms.includes(id);
    toggleStressSymptom(id);
    const nextState = useOnboardingStore.getState();
    const dominant = !wasSelected
      ? id
      : nextState.stress_symptoms[0] ?? null;
    if (dominant !== nextState.dominant_decision_friction) {
      updateFields({ dominant_decision_friction: dominant });
    }
    onSyncPatch({
      stress_symptoms: useOnboardingStore.getState().stress_symptoms,
      dominant_decision_friction: useOnboardingStore.getState().dominant_decision_friction,
    });
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

      <div className={`${ONBOARDING_CARD_CLASS} space-y-3`}>
        {SHADOW_OPTIONS.map(({ id, titleKey, descKey, clinicalKey, Icon }) => {
          const selected = stressSymptoms.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => handleToggleShadow(id)}
              className={
                "min-h-[76px] w-full rounded-xl border p-4 text-left transition-all duration-150 " +
                "flex items-start gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]/60 " +
                (selected ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE)
              }
            >
              <Icon
                className="h-5 w-5 shrink-0 mt-0.5 text-[#9e7828] dark:text-[#c9a24b]"
                aria-hidden
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold leading-snug">
                    {t(titleKey)}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-md border border-[#9e7828]/30 bg-[#9e7828]/10 text-[#9e7828] dark:border-[#c9a24b]/30 dark:bg-[#c9a24b]/10 dark:text-[#c9a24b]">
                    {t(clinicalKey)}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] leading-relaxed text-[#161614]/70 dark:text-[#f5f2eb]/70">
                  {t(descKey)}
                </p>
              </div>
              {selected && (
                <Check
                  className="h-4 w-4 shrink-0 mt-0.5 text-[#9e7828] dark:text-[#c9a24b]"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
