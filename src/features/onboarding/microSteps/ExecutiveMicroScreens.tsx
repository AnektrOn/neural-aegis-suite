import { Building2, Compass, Crown, Feather, MapPin, Check } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageContext";
import {
  useOnboardingStore,
  type ExecutiveOccupation,
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
  ONBOARDING_SUBCARD_CLASS,
  pickLocaleCopy,
} from "../onboardingPrimitives";
import { getOccupationPreset } from "../occupationPresets";
import Step4SomaticFriction from "../components/steps/Step4SomaticFriction";
import { MIRROR_DILEMMAS } from "../components/steps/Step5DecisionDilemmas";

const OCCUPATION_CARDS: {
  id: ExecutiveOccupation;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  Icon: typeof Crown;
}[] = [
  { id: "Business Owner", labelKey: "execOnboarding.step1.occ.business_owner", descKey: "execOnboarding.step1.occ.business_owner.desc", Icon: Building2 },
  { id: "Leader", labelKey: "execOnboarding.step1.occ.leader", descKey: "execOnboarding.step1.occ.leader.desc", Icon: Compass },
  { id: "Board Member", labelKey: "execOnboarding.step1.occ.board_member", descKey: "execOnboarding.step1.occ.board_member.desc", Icon: Crown },
  { id: "Vie Perso / Indépendant", labelKey: "execOnboarding.step1.occ.personal", descKey: "execOnboarding.step1.occ.personal.desc", Icon: Feather },
];

const QUICK_CITIES = ["Paris, France", "Lyon, France", "Montréal, Canada", "Genève, Suisse", "Bruxelles, Belgique"] as const;

type Sync = (patch: Partial<OnboardingProfileFields>) => void;

function FieldScreen({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <p className={ONBOARDING_KICKER_CLASS}>{kicker}</p>
      <h1 className={ONBOARDING_H1_CLASS}>{title}</h1>
      <div className={ONBOARDING_CARD_CLASS}>{children}</div>
    </div>
  );
}

export function MicroOccupation({ onSyncPatch }: { onSyncPatch: Sync }) {
  const { t } = useLanguage();
  const occupation = useOnboardingStore((s) => s.occupation);
  const updateFields = useOnboardingStore((s) => s.updateFields);

  return (
    <div className="space-y-4">
      <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.step1.kicker")}</p>
      <h1 className={ONBOARDING_H1_CLASS}>{t("execOnboarding.step1.title")}</h1>
      <div className={`${ONBOARDING_CARD_CLASS} grid gap-2`}>
        {OCCUPATION_CARDS.map(({ id, labelKey, descKey, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              const patch = { occupation: id, role_title: id };
              updateFields(patch);
              onSyncPatch(patch);
            }}
            className={`${ONBOARDING_CHIP_BASE} ${occupation === id ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4 opacity-70" aria-hidden />
              {t(labelKey)}
            </span>
            <span className="text-xs font-normal opacity-80">{t(descKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function MicroFullName({ onSyncPatch }: { onSyncPatch: Sync }) {
  const { t } = useLanguage();
  const fullName = useOnboardingStore((s) => s.full_name);
  const updateFields = useOnboardingStore((s) => s.updateFields);
  return (
    <FieldScreen kicker={t("execOnboarding.step1.kicker")} title={t("execOnboarding.step1.fullNameLabel")}>
      <input
        className={ONBOARDING_INPUT_CLASS}
        value={fullName}
        onChange={(e) => {
          const patch = { full_name: e.target.value };
          updateFields(patch);
          onSyncPatch(patch);
        }}
        autoComplete="name"
        placeholder={t("execOnboarding.step1.fullNamePlaceholder")}
      />
    </FieldScreen>
  );
}

export function MicroEmail({ onSyncPatch }: { onSyncPatch: Sync }) {
  const { t } = useLanguage();
  const email = useOnboardingStore((s) => s.email);
  const updateFields = useOnboardingStore((s) => s.updateFields);
  return (
    <FieldScreen kicker={t("execOnboarding.step1.kicker")} title={t("execOnboarding.step1.emailLabel")}>
      <input
        className={ONBOARDING_INPUT_CLASS}
        type="email"
        value={email}
        onChange={(e) => {
          const patch = { email: e.target.value };
          updateFields(patch);
          onSyncPatch(patch);
        }}
        autoComplete="email"
        placeholder={t("execOnboarding.step1.emailPlaceholder")}
      />
    </FieldScreen>
  );
}

export function MicroBirthDate({ onSyncPatch }: { onSyncPatch: Sync }) {
  const { t } = useLanguage();
  const birthDate = useOnboardingStore((s) => s.birth_date);
  const updateFields = useOnboardingStore((s) => s.updateFields);
  return (
    <FieldScreen kicker={t("execOnboarding.step1.kicker")} title={t("execOnboarding.step1.birthDateLabel")}>
      <input
        className={ONBOARDING_INPUT_CLASS}
        type="date"
        value={birthDate}
        onChange={(e) => {
          const patch = { birth_date: e.target.value };
          updateFields(patch);
          onSyncPatch(patch);
        }}
      />
    </FieldScreen>
  );
}

export function MicroLocation({ onSyncPatch }: { onSyncPatch: Sync }) {
  const { t } = useLanguage();
  const location = useOnboardingStore((s) => s.location);
  const updateFields = useOnboardingStore((s) => s.updateFields);
  return (
    <FieldScreen kicker={t("execOnboarding.step1.kicker")} title={t("execOnboarding.step1.locationLabel")}>
      <input
        className={ONBOARDING_INPUT_CLASS}
        value={location}
        onChange={(e) => {
          const patch = { location: e.target.value };
          updateFields(patch);
          onSyncPatch(patch);
        }}
        placeholder={t("execOnboarding.step1.locationPlaceholder")}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_CITIES.map((city) => (
          <button
            key={city}
            type="button"
            className="rounded-full border border-border/40 px-3 py-1.5 text-xs min-h-9"
            onClick={() => {
              const patch = { location: city };
              updateFields(patch);
              onSyncPatch(patch);
            }}
          >
            <MapPin className="mr-1 inline h-3 w-3" aria-hidden />
            {city}
          </button>
        ))}
      </div>
    </FieldScreen>
  );
}

export function MicroStakeholderName({ onSyncPatch }: { onSyncPatch: Sync }) {
  const { t } = useLanguage();
  const primaryStakeholders = useOnboardingStore((s) => s.primary_stakeholders);
  const updateStakeholder = useOnboardingStore((s) => s.updateStakeholder);
  const first = primaryStakeholders[0];
  if (!first) return null;

  return (
    <FieldScreen kicker={t("execOnboarding.step2.kicker")} title={t("execOnboarding.step2.title")}>
      <label className="text-xs text-muted-foreground" htmlFor="stk-name">
        {t("execOnboarding.step2.nameLabel")}
      </label>
      <input
        id="stk-name"
        className={`${ONBOARDING_INPUT_CLASS} mt-2`}
        value={first.name}
        onChange={(e) => {
          updateStakeholder(first.id, { name: e.target.value });
          onSyncPatch({ primary_stakeholders: useOnboardingStore.getState().primary_stakeholders });
        }}
        placeholder={t("execOnboarding.step2.namePlaceholder")}
      />
    </FieldScreen>
  );
}

export function MicroUrgentTitle({ onSyncPatch }: { onSyncPatch: Sync }) {
  const { t, locale } = useLanguage();
  const occupation = useOnboardingStore((s) => s.occupation);
  const urgentDecisionTitle = useOnboardingStore((s) => s.urgent_decision_title);
  const updateFields = useOnboardingStore((s) => s.updateFields);
  return (
    <FieldScreen kicker={t("execOnboarding.step3.kicker")} title={t("execOnboarding.step3.titleLabel")}>
      <input
        className={ONBOARDING_INPUT_CLASS}
        value={urgentDecisionTitle}
        onChange={(e) => {
          const patch = { urgent_decision_title: e.target.value };
          updateFields(patch);
          onSyncPatch(patch);
        }}
        placeholder={t("execOnboarding.step3.titlePlaceholder")}
      />
      <button
        type="button"
        className="mt-3 text-xs text-primary underline min-h-10"
        onClick={() => {
          const first = getOccupationPreset(occupation).decisions[0];
          if (!first) return;
          const title = pickLocaleCopy(locale, first.fr, first.en);
          const patch = { urgent_decision_title: title };
          updateFields(patch);
          onSyncPatch(patch);
        }}
      >
        {t("execOnboarding.step3.presetsLabel", { occupation })}
      </button>
    </FieldScreen>
  );
}

export function MicroSymptoms({ onSyncPatch }: { onSyncPatch: Sync }) {
  return <Step4SomaticFriction onSyncPatch={onSyncPatch} />;
}

export function MicroDilemma({
  dilemmaKey,
  onSyncPatch,
}: {
  dilemmaKey: "q1" | "q2" | "q3";
  onSyncPatch: Sync;
}) {
  const { t } = useLanguage();
  const dilemma = MIRROR_DILEMMAS.find((d) => d.id === dilemmaKey);
  const rawDilemmas = useOnboardingStore((s) => s.raw_dilemma_responses);
  const setDilemmaResponse = useOnboardingStore((s) => s.setDilemmaResponse);
  if (!dilemma) return null;

  const current = rawDilemmas[dilemmaKey];

  return (
    <div className="space-y-4">
      <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.step5.kicker")}</p>
      <h1 className={ONBOARDING_H1_CLASS}>{t(dilemma.questionKey)}</h1>
      <p className="text-sm text-muted-foreground">{t(dilemma.shadowKey)}</p>
      <div className={`${ONBOARDING_SUBCARD_CLASS} space-y-2`}>
        {dilemma.options.map((opt) => {
          const selected = current?.intensity === opt.score;
          return (
            <button
              key={opt.score}
              type="button"
              onClick={() => {
                setDilemmaResponse(dilemma.id, {
                  questionPosition: dilemma.position,
                  dimension: dilemma.dimension,
                  optionPosition: opt.score,
                  intensity: opt.score,
                  answeredAt: new Date().toISOString(),
                });
                onSyncPatch({
                  raw_dilemma_responses: useOnboardingStore.getState().raw_dilemma_responses,
                });
              }}
              className={`${ONBOARDING_CHIP_BASE} ${selected ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
            >
              <span>{t(opt.labelKey)}</span>
              {selected ? <Check className="h-4 w-4" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}