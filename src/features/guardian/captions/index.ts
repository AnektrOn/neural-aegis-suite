import type { GuardianGender, GuardianLocale, GuardianStep } from "../types";
import {
  FEMALE_STEP_1_CAPTIONS,
  type GuardianCaptionCue,
} from "./femaleStep1";

export function getGuardianCaptions(
  gender: GuardianGender | null,
  locale: GuardianLocale | null,
  step: GuardianStep,
): GuardianCaptionCue[] {
  if (gender === "female" && locale === "en" && step === 1) {
    return FEMALE_STEP_1_CAPTIONS;
  }
  return [];
}

export type { GuardianCaptionCue };
export { getActiveCaption } from "./femaleStep1";
