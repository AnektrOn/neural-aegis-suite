import { Plus, Trash2 } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageContext";
import {
  useOnboardingStore,
  type OnboardingProfileFields,
  type OnboardingStakeholder,
  type StakeholderRole,
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

interface Step2Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

const ROLE_OPTIONS: { value: StakeholderRole; labelKey: TranslationKey }[] = [
  { value: "COFOUNDER", labelKey: "execOnboarding.step2.role.cofounder" },
  { value: "LEAD_INVESTOR", labelKey: "execOnboarding.step2.role.board_investor" },
  { value: "RIGHT_HAND", labelKey: "execOnboarding.step2.role.exec_n1" },
  { value: "SPOUSE", labelKey: "execOnboarding.step2.role.spouse_family" },
];

const TENSION_OPTIONS: { value: TensionLevel; labelKey: TranslationKey }[] = [
  { value: "LOW", labelKey: "execOnboarding.step2.friction.aligned" },
  { value: "MEDIUM", labelKey: "execOnboarding.step2.friction.tense" },
  { value: "HIGH", labelKey: "execOnboarding.step2.friction.critical" },
  { value: "CRITICAL", labelKey: "execOnboarding.step2.friction.blocked" },
];

export default function Step2RelationalMap({ onSyncPatch }: Step2Props) {
  const { t } = useLanguage();
  const stakeholders = useOnboardingStore((s) => s.primary_stakeholders);
  const addStakeholder = useOnboardingStore((s) => s.addStakeholder);
  const updateStakeholder = useOnboardingStore((s) => s.updateStakeholder);
  const removeStakeholder = useOnboardingStore((s) => s.removeStakeholder);

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
          <span className="font-mono text-xs tabular-nums text-[#9e7828] dark:text-[#c9a24b]">
            {t("execOnboarding.step2.countBadge", { count: stakeholders.length })}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const active = item.role === opt.value;
                  const roleLabel = t(opt.labelKey);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        handleUpdate(item.id, {
                          role: opt.value,
                          role_label: roleLabel,
                        })
                      }
                      className={`${ONBOARDING_CHIP_BASE} ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                    >
                      <span>{roleLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
                {t("execOnboarding.step2.frictionLabel")}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TENSION_OPTIONS.map((opt) => {
                  const active = item.tension_level === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        handleUpdate(item.id, { tension_level: opt.value })
                      }
                      className={`${ONBOARDING_CHIP_BASE} justify-center text-center text-xs ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                    >
                      <span>{t(opt.labelKey)}</span>
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
