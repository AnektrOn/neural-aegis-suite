import { Building2, Compass, Crown, Feather, MapPin } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageContext";
import {
  useOnboardingStore,
  type ExecutiveOccupation,
  type OnboardingProfileFields,
} from "@/store/useOnboardingStore";
import {
  ONBOARDING_CARD_CLASS,
  ONBOARDING_CHIP_ACTIVE,
  ONBOARDING_CHIP_IDLE,
  ONBOARDING_H1_CLASS,
  ONBOARDING_INPUT_CLASS,
  ONBOARDING_KICKER_CLASS,
} from "../../onboardingPrimitives";
import {
  getLocalizedRoleLabel,
  getOccupationPreset,
} from "../../occupationPresets";

interface Step1Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

const OCCUPATION_CARDS: {
  id: ExecutiveOccupation;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  Icon: typeof Crown;
}[] = [
  {
    id: "Business Owner",
    labelKey: "execOnboarding.step1.occ.business_owner",
    descKey: "execOnboarding.step1.occ.business_owner.desc",
    Icon: Building2,
  },
  {
    id: "Leader",
    labelKey: "execOnboarding.step1.occ.leader",
    descKey: "execOnboarding.step1.occ.leader.desc",
    Icon: Compass,
  },
  {
    id: "Board Member",
    labelKey: "execOnboarding.step1.occ.board_member",
    descKey: "execOnboarding.step1.occ.board_member.desc",
    Icon: Crown,
  },
  {
    id: "Vie Perso / Indépendant",
    labelKey: "execOnboarding.step1.occ.personal",
    descKey: "execOnboarding.step1.occ.personal.desc",
    Icon: Feather,
  },
];

const QUICK_CITIES = [
  "Paris, France",
  "Lyon, France",
  "Montréal, Canada",
  "Genève, Suisse",
  "Bruxelles, Belgique",
] as const;

export default function Step1OperationalTheater({ onSyncPatch }: Step1Props) {
  const { locale, t } = useLanguage();
  const occupation = useOnboardingStore((s) => s.occupation);
  const fullName = useOnboardingStore((s) => s.full_name);
  const email = useOnboardingStore((s) => s.email);
  const birthDate = useOnboardingStore((s) => s.birth_date);
  const location = useOnboardingStore((s) => s.location);
  const primaryStakeholders = useOnboardingStore((s) => s.primary_stakeholders);
  const updateFields = useOnboardingStore((s) => s.updateFields);

  const handleSelectOccupation = (occ: ExecutiveOccupation) => {
    const preset = getOccupationPreset(occ);
    const firstRole = preset.roles[0];
    const updatedStakeholders =
      primaryStakeholders.length > 0 && firstRole
        ? primaryStakeholders.map((s, idx) =>
            idx === 0
              ? {
                  ...s,
                  role: firstRole.stakeholderRole,
                  role_label: getLocalizedRoleLabel(firstRole, locale),
                }
              : s,
          )
        : primaryStakeholders;

    const patch: Partial<OnboardingProfileFields> = {
      occupation: occ,
      role_title: occ,
      primary_stakeholders: updatedStakeholders,
    };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleFieldChange = (
    key: "full_name" | "email" | "birth_date" | "location",
    value: string,
  ) => {
    const patch: Partial<OnboardingProfileFields> = { [key]: value };
    if (key === "full_name") patch.annual_revenue_bracket = value;
    if (key === "email") patch.team_size = value;
    if (key === "birth_date") patch.company_stage = value;
    if (key === "location") patch.governance_structure = value;
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
            {t("execOnboarding.step1.occupationLabel")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {OCCUPATION_CARDS.map(({ id, labelKey, descKey, Icon }) => {
              const active = occupation === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectOccupation(id)}
                  className={
                    "min-h-[68px] w-full rounded-xl border p-3.5 text-left transition-all duration-150 " +
                    "flex flex-col justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]/60 " +
                    (active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE)
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className="h-4 w-4 shrink-0 text-[#9e7828] dark:text-[#c9a24b]"
                      aria-hidden
                    />
                    <span className="text-sm font-semibold leading-tight">
                      {t(labelKey)}
                    </span>
                  </div>
                  <p className="text-xs leading-snug text-[#161614]/65 dark:text-[#f5f2eb]/65">
                    {t(descKey)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="exec-onboarding-fullname"
            className="block text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75"
          >
            {t("execOnboarding.step1.fullNameLabel")}
          </label>
          <input
            id="exec-onboarding-fullname"
            type="text"
            maxLength={100}
            value={fullName}
            onChange={(e) => handleFieldChange("full_name", e.target.value)}
            placeholder={t("execOnboarding.step1.fullNamePlaceholder")}
            className={ONBOARDING_INPUT_CLASS}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="exec-onboarding-email"
            className="block text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75"
          >
            {t("execOnboarding.step1.emailLabel")}
          </label>
          <input
            id="exec-onboarding-email"
            type="email"
            maxLength={120}
            value={email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            placeholder={t("execOnboarding.step1.emailPlaceholder")}
            className={ONBOARDING_INPUT_CLASS}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="exec-onboarding-birthdate"
            className="block text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75"
          >
            {t("execOnboarding.step1.birthDateLabel")}
          </label>
          <input
            id="exec-onboarding-birthdate"
            type="date"
            value={birthDate}
            onChange={(e) => handleFieldChange("birth_date", e.target.value)}
            className={`${ONBOARDING_INPUT_CLASS} dark:[color-scheme:dark]`}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="exec-onboarding-location"
            className="block text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75"
          >
            {t("execOnboarding.step1.locationLabel")}
          </label>
          <input
            id="exec-onboarding-location"
            type="text"
            maxLength={120}
            value={location}
            onChange={(e) => handleFieldChange("location", e.target.value)}
            placeholder={t("execOnboarding.step1.locationPlaceholder")}
            className={ONBOARDING_INPUT_CLASS}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_CITIES.map((city) => {
              const active = location === city;
              return (
                <button
                  key={city}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleFieldChange("location", city)}
                  className={
                    "min-h-[36px] inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors " +
                    (active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE)
                  }
                >
                  <MapPin className="h-3 w-3 shrink-0 text-[#9e7828] dark:text-[#c9a24b]" aria-hidden />
                  <span>{city}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
