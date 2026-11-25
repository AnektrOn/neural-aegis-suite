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
  ONBOARDING_INPUT_CLASS,
  ONBOARDING_KICKER_CLASS,
} from "../../onboardingPrimitives";

interface Step1Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

const ROLE_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "founder_ceo", labelKey: "execOnboarding.step1.role.founder_ceo" },
  { value: "c_level", labelKey: "execOnboarding.step1.role.c_level" },
  { value: "vp_head", labelKey: "execOnboarding.step1.role.vp_head" },
  { value: "managing_partner", labelKey: "execOnboarding.step1.role.managing_partner" },
  { value: "board_advisor", labelKey: "execOnboarding.step1.role.board_advisor" },
  { value: "independent_principal", labelKey: "execOnboarding.step1.role.independent_principal" },
];

const ORG_SCALE_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "solo", labelKey: "execOnboarding.step1.org.solo" },
  { value: "2_10", labelKey: "execOnboarding.step1.org.2_10" },
  { value: "11_50", labelKey: "execOnboarding.step1.org.11_50" },
  { value: "51_250", labelKey: "execOnboarding.step1.org.51_250" },
  { value: "250_plus", labelKey: "execOnboarding.step1.org.250_plus" },
];

const PRESSURE_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "hypergrowth", labelKey: "execOnboarding.step1.pressure.hypergrowth" },
  { value: "cash_crunch", labelKey: "execOnboarding.step1.pressure.cash_crunch" },
  { value: "restructuring", labelKey: "execOnboarding.step1.pressure.restructuring" },
  { value: "board_conflict", labelKey: "execOnboarding.step1.pressure.board_conflict" },
  { value: "pivot", labelKey: "execOnboarding.step1.pressure.pivot" },
  { value: "steady_scaling", labelKey: "execOnboarding.step1.pressure.steady_scaling" },
  { value: "ma_exit", labelKey: "execOnboarding.step1.pressure.ma_exit" },
];

export default function Step1OperationalTheater({ onSyncPatch }: Step1Props) {
  const { t } = useLanguage();
  const roleTitle = useOnboardingStore((s) => s.role_title);
  const teamSize = useOnboardingStore((s) => s.team_size);
  const companyStage = useOnboardingStore((s) => s.company_stage);
  const governanceStructure = useOnboardingStore((s) => s.governance_structure);
  const updateFields = useOnboardingStore((s) => s.updateFields);

  const selectedPressures = companyStage
    ? companyStage.split(",").filter(Boolean)
    : [];

  const handleSelectRole = (value: string) => {
    const patch = { role_title: value };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleSelectScale = (value: string) => {
    const patch = { team_size: value };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleTogglePressure = (value: string) => {
    const exists = selectedPressures.includes(value);
    const next = exists
      ? selectedPressures.filter((item) => item !== value)
      : [...selectedPressures, value];
    const encoded = next.length > 0 ? next.join(",") : null;
    const patch = { company_stage: encoded };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleSectorChange = (sector: string) => {
    const patch = { governance_structure: sector || null };
    updateFields(patch);
    onSyncPatch(patch);
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.step1.kicker")}</p>
        <h1 className={ONBOARDING_H1_CLASS}>{t("execOnboarding.step1.title")}</h1>
        <p className="text-sm sm:text-[15px] leading-relaxed text-[#161614]/70 dark:text-[#f5f2eb]/70">
          {t("execOnboarding.step1.subtitle")}
        </p>
      </header>

      <div className={`${ONBOARDING_CARD_CLASS} space-y-5`}>
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
            {t("execOnboarding.step1.roleLabel")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ROLE_OPTIONS.map((opt) => {
              const active = roleTitle === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectRole(opt.value)}
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
            {t("execOnboarding.step1.orgLabel")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ORG_SCALE_OPTIONS.map((opt) => {
              const active = teamSize === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectScale(opt.value)}
                  className={`${ONBOARDING_CHIP_BASE} justify-center text-center ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <span className="font-mono text-xs sm:text-sm tabular-nums">{t(opt.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
            {t("execOnboarding.step1.pressureLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESSURE_OPTIONS.map((opt) => {
              const active = selectedPressures.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleTogglePressure(opt.value)}
                  className={
                    "min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition-all " +
                    (active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE)
                  }
                >
                  <span>{t(opt.labelKey)}</span>
                  {active && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#9e7828] dark:text-[#c9a24b]" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="exec-onboarding-sector"
            className="block text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75"
          >
            {t("execOnboarding.step1.sectorLabel")}
          </label>
          <input
            id="exec-onboarding-sector"
            type="text"
            maxLength={120}
            value={governanceStructure ?? ""}
            onChange={(e) => handleSectorChange(e.target.value)}
            placeholder={t("execOnboarding.step1.sectorPlaceholder")}
            className={ONBOARDING_INPUT_CLASS}
          />
        </div>
      </div>
    </section>
  );
}
