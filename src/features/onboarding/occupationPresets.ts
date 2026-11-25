import type { Locale } from "@/i18n/translations";
import type {
  ExecutiveOccupation,
  StakeholderRole,
} from "@/store/useOnboardingStore";
import { pickLocaleCopy } from "./onboardingPrimitives";

export interface OccupationRolePreset {
  stakeholderRole: StakeholderRole;
  fr: string;
  en: string;
}

export interface OccupationDecisionPreset {
  fr: string;
  en: string;
}

export interface OccupationPresetConfig {
  roles: OccupationRolePreset[];
  decisions: OccupationDecisionPreset[];
}

export const OCCUPATION_PRESETS: Record<
  ExecutiveOccupation,
  OccupationPresetConfig
> = {
  "Business Owner": {
    roles: [
      { stakeholderRole: "COFOUNDER", fr: "Associé / Co-fondateur", en: "Co-founder / Partner" },
      { stakeholderRole: "LEAD_INVESTOR", fr: "Client clé", en: "Key client" },
      { stakeholderRole: "LEAD_INVESTOR", fr: "Investisseur", en: "Investor" },
      { stakeholderRole: "RIGHT_HAND", fr: "Bras droit / Équipe", en: "Right hand / Team" },
      { stakeholderRole: "SPOUSE", fr: "Conjoint(e) / Proche", en: "Spouse / Close relative" },
    ],
    decisions: [
      {
        fr: "Recadrer mon associé ou revoir la répartition des responsabilités",
        en: "Realign my co-founder or reset ownership boundaries",
      },
      {
        fr: "Couper une offre ou un client toxique qui me pompe toute mon énergie",
        en: "Drop a toxic client or offer draining all my energy",
      },
      {
        fr: "Dire non à une opportunité qui flatte mon ego mais disperse ma boîte",
        en: "Say no to an ego-flattering deal scattering my company",
      },
    ],
  },
  Leader: {
    roles: [
      { stakeholderRole: "RIGHT_HAND", fr: "N+1 / Direction", en: "Direct manager / Exec" },
      { stakeholderRole: "RIGHT_HAND", fr: "Membre d’équipe", en: "Team member" },
      { stakeholderRole: "COFOUNDER", fr: "Pair / Collègue", en: "Peer / Colleague" },
      { stakeholderRole: "LEAD_INVESTOR", fr: "Partie prenante", en: "Key stakeholder" },
      { stakeholderRole: "SPOUSE", fr: "Conjoint(e) / Proche", en: "Spouse / Close relative" },
    ],
    decisions: [
      {
        fr: "Avoir cette conversation franche avec un membre d'équipe qui sous-performe",
        en: "Have that candid talk with an underperforming team member",
      },
      {
        fr: "Poser une limite claire à ma direction sur ma charge réelle",
        en: "Set a firm boundary with leadership on my real bandwidth",
      },
      {
        fr: "Quitter ce poste ou ce rôle qui ne correspond plus à mes valeurs",
        en: "Leave this role that no longer aligns with my integrity",
      },
    ],
  },
  "Board Member": {
    roles: [
      { stakeholderRole: "COFOUNDER", fr: "Fondateur / CEO", en: "Founder / CEO" },
      { stakeholderRole: "LEAD_INVESTOR", fr: "Co-investisseur", en: "Co-investor" },
      { stakeholderRole: "LEAD_INVESTOR", fr: "Membre du Board", en: "Board member" },
      { stakeholderRole: "RIGHT_HAND", fr: "Conseil / Avocat", en: "Advisor / Counsel" },
      { stakeholderRole: "SPOUSE", fr: "Conjoint(e) / Proche", en: "Spouse / Close relative" },
    ],
    decisions: [
      {
        fr: "Confronter le CEO sur une dérive stratégique que personne n'ose nommer",
        en: "Confront the CEO on a strategic drift nobody dares name",
      },
      {
        fr: "Refuser de valider une décision de gouvernance avec laquelle je suis en désaccord",
        en: "Refuse to rubber-stamp a governance vote I disagree with",
      },
      {
        fr: "Sortir d'un mandat ou d'un engagement qui entame mon intégrité",
        en: "Step down from a mandate compromising my integrity",
      },
    ],
  },
  "Vie Perso / Indépendant": {
    roles: [
      { stakeholderRole: "SPOUSE", fr: "Conjoint(e) / Partenaire", en: "Spouse / Partner" },
      { stakeholderRole: "SPOUSE", fr: "Parent / Famille", en: "Parent / Family" },
      { stakeholderRole: "SPOUSE", fr: "Ami(e) proche", en: "Close friend" },
      { stakeholderRole: "LEAD_INVESTOR", fr: "Collègue / Client", en: "Colleague / Client" },
      { stakeholderRole: "RIGHT_HAND", fr: "Autre proche", en: "Other close contact" },
    ],
    decisions: [
      {
        fr: "Avoir cette conversation franche que j'évite avec mon/ma partenaire",
        en: "Have that honest conversation I keep avoiding with my partner",
      },
      {
        fr: "Quitter ce job ou ce projet qui m'épuise au quotidien",
        en: "Walk away from the job or project exhausting me daily",
      },
      {
        fr: "Dire non à une demande familiale ou pro qui dépasse mes limites",
        en: "Say no to a family or work demand crossing my boundaries",
      },
    ],
  },
};

export function getOccupationPreset(
  occupation: ExecutiveOccupation,
): OccupationPresetConfig {
  return OCCUPATION_PRESETS[occupation] ?? OCCUPATION_PRESETS["Business Owner"];
}

export function getLocalizedRoleLabel(
  presetRole: OccupationRolePreset,
  locale: Locale,
): string {
  return pickLocaleCopy(locale, presetRole.fr, presetRole.en);
}
