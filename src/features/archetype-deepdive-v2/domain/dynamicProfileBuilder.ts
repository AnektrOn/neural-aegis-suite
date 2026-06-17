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
import type { ArchetypeScore, DeepDiveResult } from "./computeDeepDiveScores";
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
  /**
   * When set, majors / survival / wheel / hotspots come from the unified Deep Dive
   * scorer (70Q + legacy), while narrative bullets still use `analysis` from the session.
   */
  unified?: DeepDiveResult | null;
}

function archetypeMapFromUnified(unified: DeepDiveResult): Map<AnyArchetypeKey, ArchetypeScore> {
  const m = new Map<AnyArchetypeKey, ArchetypeScore>();
  for (const a of unified.archetypes) {
    m.set(a.archetype, a);
  }
  return m;
}

function buildProfileFromUnified(
  input: BuildDynamicProfileInput,
  unified: DeepDiveResult,
  locale: Locale,
): SampleProfile {
  const { displayName, analysis, sessionId } = input;
  const byArch = archetypeMapFromUnified(unified);

  const majors: SampleArchetypeScore[] = CORE_12.map((arch) => {
    const a = byArch.get(arch);
    const tot = a ? a.light + a.shadow : 0;
    const lightShare = tot > 0 ? a!.light / tot : 0.5;
    const shadowShare = tot > 0 ? a!.shadow / tot : 0.5;
    return {
      archetype: arch,
      intensity: a?.intensity ?? 0,
      light: lightShare,
      shadow: shadowShare,
      topHouses: DEFAULT_HOUSES[arch] ?? [],
    };
  }).filter((m) => (byArch.get(m.archetype)?.total ?? 0) > 0);

  // Alliance de Lumière : tri strict par score light absolu
  majors.sort((x, y) => {
    const lx = byArch.get(x.archetype)?.light ?? 0;
    const ly = byArch.get(y.archetype)?.light ?? 0;
    return ly - lx;
  });

  const survival: SampleArchetypeScore[] = SURVIVAL_KEYS.map((k) => {
    const a = byArch.get(k);
    const tot = a ? a.light + a.shadow : 0;
    const lightShare = tot > 0 ? a!.light / tot : 0.5;
    const shadowShare = tot > 0 ? a!.shadow / tot : 0.5;
    const intensity = a?.intensity ?? 0;
    return {
      archetype: k,
      intensity,
      light: lightShare,
      shadow: shadowShare,
      topHouses: DEFAULT_HOUSES[k] ?? [],
      shadowHouses: intensity >= 0.3 ? DEFAULT_HOUSES[k] : [],
    };
  });

  // Roue (wheelBuckets) : intensité globale
  const sortedByIntensity = [...majors].sort((a, b) => b.intensity - a.intensity);
  const veryActive = sortedByIntensity.slice(0, 3).map((m) => m.archetype);
  const moderate = sortedByIntensity.slice(3, 7).map((m) => m.archetype);
  const discreet = sortedByIntensity.slice(7).map((m) => m.archetype);

  // Top 3 identitaire = Alliance de Lumière (majors triés par light)
  const topMajors = majors.slice(0, 3);
  const topThree = topMajors.map((m) => m.archetype);

  const hotspotHouses = unified.houses
    .filter((h) => h.answered > 0 && h.topArchetype)
    .map((h) => ({
      house: h.house,
      label: get.houseLabel(h.house, locale),
      archetypes: [h.topArchetype!],
      theme: phrases.hotspotTheme(
        archLabel(h.topArchetype!, locale),
        get.houseTheme(h.house, locale),
        locale,
      ),
    }));

  const narrative = buildNarrative({ topMajors, survival, analysis: analysis ?? null, locale });

  const labelArchs = topThree.map((a) => archLabel(a, locale)).join(" / ") || phrases.defaultProfileLabel(locale);

  return {
    id: `dynamic-${sessionId}-unified`,
    label: displayName ? `${displayName} — ${labelArchs}` : labelArchs,
    subtitle: phrases.tripleTitle(labelArchs, locale),
    majors,
    survival,
    wheelBuckets: { veryActive, moderate, discreet },
    hotspotHouses,
    narrative,
  };
}

export function buildDynamicProfile(input: BuildDynamicProfileInput): SampleProfile {
  const { displayName, scores, analysis } = input;
  const locale: Locale = input.locale ?? "fr";

  if (input.unified) {
    const byArch = archetypeMapFromUnified(input.unified);
    const anyCore = CORE_12.some((k) => (byArch.get(k)?.total ?? 0) > 0);
    if (anyCore) {
      return buildProfileFromUnified(input, input.unified, locale);
    }
  }

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

  const topMajorsForNarrative = topThree
    .map((arch) => majors.find((m) => m.archetype === arch))
    .filter((m): m is SampleArchetypeScore => m !== undefined);
  const narrative = buildNarrative({ topMajors: topMajorsForNarrative, survival, analysis, locale });

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
  topMajors: SampleArchetypeScore[];
  survival: SampleArchetypeScore[];
  analysis: AnalysisRow | null;
  locale: Locale;
}): ProfileNarrative {
  const { topMajors, survival, analysis, locale } = args;

  const topThree = topMajors.map((m) => m.archetype);
  const labels = topThree.map((a) => archLabel(a, locale));

  // Survival activation: ratio-based (polarity > 50% shadow) AND has signal.
  // This is stricter and more clinically meaningful than the legacy "intensity >= 0.3":
  // it only flags a guardian as active when its shadow polarity actually dominates,
  // not just because the archetype has been scored at all.
  const activeSurvival = [...survival]
    .filter((s) => s.intensity > 0 && s.shadow >= 0.5)
    .sort((a, b) => (b.intensity * b.shadow) - (a.intensity * a.shadow));

  const topShadow = activeSurvival[0];
  const fallbackShadow = locale === "fr" ? "Contrôle" : "Control";
  const primaryShadowTheme = topShadow
    ? (get.shadowTheme(topShadow.archetype, locale) ?? fallbackShadow)
    : fallbackShadow;

  const overviewLead = phrases.overviewLead(labels, locale);

  const RANKS = locale === "fr" ? RANKS_FR : RANKS_EN;

  const archetypeBlocks = topMajors.map((major, i) => {
    const arch = major.archetype;
    const rank = i + 1;
    const depth = getNarrativeDepth(rank);
    const label = archLabel(arch, locale);
    const intro = getArchetypeIntro(arch, locale) ?? "";
    const lr = lightRatio(major.light, major.shadow);

    const tagline = get.tagline(arch, locale) ?? phrases.taglineFallback(locale);
    const gives = get.gives(arch, locale) ?? extractFirstSentence(intro, 2);
    const watchOutBase = get.watchout(arch, locale) ?? extractShadowSentence(intro, locale);
    const adminFunctions = get.adminFunctions(arch, locale) ?? phrases.adminFunctionsFallback(label, locale);
    const adminEvidence = phrases.adminEvidence(rank, DEFAULT_HOUSES[arch] ?? [], locale);
    const adminRisksBase = get.adminRisks(arch, locale) ?? extractShadowSentence(intro, locale);
    const adminWorkAxis = get.adminWork(arch, locale) ?? phrases.adminWorkFallback(label, locale);

    if (depth === "dominant") {
      const lrPct = Math.round(lr * 100);
      return {
        archetype: arch,
        rank: RANKS[i],
        tagline,
        gives,
        watchOut: locale === "fr"
          ? `${watchOutBase} Ratio lumière actuel : ${lrPct} %.`
          : `${watchOutBase} Current light ratio: ${lrPct}%.`,
        adminFunctions,
        adminEvidence,
        adminRisks: adminRisksBase,
        adminWorkAxis,
      };
    }

    if (depth === "secondary") {
      return {
        archetype: arch,
        rank: RANKS[i],
        tagline,
        gives: locale === "fr"
          ? `${gives} Cet archétype agit ici comme ressource d'appui plutôt que comme moteur principal.`
          : `${gives} This archetype acts here as a support resource rather than the main driver.`,
        watchOut: watchOutBase,
        adminFunctions,
        adminEvidence,
        adminRisks: locale === "fr"
          ? `${adminRisksBase} Risque clé si le dominant se rigidifie : cet archétype peut être mobilisé défensivement.`
          : `${adminRisksBase} Key risk if the dominant archetype rigidifies: this archetype may be recruited defensively.`,
        adminWorkAxis,
      };
    }

    // tertiary
    return {
      archetype: arch,
      rank: RANKS[i],
      tagline,
      gives: locale === "fr"
        ? `${label} agit ici comme ressource tertiaire : moins structurant, mais très utile dans les contextes justes. ${gives}`
        : `${label} acts here as a tertiary resource: less structuring, but highly useful in the right contexts. ${gives}`,
      watchOut: locale === "fr"
        ? `À surveiller surtout sous stress ou surcharge : ${watchOutBase}`
        : `Main watchpoint under stress or overload: ${watchOutBase}`,
      adminFunctions,
      adminEvidence,
      adminRisks: locale === "fr"
        ? `Pattern secondaire, non central mais révélateur quand il s'active : ${adminRisksBase}`
        : `Secondary pattern, not central but revealing when activated: ${adminRisksBase}`,
      adminWorkAxis: locale === "fr"
        ? `Axe d'intégration léger : ${adminWorkAxis}`
        : `Light integration axis: ${adminWorkAxis}`,
    };
  });

  // Survival labels: `${label} (${theme})` — clinically more meaningful than
  // a raw percentage. Theme is null only for non-survival keys; in this
  // pipeline `activeSurvival` is always survival, so the theme is defined.
  const activeSurvivalLabels = activeSurvival.map((s) => {
    const label = archLabel(s.archetype, locale);
    const theme = get.shadowTheme(s.archetype, locale);
    return theme ? `${label} (${theme})` : label;
  });

  const survivalUser = activeSurvival.length === 0
    ? phrases.noActiveSurvivalUser(locale)
    : phrases.activeSurvivalUser(activeSurvivalLabels, locale);

  const survivalAdmin = activeSurvival.length === 0
    ? phrases.noActiveSurvivalAdmin(locale)
    : phrases.activeSurvivalAdmin(activeSurvivalLabels, locale);

  const summary = locale === "en" ? (analysis?.summary_en ?? analysis?.summary_fr) : analysis?.summary_fr;
  const closingNarrativeUser = summary
    ? summary
    : phrases.closingNarrative(
        labels[0] ?? "",
        labels[1] ?? "",
        labels[2] ?? "",
        topShadow ? primaryShadowTheme : null,
        locale,
      );

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

  const adminDiagnostic = {
    triad: labels.join(" – ") || "—",
    resources: phrases.adminResources(locale),
    survival: activeSurvival.length === 0
      ? phrases.adminNoSurvival(locale)
      : activeSurvivalLabels.join(", "),
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

type NarrativeDepth = "dominant" | "secondary" | "tertiary";

function getNarrativeDepth(rank: number): NarrativeDepth {
  if (rank <= 1) return "dominant";
  if (rank === 2) return "secondary";
  return "tertiary";
}

/**
 * Returns the light share for a (light, shadow) pair.
 * Defaults to 0.5 if the pair is empty (no signal yet).
 */
function lightRatio(light: number, shadow: number): number {
  const total = light + shadow;
  return total > 0 ? light / total : 0.5;
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
