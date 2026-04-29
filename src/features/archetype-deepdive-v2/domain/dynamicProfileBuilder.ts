/**
 * Dynamic Deep Dive profile builder.
 *
 * Transforms REAL assessment data (archetype_scores + analysis_results) into
 * a `SampleProfile` shape consumed by the Deep Dive cards/radar/report.
 *
 * Pure function — no I/O. Bilingual: pass a `locale` ("fr" | "en").
 */

import type { SampleProfile, SampleArchetypeScore, ProfileNarrative } from "./sampleProfile";
import type { AnyArchetypeKey } from "./types";
import { getArchetypeIntro } from "./narrativeTemplates";
import { archLabel, get, phrases } from "./narrativeContent";
import type { Locale } from "@/i18n/translations";

interface ArchetypeScoreRow {
  archetype_key: string;
  normalized_score: number;
  rank: number;
}

interface AnalysisRow {
  top_archetypes: string[] | null;
  shadow_signals: Record<string, number> | null;
  strengths_fr: string[] | null;
  watchouts_fr: string[] | null;
  summary_fr: string | null;
  // Optional EN fields (if persisted later)
  strengths_en?: string[] | null;
  watchouts_en?: string[] | null;
  summary_en?: string | null;
}

const SURVIVAL_KEYS: AnyArchetypeKey[] = ["child", "victim", "saboteur", "prostitute"];
const CORE_12: AnyArchetypeKey[] = [
  "sovereign", "warrior", "lover", "caregiver", "creator", "explorer",
  "rebel", "sage", "mystic", "healer", "magician", "jester",
];

const RANKS_FR: Array<"dominant" | "secondaire" | "tertiaire"> = ["dominant", "secondaire", "tertiaire"];
const RANKS_EN: Array<"dominant" | "secondaire" | "tertiaire"> = ["dominant", "secondaire", "tertiaire"];
// Note: ProfileNarrative.rank type is fixed FR; we keep FR for type compatibility
// but UI components can translate via locale-aware label maps if needed.

/** Default house mapping per archetype (Myss-inspired). */
const DEFAULT_HOUSES: Record<AnyArchetypeKey, number[]> = {
  sovereign: [1, 10], warrior: [6, 7], lover: [5, 7], caregiver: [4, 6],
  creator: [5, 10], explorer: [9, 11], rebel: [11, 12], sage: [3, 9],
  mystic: [9, 12], healer: [4, 6], magician: [10, 12], jester: [5, 11],
  child: [4], victim: [2, 7], saboteur: [6, 9], prostitute: [2, 8],
};

/* -------------------------------------------------------------------------- */
/* Public                                                                     */
/* -------------------------------------------------------------------------- */

export interface BuildDynamicProfileInput {
  sessionId: string;
  displayName?: string | null;
  scores: ArchetypeScoreRow[];
  analysis: AnalysisRow | null;
  locale?: Locale;
}

export function buildDynamicProfile(input: BuildDynamicProfileInput): SampleProfile {
  const { displayName, scores, analysis } = input;
  const locale: Locale = input.locale ?? "fr";

  const coreScores = scores
    .filter((s) => CORE_12.includes(s.archetype_key as AnyArchetypeKey))
    .sort((a, b) => a.rank - b.rank);

  const topThree = coreScores.slice(0, 3).map((s) => s.archetype_key as AnyArchetypeKey);

  const maxScore = coreScores.reduce((m, s) => Math.max(m, Number(s.normalized_score) || 0), 0);

  const majors: SampleArchetypeScore[] = coreScores.map((s) => {
    const arch = s.archetype_key as AnyArchetypeKey;
    const raw = Number(s.normalized_score) || 0;
    const intensity = maxScore > 0 ? clamp01(raw / maxScore) : 0;
    const shadowRatio = estimateShadowRatio(arch, analysis?.shadow_signals ?? {});
    return {
      archetype: arch,
      intensity,
      light: 1 - shadowRatio,
      shadow: shadowRatio,
      topHouses: DEFAULT_HOUSES[arch] ?? [],
    };
  });

  const shadow = analysis?.shadow_signals ?? {};
  const survival: SampleArchetypeScore[] = SURVIVAL_KEYS.map((k) => {
    const v = clamp01(Number(shadow[k] ?? 0));
    return {
      archetype: k,
      intensity: v,
      light: 1 - v,
      shadow: v,
      topHouses: DEFAULT_HOUSES[k] ?? [],
      shadowHouses: v >= 0.3 ? DEFAULT_HOUSES[k] : [],
    };
  });

  const sortedByIntensity = [...majors].sort((a, b) => b.intensity - a.intensity);
  const veryActive = sortedByIntensity.slice(0, 3).map((m) => m.archetype);
  const moderate = sortedByIntensity.slice(3, 7).map((m) => m.archetype);
  const discreet = sortedByIntensity.slice(7).map((m) => m.archetype);

  const hotspotHouses = topThree.flatMap((arch) => {
    const houses = DEFAULT_HOUSES[arch] ?? [];
    return houses.slice(0, 1).map((h) => ({
      house: h,
      label: get.houseLabel(h, locale),
      archetypes: [arch],
      theme: phrases.hotspotTheme(archLabel(arch, locale), get.houseTheme(h, locale), locale),
    }));
  });

  const narrative = buildNarrative({ topThree, survival, analysis, locale });

  const labelArchs = topThree.map((a) => archLabel(a, locale)).join(" / ") || phrases.defaultProfileLabel(locale);

  return {
    id: `dynamic-${input.sessionId}`,
    label: displayName ? `${displayName} — ${labelArchs}` : labelArchs,
    subtitle: phrases.tripleTitle(labelArchs, locale),
    majors,
    survival,
    wheelBuckets: { veryActive, moderate, discreet },
    hotspotHouses,
    narrative,
  };
}

/* -------------------------------------------------------------------------- */
/* Narrative composition                                                      */
/* -------------------------------------------------------------------------- */

function buildNarrative(args: {
  topThree: AnyArchetypeKey[];
  survival: SampleArchetypeScore[];
  analysis: AnalysisRow | null;
  locale: Locale;
}): ProfileNarrative {
  const { topThree, survival, analysis, locale } = args;

  const labels = topThree.map((a) => archLabel(a, locale));
  const overviewLead = phrases.overviewLead(labels, locale);

  const topShadow = [...survival].sort((a, b) => b.intensity - a.intensity)[0];
  const primaryShadowTheme = topShadow && topShadow.intensity >= 0.3
    ? get.shadowTheme(topShadow.archetype, locale)
    : (locale === "fr" ? "Contrôle" : "Control");

  const RANKS = locale === "fr" ? RANKS_FR : RANKS_EN;

  const archetypeBlocks = topThree.map((arch, i) => {
    const intro = getArchetypeIntro(arch, locale) ?? "";
    const label = archLabel(arch, locale);
    return {
      archetype: arch,
      rank: RANKS[i],
      tagline: get.tagline(arch, locale) ?? phrases.taglineFallback(locale),
      gives: get.gives(arch, locale) ?? extractFirstSentence(intro, 2),
      watchOut: get.watchout(arch, locale) ?? extractShadowSentence(intro, locale),
      adminFunctions: get.adminFunctions(arch, locale) ?? phrases.adminFunctionsFallback(label, locale),
      adminEvidence: phrases.adminEvidence(i + 1, DEFAULT_HOUSES[arch] ?? [], locale),
      adminRisks: get.adminRisks(arch, locale) ?? extractShadowSentence(intro, locale),
      adminWorkAxis: get.adminWork(arch, locale) ?? phrases.adminWorkFallback(label, locale),
    };
  });

  const activeSurvival = survival.filter((s) => s.intensity >= 0.3);

  const survivalUserParts = activeSurvival.map(
    (s) => `**${archLabel(s.archetype, locale)}** (${Math.round(s.intensity * 100)}%)`,
  );
  const survivalUser = activeSurvival.length === 0
    ? phrases.noActiveSurvivalUser(locale)
    : phrases.activeSurvivalUser(survivalUserParts, locale);

  const survivalAdminParts = activeSurvival.map(
    (s) => `${archLabel(s.archetype, locale)} ${Math.round(s.intensity * 100)}%`,
  );
  const survivalAdmin = activeSurvival.length === 0
    ? phrases.noActiveSurvivalAdmin(locale)
    : phrases.activeSurvivalAdmin(survivalAdminParts, locale);

  const summary = locale === "en" ? (analysis?.summary_en ?? analysis?.summary_fr) : analysis?.summary_fr;
  const closingNarrativeUser = summary
    ? summary
    : phrases.closingNarrative(labels[0] ?? "", labels[1] ?? "", labels[2] ?? "", locale);

  const sourceStrengths = locale === "en" ? (analysis?.strengths_en ?? analysis?.strengths_fr) : analysis?.strengths_fr;
  const strengths = sourceStrengths?.length
    ? sourceStrengths
    : topThree.map((a) => phrases.strengthFallback(archLabel(a, locale), get.strengthHint(a, locale), locale));

  const sourceWatchouts = locale === "en" ? (analysis?.watchouts_en ?? analysis?.watchouts_fr) : analysis?.watchouts_fr;
  const vigilance = sourceWatchouts?.length
    ? sourceWatchouts
    : topThree.map((a) => get.vigilanceHint(a, locale) ?? phrases.vigilanceFallback(archLabel(a, locale), locale));

  const practices = topThree
    .map((a) => get.practice(a, locale))
    .filter(Boolean) as Array<{ title: string; description: string }>;
  const finalPractices = practices.length > 0 ? practices : phrases.defaultPractices(locale);

  const activeSurvivalLabels = activeSurvival.map((s) => archLabel(s.archetype, locale));

  const adminDiagnostic = {
    triad: labels.join(" – ") || "—",
    resources: phrases.adminResources(locale),
    survival: activeSurvival.length === 0
      ? phrases.adminNoSurvival(locale)
      : survivalAdminParts.join(", "),
    hypothesis: phrases.adminHypothesis(labels[0] ?? "?", labels[1] ?? "?", labels[2] ?? "?", locale),
  };

  const adminContract = phrases.adminContract(labels, activeSurvivalLabels, labels[0] ?? "?", locale);

  return {
    overviewLead,
    primaryShadowTheme,
    archetypeBlocks,
    survivalUser,
    survivalAdmin,
    closingNarrativeUser,
    strengths,
    vigilance,
    practices: finalPractices,
    adminDiagnostic,
    adminContract,
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function estimateShadowRatio(_arch: AnyArchetypeKey, shadow: Record<string, number>): number {
  const vals = SURVIVAL_KEYS.map((k) => Number(shadow[k] ?? 0)).filter((v) => !Number.isNaN(v));
  if (vals.length === 0) return 0.35;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return clamp01(0.25 + avg * 0.3);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function extractFirstSentence(text: string, count = 1): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.slice(0, count).join(" ");
}

function extractShadowSentence(text: string, locale: Locale): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const pattern = locale === "fr" ? /ombre/i : /shadow/i;
  const shadow = sentences.find((s) => pattern.test(s));
  return shadow ?? sentences[1] ?? text;
}
