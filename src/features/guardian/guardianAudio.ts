import type { GuardianGender, GuardianLocale, GuardianStep } from "./types";

/**
 * Exact filenames under `public/audio/guardian/{gender}/{locale}/`.
 * Keep in sync with files on disk (naming varies slightly across packs).
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

/** Public URLs for per-gender, per-locale, per-step guide audio. */
export function getGuardianAudioSrc(
  gender: GuardianGender,
  locale: GuardianLocale,
  step: GuardianStep,
): string {
  const file = GUARDIAN_AUDIO_FILES[gender][locale][step];
  return `/audio/guardian/${gender}/${locale}/${encodeURIComponent(file)}`;
}
