import { Plus, Trash2 } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageContext";
import {
  useOnboardingStore,
  type OnboardingProfileFields,
  type OnboardingStakeholder,
  type TensionLevel,
} from "@/store/useOnboardingStore";
import {
  ONBOARDING_CARD_CLASS,
  ONBOARDING_CHIP_ACTIVE,
  ONBOARDING_CHIP_BASE,
  ONBOARDING_CHIP_IDLE,
  ONBOARDING_H1_CLASS,
  ONBOARDING_INPUT_CLASS,
  ONBOARDING_KICKER_CLASS,
  ONBOARDING_SUBCARD_CLASS,
} from "../../onboardingPrimitives";
import {
  getLocalizedRoleLabel,
  getOccupationPreset,
} from "../../occupationPresets";

interface Step2Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

const DYNAMICS: {
  id: string;
  labelKey: TranslationKey;
  level: TensionLevel;
}[] = [
  { id: "unspoken", labelKey: "execOnboarding.step2.dynamic.unspoken", level: "HIGH" },
  { id: "disagreement", labelKey: "execOnboarding.step2.dynamic.disagreement", level: "HIGH" },
  { id: "trust_loss", labelKey: "execOnboarding.step2.dynamic.trust_loss", level: "CRITICAL" },
  { id: "emotional_load", labelKey: "execOnboarding.step2.dynamic.emotional_load", level: "MEDIUM" },
];

export default function Step2RelationalMap({ onSyncPatch }: Step2Props) {
  const { locale, t } = useLanguage();
  const occupation = useOnboardingStore((s) => s.occupation);
  const stakeholders = useOnboardingStore((s) => s.primary_stakeholders);
  const addStakeholder = useOnboardingStore((s) => s.addStakeholder);
  const updateStakeholder = useOnboardingStore((s) => s.updateStakeholder);
  const removeStakeholder = useOnboardingStore((s) => s.removeStakeholder);

  const preset = getOccupationPreset(occupation);

  const syncCurrentList = () => {
    onSyncPatch({
      primary_stakeholders: useOnboardingStore.getState().primary_stakeholders,
    });
  };

  const handleUpdate = (
    id: string,
    patch: Partial<Omit<OnboardingStakeholder, "id">>,
  ) => {
    updateStakeholder(id, patch);
    syncCurrentList();
  };

  const handleAdd = () => {
    addStakeholder();
    syncCurrentList();
  };

  const handleRemove = (id: string) => {
    removeStakeholder(id);
    syncCurrentList();
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.step2.kicker")}</p>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md border border-[#9e7828]/30 bg-[#9e7828]/10 text-[#9e7828] dark:border-[#c9a24b]/30 dark:bg-[#c9a24b]/10 dark:text-[#c9a24b]">
            {occupation}
          </span>
        </div>
        <h1 className={ONBOARDING_H1_CLASS}>{t("execOnboarding.step2.title")}</h1>
        <p className="text-sm sm:text-[15px] leading-relaxed text-[#161614]/70 dark:text-[#f5f2eb]/70">
          {t("execOnboarding.step2.subtitle")}
        </p>
      </header>

      <div className={`${ONBOARDING_CARD_CLASS} space-y-4`}>
        {stakeholders.map((item, idx) => (
          <div key={item.id} className={`${ONBOARDING_SUBCARD_CLASS} space-y-4`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-[#9e7828] dark:text-[#c9a24b] tabular-nums">
                {t("execOnboarding.step2.nodeIndex", { index: idx + 1 })}
              </span>
              {stakeholders.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  aria-label={t("execOnboarding.step2.removeNodeAria", { index: idx + 1 })}
                  className={
                    "min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border " +
                    "border-[#161614]/12 text-[#161614]/65 hover:border-red-500/40 hover:text-red-600 " +
                    "dark:border-white/[0.08] dark:text-[#f5f2eb]/65 dark:hover:text-red-400 transition-colors"
                  }
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`stakeholder-name-${item.id}`}
                className="block text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75"
              >
                {t("execOnboarding.step2.nameLabel")}
              </label>
              <input
                id={`stakeholder-name-${item.id}`}
                type="text"
                maxLength={80}
                value={item.name}
                onChange={(e) => handleUpdate(item.id, { name: e.target.value })}
                placeholder={t("execOnboarding.step2.namePlaceholder")}
                className={ONBOARDING_INPUT_CLASS}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
                {t("execOnboarding.step2.roleLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {preset.roles.map((roleOpt) => {
                  const label = getLocalizedRoleLabel(roleOpt, locale);
                  const active = item.role_label === label;
                  return (
                    <button
                      key={roleOpt.fr}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        handleUpdate(item.id, {
                          role: roleOpt.stakeholderRole,
                          role_label: label,
                        })
                      }
                      className={
                        "min-h-[44px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition-all " +
                        (active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE)
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
                {t("execOnboarding.step2.frictionLabel")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DYNAMICS.map((dyn) => {
                  const dynLabel = t(dyn.labelKey);
                  const active =
                    item.dynamic === dynLabel || item.dynamic === dyn.id;
                  return (
                    <button
                      key={dyn.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        handleUpdate(item.id, {
                          dynamic: dynLabel,
                          tension_level: dyn.level,
                        })
                      }
                      className={`${ONBOARDING_CHIP_BASE} text-xs sm:text-sm ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                    >
                      <span>{dynLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {stakeholders.length < 3 && (
          <button
            type="button"
            onClick={handleAdd}
            className={
              "min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed " +
              "border-[#9e7828]/50 bg-[#9e7828]/5 px-4 py-3 text-sm font-medium text-[#9e7828] hover:bg-[#9e7828]/10 " +
              "dark:border-[#c9a24b]/45 dark:bg-[#c9a24b]/5 dark:text-[#c9a24b] dark:hover:bg-[#c9a24b]/12 transition-colors"
            }
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              {t("execOnboarding.step2.addNode", { count: stakeholders.length })}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
