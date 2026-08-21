import type { GuardianGender, GuardianLocale, GuardianStep } from "./types";

/**
 * Exact filenames under `public/audio/guardian/{gender}/{locale}/`.
 * Keep in sync with files on disk (and Supabase bucket `guardian-audio` if used).
 */
const GUARDIAN_AUDIO_FILES: Record<
  GuardianGender,
  Record<GuardianLocale, Record<GuardianStep, string>>
> = {
  female: {
    en: {
      1: "Iris - Onboarding Part 1 - before quizz.mp3",
      2: "Iris - Onboarding Part 2 - after quizz.mp3",
      3: "Iris - Onboarding Part 3 - Daily log.mp3",
      4: "Iris - Onboarding Part 4 - Decision log.mp3",
    },
    fr: {
      1: "Iris - FR - Onboarding Part 1 - before quizz.mp3",
      2: "Iris -FR- Onboarding Part 2 - after quizz.mp3",
      3: "Iris -FR- Onboarding Part 3 - Daily log.mp3",
      4: "Iris -FR- Onboarding Part 4 - Decision log.mp3",
    },
  },
  male: {
    en: {
      1: "Argos - Onboarding Part 1 - before quizz.mp3",
      2: "Argos - Onboarding Part 2 - after quizz.mp3",
      3: "Argos - Onboarding Part 3 - Daily log.mp3",
      4: "Argos - Onboarding Part 4 - Decision log.mp3",
    },
    fr: {
      1: "Argos- FR - Onboarding Part 1 - before quizz.mp3",
      2: "Argos -FR- Onboarding Part 2 - after quizz.mp3",
      3: "Argos -FR- Onboarding Part 3 - Daily log.mp3",
      4: "Argos -FR- Onboarding Part 4 - Decision log.mp3",
    },
  },
};

/**
 * Lovable's static deploy does not serve `.mp3` from `public/` (404 in prod), so we fall back to
 * the GitHub raw copy of the exact same files. Raw sends `access-control-allow-origin: *`, so the
 * Web Audio analyser (crossOrigin="anonymous") stays functional and audio is NOT muted.
 * Set `VITE_GUARDIAN_AUDIO_BASE_URL` to override with a CDN / same-origin path once available.
 */
const DEFAULT_PROD_AUDIO_BASE =
  "https://raw.githubusercontent.com/AnektrOn/neural-aegis-suite/main/public/audio/guardian";

function getGuardianAudioBase(): string {
  const configured = import.meta.env.VITE_GUARDIAN_AUDIO_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (import.meta.env.PROD) return DEFAULT_PROD_AUDIO_BASE;
  return "/audio/guardian";
}


/** Public URLs for per-gender, per-locale, per-step guide audio. */
export function getGuardianAudioSrc(
  gender: GuardianGender,
  locale: GuardianLocale,
  step: GuardianStep,
): string {
  const file = GUARDIAN_AUDIO_FILES[gender][locale][step];
  const base = getGuardianAudioBase();
  return `${base}/${gender}/${locale}/${encodeURIComponent(file)}`;
}
