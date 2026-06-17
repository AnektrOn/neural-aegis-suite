/**
 * V4 polarity scoring — pole activation and cartography slices.
 * Legacy morphic-field helpers remain re-exported from morphicField.ts.
 */
export {
  accumulateMorphicField,
  accumulatePolarityWeight,
  archetypePolarityKey,
  deriveLegacyScoresNormalized,
  deriveLegacyScoresRaw,
  polarityWeightsFromLegacy,
  scoringVectorToWeights,
  weightsToScoringVector,
} from "./morphicField";
export type {
  ArchetypePolarityKey,
  MorphicField,
  MyssV3Dimension,
  ScoringVector,
} from "./morphicField";

export {
  applyV4VectorToField,
  computePoleScoresFromWeights,
  scoreV4ResponseSelections,
  SCORING_MODEL_MYSS_V4,
  v4VectorToPolarityWeights,
} from "./v4Scoring";

export {
  buildSurvivalGuard,
  buildV4PoleAnalysis,
  computePoleActivationPercentages,
  computeTotalPolePoints,
  parsePoleScoresRecord,
  rankPolesByActivation,
} from "./v4PoleAnalysis";
