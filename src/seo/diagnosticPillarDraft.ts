import { DIAGNOSTIC_DECISIONNEL_DRAFT } from "./seoPages";

/**
 * Pilier SEO /diagnostic-decisionnel — brouillon V1 (non routé, non indexé).
 * Activer uniquement quand le contenu éditorial est finalisé.
 */
export const diagnosticDecisionnelPillarBrief = {
  ...DIAGNOSTIC_DECISIONNEL_DRAFT,
  primaryQuery: "diagnostic décisionnel dirigeant",
  secondaryQueries: [
    "questionnaire décision CEO",
    "profil de décideur",
    "fatigue décisionnelle test",
    "lecture profil dirigeant",
  ],
  cta: "/quiz",
} as const;