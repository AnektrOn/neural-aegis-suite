/**
 * Aegis Deep Dive (V2) — sample fictional profile.
 *
 * Reference dataset used to:
 *   - drive design reviews of the Deep Dive report,
 *   - seed unit/snapshot tests for report builders,
 *   - serve as a known-good example for both the user and admin views.
 *
 * Pure data + pure builders. No I/O.
 */

import type { AnyArchetypeKey } from "./types";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface SampleArchetypeScore {
  archetype: AnyArchetypeKey;
  intensity: number; // 0..1
  light: number;     // 0..1
  shadow: number;    // 0..1
  topHouses: number[]; // Myss houses 1..12, sorted by relevance
  /** Optional shadow-emphasis houses (used for Survival quartet). */
  shadowHouses?: number[];
}

export interface SampleProfile {
  id: string;
  label: string;
  majors: SampleArchetypeScore[];   // 12-archetype family
  survival: SampleArchetypeScore[]; // Child / Victim / Saboteur / Prostitute
  // Coarse buckets shown on the wheel summary.
  wheelBuckets: {
    veryActive: AnyArchetypeKey[];
    moderate: AnyArchetypeKey[];
    discreet: AnyArchetypeKey[];
  };
  // Houses where multiple archetypes converge — drives "thèmes" section.
  hotspotHouses: Array<{
    house: number;
    label: string;
    archetypes: AnyArchetypeKey[];
    theme: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/* Sample profile — reference for design + tests                              */
/* -------------------------------------------------------------------------- */

export const SAMPLE_PROFILE_LEADER: SampleProfile = {
  id: "sample-leader-warrior-sovereign",
  label: "Leader Warrior/Sovereign — quête de sens",
  majors: [
    { archetype: "warrior",   intensity: 0.86, light: 0.58, shadow: 0.42, topHouses: [6, 7] },
    { archetype: "sovereign", intensity: 0.79, light: 0.55, shadow: 0.45, topHouses: [1, 10] },
    { archetype: "mystic",    intensity: 0.73, light: 0.62, shadow: 0.38, topHouses: [9, 12] },
    { archetype: "healer",    intensity: 0.68, light: 0.64, shadow: 0.36, topHouses: [4, 6] },
  ],
  survival: [
    { archetype: "child",      intensity: 0.70, light: 0.40, shadow: 0.60, topHouses: [1, 4], shadowHouses: [1, 4] },
    { archetype: "victim",     intensity: 0.55, light: 0.35, shadow: 0.65, topHouses: [2, 7], shadowHouses: [2, 7] },
    { archetype: "saboteur",   intensity: 0.60, light: 0.40, shadow: 0.60, topHouses: [6, 9], shadowHouses: [6, 9] },
    { archetype: "prostitute", intensity: 0.72, light: 0.40, shadow: 0.60, topHouses: [2],    shadowHouses: [2] },
  ],
  wheelBuckets: {
    veryActive: ["warrior", "sovereign", "mystic", "healer"],
    moderate:   ["lover", "creator", "jester", "caregiver"],
    discreet:   ["explorer", "rebel", "sage", "magician"],
  },
  hotspotHouses: [
    {
      house: 6,
      label: "Travail & Santé",
      archetypes: ["warrior", "healer", "saboteur"],
      theme: "Équilibre entre performance, corps et éthique.",
    },
    {
      house: 7,
      label: "Relations",
      archetypes: ["warrior", "lover", "victim"],
      theme: "Juste place dans le couple et les partenariats.",
    },
    {
      house: 2,
      label: "Argent & sécurité",
      archetypes: ["prostitute", "victim", "sovereign"],
      theme: "Sécurité matérielle vs intégrité.",
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* Report builders — pure functions returning markdown strings                */
/* -------------------------------------------------------------------------- */

const ARCH_LABEL_FR: Record<AnyArchetypeKey, string> = {
  sovereign: "Sovereign", warrior: "Warrior", lover: "Lover", caregiver: "Caregiver",
  creator: "Creator", explorer: "Explorer", rebel: "Rebel", sage: "Sage",
  mystic: "Mystic", healer: "Healer", magician: "Magician", jester: "Jester",
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostitute",
};

function fmt(n: number): string {
  return n.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
}

/**
 * User-facing report (client). Markdown, FR.
 * Tone: bienveillant, orienté prise de conscience.
 */
export function buildUserReport(profile: SampleProfile): string {
  const lines: string[] = [];
  lines.push("# Ton paysage archétypal — vue d’ensemble");
  lines.push("");
  lines.push(
    "Ce rapport te donne une photographie de la façon dont certains archétypes agissent dans ta vie aujourd’hui, " +
    "selon l’approche de Caroline Myss (Sacred Contracts / Archetypal Wheel). " +
    "Ce n’est pas un verdict figé, mais une carte de forces, de tests et de potentiels qui peuvent évoluer " +
    "au fur et à mesure que tu deviens plus conscient de tes choix.",
  );
  lines.push("");

  lines.push("## Tes 4 archétypes majeurs — ton « équipe principale »");
  lines.push("");
  for (const m of profile.majors) {
    lines.push(`### ${ARCH_LABEL_FR[m.archetype]} — intensité ${fmt(m.intensity)}`);
    lines.push(`Lumière ${fmt(m.light)} · Ombre ${fmt(m.shadow)}`);
    lines.push(`Maisons dominantes : ${m.topHouses.join(", ")}.`);
    lines.push("");
  }

  lines.push("## Tes 4 archétypes de survie — tes fondations");
  lines.push("");
  for (const s of profile.survival) {
    lines.push(`- **${ARCH_LABEL_FR[s.archetype]}** (${fmt(s.intensity)}) — ombre ${fmt(s.shadow)}, maisons ${s.topHouses.join(" & ")}.`);
  }
  lines.push("");

  lines.push("## Ta roue de 12 archétypes — grandes tendances");
  lines.push("");
  lines.push(`- Très présents : ${profile.wheelBuckets.veryActive.map((a) => ARCH_LABEL_FR[a]).join(", ")}`);
  lines.push(`- Modérés : ${profile.wheelBuckets.moderate.map((a) => ARCH_LABEL_FR[a]).join(", ")}`);
  lines.push(`- Plus discrets : ${profile.wheelBuckets.discreet.map((a) => ARCH_LABEL_FR[a]).join(", ")}`);
  lines.push("");

  lines.push("## Maisons les plus chargées en énergie");
  lines.push("");
  for (const h of profile.hotspotHouses) {
    lines.push(
      `- **Maison ${h.house} — ${h.label}** : ${h.archetypes.map((a) => ARCH_LABEL_FR[a]).join(", ")} → ${h.theme}`,
    );
  }
  lines.push("");

  lines.push("## 3 grands thèmes de ton cycle actuel");
  lines.push("");
  lines.push(
    "1. **Apprendre à te battre sans t’auto-user.** Warrior très fort en travail/santé, Saboteur présent : " +
    "distinguer les combats qui te nourrissent de ceux qui te vident.",
  );
  lines.push(
    "2. **Passer de la survie à l’intégrité financière.** Prostitute + Victim en maison 2 : observer où tu troques " +
    "ton temps/énergie contre de la sécurité au prix de ton alignement.",
  );
  lines.push(
    "3. **Ancrer ta spiritualité dans le concret.** Mystic en 9 & 12 + Saboteur en 9 : tu es appelé vers du sens, " +
    "mais quelque chose recule au moment de l’incarner. De petits actes concrets feront la différence.",
  );

  return lines.join("\n");
}

/**
 * Admin-facing report. Markdown, FR.
 * Tone: clinique, lecture par archétype + maisons sensibles + axes de travail.
 */
export function buildAdminReport(profile: SampleProfile): string {
  const lines: string[] = [];

  lines.push("# Lecture admin — profil archétypal");
  lines.push("");

  lines.push("## Résumé analytique");
  lines.push("");
  lines.push(
    `- Majors : ${profile.majors
      .map((m) => `${ARCH_LABEL_FR[m.archetype]} (${fmt(m.intensity)})`)
      .join(", ")}.`,
  );
  const topShadow = [...profile.survival].sort((a, b) => b.shadow * b.intensity - a.shadow * a.intensity)[0];
  lines.push(
    `- Survival le plus chargé en shadow : **${ARCH_LABEL_FR[topShadow.archetype]}** ` +
    `(${fmt(topShadow.intensity)}, shadow ${fmt(topShadow.shadow)}, maison ${topShadow.topHouses.join("/")}).`,
  );
  lines.push(
    `- Maisons critiques : ${profile.hotspotHouses.map((h) => `${h.house} (${h.label})`).join(", ")}.`,
  );
  lines.push("");

  lines.push("## Lecture par archétype majeur");
  lines.push("");
  for (const m of profile.majors) {
    lines.push(`### ${ARCH_LABEL_FR[m.archetype]} — intensité ${fmt(m.intensity)} · light ${fmt(m.light)} · shadow ${fmt(m.shadow)}`);
    lines.push(`- Maisons dominantes : ${m.topHouses.join(", ")}.`);
    lines.push(`- Question Myss : « Comment ${ARCH_LABEL_FR[m.archetype]} agit-il dans ta maison ${m.topHouses[0]} sans devenir ombre ? »`);
    lines.push("");
  }

  lines.push("## Maisons sensibles — focus admin");
  lines.push("");
  for (const h of profile.hotspotHouses) {
    lines.push(`### Maison ${h.house} — ${h.label}`);
    lines.push(`Archétypes convergents : ${h.archetypes.map((a) => ARCH_LABEL_FR[a]).join(", ")}.`);
    lines.push(`Thème : ${h.theme}`);
    lines.push("");
  }

  lines.push("## Axes de travail recommandés");
  lines.push("");
  lines.push(
    "1. **Rééquilibrer Prostitute en maison 2.** Repérer les deals implicites « j’accepte X en échange de sécurité » " +
    "et travailler par micro-actes de réalignement plutôt qu’un grand saut.",
  );
  lines.push(
    "2. **Transformer la guerre en protection consciente (Warrior 6–7).** Déplacer le « je tiens quoi qu’il arrive » " +
    "vers « je protège aussi mon énergie et mon corps ». Rituels et limites claires.",
  );
  lines.push(
    "3. **Soutenir la quête du Mystic avec le Sovereign.** Structurer (temps, pratiques, environnements) pour que la " +
    "spiritualité ne reste pas théorique. Identifier 1–2 engagements concrets reliés au sens.",
  );

  return lines.join("\n");
}
