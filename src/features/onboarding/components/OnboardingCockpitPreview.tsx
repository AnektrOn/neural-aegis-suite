import { ArrowRight, RotateCcw, ShieldAlert, Users } from "lucide-react";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageContext";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import {
  ONBOARDING_CARD_CLASS,
  ONBOARDING_KICKER_CLASS,
  ONBOARDING_PRIMARY_BTN_CLASS,
  ONBOARDING_SECONDARY_BTN_CLASS,
  ONBOARDING_SUBCARD_CLASS,
  pickLocaleCopy,
} from "../onboardingPrimitives";
import { getOccupationPreset } from "../occupationPresets";

interface OnboardingCockpitPreviewProps {
  clarityScore: number;
  isAuthenticated: boolean;
  onContinue: () => void;
  onReplay: () => void;
}

const FRICTION_LABEL_KEYS: Record<string, TranslationKey> = {
  saboteur: "execOnboarding.step4.shadow.saboteur.clinical",
  prostitute: "execOnboarding.step4.shadow.prostitute.clinical",
  victim: "execOnboarding.step4.shadow.victim.clinical",
  child: "execOnboarding.step4.shadow.child.clinical",
};

export default function OnboardingCockpitPreview({
  clarityScore,
  isAuthenticated,
  onContinue,
  onReplay,
}: OnboardingCockpitPreviewProps) {
  const { locale, t } = useLanguage();
  const occupation = useOnboardingStore((s) => s.occupation);
  const fullName = useOnboardingStore((s) => s.full_name);
  const email = useOnboardingStore((s) => s.email);
  const birthDate = useOnboardingStore((s) => s.birth_date);
  const location = useOnboardingStore((s) => s.location);
  const urgentDecisionTitle = useOnboardingStore((s) => s.urgent_decision_title);
  const urgentDecisionStakes = useOnboardingStore((s) => s.urgent_decision_stakes);
  const dominantFriction = useOnboardingStore((s) => s.dominant_decision_friction);
  const stakeholders = useOnboardingStore((s) => s.primary_stakeholders);

  const displayName = fullName.trim() || t("execOnboarding.aha.defaultMember");
  const displayLoc = location.trim() || "Paris, France";
  const fallbackDecision = getOccupationPreset(occupation).decisions[0];
  const decisionTitle =
    urgentDecisionTitle.trim() ||
    (fallbackDecision
      ? pickLocaleCopy(locale, fallbackDecision.fr, fallbackDecision.en)
      : "");

  const frictionKey = dominantFriction
    ? FRICTION_LABEL_KEYS[dominantFriction]
    : undefined;
  const frictionLabel = frictionKey
    ? t(frictionKey)
    : dominantFriction || t("execOnboarding.step4.shadow.saboteur.clinical");

  const activeStakeholders = stakeholders.filter((s) => s.name.trim().length > 0);

  return (
    <section className="space-y-5 pb-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className={ONBOARDING_KICKER_CLASS}>
            {t("execOnboarding.preview.kicker", { name: displayName.toUpperCase() })}
          </p>
          <h1 className="font-cormorant text-2xl sm:text-3xl font-light text-[#161614] dark:text-[#f5f2eb]">
            {t("execOnboarding.preview.commandTitle", { occupation })}
          </h1>
          <p className="text-xs text-[#161614]/65 dark:text-[#f5f2eb]/65">
            {displayLoc}
            {birthDate
              ? ` · ${t("execOnboarding.preview.bornLabel", { date: birthDate })}`
              : ""}
          </p>
          {email && (
            <p className="font-mono text-[11px] text-[#161614]/50 dark:text-[#f5f2eb]/50">
              {email}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onReplay}
          className={`${ONBOARDING_SECONDARY_BTN_CLASS} min-h-[44px] px-3 py-2 text-[11px] shrink-0`}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          <span>{t("execOnboarding.preview.replay")}</span>
        </button>
      </header>

      {/* Carte 1 : Indice de Souveraineté & Quotas Starter */}
      <div className={`${ONBOARDING_CARD_CLASS} space-y-4 border-[#9e7828]/35 dark:border-[#c9a24b]/35`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#161614]/70 dark:text-[#f5f2eb]/70">
              {t("execOnboarding.preview.scoreLabel")}
            </p>
            <div className="mt-1 flex items-baseline gap-1 font-mono tabular-nums">
              <span className="text-4xl font-semibold text-[#9e7828] dark:text-[#c9a24b]">
                {clarityScore}
              </span>
              <span className="text-sm text-[#161614]/55 dark:text-[#f5f2eb]/55">
                /100
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1.5">
            <span className="inline-block rounded-md border border-[#9e7828]/35 bg-[#9e7828]/10 px-2.5 py-1 font-mono text-[11px] text-[#9e7828] dark:border-[#c9a24b]/35 dark:bg-[#c9a24b]/10 dark:text-[#c9a24b]">
              {frictionLabel}
            </span>
            {urgentDecisionStakes && (
              <p className="font-mono text-[11px] text-[#161614]/65 dark:text-[#f5f2eb]/65">
                {t("execOnboarding.preview.costIdentified", {
                  cost: urgentDecisionStakes,
                })}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 border-t border-[#161614]/10 pt-3 dark:border-white/[0.08]">
          <div className={`${ONBOARDING_SUBCARD_CLASS} flex items-center justify-between py-2.5 px-3`}>
            <span className="text-xs font-medium text-[#161614]/80 dark:text-[#f5f2eb]/80">
              {t("execOnboarding.preview.pulseLabel")}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#9e7828] dark:text-[#c9a24b]">
              {t("execOnboarding.preview.starterQuota")}
            </span>
          </div>
          <div className={`${ONBOARDING_SUBCARD_CLASS} flex items-center justify-between py-2.5 px-3`}>
            <span className="text-xs font-medium text-[#161614]/80 dark:text-[#f5f2eb]/80">
              {t("execOnboarding.preview.toolboxLabel")}
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums text-[#9e7828] dark:text-[#c9a24b]">
              {t("execOnboarding.preview.starterQuota")}
            </span>
          </div>
        </div>
      </div>

      {/* Carte 2 : Registre de Décision P1 */}
      <div className={`${ONBOARDING_CARD_CLASS} space-y-2.5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
            {t("execOnboarding.preview.decisionKicker")}
          </span>
          {urgentDecisionStakes && (
            <span className="font-mono text-[10px] rounded px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-300">
              {t("execOnboarding.preview.decisionStake", {
                stake: urgentDecisionStakes,
              })}
            </span>
          )}
        </div>
        <p className="text-sm sm:text-base font-medium leading-relaxed text-[#161614] dark:text-[#f5f2eb]">
          {decisionTitle}
        </p>
      </div>

      {/* Carte 3 : People Board */}
      <div className={`${ONBOARDING_CARD_CLASS} space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#9e7828] dark:text-[#c9a24b]">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {t("execOnboarding.preview.peopleKicker")}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-[#161614]/60 dark:text-[#f5f2eb]/60">
            {t("execOnboarding.preview.peopleCount", {
              count: activeStakeholders.length,
            })}
          </span>
        </div>

        <div className="space-y-2">
          {activeStakeholders.map((p) => (
            <div
              key={p.id}
              className={`${ONBOARDING_SUBCARD_CLASS} flex items-center justify-between gap-3 py-2.5 px-3`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#9e7828]/40 bg-[#9e7828]/10 font-mono text-xs font-bold text-[#9e7828] dark:border-[#c9a24b]/40 dark:bg-[#c9a24b]/10 dark:text-[#c9a24b]">
                  {(p.name.trim() || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#161614] dark:text-[#f5f2eb]">
                    {p.name.trim() || t("execOnboarding.preview.unnamedContact")}
                    {p.role_label ? ` · ${p.role_label}` : ""}
                  </p>
                  {p.dynamic && (
                    <p className="truncate text-[11px] text-[#161614]/65 dark:text-[#f5f2eb]/65">
                      {p.dynamic}
                    </p>
                  )}
                </div>
              </div>
              <span className="font-mono text-[10px] rounded border border-[#161614]/15 px-2 py-0.5 text-[#161614]/75 dark:border-white/[0.12] dark:text-[#f5f2eb]/75 shrink-0">
                {p.tension_level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isAuthenticated && (
        <p className="text-xs leading-relaxed text-center text-[#161614]/65 dark:text-[#f5f2eb]/65 px-2">
          {t("execOnboarding.preview.preLoginNote")}
        </p>
      )}

      <button
        type="button"
        onClick={onContinue}
        className={`${ONBOARDING_PRIMARY_BTN_CLASS} w-full`}
      >
        <span>
          {isAuthenticated
            ? t("execOnboarding.preview.enterDashboard")
            : t("execOnboarding.preview.createAccountCta")}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
      </button>
    </section>
  );
}
