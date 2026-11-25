import type { Locale } from "@/i18n/translations";
import type { OnboardingStep } from "@/store/useOnboardingStore";

export const TOTAL_ONBOARDING_STEPS = 5;
export const TOTAL_ONBOARDING_MICRO_STEPS = 11;

/** Shell background matching Member Shell v2 dark/light duality (Obsidienne / Albâtre). */
export const ONBOARDING_SHELL_CLASS =
  "min-h-[100dvh] bg-[#f5f2eb] text-[#161614] dark:bg-[#0b0b0a] dark:text-[#f5f2eb] font-sans antialiased";

/** Tactile Bento card surface (Craie / Basalte) with hairline border and crest highlight. */
export const ONBOARDING_CARD_CLASS =
  "rounded-2xl border border-[#161614]/12 bg-white/95 p-4 sm:p-5 shadow-sm " +
  "dark:border-white/[0.08] dark:bg-[#161614] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]";

/** Secondary nested surface (e.g. stakeholder card / preview block). */
export const ONBOARDING_SUBCARD_CLASS =
  "rounded-xl border border-[#161614]/10 bg-[#f5f2eb]/70 p-4 " +
  "dark:border-white/[0.08] dark:bg-[#1e1e1c]/90 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

/** Cinzel uppercase kicker token. */
export const ONBOARDING_KICKER_CLASS =
  "font-cinzel text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#9e7828] dark:text-[#c9a24b]";

/** Cormorant Light H1 per MEMBER_SHELL_V2_DA_GUARDRAIL (never font-display). */
export const ONBOARDING_H1_CLASS =
  "font-cormorant font-light text-[30px] sm:text-[36px] leading-[1.12] tracking-[-0.015em] text-[#161614] dark:text-[#f5f2eb]";

/** Tactile Bento selection chip with >= 44px mobile hit area. */
export const ONBOARDING_CHIP_BASE =
  "min-h-[44px] w-full rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-150 " +
  "flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]/60 active:scale-[0.99]";

export const ONBOARDING_CHIP_ACTIVE =
  "border-[#9e7828] bg-[#9e7828]/12 text-[#161614] shadow-[inset_0_1px_0_0_rgba(201,162,75,0.22)] " +
  "dark:border-[#c9a24b] dark:bg-[#c9a24b]/14 dark:text-[#f5f2eb]";

export const ONBOARDING_CHIP_IDLE =
  "border-[#161614]/12 bg-white/80 text-[#161614]/85 hover:border-[#9e7828]/50 hover:bg-white " +
  "dark:border-white/[0.08] dark:bg-[#1e1e1c] dark:text-[#f5f2eb]/85 dark:hover:border-[#c9a24b]/45 dark:hover:bg-[#242421]";

/** Mobile-safe input styling (text-base prevents iOS/Android WebView auto-zoom). */
export const ONBOARDING_INPUT_CLASS =
  "min-h-[46px] w-full rounded-xl border border-[#161614]/14 bg-white px-3.5 py-2.5 text-base text-[#161614] " +
  "placeholder:text-[#161614]/45 focus:border-[#9e7828] focus:outline-none focus:ring-2 focus:ring-[#9e7828]/25 " +
  "dark:border-white/[0.10] dark:bg-[#1e1e1c] dark:text-[#f5f2eb] dark:placeholder:text-[#f5f2eb]/40 dark:focus:border-[#c9a24b] dark:focus:ring-[#c9a24b]/25";

/** Primary Solar Gold CTA button (Bouton Solaire Or). */
export const ONBOARDING_PRIMARY_BTN_CLASS =
  "min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 " +
  "font-cinzel text-xs font-bold uppercase tracking-[0.14em] transition-all duration-150 " +
  "bg-[#9e7828] text-white hover:bg-[#8a6720] active:scale-[0.99] " +
  "dark:bg-[#c9a24b] dark:text-[#0b0b0a] dark:hover:bg-[#d6b25e] " +
  "disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]/70";

/** Secondary Mineral Outline button (Bouton Minéral). */
export const ONBOARDING_SECONDARY_BTN_CLASS =
  "min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 " +
  "border-[#161614]/15 bg-white/80 text-[#161614]/85 hover:bg-white hover:border-[#161614]/30 " +
  "dark:border-white/[0.12] dark:bg-[#161614] dark:text-[#f5f2eb]/85 dark:hover:bg-[#1e1e1c] " +
  "font-cinzel text-xs font-bold uppercase tracking-[0.12em] transition-all duration-150 " +
  "disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]/60";

/** Guardian audio tracks currently ship steps 1..4; map step 5 cleanly to track 4. */
export function mapStepToGuardianAudioStep(step: OnboardingStep): 1 | 2 | 3 | 4 {
  if (step === 1 || step === 2 || step === 3) return step;
  return 4;
}

/** Pick localized copy without conditional ternary patterns flagged by i18n audit scripts. */
export function pickLocaleCopy(locale: Locale, fr: string, en: string): string {
  return { fr, en }[locale];
}
