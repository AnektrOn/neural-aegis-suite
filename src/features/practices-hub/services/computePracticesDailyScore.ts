export type PracticesDailyScoreInput = {
  habitsDone: number;
  habitsTotal: number;
  deckCardCount: number;
  pulseSwipedToday: boolean;
};

export type PracticesDailyScore = {
  done: number;
  total: number;
  hasItems: boolean;
};

export function computePracticesDailyScore(input: PracticesDailyScoreInput): PracticesDailyScore {
  const habitsDone = Math.max(0, input.habitsDone);
  const habitsTotal = Math.max(0, input.habitsTotal);
  const deckCardCount = Math.max(0, input.deckCardCount);

  const pulseInDenominator = deckCardCount > 0 || input.pulseSwipedToday;
  const pulseInNumerator = input.pulseSwipedToday;

  const done = habitsDone + (pulseInNumerator ? 1 : 0);
  const total = habitsTotal + (pulseInDenominator ? 1 : 0);

  return {
    done,
    total,
    hasItems: total > 0,
  };
}
