/**
 * Pure recommendation engine. No side effects, no I/O.
 * Inputs: AnalysisResult + tools + rules.
 * Outputs: ranked RecommendedTool[].
 */

import { TOOLS, getTool } from "./tools";
import { RECOMMENDATION_RULES } from "./rules";
import type {
  AnalysisResult,
  ArchetypeKey,
  DimensionKey,
  RecommendationRule,
  RecommendedTool,
  ShadowKey,
  ToolSeed,
} from "./types";

interface MatchScore {
  tool: ToolSeed;
  score: number;
  reasons: string[];
  ruleKey?: string;
}

/** Base archetype/dimension/shadow affinity. Pure function. */
export function matchTools(
  analysis: AnalysisResult,
  tools: ToolSeed[] = TOOLS
): MatchScore[] {
  return tools.map((tool) => {
    let score = 0;
    const reasons: string[] = [];

    // Archetype affinity (weighted by rank: rank 1 = 3, rank 2 = 2, rank 3 = 1)
    for (const [idx, archKey] of analysis.topArchetypes.entries()) {
      if (tool.archetypes.includes(archKey)) {
        const rankWeight = 3 - idx;
        score += rankWeight;
        reasons.push(`top${idx + 1}:${archKey}`);
      }
    }

    // Dimension hits
    for (const dim of tool.dimensions ?? []) {
      const v = analysis.dimensionScores[dim] ?? 0;
      if (v >= 0.5) {
        score += v * 1.5;
        reasons.push(`dim:${dim}`);
      }
    }

    // Shadow hits
    for (const shd of tool.shadows ?? []) {
      const v = analysis.shadowSignals[shd] ?? 0;
      if (v >= 0.3) {
        score += v * 2;
        reasons.push(`shadow:${shd}`);
      }
    }

    return { tool, score, reasons };
  });
}

/** Apply rule bonuses. Pure function. Returns updated score map and the rule
 *  that contributed the most to each tool (for transparency in admin). */
export function applyRules(
  analysis: AnalysisResult,
  matched: MatchScore[],
  rules: RecommendationRule[] = RECOMMENDATION_RULES
): MatchScore[] {
  const ctx = {
    topArchetypes: analysis.topArchetypes as ArchetypeKey[],
    dimensionScores: analysis.dimensionScores as Record<DimensionKey, number>,
    shadowSignals: analysis.shadowSignals as Record<ShadowKey, number>,
  };

  const fired = rules.filter((r) => r.match(ctx));

  return matched.map((m) => {
    let bestRuleKey: string | undefined = m.ruleKey;
    let bonus = 0;
    let bestRuleWeight = -Infinity;
    for (const rule of fired) {
      if (rule.toolKeys.includes(m.tool.key)) {
        bonus += rule.weight;
        if (rule.weight > bestRuleWeight) {
          bestRuleWeight = rule.weight;
          bestRuleKey = rule.key;
        }
      }
    }
    return {
      ...m,
      score: m.score + bonus,
      ruleKey: bestRuleKey,
    };
  });
}

/** Build a human-readable rationale string for a tool. Pure function. */
export function buildRationale(
  match: MatchScore,
  analysis: AnalysisResult,
  lang: "fr" | "en"
): string {
  const t = match.tool;
  const baseHint = lang === "fr" ? t.rationaleHint_fr : t.rationaleHint_en;

  const tops = analysis.topArchetypes.filter((k) => t.archetypes.includes(k));
  const archMention = tops.length
    ? lang === "fr"
      ? ` Adapté à vos archétypes dominants (${tops.join(", ")}).`
      : ` Aligned with your dominant archetypes (${tops.join(", ")}).`
    : "";

  const shadowHits = (t.shadows ?? []).filter(
    (s) => (analysis.shadowSignals[s] ?? 0) >= 0.3
  );
  const shadowMention = shadowHits.length
    ? lang === "fr"
      ? ` Aide à réguler : ${shadowHits.join(", ")}.`
      : ` Helps regulate: ${shadowHits.join(", ")}.`
    : "";

  const ruleMention = match.ruleKey
    ? lang === "fr"
      ? ` (règle ${match.ruleKey})`
      : ` (rule ${match.ruleKey})`
    : "";

  const intro = lang === "fr" ? "Pourquoi : " : "Why: ";
  return `${intro}${baseHint}.${archMention}${shadowMention}${ruleMention}`;
}

/** Final selection. Returns the top N tools as RecommendedTool[]. */
export function selectTopTools(
  analysis: AnalysisResult,
  opts: { limit?: number; lang?: "fr" | "en" } = {}
): RecommendedTool[] {
  const limit = opts.limit ?? 6;
  const lang = opts.lang ?? "fr";

  const matched = matchTools(analysis);
  const ruled = applyRules(analysis, matched);

  const ranked = ruled
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map((m, idx) => {
    const t = getTool(m.tool.key);
    return {
      toolKey: t.key,
      type: t.type,
      title_fr: t.title_fr,
      title_en: t.title_en,
      duration_fr: t.duration_fr,
      duration_en: t.duration_en,
      widgetKey: t.widgetKey,
      rationale_fr: buildRationale(m, analysis, "fr"),
      rationale_en: buildRationale(m, analysis, "en"),
      ruleKey: m.ruleKey,
      rank: idx + 1,
      score: m.score,
    };
  });
}
