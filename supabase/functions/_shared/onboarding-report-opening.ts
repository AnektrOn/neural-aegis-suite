/** Extrait le top 3 des 12 archétypes majeurs depuis 00_RAPPORT.md et compose le first message LOGOS. */

export type MajorArchetypeScore = { label: string; score: number };

/** 12 majeurs Myss (hors Survival Family). */
const MAJOR_MATCHERS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(?:mystique|mystic)\b/i, label: "Mystique" },
  { pattern: /\b(?:sage)\b/i, label: "Sage" },
  { pattern: /\b(?:guérisseur|guerisseur|healer)\b/i, label: "Guérisseur" },
  { pattern: /\b(?:magicien|magician)\b/i, label: "Magicien" },
  { pattern: /\b(?:créateur|createur|creator)\b/i, label: "Créateur" },
  { pattern: /\b(?:souverain|sovereign)\b/i, label: "Souverain" },
  { pattern: /\b(?:guerrier|warrior)\b/i, label: "Guerrier" },
  { pattern: /\b(?:amant|lover)\b/i, label: "Amant" },
  { pattern: /\b(?:caregiver|aidant)\b/i, label: "Aidant" },
  { pattern: /\b(?:explorateur|explorer)\b/i, label: "Explorateur" },
  { pattern: /\b(?:rebelle|rebel)\b/i, label: "Rebelle" },
  { pattern: /\b(?:jester|bouffon|fou)\b/i, label: "Bouffon" },
];

function canonicalMajorLabel(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return null;
  for (const { pattern, label } of MAJOR_MATCHERS) {
    if (pattern.test(t)) return label;
  }
  return null;
}

function ingestScore(bucket: Map<string, number>, label: string, score: number) {
  const prev = bucket.get(label) ?? 0;
  if (score > prev) bucket.set(label, score);
}

/** Parse scores « Mystique : 74 points » / « Mystique (74 pts) » dans le rapport clinique. */
export function parseTopThreeMajorArchetypes(reportMarkdown: string): MajorArchetypeScore[] {
  const bucket = new Map<string, number>();
  const text = reportMarkdown.slice(0, 120_000);

  const patterns = [
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\-\s]{0,28}?)\s*:\s*(\d{1,3})\s*points?/gi,
    /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\-\s]{0,28}?)\s*\(\s*(\d{1,3})\s*pts?/gi,
    /un[e]?\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\-\s]{0,28}?)\s+(?:sommital|universel|immaculé)?\s*\(\s*(\d{1,3})\s*points?/gi,
  ];

  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const label = canonicalMajorLabel(m[1]);
      const score = Number(m[2]);
      if (label && Number.isFinite(score) && score > 0 && score <= 100) {
        ingestScore(bucket, label, score);
      }
    }
  }

  return [...bucket.entries()]
    .map(([label, score]) => ({ label, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function formatArchetypeTripleLine(top: MajorArchetypeScore[]): string {
  if (!top.length) return "";
  return top
    .map((a) => (a.score ? `${a.label} (${a.score} points)` : a.label))
    .join(", ");
}

export function buildOnboardingReportFirstMessage(
  firstName: string,
  top: MajorArchetypeScore[],
): string {
  const name = firstName.trim() || "toi";
  const triple = formatArchetypeTripleLine(top);
  if (top.length >= 3 && triple) {
    return (
      `Bonjour ${name}. Je suis LOGOS. Ton rapport d'audit est ouvert : tes trois archétypes majeurs sont ${triple}. ` +
      `Nous avons trente minutes. Je ne suis pas là pour te flatter — ma fonction est d'isoler ce que tu t'efforces encore de ne pas regarder. ` +
      `Lequel de ces trois pèse le plus sur une décision ou une tension relationnelle que tu repousses ce matin ?`
    );
  }
  return (
    `Bonjour ${name}. Je suis LOGOS. Ton rapport d'audit décisionnel est ouvert devant nous. Nous avons 30 minutes. ` +
    `Je ne suis pas là pour te flatter ni valider tes justifications : ma seule fonction est d'isoler ce que tu t'efforces de ne pas regarder. ` +
    `Quel est le dilemme ou la tension relationnelle qui te coûte le plus d'énergie depuis ce matin ?`
  );
}

export function openingFromOnboardingPack(reportMarkdown: string, firstName: string): {
  first_message: string;
  top_archetypes: MajorArchetypeScore[];
} {
  const top = parseTopThreeMajorArchetypes(reportMarkdown);
  return {
    top_archetypes: top,
    first_message: buildOnboardingReportFirstMessage(firstName, top),
  };
}