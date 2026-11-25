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

interface Step3Props {
  onSyncPatch: (patch: Partial<OnboardingProfileFields>) => void;
}

const DECISION_PRESETS: TranslationKey[] = [
  "execOnboarding.step3.preset.exec_exit",
  "execOnboarding.step3.preset.capital_call",
  "execOnboarding.step3.preset.pivot_product",
];

const HORIZON_OPTIONS: { value: string; labelKey: TranslationKey }[] = [
  { value: "48h", labelKey: "execOnboarding.step3.horizon.48h" },
  { value: "this_week", labelKey: "execOnboarding.step3.horizon.this_week" },
  { value: "this_month", labelKey: "execOnboarding.step3.horizon.this_month" },
  { value: "this_quarter", labelKey: "execOnboarding.step3.horizon.this_quarter" },
];

const STAKE_KEYS = ["financial", "human", "strategic", "governance"] as const;
type StakeKey = (typeof STAKE_KEYS)[number];

const STAKE_OPTIONS: { value: StakeKey; labelKey: TranslationKey }[] = [
  { value: "financial", labelKey: "execOnboarding.step3.stakes.financial" },
  { value: "human", labelKey: "execOnboarding.step3.stakes.human" },
  { value: "strategic", labelKey: "execOnboarding.step3.stakes.strategic" },
  { value: "governance", labelKey: "execOnboarding.step3.stakes.governance" },
];

function parseStakes(raw: string): { tag: StakeKey | null; note: string } {
  for (const key of STAKE_KEYS) {
    if (raw === key) return { tag: key, note: "" };
    const prefix = `${key}::`;
    if (raw.startsWith(prefix)) {
      return { tag: key, note: raw.slice(prefix.length) };
    }
  }
  return { tag: null, note: raw };
}

function formatStakes(tag: StakeKey | null, note: string): string {
  if (!tag) return note;
  return note.trim().length > 0 ? `${tag}::${note}` : tag;
}

export default function Step3UrgentDilemma({ onSyncPatch }: Step3Props) {
  const { t } = useLanguage();
  const title = useOnboardingStore((s) => s.urgent_decision_title);
  const horizon = useOnboardingStore((s) => s.urgent_decision_horizon);
  const rawStakes = useOnboardingStore((s) => s.urgent_decision_stakes);
  const updateFields = useOnboardingStore((s) => s.updateFields);

  const { tag: activeStakeTag, note: blockageNote } = parseStakes(rawStakes);

  const handleTitleChange = (nextTitle: string) => {
    const patch = { urgent_decision_title: nextTitle };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleSelectHorizon = (value: string) => {
    const patch = { urgent_decision_horizon: value };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleSelectStakeTag = (value: StakeKey) => {
    const nextTag = activeStakeTag === value ? null : value;
    const encoded = formatStakes(nextTag, blockageNote);
    const patch = { urgent_decision_stakes: encoded };
    updateFields(patch);
    onSyncPatch(patch);
  };

  const handleNoteChange = (nextNote: string) => {
    const encoded = formatStakes(activeStakeTag, nextNote);
    const patch = { urgent_decision_stakes: encoded };
    updateFields(patch);
    onSyncPatch(patch);
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <p className={ONBOARDING_KICKER_CLASS}>{t("execOnboarding.step3.kicker")}</p>
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
          <input
            id="urgent-decision-title"
            type="text"
            maxLength={160}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder={t("execOnboarding.step3.titlePlaceholder")}
            className={ONBOARDING_INPUT_CLASS}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-[#161614]/65 dark:text-[#f5f2eb]/65">
            {t("execOnboarding.step3.presetsLabel")}
          </p>
          <div className="flex flex-col gap-2">
            {DECISION_PRESETS.map((key) => {
              const presetLabel = t(key);
              const active = title.trim() === presetLabel.trim();
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleTitleChange(presetLabel)}
                  className={`${ONBOARDING_CHIP_BASE} ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <span>{presetLabel}</span>
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
            {t("execOnboarding.step3.horizonLabel")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {HORIZON_OPTIONS.map((opt) => {
              const active = horizon === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectHorizon(opt.value)}
                  className={`${ONBOARDING_CHIP_BASE} justify-center text-center ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <span>{t(opt.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75">
            {t("execOnboarding.step3.stakesLabel")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STAKE_OPTIONS.map((opt) => {
              const active = activeStakeTag === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSelectStakeTag(opt.value)}
                  className={`${ONBOARDING_CHIP_BASE} justify-center text-center text-xs ${active ? ONBOARDING_CHIP_ACTIVE : ONBOARDING_CHIP_IDLE}`}
                >
                  <span>{t(opt.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="urgent-decision-blockage"
            className="block text-xs font-semibold uppercase tracking-wider text-[#161614]/75 dark:text-[#f5f2eb]/75"
          >
            {t("execOnboarding.step3.blockageLabel")}
          </label>
          <textarea
            id="urgent-decision-blockage"
            rows={3}
            maxLength={400}
            value={blockageNote}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder={t("execOnboarding.step3.blockagePlaceholder")}
            className={ONBOARDING_INPUT_CLASS}
          />
        </div>
      </div>
    </section>
  );
}
